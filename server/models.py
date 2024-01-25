import random
import os
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column
from sqlalchemy.ext.mutable import MutableList
from uuid import uuid4
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

db = SQLAlchemy()

BLOCK_SIZE = 16

# Key + IV generation
key1 = os.environ.get("key1", os.urandom(16))
key2 = os.environ.get("key2", os.urandom(16))
iv = os.urandom(16)  


def get_uuid():
    return uuid4().hex


def encrypt_data(data):
    cipher1 = AES.new(key1, AES.MODE_CBC, iv)
    encrypted_data = cipher1.encrypt(pad(data.encode(), BLOCK_SIZE))
    cipher2 = AES.new(key2, AES.MODE_CBC, iv)
    double_encrypted_data = cipher2.encrypt(encrypted_data)
    return double_encrypted_data


def decrypt_data(data):
    cipher2 = AES.new(key2, AES.MODE_CBC, iv)
    decrypted_data = cipher2.decrypt(data)
    cipher1 = AES.new(key1, AES.MODE_CBC, iv)
    double_decrypted_data = unpad(cipher1.decrypt(decrypted_data), BLOCK_SIZE)
    return double_decrypted_data.decode()


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(32), primary_key=True, unique=True, default=get_uuid)
    email = db.Column(db.String(255), unique=True)
    password_hash_sets = db.Column(MutableList.as_mutable(db.JSON), nullable=True, default=[])
    balance = db.Column(db.Float, default=50)
    card = Column(db.String(255), nullable=False)
    cvv = Column(db.String(255), nullable=False)
    combination = db.Column(db.Integer)

    failed_login_attempts = db.Column(db.Integer, default=0)
    lockout_time = db.Column(db.DateTime)

    def is_account_locked(self):
        if self.failed_login_attempts >= 5 and self.lockout_time and self.lockout_time > datetime.utcnow():
            return True
        return False

    def add_password_hash_set(self, set_index, password_hash):
        self.password_hash_sets.append({"set_index": set_index, "hash": password_hash})

    def get_password_hash_for_set(self, set_index):
        for password_set in self.password_hash_sets:
            if password_set["set_index"] == set_index:
                return password_set["hash"]
        return None

    def generate_random_card(self):
        digits = "0123456789"
        card = "4"  # Assuming all cards start with 4 according to banks notation
        for _ in range(15):
            card += random.choice(digits)
        self.card = encrypt_data(card).hex()
        self.cvv = encrypt_data(str(random.randint(100, 999))).hex()
        return card

    def get_card(self):
        return decrypt_data(bytes.fromhex(self.card))

    def get_cvv(self):
        return decrypt_data(bytes.fromhex(self.cvv))

    @staticmethod
    def find_by_card(card):
        for user in User.query.all():
            if decrypt_data(bytes.fromhex(user.card)) == card:
                return user
        return None


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.String(32), db.ForeignKey("users.id"))
    recipient_id = db.Column(db.String(32), db.ForeignKey("users.id"))
    amount = db.Column(db.Float)
    comment = db.Column(db.String(64))
    timestamp = db.Column(db.DateTime, default=db.func.now())
