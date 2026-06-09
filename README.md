
# Simplest GST Billing app.

* Easily create invoices
* Manage inventory
* Keep books and track balances


Run the following commands to set up the environment:
for (macOS, Linux)
virtualenv -p python3 venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

For (windows)
1. py -3 -m venv venv   
2. venv\Scripts\activate   
3. python manage.py runserver   
4. pip install -r requirements.txt
5. python manage.py migrate 
6. python manage.py runserver