"""
Subclass db.Model to define a model class.
Create SQL table
Reference: 
"""

from sqlalchemy import Integer, String
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

