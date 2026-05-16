from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from model import User, Vehicle, Booking, Slot
from datetime import datetime, timedelta, timezone
from services.services import BookingService, VehicleService, SlotService, SubscriptionService, RecommendationService
"""
Core features API which are required user to sign in to use
(JWT access token required)
"""

protected = Blueprint(
    name='protected',
    import_name= __name__,
    url_prefix='/protected'
)

booking_service = BookingService()
vehicle_service = VehicleService()
slot_service = SlotService()
subscription_service = SubscriptionService()
recommendation_service = RecommendationService()

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
    email = get_jwt_identity()
    result, status = vehicle_service.add_vehicle(email, request.json)
    return jsonify(result), status

@protected.route("/myProfile/showLicensePlate", methods=["GET"])
@jwt_required()
def showLicensePlate():
    email = get_jwt_identity()
    result, status = vehicle_service.get_vehicles(email)
    return jsonify(result), status


@protected.route("/subscription/current", methods=["GET"])
@jwt_required()
def getCurrentSubscription():
    email = get_jwt_identity()
    result, status = subscription_service.get_user_subscription(email)
    return jsonify(result), status

@protected.route("/subscription/upgrade", methods=["POST"])
@jwt_required()
def upgradeSubscription():
    email = get_jwt_identity()
    data = request.json
    plan = data.get("plan")
    result, status = subscription_service.upgrade_subscription(email, plan)
    return jsonify(result), status

@protected.route("/subscription/cancel", methods=["POST"])
@jwt_required()
def cancelSubscription():
    email = get_jwt_identity()
    result, status = subscription_service.cancel_subscription(email)
    return jsonify(result), status

@protected.route("/findParking/booking", methods=["POST"])
@jwt_required()
def setupBooking():
    email = get_jwt_identity()
    result, status = booking_service.create_booking(email, request.json)
    return jsonify(result), status

@protected.route("/myBooking/showBooking", methods=["GET"])
@jwt_required()
def showBooking():
    email = get_jwt_identity()
    result, status = booking_service.get_user_bookings(email)
    return jsonify(result), status

@protected.route("/myBooking/cancelBooking", methods=["POST"])
@jwt_required()
def cancelBooking():
    data = request.json
    email = get_jwt_identity()
    booking_id = data["booking_id"]
    result, status = booking_service.cancel_booking(email, booking_id)
    return jsonify(result), status

@protected.route("/searchParking", methods=["POST"])
@jwt_required()
def searchParking():
    data = request.json
    result, status = slot_service.search_available(data)
    return jsonify(result), status

@protected.route("/dashboard", methods=["POST", "GET"])
@jwt_required()
def dashboard():
    if request.method == "POST":
        data = request.json
        result, status = slot_service.get_dashboard(data=data) 
        return jsonify(result), status
    
    elif request.method == "GET":
        result, status = slot_service.get_dashboard()
        return jsonify(result), status

@protected.route("/parking/recommendations", methods=["POST"])
@jwt_required()
def getRecommendations():
    email = get_jwt_identity()
    data = request.json
    time_start = datetime.fromisoformat(data["timeStart"])
    time_end = datetime.fromisoformat(data["timeEnd"])
    result, status = recommendation_service.get_recommendations(time_start, time_end)
    return jsonify(result), status