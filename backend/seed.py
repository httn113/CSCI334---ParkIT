"""
WHY: Spec requires 100+ records per data type for the live demo.
Run with: python seed.py
"""
import random
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash
from app import app
from database import db
from model import User, Vehicle, Slot, Booking, OccupancyLog
from repositories.repositories import UserRepository, VehicleRepository, SlotRepository
from sqlalchemy import delete

ZONES = ['A', 'B', 'C', 'D', 'E']
SLOTS_PER_ZONE = 20        # 100 slots total
NUM_USERS = 100
NUM_BOOKINGS = 300
NUM_LOGS = 500

BRANDS = ["Toyota", "Honda", "Mazda", "Ford", "BMW"]
MODELS = ["Corolla", "Civic", "3", "Ranger", "320i"]
COLORS = ["White", "Black", "Silver", "Blue", "Red"]
TYPES  = ["Sedan", "SUV", "Hatchback", "Ute", "Wagon"]

user_repo = UserRepository()
vehicle_repo = VehicleRepository()
slot_repo = SlotRepository()

def random_plate(used):
    while True:
        p = ''.join(random.choices('ABCDEFGHJKLMNPRSTUVWXYZ', k=3)) + \
            ''.join(random.choices('0123456789', k=3))
        if p not in used:
            used.add(p)
            return p

def seed():
    with app.app_context():
        # Clear all tables first
        db.session.execute(delete(OccupancyLog))
        db.session.execute(delete(Booking))
        db.session.execute(delete(Vehicle))
        db.session.execute(delete(Slot))
        db.session.execute(delete(User))
        db.session.commit()
        print("Cleared existing data")

        db.create_all()

        # Slots
        slots = []
        for zone in ZONES:
            for number in range(1, SLOTS_PER_ZONE + 1):
                slot = Slot(zoneName=zone, zoneNumber=number, status="available")
                db.session.add(slot)
                slots.append(slot)
        db.session.commit()
        print(f"Created {len(slots)} slots")

        # Admin user
        admin = User(
            customerFName="Admin", customerLName="User",
            licenseNo="00000000", phone="0400000000",
            email="admin@parking.com",
            password=generate_password_hash("admin123"),
            role="admin"
        )
        db.session.add(admin)
        db.session.commit()

        kiosk = User(
            customerFName="Kiosk", customerLName="User",
            licenseNo="0100000", phone="0410000000",
            email="kiosk@parking.com",
            password=generate_password_hash("kiosk123"),
            role="kiosk"
        )
        db.session.add(kiosk)
        db.session.commit()

        # Regular users + vehicles
        used_plates = set()
        users = []
        vehicles = []
        for i in range(1, NUM_USERS + 1):
            user = User(
                customerFName=f"First{i}", customerLName=f"Last{i}",
                licenseNo=f"{i:08d}", phone=f"04{i:08d}",
                email=f"user{i}@parking.com",
                password=generate_password_hash("password123"),
                role="user"
            )
            db.session.add(user)
            db.session.commit()
            users.append(user)

            vehicle = Vehicle(
                customerId=user.customerId,
                licensePlate=random_plate(used_plates),
                color=random.choice(COLORS),
                brand=random.choice(BRANDS),
                model=random.choice(MODELS),
                type=random.choice(TYPES)
            )
            db.session.add(vehicle)
            vehicles.append(vehicle)
        db.session.commit()
        print(f"Created {len(users)} users and {len(vehicles)} vehicles")

        # Bookings
        users = user_repo.get_all()
        vehicles = vehicle_repo.get_all()
        slots = slot_repo.get_all()

        now = datetime.now()
        bookings = []

        random.shuffle(vehicles)

        for vehicle in vehicles:
            user = next((u for u in users if u.customerId == vehicle.customerId), None)
            if not user:
                continue

            days_offset = 0
            current_hour = now.hour
            dynamic_weights = [10 if abs(i - current_hour) <= 1 else 1 for i in range(24)]

            hour = random.choices(
                range(24),
                weights=dynamic_weights,
                k=1
            )[0]

            time_start = now.replace(
                hour=hour,
                minute=random.randint(0, 59),
                second=0,
                microsecond=0
            ) + timedelta(days=days_offset)

            duration = random.choices([1, 2], weights=[8, 2], k=1)[0]
            time_end = time_start + timedelta(hours=duration)

            available_slots = slot_repo.get_available_in_window(time_start, time_end)
            available_ids = [s.slotId for s in available_slots]

            slot = random.choice(
                [s for s in slots if s.slotId in available_ids]
            ) if available_ids else None

            if not slot:
                continue

            booking = Booking(
                userId=user.customerId,
                slotId=slot.slotId,
                licensePlate=vehicle.licensePlate,
                timeStart=time_start,
                timeEnd=time_end,
            )

            db.session.add(booking)
            bookings.append(booking)

        db.session.commit()
        print(f"Created {len(bookings)} bookings")

        # Occupancy logs for each booking
        for booking in bookings:
            base_time = booking.timeStart

            for status, offset_mins in [
                ("reserved",  0),
                ("occupied",  random.randint(1, 10)),
                ("available", (booking.timeEnd - booking.timeStart).seconds // 60),
            ]:
                log = OccupancyLog(
                    slotId=booking.slotId,
                    status=status,
                    licensePlate=booking.licensePlate,  # ← plate stored on every log
                    recorded_at=base_time + timedelta(minutes=offset_mins),
                )
                db.session.add(log)

        db.session.commit()
        print(f"Created occupancy logs for {len(bookings)} bookings")

        # Entry gate logs (slotId=0) — simulates cars passing through the gate
        gate_vehicles = random.sample(vehicles, min(30, len(vehicles)))
        for vehicle in gate_vehicles:
            log = OccupancyLog(
                slotId=0,
                status="occupied",
                licensePlate=vehicle.licensePlate,
                recorded_at=now - timedelta(minutes=random.randint(1, 240)),
            )
            db.session.add(log)

        db.session.commit()
        print(f"Created {len(gate_vehicles)} entry gate logs")
        print("Seed complete.")

        db.session.add(kiosk)
        db.session.commit()

        # Train prediction model after seeding
        from routes.admin_routes import prediction_service
        prediction_service.force_retrain()
        print("Prediction model trained.")

if __name__ == "__main__":
    seed()