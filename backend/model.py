"""
Subclass db.Model to define a model class.
Create SQL table
Reference: 
"""

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from database import db

class User(db.Model):
    customerId: Mapped[int] = mapped_column(primary_key=True)
    customerFName: Mapped[str]
    customerLName: Mapped[str]
    licenseNo: Mapped[str] = mapped_column(unique=True)
    phone: Mapped[str] = mapped_column(unique=True)
    email: Mapped[str] = mapped_column(unique=True)
    password: Mapped[str]
    role: Mapped[str]

class Vehicle(db.Model):
    customerId: Mapped[int]
    licensePlate: Mapped[str] = mapped_column(primary_key=True)
    color: Mapped[str]
    brand: Mapped[str]
    model: Mapped[str]
    type: Mapped[str]


class Slot(db.Model):
    slotId: Mapped[int] = mapped_column(primary_key=True)
    zoneName: Mapped[str]
    zoneNumber: Mapped[int]

class Booking(db.Model):
    bookingId: Mapped[int] = mapped_column(primary_key=True)
    userId: Mapped[int]
    slotId: Mapped[int]
    licensePlate: Mapped[int]
    timeStart = mapped_column(DateTime(timezone=True))
    timeEnd = mapped_column(DateTime(timezone=True))
