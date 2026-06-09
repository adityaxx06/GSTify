# GSTBillS — Complete Project Documentation

Last updated: 2025-11-26

This document provides a complete reference for the GSTBillS project (GST Billing Django application). It covers the project's purpose, features, installation, architecture, database schema, API endpoints, usage examples, developer guidance, deployment notes and troubleshooting.

--

**Table of contents**

- Project overview
- Features
- Quick start (development)
- Installation (detailed)
- Project layout
- Database schema (models)
- URL routes & API reference
- User guide (step-by-step)
- Developer guide (code structure & patterns)
- Deployment (production checklist)
- Testing and maintenance
- Troubleshooting & FAQ
- Contribution guide
- License & credits

--

## Project overview

GSTBillS is a lightweight Django application designed to help small businesses generate GST-compliant invoices, manage inventory, and keep books/ledgers. It focuses on simplicity and practical features needed for day-to-day billing: invoice creation, automatic GST calculation (CGST/SGST/IGST), inventory deduction, customer management, and basic reporting.

Primary goals:

- Make invoice creation fast and friendly
- Maintain inventory and transaction logs automatically
- Keep customer ledgers (books) and payment tracking
- Offer a small learning curve for non-technical users

Intended users: Small businesses, freelancers, college projects and developers needing a simple billing backbone.

--

## Features

- Create, view, print and export invoices (GST-compliant)  
- Automatic GST calculations (SGST + CGST for intra-state, IGST for inter-state)  
- Product catalog with HSN code and unit price  
- Inventory tracking and InventoryLog to record stock changes  
- Customer management and per-customer ledger (Books + BookLog)  
- Export options (CSV/PDF) for invoices and reports  
- User registration, login, profile management  
- Admin interface for power users  

--

## Quick start (development)

Prerequisites:

- Python 3.8 (project bundled with embedded 3.8.1 in repo)  
- pip  
- Optional: virtualenv

On Windows (recommended command prompt / PowerShell):

```powershell
py -3 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # optional: create admin
python manage.py runserver
```

On macOS / Linux:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Open the site at: http://127.0.0.1:8000

--

## Installation (detailed)

1. Clone the repository or copy the project folder to your machine.
2. Create and activate a virtual environment.
3. Install dependencies: `pip install -r requirements.txt`.
4. Configure environment variables if needed (for production): `SECRET_KEY`, `ALLOWED_HOSTS`, database URL, email settings.
5. Run `python manage.py migrate`.
6. (Optional) Create a superuser: `python manage.py createsuperuser`.
7. Start the development server: `python manage.py runserver`.

Notes:

- The repository includes an embedded Python 3.8 distribution; use your system Python and virtualenv for development.  
- For production use PostgreSQL and set `DEBUG = False` in `gstbilling/settings.py`.

--

## Project layout

Top-level files and folders:

```
Gst-Billing-Python-Django/
├── gstbilling/          # Django project (settings, urls, wsgi/asgi)
├── gstbillingapp/       # Main app (models, views, templates, static)
├── manage.py
├── requirements.txt
├── gstbillingdb.sqlite3 # development DB (SQLite)
└── DOCUMENTATION.md
```

Important app folders (inside `gstbillingapp/`):

- `models.py` — All Django models (Customer, Invoice, Product, Inventory, InventoryLog, Book, BookLog, UserProfile, BillingProfile, Plan)
- `views.py` — Main views handling invoices, products, customers, books, inventory and pages
- `urls.py` — App-specific URL patterns
- `templates/gstbillingapp/` — All HTML templates (invoice pages, product pages, chatbot, landing pages)
- `static/gstbillingapp/` — Static assets (CSS, JS, images)

--

## Database schema (models)

Below is a high-level summary of the main models used. For exact fields see `gstbillingapp/models.py`.

1. User (Django built-in) — authentication & permissions

2. UserProfile (1:1 with User)
- business_name, address, email, phone, gst_number, other details

3. Plan and BillingProfile
- Plan: subscription tier (name, limits, price)
- BillingProfile: subscription information attached to `User`

4. Customer
- Fields: name, contact, address, gstin, email, phone, user (ForeignKey)

5. Product
- Fields: name, hsn, unit, price, gst_percent, user (ForeignKey)

6. Inventory
- Fields: product (OneToOne/ForeignKey), quantity, reorder_level, user

7. InventoryLog
- Records inventory transactions: product, qty_change, reason, related_invoice (optional), timestamp, user

8. Invoice
- Stores invoice metadata and the full invoice JSON for flexible retrieval. Fields include invoice_number, date, customer (FK), invoice_json (Text/JSON), total, user

9. Book (Ledger)
- Per-customer ledger with balance info and related BookLog entries

10. BookLog
- Individual ledger entries (credit/debit, date, narration, amount, related_invoice)

Relationships & Notes:

- All domain models are scoped to the `user` to implement multi-tenant isolation. Always filter by `request.user` in views.
- Invoice JSON stores line-items, tax breakdown, totals, rounding and metadata for auditability and flexible exports.

--

## URL routes & API reference

This project follows Django's standard routing. The primary routes (app-level) include:

- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/invoices/` - List of invoices
- `/invoices/new` or `/invoice/create` - Create invoice (form)
- `/invoice/<id>/` - View/print specific invoice
- `/customers/` - Customer listing
- `/customers/add` - Add a customer
- `/products/` - Product listing
- `/products/add` - Add a product
- `/inventory/` - Inventory overview
- `/books/` - Customer books/ledgers
- `/admin/` - Django admin site

AJAX endpoints (examples):

- `/customersjson` - Returns customers as JSON for autocomplete
- `/productsjson` - Returns products as JSON for autocomplete

For precise parameter lists and expected POST data, inspect `gstbillingapp/urls.py` and `gstbillingapp/views.py`.

--

## User guide (step-by-step)

1. Create a user account or login.
2. Complete `Profile` with business details and GSTIN.
3. Add products to the catalog with HSN codes and GST percentages.
4. Add opening stock in Inventory (if starting with existing stock levels).
5. Create a customer (or select an existing one) and create an invoice:
   - Add line items, quantity and unit price. The app calculates amount and GST.
   - Save invoice to reduce inventory (if stock tracking enabled).
   - Print or export invoice as required.
6. Use `Books` to see invoices and payments for each customer.

Tips:

- Use unique invoice numbering for audit trail.
- Keep backups of the database (SQLite file) or use PostgreSQL with regular dumps in production.

--

## Developer guide

Coding style and conventions:

- Follow Django best practices: use class-based views where appropriate, forms for input validation, and templates for presentation.
- Keep business logic in `utils.py` or separate service modules to keep `views.py` lean.

Key helper functions (look in `gstbillingapp/utils.py`):

- Invoice parsing and validation
- Product upsert logic when invoice contains unknown product
- Inventory updates and InventoryLog creation
- Book/ledger updates

Testing:

- Run unit tests with `python manage.py test`.
- Add tests for any new model or view logic you implement.

Making database changes:

```bash
python manage.py makemigrations
python manage.py migrate
```

Admin panel:

- The admin interface provides a quick way to inspect models and data; create a superuser to access it.

Security and multi-tenancy:

- Always filter queries by `user=request.user` to prevent cross-user data exposure.
- Use Django's built-in CSRF protection on forms and AJAX calls.

--

## Deployment (production checklist)

This checklist highlights production-relevant steps.

1. Set `DEBUG = False` in `gstbilling/settings.py`.
2. Generate and set a strong `SECRET_KEY` via environment variable.
3. Set `ALLOWED_HOSTS` to your domain(s).
4. Use PostgreSQL in production: update `DATABASES` in settings and migrate.
5. Configure static files: `python manage.py collectstatic` and serve them via Nginx/CloudFront.
6. Use Gunicorn or uWSGI as the WSGI server behind Nginx.
7. Configure HTTPS (Let's Encrypt or commercial cert) and redirect all HTTP to HTTPS.
8. Configure logging, monitoring and backups.

Example Gunicorn command:

```bash
gunicorn gstbilling.wsgi:application --workers 3 --bind 0.0.0.0:8000
```

--

## Testing and maintenance

- Keep `requirements.txt` updated when adding dependencies.
- Add unit tests for critical business rules (GST calculation, inventory updates).
- Schedule backups for production DB.
- Run database integrity checks and review logs regularly.

--

## Troubleshooting & FAQ

Q: `ModuleNotFoundError` when starting server?

A: Ensure virtualenv is activated and run `pip install -r requirements.txt`.

Q: `sqlite3.OperationalError: database is locked`?

A: Close any other process accessing the SQLite DB. Consider migrating to PostgreSQL for concurrent usage.

Q: Static files not served in production?

A: Run `python manage.py collectstatic` and configure your web server (Nginx) to serve the `/static/` directory.

Q: How to change invoice numbering?

A: Invoice numbering logic is in `gstbillingapp/utils.py` (or inside `views.py` where invoices are created). Modify the sequence generator carefully and migrate existing data if you change the format.

--

## Contribution guide

If you want to contribute:

1. Fork the repository and create a feature branch.
2. Run tests locally and add new tests for your changes.
3. Create a pull request with a clear description of the change and rationale.

Code of conduct: Be polite and include tests/documentation for significant changes.

--

## License & credits

This project includes a `LICENSE` file at the repository root — consult it for licensing details.

Credits:

- Built with Django
- Uses Bootstrap and DataTables for frontend UI
- Numeric invoice-to-words uses `num2words` Python package

--

If you want, I can also:

- Generate a separate `API_DOCUMENTATION.md` with request/response examples for each endpoint.  
- Produce `DATABASE_SCHEMA.md` with exact model field definitions and example queries.  
- Create `PROJECT_REPORT.md` with Abstract, Methodology and Future Scope sections.  

Tell me which additional documents you'd like and I will create them next.
