from database import db
from model import User, Vehicle, Slot, Booking, OccupancyLog, Subscription
from datetime import datetime, timedelta

class UserRepository:

    def get_all(self):
        return db.session.execute(
            db.select(User)
        ).scalars().all()

    def get_by_email(self, email: str):
        return db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalars().first()

    def get_by_license(self, licenseNo: str):
        return db.session.execute(
            db.select(User).filter_by(licenseNo=licenseNo)
        ).scalars().first()

    def get_by_phone(self, phone: str):
        return db.session.execute(
            db.select(User).filter_by(phone=phone)
        ).scalars().first()
    
    def get_by_id(self, user_id: int):
        return db.session.execute(
            db.select(User).filter_by(customerId=user_id)
        ).scalars().first()

    def email_exists(self, email: str) -> bool:
        return self.get_by_email(email) is not None
    
    def license_exists(self, licenseNo: str) -> bool:
        return self.get_by_license(licenseNo) is not None
    
    def phone_exists(self, phone: str) -> bool:
        return self.get_by_phone(phone) is not None

    def save(self, user: User):
        db.session.add(user)
        db.session.commit()
        return user


class SubscriptionRepository:
    def get_by_customer(self, customer_id: int):
        return db.session.execute(
            db.select(Subscription).filter_by(customerId=customer_id)
        ).scalars().first()

    def create_or_update(self, customer_id: int, plan: str):
        existing = self.get_by_customer(customer_id)
        if existing:
            existing.plan = plan
            existing.is_active = True
            existing.start_date = datetime.now()
            db.session.commit()
            return existing
        else:
            subscription = Subscription(
                customerId=customer_id,
                plan=plan,
                is_active=True,
                start_date=datetime.now()
            )
            db.session.add(subscription)
            db.session.commit()
            return subscription

    def cancel(self, customer_id: int):
        subscription = self.get_by_customer(customer_id)
        if subscription:
            subscription.is_active = False
            subscription.end_date = datetime.now()
            db.session.commit()
            return subscription
        return None

    def is_active(self, customer_id: int) -> bool:
        subscription = self.get_by_customer(customer_id)
        return subscription and subscription.is_active

class VehicleRepository:

    def get_all(self):
        return db.session.execute(db.select(Vehicle)).scalars().all()

    def get_by_plate(self, plate):
        return db.session.execute(
            db.select(Vehicle).filter_by(licensePlate=plate)
            ).scalars().first()

    def get_by_customer(self, customer_id: int):
        return db.session.execute(
            db.select(Vehicle).filter_by(customerId=customer_id)
            ).scalars().all() 

    def plate_exists(self, plate: str) -> bool:
        return self.get_by_plate(plate) is not None

    def save(self, vehicle: Vehicle):
        db.session.add(vehicle)
        db.session.commit()
        return vehicle
    
class SlotRepository:
    def get_all(self):
        return db.session.execute(db.select(Slot)).scalars().all()
    
    def get_by_id(self, slot_id):
        return db.session.execute(
            db.select(Slot).filter_by(slotId = slot_id)
        ).scalars().first()

    def get_available_in_window(self, time_start, time_end):
        return db.session.execute(
            db.select(Slot).where(
                ~db.select(Booking).where(
                    Booking.slotId == Slot.slotId,
                    Booking.timeStart < time_end,
                    Booking.timeEnd > time_start,
                ).exists()
            )
        ).scalars().all()

    def save(self, slot: Slot):
        db.session.add(slot)
        db.session.commit()
        return slot

    def commit(self):
        db.session.commit()

class BookingRepository:
    def get_all(self):
        return db.session.execute(db.select(Booking)).scalars().all()
    
    def get_by_user(self, user_id: int):
        return db.session.execute(db.select(Booking).filter_by(
            userId = user_id
        )).scalars().all()
    
    def get_by_id(self, booking_id: int):
        return db.session.execute(db.select(Booking).filter_by(
            bookingId = booking_id
        )).scalar_one_or_none()

    def get_active_by_slot_now(self, slot_id: int, now):
        # A 1-minute buffer is enough to fix rounding errors 
        # without overlapping other bookings.
        return db.session.execute(
            db.select(Booking).where(
                Booking.slotId == slot_id,
                Booking.timeStart <= now,
                Booking.timeEnd >= now
            )
        ).scalar_one_or_none()
    
    def get_active_booking_by_plate(self, plate: str, now):
        return db.session.execute(
            db.select(Booking).where(
                Booking.licensePlate == plate,
                Booking.timeStart <= now,
                Booking.timeEnd >= now
            )
        ).scalars().first()
    
    def get_next_upcoming_by_slot(self, slot_id: int, timestamp):
    # Finds the booking for this slot that starts at or after the log time
        return db.session.execute(
            db.select(Booking).where(
                Booking.slotId == slot_id,
                Booking.timeStart >= timestamp
            ).order_by(Booking.timeStart.asc())
        ).scalars().first()
        
    # def get_expired(self, now):
    #     return db.session.execute(
    #         db.select(Booking).where(
    #             Booking.status == "active",
    #             Booking.timeEnd < now,
    #         )
    #     ).scalars().all()

    def save(self, booking: Booking):
        db.session.add(booking)
        db.session.commit()
        return booking
    
    def delete(self, booking: Booking):
        db.session.delete(booking)
        db.session.commit()
        return None
    
    def commit(self):
        db.session.commit()

class OccupancyLogRepository:
    def get_all(self, duration: int = None):
        if not duration:
            start_time = datetime.now() - timedelta(hours=24)
        else:
            start_time = datetime.now() - timedelta(hours=duration)

        return db.session.execute(
            db.select(OccupancyLog).filter(OccupancyLog.recorded_at >= start_time)
        ).scalars().all()
    
    def get_by_slot_id(self, slot_id: int):
        return db.session.execute(
            db.select(OccupancyLog).filter_by(slotID = slot_id)
        ).scalars().all()
    
    def save(self, log: OccupancyLog):
        db.session.add(log)
        db.session.commit()
        return log