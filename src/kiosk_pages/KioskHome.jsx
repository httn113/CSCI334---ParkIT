import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import acceptPaymentImg from '../assets/accept_payment.jpg';
import './KioskHome.css';

const ENDPOINT = import.meta.env.VITE_API_URL;

const STEPS = [
  { number: 1, label: 'Vehicle' },
  { number: 2, label: 'Duration' },
  { number: 3, label: 'Payment' },
  { number: 4, label: 'Confirm' },
];

const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480];

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return h === 1 ? '1 hour' : `${h} hours`;
  return `${h}h ${m}m`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function getRoundedTime() {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  const rem = m % 10;
  if (rem !== 0) {
    m = Math.ceil(m / 10) * 10;
    if (m === 60) { m = 0; h = (h + 1) % 24; }
  }
  return { hour: h, minute: m };
}

function isTimePast(dateStr, hour, minute) {
  const selected = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  return selected <= new Date();
}

// search_available expects "%Y-%m-%d %H:%M:%S"
function toSearchFormat(dateStr, hour, minute) {
  return `${dateStr} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

// create_booking expects ISO string
function toISOLocal(dateStr, hour, minute) {
  return `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function addMinutes(dateStr, hour, minute, durationMins) {
  const dt = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  dt.setMinutes(dt.getMinutes() + durationMins);
  return {
    dateStr: dt.toISOString().slice(0, 10),
    hour: dt.getHours(),
    minute: dt.getMinutes(),
  };
}

function getToken() {
  return localStorage.getItem('access_token');
}

export default function KioskHome() {
  const { logout } = useAuth();
  const [showCard, setShowCard] = useState(false);
  const [step, setStep] = useState(1);
  const [paid, setPaid] = useState(false);

  // Step 1
  const [licensePlate, setLicensePlate] = useState('');

  // Step 2
  const today = new Date().toISOString().slice(0, 10);
  const defaultTime = getRoundedTime();
  const [parkingDate, setParkingDate] = useState(today);
  const [parkingHour, setParkingHour] = useState(defaultTime.hour);
  const [parkingMinute, setParkingMinute] = useState(defaultTime.minute);
  const [duration, setDuration] = useState(30);

  // Slot search
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [assignedSlot, setAssignedSlot] = useState(null); // { slotId, zoneName, zoneNumber }

  // Step 3
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Step 4 — booking
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const resetAll = () => {
    setStep(1);
    setLicensePlate('');
    setParkingDate(today);
    const t = getRoundedTime();
    setParkingHour(t.hour);
    setParkingMinute(t.minute);
    setDuration(30);
    setSearching(false);
    setSearchError(null);
    setAssignedSlot(null);
    setPaymentMethod(null);
    setBooking(false);
    setBookingError(null);
    setPaid(false);
  };

  const handleFindSpot = () => { resetAll(); setShowCard(true); };
  const handleBack = () => { setShowCard(false); resetAll(); };

  // Step 2 Continue — search for a slot and auto-assign the first one
  const handleSearchAndContinue = async () => {
    setSearching(true);
    setSearchError(null);
    setAssignedSlot(null);

    const end = addMinutes(parkingDate, parkingHour, parkingMinute, duration);

    try {
      const res = await fetch(`${ENDPOINT}/protected/searchParking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          timeStart: toSearchFormat(parkingDate, parkingHour, parkingMinute),
          timeEnd: toSearchFormat(end.dateStr, end.hour, end.minute),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSearchError(json.error || 'Failed to search for available slots.');
        return;
      }

      if (!Array.isArray(json) || json.length === 0) {
        setSearchError('No available spots for this time. Try a different time or duration.');
        return;
      }

      // Auto-assign first available slot — user doesn't choose
      setAssignedSlot(json[0]);
      setStep(3);
    } catch {
      setSearchError('Could not connect to server. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Step 4 Pay Now — create the booking
  const handlePayNow = async () => {
    setBooking(true);
    setBookingError(null);

    const end = addMinutes(parkingDate, parkingHour, parkingMinute, duration);

    try {
      const res = await fetch(`${ENDPOINT}/protected/findParking/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          slotId: assignedSlot.slotId,
          licensePlate: licensePlate.trim().toUpperCase(),
          timeStart: toISOLocal(parkingDate, parkingHour, parkingMinute),
          timeEnd: toISOLocal(end.dateStr, end.hour, end.minute),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setBookingError(json.error || 'Booking failed. Please try again.');
        return;
      }

      setPaid(true);
    } catch {
      setBookingError('Could not connect to server. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const timePast = isTimePast(parkingDate, parkingHour, parkingMinute);
  const formattedTime = `${String(parkingHour).padStart(2, '0')}:${String(parkingMinute).padStart(2, '0')}`;
  const end = addMinutes(parkingDate, parkingHour, parkingMinute, duration);
  const formattedEndTime = `${String(end.hour).padStart(2, '0')}:${String(end.minute).padStart(2, '0')}`;
  const spotLabel = assignedSlot
    ? `${assignedSlot.zoneName}-${String(assignedSlot.zoneNumber).padStart(3, '0')}`
    : '—';

  return (
    <div className="kiosk-page">
      <div className="kiosk-bg">
        <div className="korb korb-1" />
        <div className="korb korb-2" />
        <div className="korb korb-3" />
      </div>

      <div className="kiosk-brand">
        <div className="kiosk-brand-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
          </svg>
        </div>
        <div className="kiosk-brand-text">
          <span className="kiosk-brand-name">ParkIT</span>
          <span className="kiosk-brand-sub">Self-Service Kiosk</span>
        </div>
      </div>

      <button className="kiosk-logout-btn" onClick={logout} aria-label="Logout">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Exit
      </button>

      {!showCard && (
        <div className="kiosk-center">
          <p className="kiosk-welcome">Welcome to ParkIT</p>
          <p className="kiosk-tagline">Quick, easy, and contactless parking</p>
          <button className="kiosk-find-btn" onClick={handleFindSpot}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Find Spot Now
          </button>
        </div>
      )}

      {showCard && (
        <div className="kiosk-card">
          {/* Step indicator */}
          <div className="kiosk-steps">
            {STEPS.map((s, idx) => (
              <div key={s.number} className="kiosk-step-item">
                <div className={`kiosk-step-circle ${paid ? 'done' : step === s.number ? 'active' : step > s.number ? 'done' : ''
                  }`}>
                  {(paid || step > s.number) ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : s.number}
                </div>
                <span className={`kiosk-step-label ${step === s.number && !paid ? 'active' : ''}`}>{s.label}</span>
                {idx < STEPS.length - 1 && (
                  <div className={`kiosk-step-line ${paid || step > s.number ? 'done' : ''}`} />
                )}
              </div>
            ))}
          </div>

          <div className="kiosk-step-content">

            {/* ── STEP 1: Vehicle ── */}
            {!paid && step === 1 && (
              <div className="kiosk-step-panel">
                <h2 className="kiosk-step-heading">Enter License Plate</h2>
                <p className="kiosk-step-sub">Please enter your license plate</p>
                <div className="kiosk-input-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kiosk-input-icon">
                    <rect x="1" y="6" width="22" height="13" rx="2" />
                    <path d="M5 6V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2" />
                    <circle cx="8" cy="13" r="1" /><circle cx="16" cy="13" r="1" />
                  </svg>
                  <input
                    type="text"
                    className="kiosk-input"
                    placeholder="e.g. ABC-1234"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <button
                  className="kiosk-continue-btn"
                  onClick={() => setStep(2)}
                  disabled={!licensePlate.trim()}
                >
                  Continue
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            )}

            {/* ── STEP 2: Duration ── */}
            {!paid && step === 2 && (
              <div className="kiosk-step-panel">
                <h2 className="kiosk-step-heading">Select Duration</h2>
                <p className="kiosk-step-sub">Choose your parking date, time and duration</p>

                <div className="kiosk-field-row">
                  <label className="kiosk-field-label">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Date
                  </label>
                  <input
                    type="date"
                    className="kiosk-input kiosk-date-input"
                    value={parkingDate}
                    min={today}
                    onChange={(e) => { setParkingDate(e.target.value); setSearchError(null); }}
                  />
                </div>

                <div className="kiosk-field-row">
                  <label className="kiosk-field-label">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Time
                  </label>
                  <div className="kiosk-time-selects">
                    <select
                      className="kiosk-select"
                      value={parkingHour}
                      onChange={(e) => { setParkingHour(Number(e.target.value)); setSearchError(null); }}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span className="kiosk-time-sep">:</span>
                    <select
                      className="kiosk-select"
                      value={parkingMinute}
                      onChange={(e) => { setParkingMinute(Number(e.target.value)); setSearchError(null); }}
                    >
                      {[0, 10, 20, 30, 40, 50].map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {timePast && (
                  <p className="kiosk-error-msg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Selected time is in the past
                  </p>
                )}

                <div className="kiosk-field-row kiosk-field-col">
                  <label className="kiosk-field-label">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Duration
                  </label>
                  <div className="kiosk-duration-pills">
                    {DURATION_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        className={`kiosk-duration-pill${duration === opt ? ' selected' : ''}`}
                        onClick={() => { setDuration(opt); setSearchError(null); }}
                        type="button"
                      >
                        {formatDuration(opt)}
                      </button>
                    ))}
                  </div>
                </div>

                {searchError && (
                  <p className="kiosk-error-msg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {searchError}
                  </p>
                )}

                <button
                  className="kiosk-continue-btn"
                  onClick={handleSearchAndContinue}
                  disabled={timePast || searching}
                >
                  {searching ? (
                    <>
                      <svg className="kiosk-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                      Finding spot…
                    </>
                  ) : (
                    <>
                      Continue
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── STEP 3: Payment ── */}
            {!paid && step === 3 && (
              <div className="kiosk-step-panel">
                <h2 className="kiosk-step-heading">Payment Method</h2>
                <p className="kiosk-step-sub">Select how you would like to pay</p>

                {assignedSlot && (
                  <div className="kiosk-spot-assigned">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Spot assigned: <strong>{spotLabel}</strong>
                  </div>
                )}

                <div className="kiosk-payment-options">
                  <button
                    type="button"
                    className={`kiosk-payment-card${paymentMethod === 'cash' ? ' selected' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className="kiosk-payment-icon kiosk-payment-icon--cash">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M5 12H1M23 12h-4" />
                      </svg>
                    </div>
                    <span className="kiosk-payment-label">Pay With Cash</span>
                    {paymentMethod === 'cash' && (
                      <div className="kiosk-payment-check">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`kiosk-payment-card${paymentMethod === 'card' ? ' selected' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="kiosk-payment-icon kiosk-payment-icon--card">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                    </div>
                    <span className="kiosk-payment-label">Card Payment</span>
                    <span className="kiosk-payment-accept">We Accept</span>
                    <div className="kiosk-brand-logos">
                      <img src={acceptPaymentImg} alt="Visa, Mastercard, American Express accepted" className="kiosk-accept-payment-img" />
                    </div>
                    {paymentMethod === 'card' && (
                      <div className="kiosk-payment-check">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>

                <button
                  className="kiosk-continue-btn"
                  onClick={() => setStep(4)}
                  disabled={!paymentMethod}
                >
                  Continue
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            )}

            {/* ── STEP 4: Confirm ── */}
            {!paid && step === 4 && (
              <div className="kiosk-step-panel">
                <h2 className="kiosk-step-heading">Confirm Booking</h2>
                <p className="kiosk-step-sub">Please review your parking details</p>

                <div className="kiosk-confirm-summary">
                  <div className="kiosk-confirm-row">
                    <span className="kiosk-confirm-label">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="6" width="22" height="13" rx="2" />
                        <path d="M5 6V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2" />
                        <circle cx="8" cy="13" r="1" /><circle cx="16" cy="13" r="1" />
                      </svg>
                      License Plate
                    </span>
                    <span className="kiosk-confirm-value kiosk-confirm-plate">{licensePlate.toUpperCase()}</span>
                  </div>
                  <div className="kiosk-confirm-divider" />
                  <div className="kiosk-confirm-row">
                    <span className="kiosk-confirm-label">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Spot
                    </span>
                    <span className="kiosk-confirm-value">{spotLabel}</span>
                  </div>
                  <div className="kiosk-confirm-divider" />
                  <div className="kiosk-confirm-row">
                    <span className="kiosk-confirm-label">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Date
                    </span>
                    <span className="kiosk-confirm-value">{formatDate(parkingDate)}</span>
                  </div>
                  <div className="kiosk-confirm-divider" />
                  <div className="kiosk-confirm-row">
                    <span className="kiosk-confirm-label">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Time
                    </span>
                    <span className="kiosk-confirm-value">{formattedTime} → {formattedEndTime}</span>
                  </div>
                  <div className="kiosk-confirm-divider" />
                  <div className="kiosk-confirm-row">
                    <span className="kiosk-confirm-label">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Duration
                    </span>
                    <span className="kiosk-confirm-value">{formatDuration(duration)}</span>
                  </div>
                  <div className="kiosk-confirm-divider" />
                  <div className="kiosk-confirm-row">
                    <span className="kiosk-confirm-label">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      Payment
                    </span>
                    <span className="kiosk-confirm-value">
                      {paymentMethod === 'cash' ? 'Cash' : 'Card Payment'}
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <p className="kiosk-error-msg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {bookingError}
                  </p>
                )}

                <button
                  className="kiosk-continue-btn kiosk-paynow-btn"
                  onClick={handlePayNow}
                  disabled={booking}
                >
                  {booking ? (
                    <>
                      <svg className="kiosk-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      Pay Now
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Result: Cash ── */}
            {paid && paymentMethod === 'cash' && (
              <div className="kiosk-step-panel kiosk-result">
                <div className="kiosk-result-icon kiosk-result-icon--cash">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M5 12H1M23 12h-4" />
                  </svg>
                </div>
                <h2 className="kiosk-step-heading">Booking Confirmed</h2>
                <p className="kiosk-step-sub">Please proceed to the payment counter</p>
                <div className="kiosk-queue-number">{spotLabel}</div>
                <p className="kiosk-result-hint">Show this spot number at the counter to complete your cash payment</p>
                <button className="kiosk-continue-btn kiosk-finish-btn" onClick={handleBack}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Finish
                </button>
              </div>
            )}

            {/* ── Result: Card ── */}
            {paid && paymentMethod === 'card' && (
              <div className="kiosk-step-panel kiosk-result">
                <div className="kiosk-result-icon kiosk-result-icon--card">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <h2 className="kiosk-step-heading">Booking Confirmed</h2>
                <p className="kiosk-step-sub">Spot {spotLabel} — please tap your card below</p>
                <div className="kiosk-pos-indicator">
                  <div className="kiosk-pos-pulse" />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <button className="kiosk-continue-btn kiosk-finish-btn" onClick={handleBack}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Finish
                </button>
              </div>
            )}

          </div>

          {!paid && (
            <button className="kiosk-back-btn" onClick={step === 1 ? handleBack : () => setStep(step - 1)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {step === 1 ? 'Back to Home' : 'Back'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}