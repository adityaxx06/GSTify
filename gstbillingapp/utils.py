import datetime
import json

from django.db.models import Sum


from .models import Product
from .models import Inventory
from .models import InventoryLog
from .models import Book
from .models import BookLog


def _safe_int(value, default=0):
    """
    Safely convert a value to int.
    Empty strings, None or invalid values are converted to a sane default
    instead of raising ValueError.
    """
    if value is None:
        return default
    try:
        text = str(value).strip()
        return int(text) if text else default
    except (TypeError, ValueError):
        return default


def _safe_float(value, default=0.0):
    """
    Safely convert a value to float.
    Empty strings, None or invalid values are converted to a sane default
    instead of raising ValueError.
    """
    if value is None:
        return default
    try:
        text = str(value).strip()
        return float(text) if text else default
    except (TypeError, ValueError):
        return default


def invoice_data_validator(invoice_data):
    
    # Validate Invoice Info ----------

    # invoice-number
    try:
        invoice_number_raw = invoice_data.get('invoice-number')
        invoice_number = int(invoice_number_raw)
    except Exception:
        print("Error: Incorrect Invoice Number")
        return "Error: Incorrect Invoice Number"

    # invoice date
    try:
        date_text = invoice_data.get('invoice-date', '')
        datetime.datetime.strptime(date_text, '%Y-%m-%d')
    except Exception:
        print("Error: Incorrect Invoice Date")
        return "Error: Incorrect Invoice Date"

    # Validate Customer Data ---------

    # customer-name
    customer_name = invoice_data.get('customer-name', '') or ''
    if len(customer_name) < 1 or len(customer_name) > 200:
        print("Error: Incorrect Customer Name")
        return "Error: Incorrect Customer Name"

    customer_address = invoice_data.get('customer-address', '') or ''
    if len(customer_address) > 600:
        print("Error: Incorrect Customer Address")
        return "Error: Incorrect Customer Address"

    customer_phone = invoice_data.get('customer-phone', '') or ''
    if len(customer_phone) > 14:
        print("Error: Incorrect Customer Phone")
        return "Error: Incorrect Customer Phone"

    customer_gst = invoice_data.get('customer-gst', '') or ''
    if len(customer_gst) != 15 and len(customer_gst) != 0:
        print("Error: Incorrect Customer GST")
        return "Error: Incorrect Customer GST"
    return None


def invoice_data_processor(invoice_post_data):
    print(invoice_post_data)
    processed_invoice_data = {}

    # Use .get() for all header/customer fields so missing keys (e.g. when
    # inputs are hidden in Cash Customer mode) never raise MultiValueDictKeyError.
    processed_invoice_data['invoice_number'] = invoice_post_data.get('invoice-number', '')
    processed_invoice_data['invoice_date'] = invoice_post_data.get('invoice-date', '')

    processed_invoice_data['customer_name'] = invoice_post_data.get('customer-name', '')
    processed_invoice_data['customer_address'] = invoice_post_data.get('customer-address', '')
    processed_invoice_data['customer_phone'] = invoice_post_data.get('customer-phone', '')
    processed_invoice_data['customer_gst'] = invoice_post_data.get('customer-gst', '')

    processed_invoice_data['vehicle_number'] = invoice_post_data.get('vehicle-number', '')

    if 'igstcheck' in  invoice_post_data:
        processed_invoice_data['igstcheck'] = True
    else:
        processed_invoice_data['igstcheck'] = False

    processed_invoice_data['items'] = []
    # Defensive conversions: totals should never crash invoice processing.
    processed_invoice_data['invoice_total_amt_without_gst'] = _safe_float(invoice_post_data.get('invoice-total-amt-without-gst'))
    processed_invoice_data['invoice_total_amt_sgst'] = _safe_float(invoice_post_data.get('invoice-total-amt-sgst'))
    processed_invoice_data['invoice_total_amt_cgst'] = _safe_float(invoice_post_data.get('invoice-total-amt-cgst'))
    processed_invoice_data['invoice_total_amt_igst'] = _safe_float(invoice_post_data.get('invoice-total-amt-igst'))
    processed_invoice_data['invoice_total_amt_with_gst'] = _safe_float(invoice_post_data.get('invoice-total-amt-with-gst'))


    invoice_post_data = dict(invoice_post_data)
    # NOTE: Convert QueryDict to plain dict for easier list access.
    # This continues to support legacy fields while allowing new optional fields
    # like description without breaking existing invoices.
    for idx, product in enumerate(invoice_post_data.get('invoice-product', [])):
        if product:
            print(idx, product)
            item_entry = {}
            item_entry['invoice_product'] = product
            item_entry['invoice_hsn'] = invoice_post_data['invoice-hsn'][idx]
            # Unit is now hidden in the UI but still maintained internally
            # for backward-compatible product & inventory logic.
            # If no unit is provided, default to "NOS".
            if 'invoice-unit' in invoice_post_data and len(invoice_post_data['invoice-unit']) > idx:
                item_entry['invoice_unit'] = invoice_post_data['invoice-unit'][idx]
            else:
                item_entry['invoice_unit'] = "NOS"  # TODO: remove when models/utils stop depending on unit.
            # Safe numeric parsing – blank values become zero instead of crashing.
            qty = _safe_int(invoice_post_data['invoice-qty'][idx])
            rate_with_gst = _safe_float(invoice_post_data['invoice-rate-with-gst'][idx])
            gst_percentage = _safe_float(invoice_post_data['invoice-gst-percentage'][idx])

            rate_without_gst = _safe_float(invoice_post_data['invoice-rate-without-gst'][idx])
            amt_without_gst = _safe_float(invoice_post_data['invoice-amt-without-gst'][idx])

            # Optional per-line description (may not exist on legacy invoices)
            if 'invoice-description' in invoice_post_data and len(invoice_post_data['invoice-description']) > idx:
                item_entry['invoice_description'] = invoice_post_data['invoice-description'][idx]
            else:
                item_entry['invoice_description'] = ""

            # Amount fields – also parsed defensively.
            item_entry['invoice_amt_sgst'] = _safe_float(invoice_post_data['invoice-amt-sgst'][idx])
            item_entry['invoice_amt_cgst'] = _safe_float(invoice_post_data['invoice-amt-cgst'][idx])
            item_entry['invoice_amt_igst'] = _safe_float(invoice_post_data['invoice-amt-igst'][idx])
            item_entry['invoice_amt_with_gst'] = _safe_float(invoice_post_data['invoice-amt-with-gst'][idx])

            # Basic line validation:
            # - Quantity must be positive
            # - At least one of the rate fields must be positive
            if qty <= 0 or (rate_with_gst <= 0 and rate_without_gst <= 0):
                # Skip invalid/empty invoice rows instead of crashing.
                continue

            item_entry['invoice_qty'] = qty
            item_entry['invoice_rate_with_gst'] = rate_with_gst
            item_entry['invoice_gst_percentage'] = gst_percentage
            item_entry['invoice_rate_without_gst'] = rate_without_gst
            item_entry['invoice_amt_without_gst'] = amt_without_gst

            processed_invoice_data['items'].append(item_entry)

    print(processed_invoice_data)
    return processed_invoice_data

def update_products_from_invoice(invoice_data_processed, request):
    for item in invoice_data_processed['items']:
        new_product = False
        if Product.objects.filter(user=request.user,
                                  product_name=item['invoice_product'],
                                  product_hsn=item['invoice_hsn'],
                                  product_unit=item['invoice_unit'],
                                  product_gst_percentage=item['invoice_gst_percentage']).exists():
            product = Product.objects.get(user=request.user,
                                          product_name=item['invoice_product'],
                                          product_hsn=item['invoice_hsn'],
                                          product_unit=item['invoice_unit'],
                                          product_gst_percentage=item['invoice_gst_percentage'])
        else:
            new_product = True
            product = Product(user=request.user,
                              product_name=item['invoice_product'],
                              product_hsn=item['invoice_hsn'],
                              product_unit=item['invoice_unit'],
                              product_gst_percentage=item['invoice_gst_percentage'])
        product.product_rate_with_gst = item['invoice_rate_with_gst']
        product.save()

        if new_product:
            create_inventory(product)

#  ================== Inventory methods ====================

def create_inventory(product):
    if not Inventory.objects.filter(user=product.user, product=product).exists():
        new_inventory = Inventory(user=product.user, product=product)
        new_inventory.save()

def update_inventory(invoice, request):
    invoice_data =  json.loads(invoice.invoice_json)
    for item in invoice_data['items']:
        product = Product.objects.get(user=request.user,
                                      product_name=item['invoice_product'],
                                      product_hsn=item['invoice_hsn'],
                                      product_unit=item['invoice_unit'],
                                      product_gst_percentage=item['invoice_gst_percentage'])
        inventory = Inventory.objects.get(user=product.user, product=product)
        change = int(item['invoice_qty'])*(-1)
        inventory_log = InventoryLog(user=product.user,
                                     product=product,
                                     date=datetime.datetime.now(),
                                     change=change,
                                     change_type=4,
                                     associated_invoice=invoice,
                                     description="Sale - Auto Deduct")
        inventory_log.save()
        inventory.current_stock += change
        inventory.last_log = inventory_log
        inventory.save()


def remove_inventory_entries_for_invoice(invoice, user):
        inventory_logs = InventoryLog.objects.filter(user=user,
                                     associated_invoice=invoice)
        for inventory_log in inventory_logs:
            inventory_product = inventory_log.product
            inventory_log.delete()
            # update the inventory total
            inventory_obj = Inventory.objects.get(user=user, product=inventory_product)
            recalculate_inventory_total(inventory_obj, user)


def recalculate_inventory_total(inventory_obj, user):
    new_total = InventoryLog.objects.filter(user=user, product=inventory_obj.product).aggregate(Sum('change'))['change__sum']
    if not new_total:
        new_total = 0
    inventory_obj.current_stock = new_total
    inventory_obj.save()


# ================ Book methods ===========================

def add_customer_book(customer):
    # check if customer already exists
    if Book.objects.filter(user=customer.user, customer=customer).exists():
        return
    book = Book(user=customer.user,
                customer=customer)
    book.save()


def auto_deduct_book_from_invoice(invoice):
    invoice_data =  json.loads(invoice.invoice_json)

    book = Book.objects.get(user=invoice.user, customer=invoice.invoice_customer)

    book_log = BookLog(parent_book=book,
                       date=invoice.invoice_date,
                       change_type=1,
                       change=(-1.0)*float(invoice_data['invoice_total_amt_with_gst']),
                       associated_invoice=invoice,
                       description="Purchase - Auto Deduct")

    book_log.save()

    book.current_balance = book.current_balance + book_log.change
    book.last_log = book_log
    book.save()
