import random
from collections import defaultdict
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from app import app
from database import db
from model import User, Vehicle, Slot, Booking, OccupancyLog, Subscription
from repositories.repositories import UserRepository, VehicleRepository, SlotRepository
from sqlalchemy import delete

ZONES = ["A", "B", "C", "D", "E"]
SLOTS_PER_ZONE = 20
NUM_USERS = 100

BRANDS = ["Toyota", "Honda", "Mazda", "Ford", "BMW"]
MODELS = ["Corolla", "Civic", "3", "Ranger", "320i"]
COLORS = ["White", "Black", "Silver", "Blue", "Red"]
TYPES = ["Sedan", "SUV", "Hatchback", "Ute", "Wagon"]

user_repo = UserRepository()
vehicle_repo = VehicleRepository()
slot_repo = SlotRepository()


def random_plate(used):
    while True:
        plate = "".join(random.choices("ABCDEFGHJKLMNPRSTUVWXYZ", k=3))
        plate += "".join(random.choices("0123456789", k=3))
        if plate not in used:
            used.add(plate)
            return plate


def make_hour_weights(day_of_week: int):
    if day_of_week < 5:  # Mon-Fri
        weights = [2] * 24
        for hour in [7, 8, 9, 10]:
            weights[hour] = 18
        for hour in [11, 12, 13, 14]:
            weights[hour] = 14
        for hour in [15, 16, 17, 18]:
            weights[hour] = 16
        weights[19] = 10
    else:  # Sat-Sun
        weights = [1] * 24
        for hour in [10, 11, 12, 13, 14, 15]:
            weights[hour] = 10
        for hour in [16, 17, 18, 19]:
            weights[hour] = 8
    return weights


def is_slot_available(
    slot_bookings: dict[int, list[tuple[datetime, datetime]]],
    slot_id: int,
    start: datetime,
    end: datetime,
) -> bool:
    for existing_start, existing_end in slot_bookings[slot_id]:
        if start < existing_end and end > existing_start:
            return False
    return True


def seed():
    with app.app_context():
        # wipe relevant tables
        db.session.execute(delete(OccupancyLog))
        db.session.execute(delete(Booking))
        db.session.execute(delete(Vehicle))
        db.session.execute(delete(Slot))
        db.session.execute(delete(Subscription))

        # ── Admin / kiosk: only wipe regular users, preserve system accounts ──
        db.session.execute(
            delete(User).where(User.role.notin_(["admin", "kiosk"]))
        )
        db.session.commit()

        db.create_all()

        # create slots
        slots = []
        for zone in ZONES:
            for number in range(1, SLOTS_PER_ZONE + 1):
                slot = Slot(zoneName=zone, zoneNumber=number, status="available")
                db.session.add(slot)
                slots.append(slot)
        db.session.commit()

        # admin and kiosk: create only if they don't already exist
        if not User.query.filter_by(email="admin@parking.com").first():
            db.session.add(User(
                customerFName="Admin",
                customerLName="User",
                licenseNo="00000000",
                phone="0400000000",
                email="admin@parking.com",
                password=generate_password_hash("admin123"),
                role="admin",
            ))

        if not User.query.filter_by(email="kiosk@parking.com").first():
            db.session.add(User(
                customerFName="Kiosk",
                customerLName="User",
                licenseNo="01000000",
                phone="0410000000",
                email="kiosk@parking.com",
                password=generate_password_hash("kiosk123"),
                role="kiosk",
            ))

        db.session.commit()

        # create users and vehicles
        used_plates = set()
        for i in range(1, NUM_USERS + 1):
            user = User(
                customerFName=f"First{i}",
                customerLName=f"Last{i}",
                licenseNo=f"{i:08d}",
                phone=f"04{i:08d}",
                email=f"user{i}@parking.com",
                password=generate_password_hash("password123"),
                role="user",
            )
            db.session.add(user)
            db.session.flush()  # get customerId without a full commit

            vehicle = Vehicle(
                customerId=user.customerId,
                licensePlate=random_plate(used_plates),
                color=random.choice(COLORS),
                brand=random.choice(BRANDS),
                model=random.choice(MODELS),
                type=random.choice(TYPES),
            )
            db.session.add(vehicle)

        db.session.commit()  # single commit for all users + vehicles

        # reload repository-backed lists
        users = user_repo.get_all()
        vehicles = vehicle_repo.get_all()
        slots = slot_repo.get_all()

        # time window: last 7 days (6 days ago -> today)
        now = datetime.now()
        week_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6)

        total_slots = len(slots)
        MIN_PCT = 0.10
        PEAK_PCT = 0.50

        bookings = []
        week_end = week_start + timedelta(days=7, hours=23, minutes=59)

        slot_bookings: dict[int, list[tuple[datetime, datetime]]] = defaultdict(list)

        print(f"Seeding bookings for 7 days from {week_start.isoformat()} (total slots: {total_slots})")

        for day_offset in range(7):
            current_day = week_start + timedelta(days=day_offset)
            day_of_week = current_day.weekday()
            hour_weights = make_hour_weights(day_of_week)

            min_w = min(hour_weights)
            max_w = max(hour_weights) or 1

            for hour in range(24):
                norm = (hour_weights[hour] - min_w) / (max_w - min_w) if max_w > min_w else 0.5
                target_pct = MIN_PCT + norm * (PEAK_PCT - MIN_PCT)
                target_count = max(1, round(total_slots * target_pct))

                created = 0
                attempts = 0
                max_attempts = target_count * 6 + 200

                while created < target_count and attempts < max_attempts:
                    attempts += 1
                    vehicle = random.choice(vehicles)
                    user = next((u for u in users if u.customerId == vehicle.customerId), None)
                    if not user:
                        continue

                    minute = random.randint(0, 59)
                    time_start = current_day.replace(hour=hour, minute=minute)
                    duration_hours = random.choices([1, 2, 3, 4], weights=[40, 35, 15, 10], k=1)[0]
                    time_end = time_start + timedelta(hours=duration_hours)
                    if time_end > week_end:
                        time_end = week_end

                    available_slots = [
                        s for s in slots
                        if is_slot_available(slot_bookings, s.slotId, time_start, time_end)
                    ]
                    if not available_slots:
                        continue

                    slot = random.choice(available_slots)
                    slot_bookings[slot.slotId].append((time_start, time_end))

                    booking = Booking(
                        userId=user.customerId,
                        slotId=slot.slotId,
                        licensePlate=vehicle.licensePlate,
                        timeStart=time_start,
                        timeEnd=time_end,
                    )
                    db.session.add(booking)
                    bookings.append(booking)
                    created += 1

            print(f"  Day {day_offset+1}/7 seeded")

        # ── single commit for ALL bookings ──
        db.session.commit()
        print(f"Total bookings created: {len(bookings)}")

        # create occupancy logs
        for booking in bookings:
            base_time = booking.timeStart
            duration_mins = max(1, int((booking.timeEnd - booking.timeStart).total_seconds() // 60))
            occupied_offset = min(random.randint(1, 10), max(1, duration_mins - 1))
            for status, offset in [("reserved", 0), ("occupied", occupied_offset), ("available", duration_mins)]:
                db.session.add(OccupancyLog(
                    slotId=booking.slotId,
                    status=status,
                    licensePlate=booking.licensePlate,
                    recorded_at=base_time + timedelta(minutes=offset),
                ))
        db.session.commit()

        # update slot/booking statuses relative to now
        now = datetime.now()
        for booking in bookings:
            slot = slot_repo.get_by_id(booking.slotId)
            if booking.timeStart <= now <= booking.timeEnd:
                if now >= booking.timeStart + timedelta(minutes=5):
                    slot.status = "occupied"
                    booking.status = "occupied"
                else:
                    slot.status = "reserved"
                    booking.status = "active"
            elif now < booking.timeStart:
                slot.status = "reserved"
                booking.status = "active"
            else:
                if booking.status == "active":
                    booking.status = "completed"
                slot.status = "available"
        db.session.commit()

        # gate logs
        gate_vehicles = random.sample(vehicles, min(40, len(vehicles)))
        for vehicle in gate_vehicles:
            db.session.add(OccupancyLog(
                slotId=0,
                status="occupied",
                licensePlate=vehicle.licensePlate,
                recorded_at=now - timedelta(minutes=random.randint(1, 240)),
            ))
        db.session.commit()

        try:
            from routes.admin_routes import prediction_service
            prediction_service.force_retrain()
        except Exception:
            print("Prediction service not available to retrain in this context.")

        print("Seed complete and prediction model trained (if available).")


if __name__ == "__main__":
    seed()