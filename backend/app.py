from flask import Flask
from database import db
from model import Booking, OccupancyLog
from routes.auth import authentication
from routes.protected import protected
from routes.admin_routes import admin_bp
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import re
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
# Browsers treat localhost vs 127.0.0.1 as different origins; Vite may be opened on either.
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///parkIT.db"
app.config["JWT_SECRET_KEY"] = "whateversecretekey"

# Vite defaults to 5173; if that port is taken it serves on 5174, 5175, … Same for localhost vs 127.0.0.1.
CORS(app, origins=[
    re.compile(r"http://(?:localhost|127\.0\.0\.1):(517[3-9]|518\d|519\d)"),
    re.compile(r"https://.*\.vercel\.app"),
])

"""
Initialising the database and jwt
"""
db.init_app(app)
with app.app_context():
    db.create_all()
jwt = JWTManager(app)

"""
Initialising the route for different apis
"""
app.register_blueprint(authentication)
app.register_blueprint(protected)
app.register_blueprint(admin_bp)

def expire_old_bookings():
    """Background task to mark expired bookings"""
    with app.app_context():
        now = datetime.now()
        expired_bookings = db.session.execute(
            db.select(Booking).where(
                Booking.timeEnd < now,
                Booking.status == "active"
            )
        ).scalars().all()
        
        for booking in expired_bookings:
            booking.status = "expired"
            # Create occupancy log for slot vacation
            log = OccupancyLog(
                slotId=booking.slotId,
                status="vacated",
                licensePlate=booking.licensePlate,
                recorded_at=now
            )
            db.session.add(log)
        
        if expired_bookings:
            db.session.commit()
            print(f"Marked {len(expired_bookings)} bookings as expired")

# Initialize background scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(expire_old_bookings, 'interval', minutes=5)
scheduler.start()

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5001)