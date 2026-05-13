from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from functools import wraps
from services.services import AnalyticService, SlotService, BookingService, PredictionService

admin_bp = Blueprint(name='admin', import_name=__name__, url_prefix='/admin')
analytics_service = AnalyticService()
slot_service = SlotService()
booking_service = BookingService()
prediction_service = PredictionService()

def admin_required(fn):
    """
    The spec requires different user types with appropriate access.
    This decorator checks the JWT claims for role == "admin" before
    allowing access to any route it decorates.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required."}), 403
        return fn(*args, **kwargs)
    return wrapper

@admin_bp.route("/analytics/slotStatus", methods = ["GET"])
@jwt_required()
@admin_required
def slotStatus():
    result, status = slot_service.get_dashboard()
    return jsonify(result), status

@admin_bp.route("/analytics/peakHours", methods = ["GET"])
@jwt_required()
@admin_required
def peakHours():
    result, status = analytics_service.get_peak_hours()
    return jsonify(result), status

@admin_bp.route("/utilisation", methods = ["GET"])
@jwt_required()
@admin_required
def utilisation():
    result, status = analytics_service.get_utilisation()
    return jsonify(result), status

@admin_bp.route("/analytics/trends", methods = ["GET"])
@jwt_required()
@admin_required
def trends():
    result, status = analytics_service.get_trends()
    return jsonify(result), status

@admin_bp.route('/analytics/recent-activity', methods=["GET"])
@jwt_required()
@admin_required
def recent_activity():
    limit = request.args.get("limit", 5, type=int)
    result, status = analytics_service.get_recent_activity(limit)
    return jsonify(result), status

@admin_bp.route('/analytics/bookings/list', methods=["GET"])
@jwt_required()
@admin_required
def booking_list():
    result, status = booking_service.get_booking_list()
    return jsonify(result), status

@admin_bp.route("/analytics/predict", methods=["GET"])
@jwt_required()
@admin_required
def predict_availability():
    result, status = prediction_service.predict_next_24h()
    return jsonify(result), status


@admin_bp.route("/analytics/predict/retrain", methods=["POST"])
@jwt_required()
@admin_required
def retrain_model():
    success = prediction_service.force_retrain()
    if success:
        return jsonify({"message": "Model retrained successfully"}), 200
    return jsonify({"message": "Not enough data to train model"}), 400