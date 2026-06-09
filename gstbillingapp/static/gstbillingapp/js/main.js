var invoice_item_row_counter = 1
var fuse_customers;

// ADDING INVOICE ROWS ===================================================
function add_invoice_item_row() {
    old_item_row_count = invoice_item_row_counter
    invoice_item_row_counter++;

    $('#invoice-form-items-table-body >tr:last').clone(true).insertAfter('#invoice-form-items-table-body >tr:last');
    $('#invoice-form-items-table-body >tr:last input').val('');

    $('#invoice-form-items-table-body >tr:last td')[0].innerHTML = invoice_item_row_counter
    update_amounts($('#invoice-form-items-table-body input[name=invoice-qty]:last'));
}

function setup_invoice_rows() {
    $("#invoice-form-addrow").click(function(event) {
       event.preventDefault();
       add_invoice_item_row();
    });

    for (var i = 0; i <= 4; i++) {
        add_invoice_item_row();
    }
}

// UPDATING INVOICE TOTALS ================================================

function update_invoice_totals() {

    // amount without gst
    sum_amt_without_gst = 0
    $('input[name=invoice-amt-without-gst]').each(function(){
        sum_amt_without_gst += parseFloat($(this).val());
    });
    $('input[name=invoice-total-amt-without-gst]').val(sum_amt_without_gst.toFixed(2));

    // amount sgst
    sum_amt_sgst = 0
    $('input[name=invoice-amt-sgst]').each(function(){
        sum_amt_sgst += parseFloat($(this).val());
    });
    $('input[name=invoice-total-amt-sgst]').val(sum_amt_sgst.toFixed(2));

    // amount cgst
    sum_amt_cgst = 0
    $('input[name=invoice-amt-cgst]').each(function(){
        sum_amt_cgst += parseFloat($(this).val());
    });
    $('input[name=invoice-total-amt-cgst]').val(sum_amt_cgst.toFixed(2));

    // amount igst
    sum_amt_igst = 0
    $('input[name=invoice-amt-igst]').each(function(){
        sum_amt_igst += parseFloat($(this).val());
    });
    $('input[name=invoice-total-amt-igst]').val(sum_amt_igst.toFixed(2));

    sum_amt_with_gst = 0
    $('input[name=invoice-amt-with-gst]').each(function(){
        sum_amt_with_gst += parseFloat($(this).val());
    });
    $('input[name=invoice-total-amt-with-gst]').val(sum_amt_with_gst.toFixed(2));

}


// AUTO CALCULATE ITEM AMOUNTS =============================================

function initialize_auto_calculation(){
    update_amounts($('#invoice-form-items-table-body input[name=invoice-qty]:first'));
    $('input[name=invoice-qty], input[name=invoice-gst-percentage], input[name=invoice-rate-with-gst], input[name=invoice-rate-without-gst]').change(function (){
        update_amounts($(this));
    });
}

function get_rate_mode() {
    // Global rate mode selector:
    // "with"  - user enters rate WITH GST (existing behaviour)
    // "without" - user enters base rate WITHOUT GST, GST is added automatically.
    var selected = $('input[name=rate-mode]:checked').val();
    if (selected === 'without') {
        return 'without';
    }
    return 'with';
}

function update_amounts(element){
    var product = element.parent().parent().find('input[name=invoice-product]').val();
    var qty = parseInt(element.parent().parent().find('input[name=invoice-qty]').val());
    var gst_percentage = parseFloat(element.parent().parent().find('input[name=invoice-gst-percentage]').val());

    if (isNaN(qty)) {
        qty = 0;
    }
    if (isNaN(gst_percentage)) {
        gst_percentage = 0;
    }

    var row = element.parent().parent();
    var rate_mode = get_rate_mode();
    var rate_with_gst;
    var rate_without_gst;

    if (rate_mode === 'without') {
        // User provides base rate without GST; derive rate with GST.
        rate_without_gst = parseFloat(row.find('input[name=invoice-rate-without-gst]').val());
        if (isNaN(rate_without_gst)) {
            rate_without_gst = 0;
        }
        rate_with_gst = rate_without_gst * (100.0 + gst_percentage) / 100.0;
    } else {
        // Existing behaviour: user enters rate WITH GST; derive base rate.
        rate_with_gst = parseFloat(row.find('input[name=invoice-rate-with-gst]').val());
        if (isNaN(rate_with_gst)) {
            rate_with_gst = 0;
        }
        rate_without_gst = (rate_with_gst * 100.0) / (100.0 + gst_percentage || 1);
    }
    var amt_without_gst = rate_without_gst * qty;

    var sgst;
    var cgst;
    var igst;
    if(product == ""){
        sgst = 0;
        cgst = 0;
        igst = 0;
        amt_without_gst = 0;
    }
    else {
        if($('input[name=igstcheck]').is(':checked')){
            sgst = 0;
            cgst = 0;
            igst = amt_without_gst * gst_percentage / 100;
        }
        else {
            sgst = amt_without_gst * gst_percentage / 200;
            cgst = amt_without_gst * gst_percentage / 200;
            igst = 0;

        }
    }
    var amt_with_gst = amt_without_gst + cgst + sgst + igst;

    row.find('input[name=invoice-rate-with-gst]').val(rate_with_gst.toFixed(2));
    row.find('input[name=invoice-rate-without-gst]').val(rate_without_gst.toFixed(2));
    row.find('input[name=invoice-amt-without-gst]').val(amt_without_gst.toFixed(2));
    row.find('input[name=invoice-amt-sgst]').val(sgst.toFixed(2));
    row.find('input[name=invoice-amt-cgst]').val(cgst.toFixed(2));
    row.find('input[name=invoice-amt-igst]').val(igst.toFixed(2));
    row.find('input[name=invoice-amt-with-gst]').val(amt_with_gst.toFixed(2));

    update_invoice_totals();

}


// CUSTOMER SEARCH ========================================================

function customer_result_to_domstr(result) {
    var domstr = "<div class='customer-search-result' data-customer='" + JSON.stringify(result) + "'>"+
    "<div>"+ result['customer_name'] + "</div>" +
    "<div>"+ result['customer_address'] + "</div>" +
    "<div>"+ result['customer_phone'] + "</div>" +
    "<div>"+ result['customer_gst'] + "</div>" +
    "</div>";
     return domstr;
}

function customer_result_click() {
    console.log("UPDATE THE FORM WITH SEARCH RESULT");
    customer_data_json = JSON.parse($(this).attr('data-customer'));
    $('#customer-name-input').val(customer_data_json['customer_name']);
    $('#customer-address-input').val(customer_data_json['customer_address']);
    $('#customer-phone-input').val(customer_data_json['customer_phone']);
    $('#customer-gst-input').val(customer_data_json['customer_gst']);
}

function initialize_fuse_customers_search_bar() {
    console.log("INITIALIZING CUSTOMER SEARCH");

    $(".customer_search_area").focusin(function() {
        $("#customer_search_bar").show();
        var input = $('.customer_search_input');
        var val = input.val();
        update_customer_search_bar(val);
    });

    $(document).bind('focusin click',function(e) {
        if ($(e.target).closest('#customer_search_bar, .customer_search_area').length) return;
        $('#customer_search_bar').hide();
    });

    $(".customer_search_input").on("input", function(e) {
        $("#customer_search_bar").show();
        var input = $(this);
        var val = input.val();
        update_customer_search_bar(val);
    });
}

function update_customer_search_bar(search_string){
    console.log("Update customer search bar with query: " + search_string);
    results = fuse_customers.search(search_string);
    // console.log(results);
    $("#customer_search_bar").empty();
    for (var i = 0; i < results.length; i++) {
        $("#customer_search_bar").append(customer_result_to_domstr(results[i]));
    }
    $('.customer-search-result').click(customer_result_click);
}


function initialize_fuse_customers () {
    // fetch customer data
    $.getJSON( "/customersjson", function( data ) {
        var fuse_customer_options = {
            shouldSort: true,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
            "customer_name",
            "customer_address",
            "customer_gst",
            ]
        };
        fuse_customers = new Fuse(data, fuse_customer_options);

        // initialize the search bar
        initialize_fuse_customers_search_bar();
    });
}


// PRODUCT SEARCH ========================================================

var selected_item_input;

function product_result_to_domstr(result) {
    var domstr = "<div class='product-search-result' data-product='" + JSON.stringify(result) + "'>"+
    "<div>"+ result['product_name'] + "</div>" +
    "<div>"+ result['product_hsn'] + " | " + result['product_unit'] + " | " + result['product_gst_percentage'] +
    "</div>";
     return domstr;
}

function product_result_click() {
    console.log("UPDATE THE FORM WITH SEARCH RESULT");
    product_data_json = JSON.parse($(this).attr('data-product'));
    selected_item_input.val(product_data_json['product_name']);
    selected_item_input.parent().parent().find('input[name=invoice-hsn]').val(product_data_json['product_hsn']);    
    selected_item_input.parent().parent().find('input[name=invoice-rate-with-gst]').val(product_data_json['product_rate_with_gst']);    
    selected_item_input.parent().parent().find('input[name=invoice-gst-percentage]').val(product_data_json['product_gst_percentage']);    

    // $('#customer-address-input').val(customer_data_json['customer_address']);
    // $('#customer-phone-input').val(customer_data_json['customer_phone']);
    // $('#customer-gst-input').val(customer_data_json['customer_gst']);
}

function initialize_fuse_product_search_bar() {
    console.log("INITIALIZING PRODUCT SEARCH");

    $(".product_search_area").focusin(function() {
        console.log("DISPLAY PRODUCT SEARCH");
        $("#product_search_bar").show();
        var input = $( this );
        selected_item_input = input;
        var val = input.val();
        update_product_search_bar(val);
    });

    $(document).bind('focusin click',function(e) {
        if ($(e.target).closest('#product_search_bar, .product_search_area').length) return;
        $('#product_search_bar').hide();
    });

    $(".product_search_input").on("input", function(e) {
        $("#product_search_bar").show();
        var input = $(this);
        var val = input.val();
        update_product_search_bar(val);
    });
}

function update_product_search_bar(search_string){
    console.log("Update product search bar with query: " + search_string);
    results = fuse_products.search(search_string);
    console.log(results);
    $("#product_search_bar").empty();
    if (!results.length) {
        // If there are no matching products, hide the suggestions panel
        // so the user does not see a large empty white box.
        $("#product_search_bar").hide();
        return;
    }
    for (var i = 0; i < results.length; i++) {
        $("#product_search_bar").append(product_result_to_domstr(results[i]));
    }
    $('.product-search-result').click(product_result_click);
}


function initialize_fuse_products () {
    // fetch customer data
    $.getJSON( "/productsjson", function( data ) {
        var fuse_product_options = {
            shouldSort: true,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
            "product_name",
            ]
        };
        fuse_products = new Fuse(data, fuse_product_options);
        // initialize the search bar
        initialize_fuse_product_search_bar();
    });
}


// START =============================================================

$(document).ready(function() {

    // Initialize invoice row addition
    setup_invoice_rows();

    // Initialize customer search
    initialize_fuse_customers();

    // Initialize product search
    initialize_fuse_products();

    // Initialize auto calculation of amounts
    initialize_auto_calculation();

    // Initialize igst toggle
    $("input[name=igstcheck]").change(function() {
            $('input[name=invoice-qty]').each(function(){
                update_amounts($( this ));
            });
    });

    // Initialize rate-with/without GST toggle
    $('input[name=rate-mode]').change(function () {
        var mode = get_rate_mode();
        if (mode === 'without') {
            // User will now type base rate; show that field as editable.
            $('input[name=invoice-rate-without-gst]').prop('readonly', false);
            $('input[name=invoice-rate-with-gst]').prop('readonly', true);
        } else {
            // Existing behaviour.
            $('input[name=invoice-rate-without-gst]').prop('readonly', true);
            $('input[name=invoice-rate-with-gst]').prop('readonly', false);
        }
        // Recalculate all rows when mode changes.
        $('input[name=invoice-qty]').each(function(){
            update_amounts($( this ));
        });
    });

    // Ensure initial mode UI is in sync (default: with GST)
    $('input[name=rate-mode]').trigger('change');

    // Initialize Cash Customer toggle behaviour
    $('#cash-customer-toggle').change(function () {
        var isCash = $(this).is(':checked');
        if (isCash) {
            $('#customer-name-input').val('Cash').prop('readonly', true);
            $('#customer-address-input').val('').prop('disabled', true).prop('required', false);
            $('#customer-phone-input').val('').prop('disabled', true);
            $('#customer-gst-input').val('').prop('disabled', true);
        } else {
            $('#customer-name-input').prop('readonly', false);
            $('#customer-address-input').prop('disabled', false).prop('required', true);
            $('#customer-phone-input').prop('disabled', false);
            $('#customer-gst-input').prop('disabled', false);
        }
    });

    // Show the invoice form
    $("#invoice-form")[0].hidden = false;

});
