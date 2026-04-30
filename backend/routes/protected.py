from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from model import User, Vehicle, Booking, Slot
from datetime import datetime, timedelta, timezone

"""
Core features API which are required user to sign in to use
(JWT access token required)
"""

protected = Blueprint(
    name='protected',
    import_name= __name__,
    url_prefix='/protected'
)

@protected.route("/home", methods=["GET"])
@jwt_required()
def home():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@protected.route("/myProfile/information", methods=["GET"])
@jwt_required()
def personalInformation():
    current_user = get_jwt_identity()
    database_user = db.session.execute(db.select(User).filter_by(email=current_user)).scalars().first()
    return {
        "customerFName": database_user.customerFName,
        "customerLName": database_user.customerLName,
        "licenseNo": database_user.licenseNo,
        "phone": database_user.phone,
        "email": database_user.email,
        "password": database_user.password,
    }

@protected.route("/myProfile/addLicensePlate", methods=['POST'])
@jwt_required()
def addLicensePlate():
    current_user = get_jwt_identity()
    data = request.json
    database_user = db.session.execute(db.select(User).filter_by(email=current_user)).scalars().first()
    result = db.session.execute(db.select(Vehicle).filter_by(licensePlate=data["licensePlate"])).scalars().all()
    if len(result) != 0:
        return {
            "Error": "License plate already exist"
        }, 400
    else:
        vehicle = Vehicle(
            customerId = database_user.customerId,
            licensePlate = data["licensePlate"],
            color=data["color"],
            brand=data["brand"],
            model = data["model"],
            type=data["type"]
        )
        db.session.add(vehicle)
        db.session.commit()
        return "Vehicle created", 200

@protected.route("/myProfile/showLicensePlate", methods=["GET"])
@jwt_required()
def showLicensePlate():
    # [{ id: 1, plate: 'TEST-1234', model: 'Toyota' }]
    license_plates = []
    current_user = get_jwt_identity()
    database_user = db.session.execute(db.select(User).filter_by(email=current_user)).scalars().first()
    database_vehicles = db.session.execute(db.select(Vehicle).filter_by(customerId=database_user.customerId)).scalars().all()
    for vehicle in database_vehicles:
        license_plates.append(
            {
                "licensePlate": vehicle.licensePlate,
                "customerId": vehicle.customerId,
                "model": vehicle.model,
                "type": vehicle.type,
                "color": vehicle.color
            }
        )
    print(license_plates)
    return license_plates, 200

@protected.route("/findParking/booking", methods=["POST"])
@jwt_required()
def setupBooking():
    current_user = get_jwt_identity()
    data = request.json
    database_user = db.session.execute(db.select(User).filter_by(email=current_user)).scalars().first()
    booking = Booking(
        userId=database_user.customerId,
        slotId=data["slotId"],
        licensePlate=data["licensePlate"],
        timeStart=datetime.fromisoformat(data["timeStart"]),
        timeEnd=datetime.fromisoformat(data["timeEnd"]),
    )
    db.session.add(booking)
    db.session.commit()
    return "ok", 200

@protected.route("/myBooking/showBooking", methods=["GET"])
@jwt_required()
def showBooking():
    current_user = get_jwt_identity()
    database_user = db.session.execute(db.select(User).filter_by(email=current_user)).scalars().first()

    if not database_user:
        return jsonify({"error": "User not found"}), 404

    bookings = db.session.execute(
        db.select(Booking).filter_by(userId=database_user.customerId)
    ).scalars().all()

    booking_list = []
    now = datetime.now(timezone.utc)
    
    for b in bookings:
        vehicle = db.session.execute(
            db.select(Vehicle).filter_by(licensePlate=b.licensePlate)
        ).scalars().first()
        
        slot = db.session.execute(
            db.select(Slot).filter_by(slotId=b.slotId)
        ).scalars().first()

        booking_list.append({
            "bookingId": b.bookingId,
            "slotId": b.slotId,
            "zoneName": slot.zoneName if slot else "—",
            "zoneNumber": slot.zoneNumber if slot else "—",
            "licensePlate": b.licensePlate,
            "brand": vehicle.brand if vehicle else "—",
            "model": vehicle.model if vehicle else "—",
            "color": vehicle.color if vehicle else "—",
            "timeStart": b.timeStart.isoformat() if b.timeStart else None,
            "timeEnd": b.timeEnd.isoformat() if b.timeEnd else None,
        })

    # booking_list = [
    #     b for b in booking_list
    #     if b["timeEnd"] and datetime.fromisoformat(b["timeEnd"]) > now
    # ]

    booking_list.sort(key=lambda x: x["timeStart"] or "")

    return jsonify({
        "userName": f"{database_user.customerFName} {database_user.customerLName}",
        "bookings": booking_list
    }), 200