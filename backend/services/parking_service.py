from repositories.repositories import VehicleRepository, BookingRepository, SlotRepository, OccupancyLogRepository
from datetime import datetime

class ParkingService:
    def __init__(self):
        self.vehicle_repo = VehicleRepository()
        self.booking_repo = BookingRepository()
        self.slot_repo = SlotRepository()
        self.occupancy_repo = OccupancyLogRepository()

    def _log(self, slot_id, status, license_plate=None):
        from model import OccupancyLog
        log = OccupancyLog(
            slotId = slot_id,
            status = status,
            licensePlate = license_plate
        )
        self.occupancy_repo.save(log)
        return log

    def verify_entry_by_plate(self, plate_text):
        if not plate_text:
            return {"message": "No Car Detected"}, 200

        vehicle = self.vehicle_repo.get_by_plate(plate_text)
        if not vehicle:
            return {"message": "Access Denied"}, 200

        now = datetime.now()
        active_booking = self.booking_repo.get_active_booking_by_plate(plate_text, now)
        if not active_booking:
            return {"message": "Access Denied — No Active Booking"}, 200

        self._log(slot_id=0, status="occupied", license_plate=plate_text)
        return {"message": "Access Granted"}, 200

    def verify_exit_by_plate(self, plate_text):
        if not plate_text:
            return {"message": "No Car Detected"}, 200

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

    def verify_slot_by_plate(self, plate_text, slotId):
        now = datetime.now()
        slot = self.slot_repo.get_by_id(slotId)
        if not slot:
            return {"message": "Slot not found"}, 404

        if plate_text:
            curr_booking = self.booking_repo.get_active_by_slot_now(slotId, now)

            if curr_booking is None:
                self._log(slot_id=slotId, status="occupied", license_plate=plate_text)
                slot.status = "occupied"
                self.slot_repo.commit()
                return {"message": "No Booking But Car Detected"}, 200

            elif curr_booking.licensePlate != plate_text:
                self._log(slot_id=slotId, status="occupied", license_plate=plate_text)
                slot.status = "occupied"
                self.slot_repo.commit()
                return {"message": "Parking in Wrong Spot"}, 200

            else:
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
                slot.status = "reserved"
                curr_booking.status = "active"
                self.booking_repo.commit()
                self._log(slot_id=slotId, status="vacated", license_plate=curr_booking.licensePlate)
            self.slot_repo.commit()
            return {"message": "No Car Detected"}, 200