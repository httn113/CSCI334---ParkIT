from model import User, Vehicle, Slot, Booking
from flask import Blueprint, request, jsonify
from database import db
import json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy import delete
from datetime import datetime, timedelta
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

    role = data.get("role", "user")

    required_fields = ["customerFName", "customerLName", "licenseNo", "phone", "email", "password"]
    for field in required_fields:
        if not data.get(field) or not str(data[field]).strip():
            return {"Error": f"{field} is required."}, 400

    email_result = db.session.execute(db.select(User).filter_by(email=data["email"])).scalars().all()
    if len(email_result) != 0:
        return {"Error": "Email already exists."}, 400

    license_result = db.session.execute(db.select(User).filter_by(licenseNo=data["licenseNo"])).scalars().all()
    if len(license_result) != 0:
        return {"Error": "License number already registered."}, 400

    phone_result = db.session.execute(db.select(User).filter_by(phone=data["phone"])).scalars().all()
    if len(phone_result) != 0:
        return {"Error": "Phone number already registered."}, 400

    user = User(
        customerFName=data["customerFName"],
        customerLName=data["customerLName"],
        licenseNo=data["licenseNo"],
        phone=data["phone"],
        email=data["email"],
        password=generate_password_hash(data["password"]),
        role=role
    )
    db.session.add(user)
    db.session.commit()

    return {"message": "User created"}, 200

@authentication.route("/signin", methods=["POST"])
def signIn():
    data = request.json
    email = data["email"]
    password = data["password"]
    user = db.session.execute(db.select(User).filter_by(email=email)).scalars().first()
    if (not user) or (not check_password_hash(user.password, password)):
        return {"Failed": "Wrong credential"}, 404
    else:
        access_token = create_access_token(identity=email, additional_claims={"role": user.role})
        return jsonify(access_token=access_token)

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
        print(user.role)
        print('-' * 30)
    return {"ok": "1"}, 200

@authentication.route("/test/showLicensePlateAll", methods=["GET"])
def showLicensePlateAll():
    vehicles = db.session.execute(db.select(Vehicle)).scalars().all()
    for vehicle in vehicles:
        print(vehicle.licensePlate)
        print(vehicle.customerId)
        print(vehicle.model)
        print('-----')
    return {"ok": "1"}, 200

@authentication.route("/test/setupSlot", methods=["GET"])
def setupSlot():
    db.session.execute(delete(Slot))
    zone_name = ['A', 'B', 'C', 'D']
    zone_number = [1, 2, 3, 4, 5]
    for name in zone_name:
        for number in zone_number:
            slot = Slot(
                zoneName = name,
                zoneNumber = number
            )
            db.session.add(slot)
            db.session.commit()
    return "ok", 200

@authentication.route("/test/showSlot", methods=["GET"])
def showSlot():
    slots = db.session.execute(db.select(Slot)).scalars().all()
    for slot in slots:
        print(slot.slotId, slot.zoneName, slot.zoneNumber)
    return "ok", 200

@authentication.route("/test/setupBooking", methods=["GET"])
def setupBooking():
    vehicleSample = db.session.execute(db.select(Vehicle)).scalars().first()
    slotSample = db.session.execute(db.select(Slot)).scalars().first()
    bookingSample = Booking(
        slotId=slotSample.slotId,
        licensePlate=vehicleSample.licensePlate,
        timeStart=datetime.now(),
        timeEnd=datetime.now() + timedelta(hours=1),
    )
    db.session.add(bookingSample)
    db.session.commit()
    return "ok", 200

@authentication.route("/test/searchParking", methods=["POST"])
def searchParking():
    data = request.json
    time_start = datetime.strptime(data["timeStart"], "%Y-%m-%d %H:%M:%S")
    time_end = datetime.strptime(data["timeEnd"], "%Y-%m-%d %H:%M:%S")
    availableSlots = db.session.execute(
        db.select(Slot).where(
            ~db.select(Booking).where(
                Booking.slotId == Slot.slotId,
                Booking.timeStart < time_end,
                Booking.timeEnd > time_start
            ).exists()
        )
    ).scalars().all()
    response = []
    for slot in availableSlots:
        response.append(
            {
                "slotId": slot.slotId,
                "zoneName": slot.zoneName,
                "zoneNumber": slot.zoneNumber
            }
        )
        # print(slot.slotId, slot.zoneName, slot.zoneNumber)
    print(response)
    return jsonify(response), 200