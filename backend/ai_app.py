from flask import Flask, request, jsonify
import numpy as np
from PIL import Image
import io
from services.detection_service import DetectionService
from ultralytics import YOLO
import easyocr
from flask_cors import CORS
import re

app = Flask(__name__)

CORS(app)


# load heavy AI models once at startup

model = YOLO("https://huggingface.co/Koushim/yolov8-license-plate-detection/resolve/main/best.pt")
ocr = easyocr.Reader(['en'], gpu=False)

detector = DetectionService(model, ocr)

@app.route("/ai/detect", methods=["POST"])
def detect():
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "file is required"}), 400
    data = file.read()
    image = Image.open(io.BytesIO(data)).convert("RGB")
    image_np = np.array(image, dtype=np.uint8)
    plate = detector.detect_plate(image_np)
    return jsonify({"licensePlate": plate}), 200

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)