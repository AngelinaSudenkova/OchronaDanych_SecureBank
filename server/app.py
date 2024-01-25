import time
from datetime import datetime, timedelta
from functools import wraps

import flask_wtf
from flask_wtf.csrf import generate_csrf
from flask_wtf.csrf import CSRFProtect
from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from models import db, User, Transaction
from config import ApplicationConfig

from flask_session import Session
from flask_migrate import Migrate
import random

from utils import validate_email, validate_password, validate_input

app = Flask(__name__)
CSRFProtect(app)
app.config.from_object(ApplicationConfig)

bcrypt = Bcrypt(app)
server_session = Session(app)
app.permanent_session_lifetime=timedelta(minutes=5)
db.init_app(app)
migrate = Migrate(app, db)

sets_dict = {
    1: [1, 2, 5, 7, 9],
    2: [2, 3, 5, 8, 10],
    3: [1, 3, 5, 8, 9],
    4: [3, 4, 7, 9, 10],
    5: [1, 3, 4, 7, 10],
    6: [2, 5, 6, 8, 10],
    7: [1, 4, 6, 8, 9],
    8: [2, 5, 7, 9, 10],
    9: [2, 4, 6, 8, 10],
    10: [1, 2, 4, 6, 8]
}


with app.app_context():
        db.create_all()



def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)

    return decorated_function


@app.route("/api/csrf-token", methods=["GET"])
def get_csrf_token():
    csrf_token = generate_csrf(secret_key=ApplicationConfig.SECRET_KEY)
    return jsonify({"token": csrf_token})


@app.route("/api/@me")
@login_required
def get_current_user():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    failed_attempts = user.failed_login_attempts

    return jsonify({
        "email": user.email,
        "failed_login_attempts": failed_attempts
    })


@app.route("/api/register", methods=["POST"])
def register_user():
    email = request.json["email"]
    password = request.json["password"]

    if not validate_input(email) or not validate_input(password):
        return jsonify({"error": "Input contains invalid characters"}), 400

    if not validate_email(email):
        return jsonify({"error": "Invalid email address or password"}), 400
    is_nice_password, message = validate_password(password)
    if not is_nice_password:
        return jsonify({"error": message}), 400

    user_exists = User.query.filter_by(email=email).first() is not None

    if user_exists:
        return jsonify({"error": "Invalid email address or password"}), 400  # we should not say it exists

    hashes_for_sets = gen_hashes(password)

    new_user = User(email=email, password_hash_sets=[])
    for set_index, hash_for_set in hashes_for_sets.items():
        new_user.add_password_hash_set(set_index, hash_for_set)

    new_user.generate_random_card()

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "email": new_user.email
    })


@app.route("/api/card", methods=["GET"])
@login_required
def get_card_number():
    user_id = session.get("user_id")
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Unauthorized"}), 401  # Actually it's 404

    return jsonify({"card_number": user.get_card(),
                    "cvv": user.get_cvv()})




@app.route("/api/login", methods=['POST'])
def login_user():
    req = request.json
    if "email" not in req or "password" not in req:
        return jsonify({"error": "Malformed body"}), 422

    email = req["email"]
    password = req["password"]

    if not validate_input(email) or not validate_input(password):
        return jsonify({"error": "Input contains invalid characters"}), 400

    user = User.query.filter_by(email=email).first()

    if user is None or user.is_account_locked():
        if user:
            print(f"User {email} is locked")
        return jsonify({"error": "Unauthorized"}), 401

    combination = user.combination

    if not bcrypt.check_password_hash(user.get_password_hash_for_set(combination), password):
        user.failed_login_attempts += 1
        delay = 2 ** (user.failed_login_attempts - 1)
        time.sleep(delay)

        if user.failed_login_attempts >= 5:
            user.lockout_time = datetime.utcnow() + timedelta(minutes=15)  # 15 min lock
        db.session.commit()
        return jsonify({"error": "Unauthorized"}), 401

    user.lockout_time = None
    db.session.commit()

    session["user_id"] = user.id

    return jsonify({
        "email": user.email
    })




@app.route("/api/login/set", methods=['POST'])
def get_user_set():
    email = request.json.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    if not validate_input(email):
        return jsonify({"error":"Email is required"}), 400

    user_exists = User.query.filter_by(email=email).first() is not None
    user = User.query.filter_by(email=email).first()

    key_combination = random.choice(list(sets_dict.keys()))

    if user_exists:
        combination = sets_dict[key_combination]
        user.combination = key_combination
        db.session.commit()
    else:
        combination = sets_dict[5]  # Fake answer
        delay = 1 
        time.sleep(delay)

    return jsonify({"combination": combination})


@app.route("/api/logout", methods=["POST"])
def logout_user():
    user = User.query.get(session.get("user_id"))
    if user is None:
        return jsonify({"error": "Incorrect account"}), 400
    session.pop("user_id")
    user.failed_login_attempts = 0
    db.session.commit()
    return "200"


@app.route("/api/balance", methods=["GET"])
@login_required
def get_balance():
    user = User.query.get(session.get("user_id"))
    if user is None:
        jsonify({"error": "Incorrect account"}), 400
    balance = user.balance
    return jsonify({"balance": balance})


@app.route("/api/send_transaction", methods=["POST"])
@login_required
def send_transaction():

    user_id = session.get("user_id")
    recipient_card = request.json.get("card")
    amount = request.json.get("amount")
    comment = request.json.get("comment", "")

    if not recipient_card or not amount:
        return jsonify({"error": "Missing recipient email or amount"}), 400

    if not validate_input(recipient_card) or not validate_input(str(amount)) or not validate_input(comment):
        return jsonify({"error": "Input contains invalid characters"}), 400

    recipient = User.find_by_card(card=recipient_card)
    if not recipient:
        return jsonify({"error": "Transaction error"}), 400

    sender = User.query.get(user_id)

    if sender.id == recipient.id:
        return jsonify({"error": "Bro personally for me you can send anywhere, but boss doesn't like it"}), 422

    balance = float(sender.balance)
    amount = float(amount)
    if balance < amount:
        return jsonify({"error": "Insufficient balance"}), 400

    sender.balance -= amount
    recipient.balance += amount

    transaction = Transaction(sender_id=sender.id, recipient_id=recipient.id, amount=amount, comment=comment)
    db.session.add(transaction)
    db.session.commit()

    return jsonify({"message": "Transaction successful"})


@app.route("/api/transactions", methods=["GET"])
@login_required
def get_transactions():
    user_id = session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Transaction error"}), 400

    sent_transactions = Transaction.query.filter_by(sender_id=user_id).all()
    received_transactions = Transaction.query.filter_by(recipient_id=user_id).all()

    transactions = []
    for transaction in sent_transactions:
        transactions.append({
            "id": transaction.id,
            "type": "Sent",
            "amount": transaction.amount,
            "comment": transaction.comment,
            "timestamp": transaction.timestamp.isoformat()
        })

    for transaction in received_transactions:
        transactions.append({
            "id": transaction.id,
            "type": "Received",
            "amount": transaction.amount,
            "comment": transaction.comment,
            "timestamp": transaction.timestamp.isoformat()
        })

    return jsonify({"transactions": transactions})


@app.route("/api/change_password", methods=["POST"])
@login_required
def change_password():
    new_password = request.json["new_password"]

    if not validate_input(new_password):
        return jsonify({"error": "Input contains invalid characters"}), 400
    user = User.query.get(session.get("user_id"))

    is_nice_password, message = validate_password(new_password)
    if not is_nice_password:
        return jsonify({"error": message}), 400

    hashes_for_sets = gen_hashes(new_password)

    user.password_hash_sets = []
    for set_index, hash_for_set in hashes_for_sets.items():
        user.add_password_hash_set(set_index, hash_for_set)

    db.session.commit()

    return jsonify({"message": "Password changed successfully"})


def calculate_set_hash(password, index_set):
    password_symbols = [password[index - 1] for index in index_set]
    combined_password = ''.join(password_symbols)
    print(combined_password)
    return bcrypt.generate_password_hash(combined_password)


def gen_hashes(password):
    hashes = {}
    for set_index, index_set in sets_dict.items():
        hash_for_set = calculate_set_hash(password, index_set)
        print(password, hash_for_set)
        hashes[set_index] = str(hash_for_set, 'utf-8')
    return hashes


if __name__ == "__main__":
    app.run()
