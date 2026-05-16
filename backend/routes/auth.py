from flask import Blueprint, request, jsonify
from database import db
from services.services import UserService
from services.parking_service import ParkingService

user_service = UserService()
parking_service = ParkingService()

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
    result, status = user_service.register(request.json)
    return jsonify(result), status


@authentication.route("/signin", methods=["POST"])
def signIn():
    result, status = user_service.authenticate(request.json)
    return jsonify(result), status

@authentication.route("/parking/entry", methods=["POST"])
def parking_entry():
    data = request.get_json() or {}
    plate = data.get("licensePlate")
    result, status = parking_service.verify_entry_by_plate(plate)
    return jsonify(result), status

@authentication.route("/parking/exit", methods=["POST"])
def parking_exit():
    data = request.get_json() or {}
    plate = data.get("licensePlate")
    result, status = parking_service.verify_exit_by_plate(plate)
    return jsonify(result), status

@authentication.route("/parking/slot", methods=["POST"])
def parking_slot():
    data = request.get_json() or {}
    plate = data.get("licensePlate")
    slotId = data.get("slotId")
    if slotId is None:
        return jsonify({"error": "slotId required"}), 400
    result, status = parking_service.verify_slot_by_plate(plate, int(slotId))
    return jsonify(result), status