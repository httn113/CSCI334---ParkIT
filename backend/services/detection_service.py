import numpy as np

class DetectionService:
    def __init__(self, model, ocr):
        self.model = model
        self.ocr = ocr

    def plate_normalisation(self, plate_text: str) -> str:
        return plate_text.upper().replace(" ", "").replace("-", "")

    def detect_plate(self, image_np):
        results = self.model(image_np)
        result = results[0]

        if len(result.boxes) != 0:
            x1, y1, x2, y2 = result.boxes.xyxy[0].cpu().numpy().astype(int)
            plate = image_np[y1:y2, x1:x2]
            ocr_result = self.ocr.readtext(plate)
            if ocr_result and ocr_result[0]:
                plate_text = " ".join([line[1] for line in ocr_result])
                return self.plate_normalisation(plate_text)

        return None