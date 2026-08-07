# ParkIt
ParkIt is a smart parking management system with separate interfaces for users, admins, and kiosks.

- Frontend: React + Vite
- Backend: Flask + SQLite + JWT auth
- AI service: license plate detection using YOLO + EasyOCR
- Roles: user, admin, kiosk

## Project Structure

- `src/` — React frontend
  - `admin_pages/` — admin dashboard and analytics
  - `user_pages/` — user booking, profile, and parking search
  - `kiosk_pages/` — kiosk/gate UI
  - `AuthContext.jsx`, `Login.jsx`, `main.jsx` — auth, routing, and entrypoint
- `backend/` — Flask backend
  - `app.py` — main API server
  - `ai_app.py` — license plate detection API
  - `database.py`, `model.py` — SQLAlchemy schema and DB setup
  - `routes/` — auth, protected user routes, admin routes
  - `services/` — business logic
  - `repositories/` — data access layer
- `backend/requirements.txt` — backend dependencies
- `backend/requirements.ai.txt` — AI service dependencies

## Features

### User
- Sign up / sign in
- View profile information
- Add and manage vehicles
- Search parking availability
- Reserve parking spots
- View and cancel bookings
- Manage subscriptions
- Get parking recommendations

### Admin
- Seed database with test data
- View slot utilisation and peak hours
- Review booking and occupancy analytics
- Predict availability
- Retrain prediction model

### Kiosk
- License plate entry verification
- Exit verification
- Parking slot verification and occupancy logging

### AI
- Upload image to detect license plate
- YOLO-based detection + OCR recognition

## Backend API

### Auth
- `POST /auth/signup`
- `POST /auth/signin`
- `POST /auth/parking/entry`
- `POST /auth/parking/exit`
- `POST /auth/parking/slot`

### Protected (JWT required)
- `GET /protected/home`
- `GET /protected/myProfile/information`
- `POST /protected/myProfile/addLicensePlate`
- `GET /protected/myProfile/showLicensePlate`
- `GET /protected/subscription/current`
- `POST /protected/subscription/upgrade`
- `POST /protected/subscription/cancel`
- `POST /protected/findParking/booking`
- `GET /protected/myBooking/showBooking`
- `POST /protected/myBooking/cancelBooking`
- `POST /protected/searchParking`
- `GET|POST /protected/dashboard`
- `POST /protected/parking/recommendations`

### Admin
- `POST /admin/seed`
- `GET /admin/analytics/slotStatus`
- `GET /admin/analytics/peakHours`
- `GET /admin/utilisation`
- `GET /admin/analytics/trends`
- `GET /admin/analytics/recent-activity`
- `GET /admin/analytics/bookings/list`
- `GET /admin/analytics/predict`
- `POST /admin/analytics/predict/retrain`

### AI
- `POST /ai/detect`

## Setup

### Prerequisites
- Node.js 20.x or newer
- Python 3.11+ (recommended)

### Frontend
1. From project root:
```bash
npm install
```


2. Configure API URL:
Create .env in the repo root
```bash
VITE_API_URL=http://127.0.0.1:5001
```

3. Start dev server
```bash
npm run dev
```

### Backend
1. Install dependencies:
```bash
python -m pip install -r backend/requirements.txt
python -m pip install -r backend/requirements.ai.txt

```

2. Run the API
```bash
python backend/app.py
```

### Demo account, booking, user activity
- Normal user: Can be created easily via the User Interface
- Admin role and kiosk role: run the following command
```bash
python seed.py
```
- Admin: admin@parking.com - admin123
- Kiosk: kiosk@parking.com - kiosk123

### Notes
- The Flask backend uses backend/parkIT.db as its SQLite database.
- backend/app.py runs a scheduled task to expire old bookings every 5 minutes.
- Auth tokens are stored in session storage and route users by role in src/main.jsx.
