from model import User, Vehicle, Slot, Booking
from flask import Blueprint, request, jsonify
from database import db
import json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy import delete
from datetime import datetime, timedelta, timezone
import numpy as np
from PIL import Image
import io
from ultralytics import YOLO
from paddleocr import PaddleOCR
from services.services import UserService, DetectionService, AnalyticService

model = YOLO("https://huggingface.co/Koushim/yolov8-license-plate-detection/resolve/main/best.pt")
ocr = PaddleOCR(use_angle_cls=True, lang='en')

user_service = UserService()
detection_service = DetectionService(model, ocr)
analytics_service = AnalyticService()

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


@authentication.route("/test/entryDetection", methods=["POST"])
def entryDetection():
    file = request.files.get('file')
    data = file.read()
    image = Image.open(io.BytesIO(data))
    image_np = np.array(image, dtype=np.uint8)

    result, status = detection_service.verify_entry(image_np)
    return jsonify(result), status


@authentication.route("/test/exitDetection", methods=["POST"])
def exitDetection():
    file = request.files.get('file')
    data = file.read()
    image = Image.open(io.BytesIO(data))
    image_np = np.array(image, dtype=np.uint8)

    result, status = detection_service.verify_exit(image_np)
    return jsonify(result), status

@authentication.route("/test/slotDetection", methods=["POST"])
def slotDetection():
    file = request.files.get('file')
    slotId = int(request.form.get('id'))
    data = file.read()
    image = Image.open(io.BytesIO(data))
    image_np = np.array(image, dtype=np.uint8)

    result, status = detection_service.verify_slot(image_np, slotId)
    return jsonify(result), status