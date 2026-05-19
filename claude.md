# ParkIT — Project Reference for Claude

CSCI334 Smart Parking Management System. A full-stack app with three runtime roles
(`user`, `admin`, `kiosk`) plus a separate AI microservice for license-plate
recognition. Frontend is React + Vite. Backend is Flask + SQLAlchemy + JWT.
AI service is Flask + YOLOv8 + EasyOCR.

---

## 1. High-level architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────────────┐
│  Frontend       │ ───► │  Backend API     │ ───► │  SQLite (parkIT.db)  │
│  React + Vite   │      │  Flask :5001     │      │  via SQLAlchemy      │
│  :5173          │      │  JWT auth        │      └──────────────────────┘
└────────┬────────┘      └─────┬────────────┘
         │                     │ (no direct call; frontend orchestrates)
         │ multipart upload    │
         ▼                     ▼
┌─────────────────────────────────────────────┐
│  AI Service — Flask :5000                   │
│  YOLOv8 plate detector + EasyOCR            │
│  /ai/detect → returns { licensePlate }      │
└─────────────────────────────────────────────┘
```

Flow for camera detection (admin `AICamera` and similar):
1. Frontend uploads an image to **AI service** `/ai/detect`.
2. AI service returns the OCR-normalised plate text.
3. Frontend forwards the plate (and slotId if needed) to **Backend**
   (`/auth/parking/entry`, `/auth/parking/exit`, or `/auth/parking/slot`) which
   updates DB state and returns a human-readable verdict.

Three Docker services in `docker-compose.yml`: `backend` (5001), `ai` (5010→5000),
`frontend` (5173).

---

## 2. Repository layout

```
.
├── src/                       # React frontend (Vite)
│   ├── main.jsx               # Router root, role-based gating from JWT
│   ├── AuthContext.jsx        # token persisted in sessionStorage (key: parkit_role)
│   ├── DashboardLayout.jsx    # shared sidebar + topbar shell
│   ├── Login.jsx              # login + register screen
│   ├── admin_pages/           # admin portal screens
│   ├── user_pages/            # user portal screens
│   ├── kiosk_pages/           # self-service kiosk screens
│   └── components/            # shared UI atoms (GlassCard, StatCard, Modal, …)
├── backend/                   # Flask backend + AI microservice
│   ├── app.py                 # main API app (:5001), JWT, CORS, scheduler
│   ├── ai_app.py              # AI app (:5000), YOLO + EasyOCR
│   ├── database.py            # SQLAlchemy db singleton
│   ├── model.py               # ORM models
│   ├── routes/                # Blueprints: auth, protected, admin_routes
│   ├── services/              # Business logic layer
│   ├── repositories/          # DB access layer
│   ├── seed.py                # Demo data seeder (100 users, 100 slots, …)
│   ├── instance/parkIT.db     # SQLite DB (auto-created)
│   ├── Dockerfile.app         # main API image
│   ├── Dockerfile.ai_service  # AI image (torch + ultralytics + easyocr)
│   ├── requirements.txt       # main API deps
│   └── requirements.ai.txt    # AI deps (CPU torch wheel)
├── weights/best.pt            # YOLOv8 plate-detection weights (also fetched from HF)
├── Dockerfile.frontend
├── docker-compose.yml
├── package.json               # React 19 + Vite 8 + react-router 7 + three.js + dayjs
├── vite.config.js
├── vercel.json                # SPA rewrite for Vercel deploy
└── .env / .env.example        # VITE_API_URL, VITE_API_AI_URL
```

---

## 3. Frontend (React + Vite)

### Routing & roles (`src/main.jsx`)

- Reads the JWT `token` from `AuthContext` (kept in `sessionStorage`).
- Decodes the JWT payload client-side to read `role` and routes accordingly:
  - `admin`  → `/admin/*` (`AdminHome`)
  - `kiosk`  → `/kiosk/*` (`KioskAppRoot` → `KioskHome`)
  - `user`   → `/user/*`  (`UserHome`)
- Unauthenticated → `/login` (`Login.jsx`).
- `localStorage.access_token` is also set on login and used by fetch calls as
  `Authorization: Bearer <token>`.

### Admin portal (`src/admin_pages/`)

`AdminHome.jsx` mounts `DashboardLayout` with nav items:

| Screen          | Route                    | Backend endpoints used                                  |
|-----------------|--------------------------|---------------------------------------------------------|
| Overview        | `/admin/overview`        | `GET /protected/dashboard`, `GET /admin/analytics/recent-activity` |
| Parking Spots   | `/admin/parking-spots`   | `GET /admin/analytics/slotStatus`                       |
| Bookings        | `/admin/bookings`        | `GET /admin/analytics/bookings/list`                    |
| Analytics       | `/admin/analytics`       | `GET /admin/analytics/peakHours`, `/utilisation`, `/trends` |
| Smart Insights  | `/admin/smart-insights`  | `GET /admin/analytics/predict`, `POST /admin/analytics/predict/retrain` |
| AI Camera       | `/admin/ai-camera`       | `POST {AI}/ai/detect` then `/auth/parking/{entry,exit,slot}` |

### User portal (`src/user_pages/`)

Lazy-loaded screens under `UserHome.jsx`:

| Screen        | Route                                | Endpoints                                                                 |
|---------------|--------------------------------------|---------------------------------------------------------------------------|
| MyBookings    | `/user/my-bookings`                  | `GET /protected/myBooking/showBooking`, `POST /protected/myBooking/cancelBooking` |
| FindParking   | `/user/find-parking`                 | `POST /protected/searchParking`, `POST /protected/parking/recommendations` |
| ReserveSpot   | `/user/find-parking/reservespot/:id` | `POST /protected/findParking/booking`                                     |
| MyProfile     | `/user/my-profile`                   | `GET /protected/myProfile/information`, `addLicensePlate`, `showLicensePlate` |
| Subscribtion  | `/user/subscribtion`                 | `GET /protected/subscription/current`, `POST upgrade`, `POST cancel`      |
| Support       | `/user/support`                      | static FAQ                                                                |

Theme toggle (`parkit-user-theme` in `localStorage`) switches dark/light.

### Kiosk portal (`src/kiosk_pages/KioskHome.jsx`)

4-step touchscreen flow rendered as one component:
1. **Vehicle** — enter license plate.
2. **Duration** — pick date, time (10-min steps), duration pills (30…480 mins);
   on Continue → `POST /protected/searchParking` and auto-assigns the first
   available slot.
3. **Payment** — cash or card.
4. **Confirm** — `POST /protected/findParking/booking` creates the booking, then
   shows a cash-counter screen or simulated card tap.

The kiosk is logged in as a shared `kiosk` user (see seed data).

### Shared UI components (`src/components/`)

Small presentational atoms reused across pages: `GlassCard`, `StatCard`,
`SectionTitle`, `FormField`, `FilterPillGroup`, `EmptyState`, `Modal`,
`QuickActionCard`, `PricingCard`, `FaqItem`.

### Environment

- `.env` (Vite injects at build time):
  - `VITE_API_URL`     — main backend base URL (default `http://localhost:5001`)
  - `VITE_API_AI_URL`  — AI service base URL (local `http://localhost:5000` or Cloud Run URL)
- Accessed in code as `import.meta.env.VITE_API_URL` / `VITE_API_AI_URL`.

### Scripts (`package.json`)

```
npm run dev       # vite dev server on :5173
npm run build     # production build → dist/
npm run preview
npm run lint
```

Dependencies of note: `react@19`, `react-dom@19`, `react-router-dom@7`,
`three@0.184`, `dayjs`. (`flask` listed in dependencies is unused — left over.)

---

## 4. Backend — main API (`backend/app.py`, port 5001)

### Bootstrap

- `app.py` creates the Flask app, configures:
  - SQLite URI `sqlite:///parkIT.db` (file lives under `backend/instance/`).
  - `JWT_SECRET_KEY = "whateversecretekey"` (demo only).
  - CORS allowlist: `localhost`/`127.0.0.1` on ports `5173–5199` and any
    `*.vercel.app`.
- Registers three blueprints:
  - `authentication` → `/auth/*`
  - `protected`      → `/protected/*` (JWT required)
  - `admin_bp`       → `/admin/*` (JWT + `role=="admin"` via `admin_required`)
- `APScheduler` background job `expire_old_bookings` runs every 5 minutes and
  marks active bookings whose `timeEnd < now` as `expired`, also writing an
  `OccupancyLog(status="vacated")` row.

### Data model (`backend/model.py`)

All tables share the SQLAlchemy `db.Model` base from `database.py`.

- **User**(`customerId` PK, `customerFName`, `customerLName`, `licenseNo` unique,
  `phone` unique, `email` unique, `password` hashed, `role` — `user|admin|kiosk`)
- **Vehicle**(`licensePlate` PK, `customerId`, `color`, `brand`, `model`, `type`)
- **Slot**(`slotId` PK, `zoneName`, `zoneNumber`, `status` default `available` —
  `available|reserved|occupied`)
- **Booking**(`bookingId` PK, `userId`, `slotId`, `licensePlate`, `timeStart`,
  `timeEnd`, `status` default `active` — `active|expired|completed|cancelled`)
- **Subscription**(`subscriptionId` PK, `customerId` unique, `plan` —
  `standard|premium|gold`, `is_active`, `start_date`, `end_date`)
- **OccupancyLog**(`logId` PK, `slotId` (0 = entry/exit gate), `status` —
  `reserved|occupied|available|vacated`, `licensePlate` nullable, `recorded_at`)

### Routes

#### `routes/auth.py` — `/auth/*` (public + kiosk-style detection)

| Method | Path                    | Body                                  | Purpose                                         |
|--------|-------------------------|---------------------------------------|-------------------------------------------------|
| POST   | `/auth/signup`          | `{customerFName,customerLName,licenseNo,phone,email,password,role?}` | Register; hashes password via Werkzeug |
| POST   | `/auth/signin`          | `{email,password}`                    | Returns `{access_token}` with `role` claim       |
| POST   | `/auth/parking/entry`   | `{licensePlate}`                      | Verify entry gate (active booking required)      |
| POST   | `/auth/parking/exit`    | `{licensePlate}`                      | Verify exit gate; marks booking `completed`      |
| POST   | `/auth/parking/slot`    | `{licensePlate, slotId}`              | Verify per-slot camera; emits OccupancyLog       |

#### `routes/protected.py` — `/protected/*` (JWT required)

| Method | Path                              | Purpose                                                  |
|--------|-----------------------------------|----------------------------------------------------------|
| GET    | `/home`                           | identity sanity check                                     |
| GET    | `/myProfile/information`          | current user fields                                       |
| POST   | `/myProfile/addLicensePlate`      | add vehicle for current user                              |
| GET    | `/myProfile/showLicensePlate`     | list current user's vehicles                              |
| GET    | `/subscription/current`           | active plan + discount (`standard 0`, `premium 10`, `gold 20`) |
| POST   | `/subscription/upgrade`           | upgrade / change plan                                     |
| POST   | `/subscription/cancel`            | mark subscription inactive                                |
| POST   | `/findParking/booking`            | create booking; returns `basePrice`, `discount`, `finalPrice` ($8/hr base) |
| GET    | `/myBooking/showBooking`          | bookings for current user joined with slot + vehicle      |
| POST   | `/myBooking/cancelBooking`        | delete booking by id (must belong to caller)              |
| POST   | `/searchParking`                  | `{timeStart,timeEnd}` (`%Y-%m-%d %H:%M:%S`) → free slots  |
| GET/POST | `/dashboard`                    | live slot snapshot (totals + per-zone + slot rows)        |
| POST   | `/parking/recommendations`        | `{timeStart,timeEnd}` ISO → nearest/least-congested/best-availability zones |

#### `routes/admin_routes.py` — `/admin/*` (JWT + admin)

| Method | Path                              | Purpose                                                  |
|--------|-----------------------------------|----------------------------------------------------------|
| GET    | `/analytics/slotStatus`           | same payload as `/protected/dashboard`                    |
| GET    | `/analytics/peakHours`            | 24-bucket histogram of `occupied` logs                    |
| GET    | `/utilisation`                    | per-zone utilisation rate                                 |
| GET    | `/analytics/trends`               | per-day occupied counts                                   |
| GET    | `/analytics/recent-activity?limit=` | last N gate/slot events, humanised                      |
| GET    | `/analytics/bookings/list`        | all bookings with stats (`total/active/completed/expired`)|
| GET    | `/analytics/predict`              | next-24h occupancy prediction (RandomForest)              |
| POST   | `/analytics/predict/retrain`      | force retrain                                             |

### Service layer (`backend/services/services.py`)

- **UserService** — register / authenticate (Werkzeug hashing, JWT issuance with
  `role` claim).
- **BookingService** — create/cancel/list bookings; applies subscription
  discount; flags status (`active/upcoming/completed`); writes
  `OccupancyLog(status="reserved")` on creation.
- **VehicleService** — CRUD for user vehicles.
- **SlotService** — `search_available` and `get_dashboard` (per-zone aggregates +
  current row-level slot snapshot).
- **AnalyticService** — `peak_hours`, `utilisation`, `trends`,
  `recent_activity` (special-cases `slotId == 0` gate events).
- **PredictionService** — trains a `RandomForestRegressor` on
  `(weekday, hour) → occupied_count` from the last 30 days of occupancy logs,
  caches the model in-process, auto-retrains every hour or on demand, then
  predicts the next 24 hourly buckets.
- **SubscriptionService** — get/upgrade/cancel with discount map
  `{standard:0, premium:10, gold:20}`.
- **RecommendationService** — given a time window, computes nearest zone
  (alphabetical), least-congested zone (lowest occupancy ratio), and
  best-availability zone (most free slots).

### Parking / camera service (`backend/services/parking_service.py`)

`ParkingService` is what the `/auth/parking/*` endpoints call. It writes
`OccupancyLog` rows (gate logs use `slotId=0`) and mutates `Slot.status` /
`Booking.status` based on whether the detected plate matches an active booking:

- `verify_entry_by_plate` — vehicle exists AND active booking → `Access Granted`.
- `verify_exit_by_plate` — vehicle exists → marks booking `completed` →
  `Exit Granted`.
- `verify_slot_by_plate(plate, slotId)`:
  - plate detected, no booking         → `"No Booking But Car Detected"` (slot becomes `occupied`).
  - plate detected, wrong plate        → `"Parking in Wrong Spot"`.
  - plate matches active booking       → `"Correct Parking"`; slot + booking → `occupied`.
  - no plate detected, no booking      → `"No Car Detected"`; slot → `available`.
  - no plate detected, has booking     → slot → `reserved`, log `vacated`.

### Repositories (`backend/repositories/repositories.py`)

Thin SQLAlchemy access layer (one class per model) used by all services so
services never touch `db.session` directly except for commit helpers. Notable
methods:
- `SlotRepository.get_available_in_window(time_start, time_end)` — slots with no
  overlapping booking via correlated `NOT EXISTS`.
- `BookingRepository.get_active_by_slot_now`, `get_active_booking_by_plate`,
  `get_next_upcoming_by_slot`.
- `OccupancyLogRepository.get_all(duration=hours)` — defaults to last 24h, used
  by analytics/prediction with `duration=720` for 30 days.
- `SubscriptionRepository.create_or_update` — upsert by `customerId`.

### Seeding (`backend/seed.py`)

`python seed.py` wipes and recreates the demo dataset (spec requires 100+ rows
per entity):
- 100 slots (zones `A–E`, 20 each).
- 1 admin (`admin@parking.com` / `admin123`), 1 kiosk (`kiosk@parking.com` /
  `kiosk123`), 100 regular users (`user{i}@parking.com` / `password123`) with one
  vehicle each (random plate, brand, model, color, type).
- ~300 bookings biased to the current hour, 1–2 hours long, only into available
  slots.
- 3 occupancy logs per booking (`reserved → occupied → available`) plus ~30
  random gate logs (`slotId=0`).
- Triggers `prediction_service.force_retrain()` at the end.

### Dependencies (`backend/requirements.txt`)

```
flask, flask_sqlalchemy, flask_jwt_extended, flask_cors,
Pillow, numpy, scikit-learn, APScheduler
```

---

## 5. AI microservice (`backend/ai_app.py`, port 5000)

Separate Flask app dedicated to ALPR so the heavy ML deps don't bloat the main
API container.

- Loads two models **once at startup**:
  - **YOLOv8** plate detector via `ultralytics.YOLO`, pulled from Hugging Face:
    `https://huggingface.co/Koushim/yolov8-license-plate-detection/resolve/main/best.pt`
    (a local copy is also kept in `weights/best.pt`).
  - **EasyOCR** reader for English, CPU only (`easyocr.Reader(['en'], gpu=False)`).
- Wraps them in `services/detection_service.DetectionService`.

### Endpoint

```
POST /ai/detect
Content-Type: multipart/form-data
Body: file=<image>
→ 200 { "licensePlate": "ABC1234" | null }
```

### `DetectionService.detect_plate(image_np)`

1. Run YOLO on the RGB ndarray.
2. If at least one box: crop the first box.
3. Run EasyOCR on the crop and concatenate text lines.
4. Normalise: uppercase, strip spaces and dashes.
5. Return the normalised string (or `None` if nothing detected).

### Dependencies (`backend/requirements.ai.txt`)

```
flask, flask_cors, ultralytics, torch (CPU wheel), easyocr,
opencv-python-headless, Pillow, numpy
```

The AI service has its own `Dockerfile.ai_service` which installs the headless
OpenCV system libs (`libgl1`, `libglib2.0-0`, …).

---

## 6. Running locally

### One-off setup
```bash
# Frontend
npm install
cp .env.example .env   # adjust VITE_API_URL / VITE_API_AI_URL if needed

# Backend (main API)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python seed.py         # populate demo data

# AI service (separate venv recommended due to torch)
pip install -r requirements.ai.txt
```

### Dev servers
```bash
# Terminal 1 — backend API on :5001
cd backend && python app.py

# Terminal 2 — AI service on :5000
cd backend && python ai_app.py

# Terminal 3 — frontend on :5173
npm run dev
```

### Docker
```bash
docker compose up --build
# frontend :5173, backend :5001, ai :5010→container 5000
```

### Demo credentials
| Role  | Email                | Password     |
|-------|----------------------|--------------|
| admin | admin@parking.com    | admin123     |
| kiosk | kiosk@parking.com    | kiosk123     |
| user  | user1@parking.com    | password123  |

(The README also mentions short dev shortcuts `user/1`, `admin/admin`,
`kiosk/1` — those are not in `seed.py` so use the seeded ones above.)

---

## 7. Conventions and gotchas

- **Auth tokens are stored in two places**: `AuthContext` keeps it in
  `sessionStorage` under key `parkit_role` (despite the name, it's the JWT);
  `Login.jsx` also writes `localStorage.access_token`, which is what every fetch
  uses for the `Authorization` header.
- **Datetime formats are inconsistent across endpoints** — be careful:
  - `/protected/searchParking` expects `"%Y-%m-%d %H:%M:%S"`.
  - `/protected/findParking/booking` and `/protected/parking/recommendations`
    expect ISO 8601 (`datetime.fromisoformat`).
- **`slotId == 0` is a sentinel** meaning entry/exit gate (no real slot).
  `AnalyticService.get_recent_activity` and `ParkingService` both rely on this.
- **`Slot.status` is global** (not time-windowed). Real reservation logic uses
  `Booking.timeStart`/`timeEnd` overlap, not the slot status, so do not treat
  `slot.status == "available"` as authoritative for future windows.
- **Background scheduler** runs in-process; if you spawn the Flask app twice
  (e.g. `debug=True` reloader) you may get duplicate jobs locally.
- **PredictionService caches the trained model in memory** and only persists
  via `_last_trained` timestamp — restarting the API loses the cache; the seed
  script retrains at the end.
- **Pricing** is hardcoded at `$8/hour` in `BookingService.create_booking`.
- **CORS** in `backend/app.py` allowlists only `localhost`/`127.0.0.1` Vite
  ports and `*.vercel.app` — add your origin there for new deploys.
- **Frontend env vars must be prefixed with `VITE_`** (Vite requirement) and
  are baked at build time.

---

## 8. Key files to read first when onboarding

1. `src/main.jsx` — routing + role gating.
2. `backend/app.py` — backend wiring + scheduler.
3. `backend/model.py` — schema.
4. `backend/services/services.py` — most business logic lives here.
5. `backend/services/parking_service.py` — camera/gate verdict logic.
6. `backend/ai_app.py` + `backend/services/detection_service.py` — ALPR pipeline.
7. `src/admin_pages/AICamera.jsx` + `src/kiosk_pages/KioskHome.jsx` — end-to-end
   client flows that exercise both backend and AI service.
