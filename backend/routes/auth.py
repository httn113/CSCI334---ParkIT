from model import User
from flask import Blueprint, request, jsonify
from database import db
import json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

"""
Better API path organising using Blueprint
Reference: https://flask.palletsprojects.com/en/stable/blueprints/
"""

authentication = Blueprint(
    name='auth',
    import_name= __name__,
    url_prefix='/auth'
)

@authentication.route('/signup', methods=["POST"])
def signUp():
    """
    SignUp API: get the users' information: Fname, Lname, LicenseNo, Phone, Email, Password 
    to create user (using hashing for storing password)
    """
    data = request.json
    result = db.session.execute(db.select(User).filter_by(email=data["email"])).scalars().all()
    if len(result) == 0:
        user = User(customerFName=data["customerFName"], 
                    customerLName=data["customerLName"],
                    licenseNo=data["licenseNo"],
                    phone=data["phone"],
                    email=data["email"],
                    password=generate_password_hash(data["password"]))
        db.session.add(user)
        db.session.commit()
    else:
        return {
            "Error": "Email already exist"
        }, 400
    return "User created", 200

@authentication.route("/signin", methods=["POST"])
def signIn():
    data = request.json
    email = data["email"]
    password = data["password"]
    user = db.session.execute(db.select(User).filter_by(email=email)).scalars().first()
    if (not user) or (not check_password_hash(user.password, password)):
        return {"Failed": "Wrong credential"}, 404
    else:
        access_token = create_access_token(identity=email)
        return jsonify(
            access_token=access_token
        )

@authentication.route('/test/show', methods=["POST"])
def show():
    users = db.session.execute(db.select(User)).scalars().all()
    print(len(users))
    for user in users:
        print(user.customerFName)
        print(user.customerLName)
        print(user.licenseNo)
        print(user.phone)
        print(user.email)
        print(user.password)
    return {"ok": "1"}, 200

