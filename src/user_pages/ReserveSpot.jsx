import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './FindParking.css';
import './ReserveSpot.css';
import GlassCard from '../components/GlassCard';
import FormField from '../components/FormField';
import SectionTitle from '../components/SectionTitle';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const MOCK_SAVED_PLATES = [
  { id: 1, plate: 'TEST-1234' },
  { id: 2, plate: 'XY-90AB' },
];

const CAR_TYPES = [
  'Sedan', 'SUV', 'Minivan', 'Hatchback', 'Coupe', 'Pickup Truck', 'Convertible', 'Wagon', 'Other',
];

const COLORS = ['Black', 'White', 'Silver', 'Red', 'Blue', 'Grey', 'Other'];

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
  const navigate = useNavigate();

  const minDate = useMemo(() => ymd(0), []);
  const defaultFutureDate = useMemo(() => ymd(1), []);

  const [plateMode, setPlateMode] = useState('saved');
  const [savedPlateId, setSavedPlateId] = useState(String(MOCK_SAVED_PLATES[0]?.id ?? ''));
  const [newPlate, setNewPlate] = useState('');

  const [vehicleType, setVehicleType] = useState(CAR_TYPES[0]);
  const [color, setColor] = useState(COLORS[0]);

  const [startDate, setStartDate] = useState(defaultFutureDate);
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [endDate, setEndDate] = useState(defaultFutureDate);
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');

  const [formErrors, setFormErrors] = useState({ plate: '', start: '', end: '', general: '' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const startAt = useMemo(
    () => dateFromYmdHms(startDate, startHour, startMinute),
    [startDate, startHour, startMinute],
  );
  const endAt = useMemo(
    () => dateFromYmdHms(endDate, endHour, endMinute),
    [endDate, endHour, endMinute],
  );

  function getResolvedPlate() {
    if (plateMode === 'saved') {
      const p = MOCK_SAVED_PLATES.find((x) => String(x.id) === savedPlateId);
      return p?.plate?.trim() ?? '';
    }
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
    const plate = getResolvedPlate();
    setConfirmed({
      spotId,
      licensePlate: plate,
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

  const totalMs = confirmed
    ? confirmed.endAt.getTime() - confirmed.startAt.getTime()
    : 0;
  const totalMinutes = Math.max(0, Math.floor(totalMs / 60_000));
  const totalTimeLabel = formatDurationFromMinutes(totalMinutes);
  const priceTotal = (totalMs / 3_600_000) * PRICE_PER_HOUR_USD;

  return (
    <div
      className="fp-page fp-reserve-spot"
      aria-label={spotId ? `Reserve spot ${spotId}` : 'Reserve spot'}
    >
      <h1 className="fp-heading">Spot {spotId ?? '—'}</h1>

      {!showConfirmation && (
        <GlassCard className="rs-form-card">
          <FormField label="License plate" error={formErrors.plate} htmlFor="rs-plate-mode">
            <div className="rs-plate-mode" role="radiogroup" aria-label="License plate source">
              <label className="rs-radio">
                <input
                  type="radio"
                  name="plateMode"
                  checked={plateMode === 'saved'}
                  onChange={() => { setPlateMode('saved'); setFormErrors((e) => ({ ...e, plate: '' })); }}
                />
                Saved on account
              </label>
              <label className="rs-radio">
                <input
                  type="radio"
                  name="plateMode"
                  checked={plateMode === 'new'}
                  onChange={() => { setPlateMode('new'); setFormErrors((e) => ({ ...e, plate: '' })); }}
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
                {MOCK_SAVED_PLATES.map((p) => (
                  <option key={p.id} value={p.id}>{p.plate}</option>
                ))}
              </select>
            ) : (
              <input
                id="rs-new-plate"
                className="fp-input rs-full"
                type="text"
                value={newPlate}
                onChange={(e) => { setNewPlate(e.target.value); setFormErrors((e2) => ({ ...e2, plate: '' })); }}
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
                {CAR_TYPES.map((t) => (
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
                {COLORS.map((c) => (
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
                  onChange={(e) => { setStartDate(e.target.value); setFormErrors((e2) => ({ ...e2, start: '' })); }}
                />
              </div>
              <div className="fp-field">
                <span className="fp-field-label">Time</span>
                <div className="fp-time-group">
                  <select
                    className="fp-select"
                    value={startHour}
                    onChange={(e) => { setStartHour(e.target.value); setFormErrors((e2) => ({ ...e2, start: '' })); }}
                  >
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="fp-time-sep">:</span>
                  <select
                    className="fp-select"
                    value={startMinute}
                    onChange={(e) => { setStartMinute(e.target.value); setFormErrors((e2) => ({ ...e2, start: '' })); }}
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
                  onChange={(e) => { setEndDate(e.target.value); setFormErrors((e2) => ({ ...e2, end: '' })); }}
                />
              </div>
              <div className="fp-field">
                <span className="fp-field-label">Time</span>
                <div className="fp-time-group">
                  <select
                    className="fp-select"
                    value={endHour}
                    onChange={(e) => { setEndHour(e.target.value); setFormErrors((e2) => ({ ...e2, end: '' })); }}
                  >
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="fp-time-sep">:</span>
                  <select
                    className="fp-select"
                    value={endMinute}
                    onChange={(e) => { setEndMinute(e.target.value); setFormErrors((e2) => ({ ...e2, end: '' })); }}
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
          <div className="rs-confirm-actions">
            <button type="button" className="rs-btn rs-btn--pay" onClick={() => { /* payment flow TBD */ }}>
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
