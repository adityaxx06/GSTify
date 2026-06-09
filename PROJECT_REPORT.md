# GST Billing Project — Comprehensive Documentation

## 1. ABSTRACT

This project implements a GST (Goods and Services Tax) billing and invoicing application built with Django (Python). It enables small and medium businesses to create, manage and print GST-compliant invoices, track inventory in real time, maintain customer ledgers, and keep a clear audit trail of transactions. The application is multi-tenant (each authenticated user manages their own data), supports Google OAuth2 for convenience, and uses an embedded SQLite database by default for development.

The system focuses on a practical balance between usability and extensibility: invoices are saved as structured JSON for flexibility, inventory and book ledgers are maintained for accurate accounting, and the codebase is organized following Django's MVT pattern to simplify future feature extension and deployment.


## 2. KEY FEATURES

- Create, view and print GST-compliant invoices (SGST + CGST or IGST)
- Automatic sequential invoice numbering and date handling
- Line-item invoicing with HSN, unit, quantity, GST% and per-line tax breakdown
- Inventory management: current stock, alert levels, and transaction logs (purchase, production, sales, other)
- Customer management and automatic customer-ledger (Book) creation
- Customer book / ledger tracking with BookLog entries and balance calculation
- Audit trail: InventoryLog and BookLog store historical changes with timestamps and references to invoices
- Multi-user isolation: all main models are scoped to the creating `user` (ForeignKey)
- Social login support (Google OAuth2) and standard Django authentication
- Extensible invoice JSON format (stored in `invoice_json`) for future search/export features
- Admin interface for manual operations via Django admin


## 3. OBJECTIVES

Primary objectives:
- Provide a lightweight, deployable billing system for GST invoicing needs.
- Enable accurate inventory deduction on sales and logging of adjustments.
- Maintain customer financial ledgers with simple debit/credit entries.
- Offer a maintainable codebase that can be extended to production (e.g., PostgreSQL migration).

Secondary objectives:
- Support OAuth login for convenience and faster onboarding.
- Keep the UI simple and mobile-friendly using Bootstrap and DataTables.
- Store invoice data in JSON to allow flexible exports and integrations.


## 4. PROBLEM FORMULATION

Objective:
- Build a system to allow businesses to generate GST-compliant invoices, manage stock and customer accounts, and preserve an auditable transaction history.

Input:
- User input from forms: invoice meta (number, date, customer), line items (product, HSN, qty, unit price with GST or without), tax selection (IGST or SGST/CGST), customer data, inventory updates, and manual book entries.
- Uploaded or preconfigured product and customer records.
- Authentication context (which user is performing the action).

Output:
- Persisted invoice record (in JSON) stored in `Invoice.invoice_json` and an `Invoice` row with metadata.
- Inventory updates: `Inventory` current_stock updated and `InventoryLog` entries created.
- Customer ledger updates: `Book` current_balance updated and `BookLog` entries created.
- Rendered HTML pages for invoice view/printing, product/customer/inventory lists, and reports.

Approach:
- Validate input on the server (via `utils.invoice_data_validator` and Django forms).
- Parse and normalize invoice POST data into a structured dict (`invoice_data_processor`).
- Upsert product catalog entries from invoices (`update_products_from_invoice`).
- Persist invoice JSON and create associated logs that update inventory and books (`update_inventory`, `auto_deduct_book_from_invoice`).
- Provide standard CRUD views and JSON endpoints for AJAX usage.


## 5. METHODOLOGY

High-level methodology and design decisions:

- Architecture: Use Django's Model-View-Template (MVT) architecture for separation of concerns. Models represent data and relationships, views contain business logic, templates provide presentational layers.

- Multi-tenant design: Each principal data model includes a `user` field (ForeignKey to Django `User`) so each account's data is isolated.

- Data persistence: Use Django ORM with SQLite for development; invoices stored both as model columns and as structured JSON for audit flexibility.

- Transactionality: Key operations (invoice creation → inventory & book updates) are performed in code that could be wrapped in transactions for data integrity when moving to production databases. The code currently follows a sequence that ensures logs and derived state (stock, balance) are updated immediately after invoice persistence.

- Validation: Server-side validation enforces invoice number integer, date format, and limits on customer fields (name length, GST number format).

- Extensibility: Utility functions (`utils.py`) centralize reusable operations like product upsert and inventory adjustments, which simplifies adding features like discounts, taxes, or integration endpoints.


## 6. PLANNING WORK

Introduction:
- The project provides an off-the-shelf billing system aimed at Indian GST compliance. It targets small businesses needing a simple, self-hosted solution to manage invoicing and inventory.

Objective:
- Deliver a working web application with invoice creation, product and customer management, inventory logs, and customer ledgers.

Scope of the Project:
- Implement the core features required for invoicing and stock management.
- Provide secure user authentication and basic social login.
- Build an extensible data model and simple UI.
- Exclude advanced features for v1: automatic tax filing, bank integrations, multi-currency, full accounting packages.

Implementation Tools:
- Programming language: Python 3.8+
- Web framework: Django 3.0.x
- Database: SQLite3 (development). Production recommendation: PostgreSQL
- Frontend: Bootstrap 4.4.1, jQuery, DataTables
- Libraries: `social-auth-app-django` (Google OAuth2), `num2words` (amount in words)
- OS/Environment: Cross-platform (Windows, macOS, Linux); development tested on embedded Python 3.8 Windows bundle included in repository

Expected Outcomes:
- A deployable Django project that runs locally with `python manage.py runserver`.
- Functional invoice creation, inventory updates, product/customer management, and ledger tracking.
- Clear documentation (this document plus in-repo docs) to assist deployment and further development.

Challenges and Risks:
- SQLite concurrency: SQLite can be locked under concurrent writes; for production, migrating to PostgreSQL is required.
- Data integrity: Without DB-level transactions around complex multi-step operations, partial failures could leave inconsistent state—wrap operations in atomic transactions when moving to production.
- Security: Default `SECRET_KEY` and `DEBUG=True` in repo; must be changed for production.
- Scalability: Web server and static files need production-grade setup (Gunicorn + nginx) for real traffic.
- Compliance risk: Tax rules change; ensure tax logic and HSN usage follow local regulations and are kept up to date.


## 7. FACILITIES REQUIRED FOR THE PROJECT

HARDWARE REQUIREMENTS (Development / Small production):
- CPU: Dual-core 2.0 GHz or better
- RAM: 2 GB (development), 4 GB+ recommended for production
- Disk: 2 GB free for application files and SQLite DB (grow as data grows)
- Network: Internet connection for OAuth and dependency installation

SOFTWARE REQUIREMENTS:
- Python 3.8+
- pip
- Virtual environment tool (`venv` or `virtualenv`)
- Django 3.x
- Required Python packages (see `requirements.txt`):
  - `Django==3.0.7`
  - `social-auth-app-django==3.1.0`
  - `num2words==0.5.10`
- For production: PostgreSQL, Gunicorn (or uWSGI), Nginx/Apache

Optional tools:
- Git for version control
- sqlite3 CLI for local DB inspection
- certbot for Let's Encrypt SSL


## 8. FUTURE SCOPE

Potential extensions and improvements:
- Migrate to PostgreSQL for concurrency, reliability, and production readiness.
- Implement RESTful API using Django REST Framework for external integrations (mobile apps, ERP systems).
- Add email delivery of invoices and PDF generation endpoint.
- Add scheduled tasks (Celery) for automated reports, reminders for overdue payments.
- Add more complete accounting features (general ledger, VAT/GST returns export, bank reconciliations).
- Add multi-currency and multi-tax jurisdictions for broader applicability.
- Add role-based access control for team-based workflows (admins, accountants, sales staff).
- Add audit logging, versioning of invoices, and soft-delete patterns for safer operations.
- Add unit/integration tests and CI pipeline to improve code quality.


## 9. CONCLUSION

This GST Billing Django project offers a compact, practical solution for handling GST-compliant invoicing, inventory tracking, and customer ledger management for small businesses. Its design favors clarity and extensibility: using Django's MVT architecture, an invoice JSON storage pattern, and modular utility functions makes it maintainable and simple to extend into a production-grade system by addressing the noted risks (DB migration, transactions, secrets management).

For teams needing a lightweight, self-hostable invoicing solution, this project provides a solid foundation that can be enhanced with production-grade deployments and integrations.


## 10. RESEARCH AND REFERENCES

- Django — The Web framework for perfectionists with deadlines: https://docs.djangoproject.com/
- social-auth-app-django: https://python-social-auth.readthedocs.io/en/latest/backends/google.html
- num2words: https://pypi.org/project/num2words/
- SQLite Documentation: https://www.sqlite.org/docs.html
- GST rules and HSN guidance: (Refer to official Indian government GST portal and tax guidelines for accurate HSN/tax rules)


---

*Prepared on November 2025.*
