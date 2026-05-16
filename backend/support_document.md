Backend System Description
The ParkIT backend is a RESTful API built with Flask, designed to manage a smart parking management system for a university campus. It is structured using object-oriented design principles across four layers — models, repositories, services, and routes — and runs as two separate services: a main application server and a dedicated AI detection service.
When a user first interacts with the system, they register an account through the signup endpoint. The backend validates their details, checks for duplicate email, phone, and license number, hashes their password, and stores their record. On subsequent visits they sign in with their email and password, receiving a JWT access token that identifies them and their role for all future requests.
Once authenticated, a user can register their vehicles by providing the license plate, brand, model, colour, and type. They can then search for available parking slots by providing a time window, and the system returns all slots with no conflicting active bookings in that period. The user selects a slot and creates a booking, at which point the system validates the time window and confirms the slot is still available before saving the reservation.
At the car park, two types of cameras interact with the backend. An entry gate camera sends an image to the AI detection service, which runs it through a YOLOv8 object detection model to locate the plate region and EasyOCR to read the text. The main backend then checks whether the detected plate belongs to a registered user and grants or denies entry accordingly. Individual slot cameras send images to the slot detection endpoint. For each image, the system detects the plate, checks whether there is an active booking for that slot at the current time, and compares the detected plate against the booked plate. Based on the result the slot status is updated — occupied if a car is present, reserved if a booking exists but no car is detected, or available if neither condition applies. Every status change is recorded in the occupancy log with a timestamp.
When a user wants to cancel a booking, the system verifies the booking belongs to them, frees the slot status, and removes the reservation. The slot camera will then detect the absence of a car and confirm the slot as available within the next detection cycle.
Administrators have access to an analytics dashboard that reads from the historical occupancy log. The system aggregates log entries to produce peak hour charts, utilisation statistics per zone, occupancy trends over time, and a recent activity feed showing the latest slot events with plate numbers and vehicle details. Administrators also have access to a machine-learning based availability prediction feature trained on historical occupancy data.
Throughout all of this, the backend enforces a strict layered structure. Every HTTP request is handled by a route function that does nothing except parse the request and call a service. Every service contains the business logic and calls repositories for data access. Every repository is the only place that touches the database directly.
Section 7 — System Architecture
7.1 Architecture Overview
The ParkIT backend is split into two independent Flask services:
•	Main application server (app.py) — runs on port 5001. Handles authentication, bookings, slot management, analytics, and all user-facing API routes.
•	AI detection service (ai_app.py) — runs on port 5000. Handles license plate detection using YOLOv8 and EasyOCR. Isolated so that heavy ML model loading does not affect the main application.
Both services are containerised using Docker (Dockerfile.app and Dockerfile.ai_service) for consistent deployment.

7.2 Architectural Style
The system uses a Layered Architecture (3-tier). Each layer communicates only with the layer directly below it.

Layer	Files	Responsibility
Layer 1 — Routes (Controller)	routes/auth.py, routes/protected.py, routes/admin_routes.py	Receives HTTP requests, calls services, returns responses. Never contains business logic.
Layer 2 — Services	services/user_service.py, booking_service.py, slot_service.py, detection_service.py, analytics_service.py, prediction_service.py	Contains all business logic. Never touches Flask or HTTP directly.
Layer 3 — Repositories	repositories/repositories.py	All database access lives here. Services never call db.session directly.
Layer 0 — Models	model.py	Domain objects representing real-world entities. SQLAlchemy ORM models.

7.3 Architecture Justification
•	Separation of concerns — HTTP logic, business logic, and data access are independent of each other.
•	If the database changes, only the repository layer changes — services and routes are unaffected.
•	If business rules change, only the service layer changes — routes stay thin and consistent.
•	The AI service is isolated so ML model loading (several seconds at startup) does not block the main API.
•	Docker containerisation ensures the two services run identically across development and production environments.
Section 8 — System Design (UML)
8.1 Class Diagram
Models Layer — 5 classes
User
Attributes: customerId (int, PK), customerFName (str), customerLName (str), licenseNo (str, unique), phone (str, unique), email (str, unique), password (str), role (str). Method: is_admin() returns bool.
Vehicle
Attributes: licensePlate (str, PK), customerId (int, FK → User), color (str), brand (str), model (str), type (str). No methods.
Slot
Attributes: slotId (int, PK), zoneName (str), zoneNumber (int), status (str — available/reserved/occupied). Methods: is_available() returns bool, transition_to(status: str).
Booking
Attributes: bookingId (int, PK), userId (int, FK → User), slotId (int, FK → Slot), licensePlate (str, FK → Vehicle), timeStart (DateTime), timeEnd (DateTime). Method: is_active_now() returns bool.
OccupancyLog
Attributes: logId (int, PK), slotId (int, FK → Slot), status (str), licensePlate (str), recorded_at (DateTime). Note: triggered_by field removed in actual implementation — all logs are from camera detection. licensePlate stored directly on each log for fast activity feed queries.
Model Relationships
•	User → Vehicle: one to many
•	User → Booking: one to many
•	Slot → Booking: one to many
•	Slot → OccupancyLog: one to many
•	Vehicle → Booking: one to many

Repository Layer — 5 classes
UserRepository: get_by_email, get_by_license, get_by_phone, email_exists, license_exists, phone_exists, get_all, save.
VehicleRepository: get_by_plate, get_by_customer, plate_exists, save.
SlotRepository: get_all, get_by_id, get_available_in_window, save, commit.
BookingRepository: get_by_id, get_by_user, get_by_slot, get_active_by_slot_now, get_expired, save, delete, commit.
OccupancyLogRepository: get_all, get_by_slot, save.

Service Layer — 6 classes
UserService — depends on UserRepository. Methods: register, authenticate, get_profile.
VehicleService — depends on VehicleRepository, UserRepository. Methods: add_vehicle, get_vehicles.
BookingService — depends on BookingRepository, UserRepository, SlotRepository, VehicleRepository. Methods: create_booking, cancel_booking, get_user_bookings.
SlotService — depends on SlotRepository, BookingRepository. Methods: search_available, get_dashboard.
DetectionService — depends on VehicleRepository, BookingRepository, SlotRepository, OccupancyLogRepository. Injected with YOLO model and EasyOCR reader. Methods: detect_plate, plate_normalisation, verify_entry, verify_slot.
AnalyticsService — depends on OccupancyLogRepository, SlotRepository. Methods: get_peak_hours, get_utilisation, get_trends, get_recent_activity.
PredictionService (new) — depends on OccupancyLogRepository, SlotRepository. Trains a scikit-learn RandomForest model on historical occupancy data to predict slot availability probability at a given future time. Methods: train, predict, force_retrain.

8.2 Sequence Diagrams
Sequence 1 — Booking Creation
1.	User sends POST /protected/findParking/booking with JWT token and booking data.
2.	Route extracts email from JWT and calls BookingService.create_booking(email, data).
3.	BookingService calls UserRepository.get_by_email(email) → returns user.
4.	BookingService calls SlotRepository.get_available_in_window(start, end) → returns available slots.
5.	BookingService checks if requested slotId is in available slot IDs.
6.	If not available → returns 400 Slot already booked to Route → Route returns error to User.
7.	If available → BookingService calls BookingRepository.save(booking).
8.	Returns 201 Booking Created to Route → Route returns to User.

Sequence 2 — License Plate Detection (Slot)
9.	Camera sends POST /ai/detect with image file to AI service (port 5000).
10.	AI service calls DetectionService.detect_plate(image_np).
11.	detect_plate runs image through YOLO model → crops plate region.
12.	detect_plate runs cropped region through EasyOCR → extracts plate text.
13.	AI service returns detected licensePlate to caller.
14.	Main backend calls DetectionService.verify_slot(image_np, slotId).
15.	BookingRepository.get_active_by_slot_now(slotId, now) → returns booking or None.
16.	If no booking → slot.status = occupied, OccupancyLog saved, returns NOT_BOOKED.
17.	If booking found → compare normalised plates.
18.	If mismatch → slot.status = occupied, log saved, returns WRONG_PLATE.
19.	If match → slot.status = occupied, log saved, returns AUTHORIZED.

Sequence 3 — Cancel Booking
20.	User sends POST /protected/myBooking/cancelBooking with JWT and booking_id.
21.	Route calls BookingService.cancel_booking(email, booking_id).
22.	BookingService calls UserRepository.get_by_email → user.
23.	BookingService calls BookingRepository.get_by_id → booking.
24.	If not found or userId mismatch → returns 404 Information Mismatch.
25.	BookingService calls SlotRepository.get_by_id → slot.
26.	Sets slot.status = available, commits.
27.	Calls BookingRepository.delete(booking).
28.	Returns 200 Booking Cancelled.

Sequence 4 — Admin Analytics
29.	Admin sends GET /admin/analytics/peak-hours with admin JWT.
30.	Route checks @jwt_required → valid token.
31.	Route checks @admin_required → role == admin. If not → 403.
32.	Route calls AnalyticsService.get_peak_hours().
33.	AnalyticsService calls OccupancyLogRepository.get_all().
34.	Counts occupied events per hour of day across all logs.
35.	Returns peak_hours list and busiest_hour to Route → 200 response.

8.3 State Diagram — Slot
States: available, reserved, occupied

•	Start → available (initial state on slot creation)
•	available → reserved (booking created for this slot — triggered by BookingService)
•	reserved → occupied (camera detects matching car — triggered by DetectionService)
•	occupied → available (camera detects no car — triggered by DetectionService every 30 seconds)
•	reserved → available (booking cancelled — triggered by BookingService.cancel_booking)
•	available → occupied (camera detects car with no booking — unauthorised parking)
Section 9 — Database Design
Database Schema
Table 1: User
Column	Type	Constraints
customerId	integer	Primary key, auto increment
customerFName	string	Not null
customerLName	string	Not null
licenseNo	string	Not null, unique
phone	string	Not null, unique
email	string	Not null, unique
password	string	Not null (bcrypt hash)
role	string	Not null, default 'user' — values: user, admin, kiosk

Table 2: Vehicle
Column	Type	Constraints
licensePlate	string	Primary key
customerId	integer	Not null, FK → User.customerId
color	string	Not null
brand	string	Not null
model	string	Not null
type	string	Not null

Table 3: Slot
Column	Type	Constraints
slotId	integer	Primary key, auto increment
zoneName	string	Not null
zoneNumber	integer	Not null
status	string	Not null, default 'available'

Table 4: Booking
Column	Type	Constraints
bookingId	integer	Primary key, auto increment
userId	integer	Not null, FK → User.customerId
slotId	integer	Not null, FK → Slot.slotId
licensePlate	string	Not null, FK → Vehicle.licensePlate
timeStart	DateTime	Not null
timeEnd	DateTime	Not null

Table 5: OccupancyLog
Column	Type	Constraints
logId	integer	Primary key, auto increment
slotId	integer	Not null, FK → Slot.slotId (0 = entry gate)
status	string	Not null — available, reserved, occupied
licensePlate	string	Plate detected at this event
recorded_at	DateTime	Default current UTC timestamp

Foreign Key Relationships
•	Vehicle.customerId → User.customerId
•	Booking.userId → User.customerId
•	Booking.slotId → Slot.slotId
•	Booking.licensePlate → Vehicle.licensePlate
•	OccupancyLog.slotId → Slot.slotId (slotId=0 used for entry gate events)
Section 10 — Design Patterns
10.1 Repository Pattern
Classes: UserRepository, VehicleRepository, SlotRepository, BookingRepository, OccupancyLogRepository.
How applied: All db.session calls are encapsulated inside repository classes. Services and routes never access the database directly. This centralises data access so that if the database or ORM changes, only the repository layer needs updating.
10.2 Service Layer Pattern
Classes: UserService, BookingService, VehicleService, SlotService, DetectionService, AnalyticsService, PredictionService.
How applied: All business logic lives in service classes. Route functions do nothing except parse the incoming request, call the appropriate service method, and return the HTTP response. This keeps routes thin and makes business logic independently testable.
10.3 Factory Method Pattern
Where: create_app() in app.py.
How applied: Instead of creating the Flask application at module level, a factory function builds and configures it. This allows different configurations to be passed for development, testing, and production without changing the application code.
10.4 Dependency Injection Pattern
Where: DetectionService.__init__(self, model, ocr) in services/detection_service.py.
How applied: The YOLOv8 model and EasyOCR reader are loaded once at application startup in ai_app.py and injected into DetectionService as constructor parameters. This avoids reloading heavy ML models on every request and makes the service independently testable by substituting mock models.
10.5 Decorator Pattern
Where: admin_required decorator in routes/admin_routes.py.
How applied: Wraps route functions to enforce role-based access control. Any route decorated with @admin_required automatically checks the JWT claims for role == 'admin' before executing. This separates authorisation logic from route logic and can be applied to any route with a single annotation.
Section 11 — OCL Specifications
11.1 Invariants
1. Booking Valid Time Window
context Booking inv validTimeWindow:   self.timeEnd > self.timeStart
2. Slot Valid Status
context Slot inv validStatus:   self.status = 'available' or self.status = 'reserved' or self.status = 'occupied'
3. User Unique Email
context User inv uniqueEmail:   User.allInstances()->isUnique(u | u.email)
4. Booking Valid Slot Reference
context Booking inv validSlot:   Slot.allInstances()->exists(s | s.slotId = self.slotId)
5. OccupancyLog Has Plate
context OccupancyLog inv hasPlate:   self.licensePlate <> null and self.licensePlate <> ''

11.2 Operations
1. BookingService::create_booking(email: String, data: Dict): Booking
pre:  User.allInstances()->exists(u | u.email = email)
pre:  data.timeEnd > data.timeStart
post: Booking.allInstances()->exists(b | b.licensePlate = data.licensePlate and b.slotId = data.slotId)
2. BookingService::cancel_booking(email: String, bookingId: Int): void
pre:  Booking.allInstances()->exists(b | b.bookingId = bookingId)
pre:  User.allInstances()->exists(u | u.email = email and u.customerId = booking.userId)
post: Booking.allInstances()->forAll(b | b.bookingId <> bookingId)
3. SlotService::get_dashboard(): Dict
post: result.total_capacity = Slot.allInstances()->size()
post: result.available + result.reserved + result.occupied = result.total_capacity
4. DetectionService::verify_slot(image: Image, slotId: Int): Dict
pre:  Slot.allInstances()->exists(s | s.slotId = slotId)
post: OccupancyLog.allInstances()->exists(l | l.slotId = slotId)
5. UserService::register(data: Dict): User
pre:  User.allInstances()->forAll(u | u.email <> data.email)
pre:  User.allInstances()->forAll(u | u.phone <> data.phone)
post: User.allInstances()->exists(u | u.email = data.email)
Section 12 — Implementation
12.1 Technology Stack
Technology	Purpose	Justification
Flask	Python web framework	Lightweight, flexible, Blueprint support for modular routing
SQLAlchemy	ORM for database abstraction	Supports multiple DB backends; clean model definition with mapped_column
SQLite	Database (development)	Zero-configuration, file-based, easily swappable to PostgreSQL for production
Flask-JWT-Extended	JWT authentication	Industry standard token-based auth with claims support for role enforcement
Werkzeug	Password hashing	Built-in with Flask; provides secure bcrypt hashing
YOLOv8 (Ultralytics)	License plate detection	State-of-the-art real-time object detection; pre-trained model from HuggingFace
EasyOCR	Plate text extraction	Replaces PaddleOCR; simpler installation, better cross-platform support, CPU-friendly
scikit-learn	Availability prediction	RandomForest classifier trained on OccupancyLog data to predict slot availability
Docker	Containerisation	Consistent deployment of two separate services (app + AI)
Flask-CORS	Cross-origin requests	Allows React frontend on different port/domain to call the API
React	Frontend framework	Component-based UI, managed by frontend team

12.2 System Components
•	app.py — Main Flask application factory. Registers blueprints, initialises DB and JWT, configures CORS.
•	ai_app.py — Standalone AI Flask service. Loads YOLO and EasyOCR once at startup, exposes /ai/detect endpoint.
•	model.py — All SQLAlchemy domain models: User, Vehicle, Slot, Booking, OccupancyLog.
•	database.py — SQLAlchemy instance shared across the app.
•	repositories/repositories.py — All repository classes for data access abstraction.
•	services/ — All service classes containing business logic.
•	routes/auth.py — Public routes: signup, signin, search parking, dashboard.
•	routes/protected.py — JWT-protected user routes: profile, vehicles, bookings.
•	routes/admin_routes.py — Admin-only routes: analytics, prediction, slot setup.
•	seed.py — Generates 100+ records per model for demo: slots, users, vehicles, bookings, occupancy logs.
Section 13 — Testing
13.1 Test Data
The seed.py script populates the database with realistic test data for the live demonstration:
•	100 parking slots across 5 zones (A, B, C, D, E), 20 slots per zone
•	1 admin user (admin@parking.com / admin123) and 1 kiosk user
•	100 regular users with unique emails, phones, and license numbers
•	100 vehicles, one per user, with random brand, model, colour, and type
•	Bookings generated per vehicle with weighted peak-hour time distribution
•	Occupancy logs generated per booking simulating camera detection cycles: reserved → occupied → available
•	Entry gate logs simulating 30 random vehicles passing through the gate
•	Prediction model automatically retrained after seeding using OccupancyLog data

13.2 Test Cases
Test	Endpoint	Input	Expected
Register duplicate email	POST /auth/signup	Existing email address	400 error
Login wrong password	POST /auth/signin	Wrong password	401 error
Book unavailable slot	POST /protected/findParking/booking	Conflicting time window	400 Slot already booked
Cancel another user's booking	POST /protected/myBooking/cancelBooking	Wrong userId	404 Information Mismatch
Admin route as regular user	GET /admin/analytics/peak-hours	User JWT token	403 Admin access required
Slot detection wrong plate	POST /ai/detect + verify_slot	Image with wrong plate	WRONG_PLATE
Slot detection no booking	POST /ai/detect + verify_slot	Unbooked slot	NOT_BOOKED
Slot detection no car	POST /ai/detect	Empty slot image	slot.status = reserved or available
Predict slot availability	GET /admin/predict/slot/<id>	Valid slotId + hour	probability 0.0–1.0
Entry gate registered plate	POST /ai/detect (entry)	Registered plate image	Access Granted
Entry gate unknown plate	POST /ai/detect (entry)	Unregistered plate	Access Denied

