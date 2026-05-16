import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './FindParking.css';
import './ReserveSpot.css';
import GlassCard from '../components/GlassCard';
import FormField from '../components/FormField';
import SectionTitle from '../components/SectionTitle';
import dayjs from 'dayjs';
const ENDPOINT = import.meta.env.VITE_API_URL;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const PRICE_PER_HOUR_USD = 8;

function ymd(todayOffsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + todayOffsetDays);
  return d.toISOString().split('T')[0];
}

function dateFromYmdHms(ymd, h, m) {
  if (!ymd) return null;
  const [y, M, d] = ymd.split('-').map(Number);
  return new Date(y, M - 1, d, Number(h), Number(m), 0, 0);
}

function formatDurationFromMinutes(totalMinutes) {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return h === 1 ? '1 hr' : `${h} hr`;
  return `${h} hr ${m} min`;
}

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatDateTime(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReserveSpot() {
  const { spotId } = useParams();
  const [slotId, setSlotId] = useState('')
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState({ plan: "standard", discount: 0 });


  const minDate = useMemo(() => ymd(0), []);
  const defaultFutureDate = useMemo(() => ymd(1), []);

  const [savedPlates, setSavedPlates] = useState([]);
  const [savedPlateId, setSavedPlateId] = useState('');
  const [carTypes, setCarTypes] = useState([]);
  const [colors, setColors] = useState([]);

  const [plateMode, setPlateMode] = useState('saved');
  const [newPlate, setNewPlate] = useState('');

  const [vehicleType, setVehicleType] = useState('');
  const [color, setColor] = useState('');

  const [startDate, setStartDate] = useState(defaultFutureDate);
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [endDate, setEndDate] = useState(defaultFutureDate);
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');

  const [formErrors, setFormErrors] = useState({ plate: '', start: '', end: '', general: '' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  // Fetch user subscription on component mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch(`${ENDPOINT}/protected/subscription/current`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSubscription(data);
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      }
    };
    fetchSubscription();
  }, []);

  // Fetch saved plates and derive car types + colors from the response
  useEffect(() => {
    async function fetchPlates() {
      try {
        const res = await fetch(`${ENDPOINT}/protected/myProfile/showLicensePlate`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setSavedPlates(data);
        setCarTypes([...new Set(data.map(p => p.type))]);
        setColors([...new Set(data.map(p => p.color))]);
        if (data.length > 0) {
          setSavedPlateId(data[0].licensePlate);
          setVehicleType(data[0].model);
          setColor(data[0].color);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchPlates();
  }, []);

  // Sync vehicleType and color when the selected plate changes
  useEffect(() => {
    const selected = savedPlates.find(p => p.licensePlate === savedPlateId);
    if (selected) {
      setVehicleType(selected.model);
      setColor(selected.color);
    }
  }, [savedPlateId, savedPlates]);

  useEffect(() => {
    const raw = localStorage.getItem('parking_search');
    if (!raw) return;
    const { date, hour, minute, durationMinutes, slotId } = JSON.parse(raw);

    if (slotId) setSlotId(slotId);
    if (date) setStartDate(date);
    if (hour) setStartHour(hour);
    if (minute) setStartMinute(minute);

    // Calculate end time from start + duration
    if (date && hour && minute && durationMinutes) {
      const end = dayjs(`${date} ${hour}:${minute}`).add(durationMinutes, 'minute');
      setEndDate(end.format('YYYY-MM-DD'));
      setEndHour(end.format('HH'));
      setEndMinute(end.format('mm'));
    }
  }, []);

  const startAt = useMemo(
    () => dateFromYmdHms(startDate, startHour, startMinute),
    [startDate, startHour, startMinute],
  );
  const endAt = useMemo(
    () => dateFromYmdHms(endDate, endHour, endMinute),
    [endDate, endHour, endMinute],
  );

  function getResolvedPlate() {
    if (plateMode === 'saved') return savedPlateId.trim();
    return newPlate.trim();
  }

  function validate() {
    const err = { plate: '', start: '', end: '', general: '' };
    const now = new Date();
    if (!spotId) err.general = 'Invalid spot.';

    const plate = getResolvedPlate();
    if (!plate) err.plate = plateMode === 'saved' ? 'Select a saved license plate.' : 'Enter a license plate.';

    if (!startAt || Number.isNaN(startAt.getTime())) {
      err.start = 'Set a valid arrival time.';
    } else if (startAt.getTime() <= now.getTime()) {
      err.start = 'Arrival must be in the future.';
    }

    if (!endAt || Number.isNaN(endAt.getTime())) {
      err.end = 'Set a valid departure time.';
    } else if (endAt.getTime() <= now.getTime()) {
      err.end = 'Departure must be in the future.';
    } else if (startAt && endAt.getTime() <= startAt.getTime()) {
      err.end = 'Departure must be after arrival.';
    }

    setFormErrors(err);
    return !err.plate && !err.start && !err.end && !err.general;
  }

  function handleConfirm() {
    if (!validate()) return;
    setConfirmed({
      slotId,          
      spotId,
      licensePlate: getResolvedPlate(),
      vehicleType,
      color,
      startAt: new Date(startAt.getTime()),
      endAt: new Date(endAt.getTime()),
    });
    setShowConfirmation(true);
  }

  function handleCancel() {
    navigate('/user/find-parking');
  }

  function handleBackToForm() {
    setShowConfirmation(false);
    setConfirmed(null);
  }

  async function handlePayment() {
    try {
      const timeStart = dayjs(confirmed.startAt).format("YYYY-MM-DD HH:mm:ss");
      const timeEnd = dayjs(confirmed.endAt).format("YYYY-MM-DD HH:mm:ss");

      const res = await fetch(`${ENDPOINT}/protected/findParking/booking`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId,
          licensePlate: confirmed.licensePlate,
          vehicleType: confirmed.vehicleType,
          color: confirmed.color,
          timeStart,
          timeEnd,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Reservation failed:", err);
        return;
      }

      // Success — clear the search cache and redirect
      localStorage.removeItem('parking_search');
      navigate('/user/my-bookings');  // adjust to your actual route
    } catch (err) {
      console.error("Reservation failed:", err);
    }
  }

  const totalMs = confirmed ? confirmed.endAt.getTime() - confirmed.startAt.getTime() : 0;
  const totalMinutes = Math.max(0, Math.floor(totalMs / 60_000));
  const totalTimeLabel = formatDurationFromMinutes(totalMinutes);

  const basePrice = (totalMs / 3_600_000) * PRICE_PER_HOUR_USD;
  const discountAmount = basePrice * (subscription.discount / 100);
  const priceTotal = basePrice - discountAmount;


  return (
    <div
      className="fp-page fp-reserve-spot"
      aria-label={spotId ? `Reserve spot ${spotId}` : 'Reserve spot'}
    >
      <h1 className="fp-heading">Spot {spotId ?? '—'}</h1>

      {/* Show subscription discount info */}
      {subscription.discount > 0 && (
        <div className="rs-discount-banner" style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50' }}>
          <p style={{ margin: 0, color: '#2e7d32', fontWeight: 'bold' }}>
            ✓ {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} subscriber: {subscription.discount}% discount applied!
          </p>
        </div>
      )}

      {!showConfirmation && (
        <GlassCard className="rs-form-card">
          <FormField label="License plate" error={formErrors.plate} htmlFor="rs-plate-mode">
            <div className="rs-plate-mode" role="radiogroup" aria-label="License plate source">
              <label className="rs-radio">
                <input
                  type="radio"
                  name="plateMode"
                  checked={plateMode === 'saved'}
                  onChange={() => { setPlateMode('saved'); setFormErrors((prev) => ({ ...prev, plate: '' })); }}
                />
                Saved on account
              </label>
              <label className="rs-radio">
                <input
                  type="radio"
                  name="plateMode"
                  checked={plateMode === 'new'}
                  onChange={() => { setPlateMode('new'); setFormErrors((prev) => ({ ...prev, plate: '' })); }}
                />
                Enter new
              </label>
            </div>
            {plateMode === 'saved' ? (
              <select
                id="rs-saved-plate"
                className="fp-select rs-full"
                value={savedPlateId}
                onChange={(e) => setSavedPlateId(e.target.value)}
              >
                {savedPlates.map((p) => (
                  <option key={p.licensePlate} value={p.licensePlate}>{p.licensePlate}</option>
                ))}
              </select>
            ) : (
              <input
                id="rs-new-plate"
                className="fp-input rs-full"
                type="text"
                value={newPlate}
                onChange={(e) => { setNewPlate(e.target.value); setFormErrors((prev) => ({ ...prev, plate: '' })); }}
                placeholder="e.g. ABC-1234"
                autoComplete="off"
              />
            )}
          </FormField>

          <div className="rs-two-col">
            <FormField label="Vehicle type" htmlFor="rs-type">
              <select
                id="rs-type"
                className="fp-select rs-full"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                {carTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Color" htmlFor="rs-color">
              <select
                id="rs-color"
                className="fp-select rs-full"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                {colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField error={formErrors.start}>
            <div className="rs-section">
              <SectionTitle>Arrival (future only)</SectionTitle>
            </div>
            <div className="rs-datetime-block">
              <div className="rs-date-row">
                <span className="fp-field-label">Date</span>
                <input
                  type="date"
                  className="fp-input rs-date-input"
                  value={startDate}
                  min={minDate}
                  onChange={(e) => { setStartDate(e.target.value); setFormErrors((prev) => ({ ...prev, start: '' })); }}
                />
              </div>
              <div className="fp-field">
                <span className="fp-field-label">Time</span>
                <div className="fp-time-group">
                  <select
                    className="fp-select"
                    value={startHour}
                    onChange={(e) => { setStartHour(e.target.value); setFormErrors((prev) => ({ ...prev, start: '' })); }}
                  >
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="fp-time-sep">:</span>
                  <select
                    className="fp-select"
                    value={startMinute}
                    onChange={(e) => { setStartMinute(e.target.value); setFormErrors((prev) => ({ ...prev, start: '' })); }}
                  >
                    {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </FormField>

          <FormField error={formErrors.end}>
            <div className="rs-section rs-section--spaced">
              <SectionTitle>Departure (future only, after arrival)</SectionTitle>
            </div>
            <div className="rs-datetime-block">
              <div className="rs-date-row">
                <span className="fp-field-label">Date</span>
                <input
                  type="date"
                  className="fp-input rs-date-input"
                  value={endDate}
                  min={minDate}
                  onChange={(e) => { setEndDate(e.target.value); setFormErrors((prev) => ({ ...prev, end: '' })); }}
                />
              </div>
              <div className="fp-field">
                <span className="fp-field-label">Time</span>
                <div className="fp-time-group">
                  <select
                    className="fp-select"
                    value={endHour}
                    onChange={(e) => { setEndHour(e.target.value); setFormErrors((prev) => ({ ...prev, end: '' })); }}
                  >
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="fp-time-sep">:</span>
                  <select
                    className="fp-select"
                    value={endMinute}
                    onChange={(e) => { setEndMinute(e.target.value); setFormErrors((prev) => ({ ...prev, end: '' })); }}
                  >
                    {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </FormField>

          {formErrors.general && <p className="rs-form-error">{formErrors.general}</p>}

          <div className="rs-actions">
            <button type="button" className="rs-btn rs-btn--secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="rs-btn rs-btn--primary" onClick={handleConfirm}>
              Confirm
            </button>
          </div>
        </GlassCard>
      )}

      {showConfirmation && confirmed && (
        <GlassCard className="rs-confirm-card">
          <h2 className="rs-confirm-title">Reservation summary</h2>
          <dl className="rs-dl">
            <div className="rs-dl-row"><dt>Spot</dt><dd>{confirmed.spotId}</dd></div>
            <div className="rs-dl-row"><dt>License plate</dt><dd>{confirmed.licensePlate}</dd></div>
            <div className="rs-dl-row"><dt>Vehicle type</dt><dd>{confirmed.vehicleType}</dd></div>
            <div className="rs-dl-row"><dt>Color</dt><dd>{confirmed.color}</dd></div>
            <div className="rs-dl-row"><dt>Arrival</dt><dd>{formatDateTime(confirmed.startAt)}</dd></div>
            <div className="rs-dl-row"><dt>Departure</dt><dd>{formatDateTime(confirmed.endAt)}</dd></div>
            <div className="rs-dl-row rs-dl-row--strong">
              <dt>Total time</dt>
              <dd>{totalTimeLabel}</dd>
            </div>
            <div className="rs-dl-row rs-dl-row--total">
              <dt>Total</dt>
              <dd>{formatMoney(priceTotal)}</dd>
            </div>
          </dl>
          <p className="rs-rate-hint">Rate: {formatMoney(PRICE_PER_HOUR_USD)} / hour (mock)</p>
          
          <div className="rs-price-section">
            <div className="rs-price-row">
              <span>Base Price ({totalTimeLabel}):</span>
              <span>{formatMoney(basePrice)}</span>
            </div>
            {subscription.discount > 0 && (
              <div className="rs-price-row rs-discount-row">
                <span>{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Discount ({subscription.discount}%):</span>
                <span style={{ color: '#4caf50', fontWeight: 'bold' }}>-{formatMoney(discountAmount)}</span>
              </div>
            )}
            <div className="rs-price-row rs-total-row">
              <span>Total Price:</span>
              <span>{formatMoney(priceTotal)}</span>
            </div>
          </div>
          
          <div className="rs-confirm-actions">
            <button type="button" className="rs-btn rs-btn--pay" onClick={handlePayment}>
              Accept and Pay
            </button>
            <button type="button" className="rs-btn rs-btn--danger" onClick={handleBackToForm}>
              Cancel
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}