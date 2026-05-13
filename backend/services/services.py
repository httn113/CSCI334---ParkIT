from repositories.repositories import UserRepository, BookingRepository, VehicleRepository, SlotRepository, OccupancyLogRepository
from model import User, Vehicle, Slot, Booking, OccupancyLog
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from datetime import datetime
from ultralytics import YOLO
from paddleocr import PaddleOCR
from collections import defaultdict
from sklearn.ensemble import RandomForestRegressor
import numpy as np
from datetime import timedelta

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()

    def register(self, data: dict):
        required_fields = ["customerFName", "customerLName", "licenseNo", "phone", "email", "password"]
        role = data.get("role", "user")

        for field in required_fields:
            if not data.get(field) or not str(data[field]).strip():
                return {"Error": f"{field} is required."}, 400

        if self.user_repo.email_exists(data["email"]):
            return {"Error": "Email already exists."}, 400

        if self.user_repo.license_exists(data["licenseNo"]):
            return {"Error": "License number already registered."}, 400

        if self.user_repo.phone_exists(data["phone"]):
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
        
        self.user_repo.save(user)

        return {"message": "User created"}, 201

    def authenticate(self, data: dict):
        required_fields = ["email", "password"]

        for field in required_fields:
            if not data.get(field) or not str(data[field]).strip():
                return {"Error": f"{field} is required."}, 400
            
        email = data["email"]
        password = data["password"]
        user = self.user_repo.get_by_email(email)

        if (not user) or (not check_password_hash(user.password, password)):
            return {"Failed": "Wrong credential"}, 404
        else:
            access_token = create_access_token(identity=email, additional_claims={"role": user.role})
            return {"access_token": access_token}, 200        

class BookingService:
    def __init__(self):
        self.booking_repo = BookingRepository()
        self.user_repo = UserRepository()
        self.vehicle_repo = VehicleRepository()
        self.slot_repo = SlotRepository()
        self.occupancy_repo = OccupancyLogRepository()

    def create_booking(self, email: str, data: dict):
        user = self.user_repo.get_by_email(email)
        if not user:
            return {"error": "User not found."}, 404

        time_start = datetime.fromisoformat(data["timeStart"])
        time_end = datetime.fromisoformat(data["timeEnd"])

        # WHY: Reuse existing availability query — if slot not in available
        # results for this window, it's already taken
        available_slots = self.slot_repo.get_available_in_window(time_start, time_end)
        available_ids = [s.slotId for s in available_slots]
        if data["slotId"] not in available_ids:
            return {"error": "Slot already booked in this time window."}, 400

        booking = Booking(
            userId=user.customerId,
            slotId=data["slotId"],
            licensePlate=data["licensePlate"],
            timeStart=time_start,
            timeEnd=time_end,
        )
        self.booking_repo.save(booking)

        slot = self.slot_repo.get_by_id(data["slotId"])
        slot.status = "reserved"
        self.slot_repo.commit()

        new_log = OccupancyLog(
            slotId=data["slotId"],
            status="reserved", 
            licensePlate=data["licensePlate"],
            recorded_at=datetime.now() 
        )
        self.occupancy_repo.save(new_log)

        return {"message": "Booking created."}, 201
    
    def cancel_booking(self, email: str, booking_id: int):
        user = self.user_repo.get_by_email(email)
        booking = self.booking_repo.get_by_id(booking_id)

        if (not user) or (not booking):
            return {"message": "Information Mismatch"}, 404

        if booking.userId != user.customerId:
            return {"message": "Information Mismatch"}, 404

        self.booking_repo.delete(booking)
        return {"message": "Booking Cancelled"}, 200        
    
    def get_user_bookings(self, email: str):
        user = self.user_repo.get_by_email(email)

        if not user:
            return {"error": "User not found"}
        
        bookings = self.booking_repo.get_by_user(user.customerId)

        booking_list = []
        
        for b in bookings:
            vehicle = self.vehicle_repo.get_by_plate(b.licensePlate)
            
            slot = self.slot_repo.get_by_id(b.slotId)

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

        booking_list.sort(key=lambda x: x["timeStart"] or "")

        return {
            "userName": f"{user.customerFName} {user.customerLName}",
            "bookings": booking_list
        }, 200
    
    def get_booking_list(self):
        now = datetime.now()
        
        # Use your Repository to get all bookings
        bookings = self.booking_repo.get_all()
        
        stats = {"total": 0, "active": 0, "completed": 0, "expired": 0}
        booking_data = []

        for b in bookings:
            stats["total"] += 1
            
            # Use your SlotRepository for the "direct search"
            slot = self.slot_repo.get_by_id(b.slotId)

            duration_delta = b.timeEnd - b.timeStart
            hours, remainder = divmod(int(duration_delta.total_seconds()), 3600)
            minutes = remainder // 60

            if b.timeStart <= now <= b.timeEnd:
                status = "active"
                stats["active"] += 1
            elif b.timeEnd < now:
                status = "completed"
                stats["completed"] += 1
            else:
                status = "upcoming"

            booking_data.append({
                "id": f"#BK-{b.bookingId:04}",
                "spot": f"{slot.zoneName}-{slot.zoneNumber:03}" if slot else "N/A",
                "vehicle": str(b.licensePlate),
                "start": b.timeStart.strftime("%Y-%m-%d %H:%M"),
                "end": b.timeEnd.strftime("%Y-%m-%d %H:%M"),
                "duration": f"{hours}h {minutes}m",
                "status": status.capitalize(),
                "zone": slot.zoneName if slot else "Unknown"
            })

        return {"stats": stats, "bookings": booking_data}, 200
        
class VehicleService:
    def __init__(self):
        self.vehicle_repo = VehicleRepository()
        self.user_repo = UserRepository()

    def add_vehicle(self, email: str, data: dict):
        user = self.user_repo.get_by_email(email)
        if not user:
            return {"error": "user not found"}, 404
        if self.vehicle_repo.plate_exists(data["licensePlate"]):
            return {"error": "Licese plate already exists"}, 400
        
        vehicle = Vehicle(
            customerId=user.customerId,
            licensePlate=data["licensePlate"],
            color=data["color"],
            brand=data["brand"],
            model=data["model"],
            type=data["type"],
        )

        self.vehicle_repo.save(vehicle)
        return {"message": "Vehicle created."}, 201
    
    def get_vehicles(self, email: str):
        user = self.user_repo.get_by_email(email)
        if not user:
            return {"error": "user not found"}, 404
        vehicles = self.vehicle_repo.get_by_customer(user.customerId)
        return [
            {
                "licensePlate": v.licensePlate,
                "customerId": v.customerId,
                "model": v.model,
                "type": v.type,
                "color": v.color,
            }
            for v in vehicles
        ], 200

class SlotService:
    def __init__(self):
        self.slot_repo = SlotRepository()
        self.booking_repo = BookingRepository()
        self.user_repo = UserRepository()

    def search_available(self, data: dict):
        time_start = datetime.strptime(data["timeStart"], "%Y-%m-%d %H:%M:%S")
        time_end = datetime.strptime(data["timeEnd"], "%Y-%m-%d %H:%M:%S")
        responses = self.slot_repo.get_available_in_window(time_start, time_end)

        return [
            {
                "slotId": slot.slotId,
                "zoneName": slot.zoneName,
                "zoneNumber": slot.zoneNumber
            }
            for slot in responses
        ], 200
    
    def get_dashboard(self, data=None):
        # 1. Handle Timezone alignment immediately
        if not data:
            time = datetime.now()
        else:
            time = datetime.strptime(data["time"], "%Y-%m-%d %H:%M:%S")
            if time.tzinfo is None:
                time = time.replace(tzinfo=None)

        total_capacity = 0
        count_all_zone = {"available": 0, "reserved": 0, "occupied": 0}
        zone_breakdown = {}
        slots_snapshot = [] # New list for the table

        for slot in self.slot_repo.get_all():
            total_capacity += 1
            zone = slot.zoneName or "Unknown"
            
            if zone not in zone_breakdown:
                zone_breakdown[zone] = {"available": 0, "reserved": 0, "occupied": 0, "total": 0}
            zone_breakdown[zone]["total"] += 1

            # Check for Booking info
            booking = self.booking_repo.get_active_by_slot_now(slot.slotId, time)
            
            # Determine Status (Re-using your existing logic flow)
            assigned_to = "—"
            current_vehicle = "—"
            
            if slot.status == "occupied":
                current_status = "Occupied"
                count_all_zone["occupied"] += 1
                zone_breakdown[zone]["occupied"] += 1
                # Even if occupied, check if we know WHO should be there
                if booking:
                    user = self.user_repo.get_by_id(booking.userId)
                    assigned_to = f"{user.customerFName} {user.customerLName}" if user else "Unknown"
                    current_vehicle = booking.licensePlate
            
            elif booking:
                current_status = "Reserved"
                count_all_zone["reserved"] += 1
                zone_breakdown[zone]["reserved"] += 1
                # assigned_to = booking.user.fullName if hasattr(booking, 'user') else "User"
                user = self.user_repo.get_by_id(booking.userId)
                assigned_to = f"{user.customerFName} {user.customerLName}" if user else "Unknown"
                current_vehicle = booking.licensePlate
                
            else:
                current_status = "Available"
                count_all_zone["available"] += 1
                zone_breakdown[zone]["available"] += 1

            # Add to the Snapshot list for the UI Table
            slots_snapshot.append({
                "spotNumber": f"{zone}-{slot.zoneNumber:03}",
                "type": getattr(slot, 'type', 'Regular'), # Fallback if column doesn't exist
                "status": current_status,
                "assignedTo": assigned_to,
                "currentVehicle": current_vehicle,
                "zone": zone
            })

        return {
            "total_capacity": total_capacity,
            "available": count_all_zone["available"],
            "reserved": count_all_zone["reserved"],
            "occupied": count_all_zone["occupied"],
            "zone_breakdown": zone_breakdown,
            "slots": slots_snapshot
        }, 200

class DetectionService:
    def __init__(self, model, ocr):
        self.model = model
        self.ocr = ocr
        self.vehicle_repo = VehicleRepository()
        self.booking_repo = BookingRepository()
        self.slot_repo = SlotRepository()
        self.occupancy_repo = OccupancyLogRepository()

    def plate_normalisation(self, plate_text: str) -> str:
        return plate_text.upper().replace(" ", "").replace("-", "")

    def _log(self, slot_id, status, license_plate=None):
        log = OccupancyLog(
            slotId = slot_id,
            status = status,
            licensePlate=license_plate 
        )
        self.occupancy_repo.save(log)
        return log
    
    def detect_plate(self, image_np):
        results = self.model(image_np)
        result = results[0]

        if len(result.boxes) != 0:
            x1, y1, x2, y2 = result.boxes.xyxy[0].cpu().numpy().astype(int)
            plate = image_np[y1:y2, x1:x2]
            ocr_result = self.ocr.ocr(plate, cls=True)

            if ocr_result and ocr_result[0]:
                plate_text = " ".join([line[1][0] for line in ocr_result[0]])
                print(self.plate_normalisation(plate_text))
                return self.plate_normalisation(plate_text)  
        
        return None
    
    def verify_entry(self, image_np):
        plate_text = self.detect_plate(image_np)
        if plate_text:
            vehicle = self.vehicle_repo.get_by_plate(plate_text)
            if not vehicle:
                return {"message": "Access Denied"}, 200

            now = datetime.now()
            active_booking = self.booking_repo.get_active_booking_by_plate(plate_text, now)
            if not active_booking:
                return {"message": "Access Denied — No Active Booking"}, 200

            self._log(slot_id=0, status="occupied", license_plate=plate_text)
            return {"message": "Access Granted"}, 200
        return {"message": "No Car Detected"}, 200

    def verify_exit(self, image_np):
        plate_text = self.detect_plate(image_np)
        if plate_text:
            vehicle = self.vehicle_repo.get_by_plate(plate_text)
            if vehicle:
                now = datetime.now()
                completed_booking = self.booking_repo.get_active_booking_by_plate(plate_text, now)
                if completed_booking:
                    completed_booking.status = "completed"
                    self.booking_repo.commit()
                self._log(slot_id=0, status="available", license_plate=plate_text)
                return {"message": "Exit Granted"}, 200
            return {"message": "Exit Denied"}, 200
        return {"message": "No Car Detected"}, 200


    def verify_slot(self, image_np, slotId):
        plate_text = self.detect_plate(image_np)
        now = datetime.now()

        slot = self.slot_repo.get_by_id(slotId)
        if not slot:
            return {"message": "Slot not found"}, 404

        if plate_text:
            curr_booking = self.booking_repo.get_active_by_slot_now(slotId, now)

            if curr_booking is None:
                # Unauthorised car — don't mark as occupied
                self._log(slot_id=slotId, status="occupied", license_plate=plate_text)
                slot.status = "occupied"
                self.slot_repo.commit()
                return {"message": "No Booking But Car Detected"}, 200

            elif curr_booking.licensePlate != plate_text:
                # Wrong car — don't mark this slot occupied
                self._log(slot_id=slotId, status="occupied", license_plate=plate_text)
                slot.status = "occupied"
                self.slot_repo.commit()
                return {"message": "Parking in Wrong Spot"}, 200

            else:
                # Correct car — now it's safe to mark occupied
                slot.status = "occupied"
                self.slot_repo.commit()
                curr_booking.status = "occupied"
                self.booking_repo.commit()
                self._log(slot_id=slotId, status="occupied", license_plate=plate_text)
                return {"message": "Correct Parking"}, 200

        else:
            curr_booking = self.booking_repo.get_active_by_slot_now(slotId, now)
            if curr_booking is None:
                self._log(slot_id=slotId, status="available", license_plate=None)
                slot.status = "available"
            else:
                # slot.status = "reserved"
                # self._log(slot_id=slotId, status="reserved", license_plate=curr_booking.licensePlate)
                slot.status = "reserved"
                curr_booking.status = "active"
                self.booking_repo.commit()
                self._log(slot_id=slotId, status="vacated", license_plate=curr_booking.licensePlate)
            self.slot_repo.commit()
            # self._log(slot_id=0, status="occupied", license_plate=plate_text)
            return {"message": "No Car Detected"}, 200

class AnalyticService:
    def __init__(self):
        self.occupancy_repo = OccupancyLogRepository()
        self.slot_repo = SlotRepository()
        self.vehicle_repo = VehicleRepository()
        self.booking_repo = BookingRepository()

    def get_peak_hours(self):
        logs = self.occupancy_repo.get_all()
        hour_counts = defaultdict(int)

        for log in logs:
            if log.status == "occupied" and log.recorded_at:
                hour_counts[log.recorded_at.hour] += 1

        busiest_hour = max(hour_counts, key=hour_counts.get)
        
        return {
            "hours_detail": [
                {"hour": h, "count": hour_counts[h]} 
                for h in range(24)
            ],
            "busiest_hour": busiest_hour
        }, 200
    
    def get_utilisation(self):
        logs = self.occupancy_repo.get_all()
        slots = self.slot_repo.get_all()

        slot_zone = {slot.slotId: slot.zoneName for slot in slots}
        
        zone_totals = defaultdict(int)
        zone_occupied = defaultdict(int)

        for log in logs:
            zone = slot_zone.get(log.slotId)
            if zone:
                zone_totals[zone] += 1
                if log.status == "occupied":
                    zone_occupied[zone] += 1
        
        utilisation = []
        for zone in zone_totals:
            rate = 0

            if zone_totals[zone] != 0:
                rate = zone_occupied[zone] / zone_totals[zone]

            utilisation.append({
                "zone": zone,
                "utilisation_rate": round(
                    rate * 100, 1
                )
            })

        return {
            "utilisation": utilisation
        }, 200
    
    def get_trends(self):
        logs = self.occupancy_repo.get_all()
        date_counts = defaultdict(int)

        for log in logs:
            if log.status == "occupied" and log.recorded_at:
                day = log.recorded_at.date().isoformat()
                date_counts[day] += 1

        return {
            "trends": [
                {"date": date, "count": count}
                for date, count in sorted(date_counts.items())
            ]
        }, 200
    
    def get_recent_activity(self, limit=5):
        logs = self.occupancy_repo.get_all(240)
        now = datetime.now()
        logs = [l for l in logs if l.recorded_at <= now]
        logs = sorted(logs, key=lambda l: l.recorded_at, reverse=True)[:limit]

        result = []
        for log in logs:
            booking = None

            if log.slotId == 0:
                # Entry/Exit gate — no slot/booking context, use stored plate directly
                if log.status == "occupied":
                    activity_type = "Vehicle Entered"
                elif log.status == "available":
                    activity_type = "Vehicle Exited"
                else:
                    activity_type = "Unknown Activity"
                plate = log.licensePlate or "Unknown"
                v = self.vehicle_repo.get_by_plate(plate) if plate != "Unknown" else None
                vehicle = f"{v.brand} {v.model}" if v else "Unknown"

            elif log.status == "reserved":
                booking = self.booking_repo.get_next_upcoming_by_slot(log.slotId, log.recorded_at)
                activity_type = "Booking Created"
                plate = booking.licensePlate if booking else (log.licensePlate or "Unknown")
                v = self.vehicle_repo.get_by_plate(plate) if plate != "Unknown" else None
                vehicle = f"{v.brand} {v.model}" if v else "Unknown"

            elif log.status == "vacated":
                booking = self.booking_repo.get_active_by_slot_now(log.slotId, log.recorded_at)
                activity_type = "Vehicle Exited Slot"
                plate = booking.licensePlate if booking else (log.licensePlate or "Unknown")
                v = self.vehicle_repo.get_by_plate(plate) if plate != "Unknown" else None
                vehicle = f"{v.brand} {v.model}" if v else "Unknown"

            else:
                booking = self.booking_repo.get_active_by_slot_now(log.slotId, log.recorded_at)
                if log.status == "occupied":
                    activity_type = "Vehicle Entered Slot"
                elif log.status == "available":
                    activity_type = "Vehicle Exited Slot"
                else:
                    activity_type = "Booking Expired"
                plate = booking.licensePlate if booking else (log.licensePlate or "Unknown")
                v = self.vehicle_repo.get_by_plate(plate) if plate != "Unknown" else None
                vehicle = f"{v.brand} {v.model}" if v else "Unknown"

            result.append({
                "id": log.logId,
                "type": activity_type,
                "plate": plate,
                "vehicle": vehicle,
                "time": log.recorded_at.strftime("%b %d, %I:%M %p") if log.recorded_at else "—",
                "slotId": log.slotId,
            })

        return {"activities": result}, 200
    

class PredictionService:
    def __init__(self):
        self.occupancy_repo = OccupancyLogRepository()
        self.slot_repo = SlotRepository()
        self._model = None
        self._last_trained = None

    def _build_training_data(self):
        logs = self.occupancy_repo.get_all(duration=720)  # last 30 days

        counts = defaultdict(int)
        for log in logs:
            if log.status == "occupied" and log.recorded_at and log.slotId != 0:
                key = (log.recorded_at.weekday(), log.recorded_at.hour)
                counts[key] += 1

        if len(counts) < 5:
            return None, None

        X, y = [], []
        for (dow, hour), count in counts.items():
            X.append([hour, dow])
            y.append(count)

        return np.array(X), np.array(y)

    def _should_retrain(self):
        if self._model is None:
            return True
        elapsed = (datetime.now() - self._last_trained).total_seconds()
        return elapsed > 3600  # retrain every hour

    def _train(self):
        X, y = self._build_training_data()
        if X is None:
            self._model = None
            self._last_trained = datetime.now()
            return False  # not enough data

        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)
        self._model = model
        self._last_trained = datetime.now()
        return True

    def force_retrain(self):
        return self._train()

    def predict_next_24h(self):
        if self._should_retrain():
            self._train()

        total_slots = len(self.slot_repo.get_all())
        now = datetime.now()
        predictions = []

        for i in range(24):
            from datetime import timedelta
            future = now + timedelta(hours=i)
            hour = future.hour
            dow = future.weekday()

            if self._model is not None:
                predicted = int(round(self._model.predict([[hour, dow]])[0]))
                predicted = max(0, min(predicted, total_slots))
            else:
                # not enough historical data yet — return 0
                predicted = 0

            predictions.append({
                "hour": hour,
                "label": future.strftime("%I %p"),  # e.g. "03 PM"
                "predicted_occupied": predicted,
                "predicted_available": total_slots - predicted,
                "total_slots": total_slots
            })

        trained_at = self._last_trained.isoformat() if self._last_trained else None

        return {
            "predictions": predictions,
            "model_trained_at": trained_at,
            "sufficient_data": self._model is not None
        }, 200

