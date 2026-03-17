import os
import matplotlib.pyplot as plt
import cv2
import numpy as np
from ultralytics import YOLO
from paddleocr import PaddleOCR


ocr = PaddleOCR(use_angle_cls=True, lang='en')
model = YOLO("https://huggingface.co/Koushim/yolov8-license-plate-detection/resolve/main/best.pt")

test_dir = r"archive\images\train"
image_files = os.listdir(test_dir)

for i in range(2, 12):
    img_path = os.path.join(test_dir, image_files[i])

    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    results = model(img)
    result = results[0]

    if len(result.boxes) == 0:
        print("No plate detected")
        continue

    x1, y1, x2, y2 = result.boxes.xyxy[0].cpu().numpy().astype(int)
    plate = img[y1:y2, x1:x2]

    ocr_result = ocr.ocr(plate, cls=True)

    if ocr_result and ocr_result[0]:
        plate_text = " ".join([line[1][0] for line in ocr_result[0]])
    else:
        plate_text = "No text detected"

    plt.imshow(img)
    plt.title(f"Detection {i + 1}: {plate_text}", fontsize=14)
    plt.axis("off")
    plt.show()

    print("Detected Plate:", plate_text)
    print("-----")