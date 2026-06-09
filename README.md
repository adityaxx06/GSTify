# GSTify – GST Billing & Invoice Management System

## 📌 Overview

GSTify is a web-based GST Billing and Invoice Management System developed as a Bachelor of Computer Applications (BCA) Final Year Project. The application helps businesses create GST-compliant invoices, manage customers, maintain product inventory, and generate professional tax invoices with automatic GST calculations.

The project is built using Python, Django, SQLite, Bootstrap, JavaScript, and jQuery. GSTify provides a simple and user-friendly interface for managing billing operations efficiently.

---

## 🚀 Live Demo

**Website:** https://gstify-8hf8.onrender.com/

---

## 🎯 Project Objectives

* Generate GST-compliant tax invoices.
* Automate CGST, SGST, and IGST calculations.
* Manage customer information and ledger records.
* Maintain product inventory and stock tracking.
* Support both registered and cash customers.
* Provide printable invoice formats.
* Reduce manual billing errors and calculation mistakes.

---

## ✨ Key Features

### Invoice Management

* Create GST invoices
* Automatic tax calculations
* Invoice preview and printing
* Amount in words generation
* GST breakup display

### Customer Management

* Add, edit, and delete customers
* Customer GST number validation
* Customer ledger maintenance
* Cash customer support

### Product Management

* Product inventory tracking
* HSN code support
* Product search functionality
* Automatic stock deduction

### GST Features

* GST number format validation
* CGST calculation
* SGST calculation
* IGST calculation
* Tax summary generation

### User Experience

* Responsive design
* Modern dashboard
* Search functionality
* Easy navigation
* Print-friendly invoices

---

## 🛠️ Technology Stack

### Frontend

* HTML5
* CSS3
* Bootstrap 4
* JavaScript
* jQuery

### Backend

* Python 3
* Django 3.0.7

### Database

* SQLite3

### Libraries Used

* Num2Words
* Social Auth Django
* WhiteNoise
* Gunicorn

### Deployment

* GitHub
* Render

---

## 📂 Project Structure

```text
GSTify/
│
├── gstbilling/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── gstbillingapp/
│   ├── models.py
│   ├── views.py
│   ├── forms.py
│   ├── urls.py
│   ├── utils.py
│   └── templates/
│
├── static/
├── manage.py
├── requirements.txt
├── Procfile
├── runtime.txt
└── README.md
```

---

## ⚙️ Installation & Setup

### Clone Repository

```bash
git clone https://github.com/adityaxx06/GSTify.git
cd GSTify
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Windows:

```bash
venv\Scripts\activate
```

Linux/Mac:

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Migrations

```bash
python manage.py migrate
```

### Start Development Server

```bash
python manage.py runserver
```

Open:

```text
http://127.0.0.1:8000/
```

---

## 🧪 Testing

The application has been tested for:

* Invoice creation
* GST calculations
* Customer management
* Product management
* Inventory updates
* Search functionality
* Input validation
* Error handling
* Responsive UI

---

## 📊 Database Entities

Main database entities include:

* User
* Customer
* Product
* Invoice
* Invoice Item
* Inventory Log
* Customer Ledger

---

## 🔐 Security Features

* Django authentication system
* CSRF protection
* Form validation
* GST number validation
* Secure session management

---

## 📈 Future Enhancements

* PDF invoice export
* Email invoice sharing
* GST API integration
* Barcode support
* Multi-user roles
* Sales analytics dashboard
* Cloud database integration
* Mobile application

---

## 🎓 Academic Information

**Project Title:** GSTify – GST Billing & Invoice Management System

**Course:** Bachelor of Computer Applications (BCA)

**College:** Rungta College of Science and Technology (RCST)

**University:** Hemchand Yadav Vishwavidyalaya, Durg (C.G.)

**Academic Session:** 2025–26

---

## 👨‍💻 Developer

**Aditya Soni**

BCA Final Year Student

Rungta College of Science and Technology

---

## 📄 License

This project is developed for academic and educational purposes.
