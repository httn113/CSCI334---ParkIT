import { useState } from 'react';
import { Link } from 'react-router-dom';
import './FindParking.css';
import SectionTitle from '../components/SectionTitle';
import GlassCard from '../components/GlassCard';
import FilterPillGroup from '../components/FilterPillGroup';
import dayjs from "dayjs";

const ENDPOINT = import.meta.env.VITE_API_URL;


const ZONES = [
  { id: 'a', label: 'Zone A' },
  { id: 'b', label: 'Zone B' },
  { id: 'c', label: 'Zone C' },
  { id: 'd', label: 'Zone D' },
];

const AVAILABLE_SLOTS = ['001', '002', '003', '004', '005'];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'a',   label: 'Zone A' },
  { id: 'b',   label: 'Zone B' },
  { id: 'c',   label: 'Zone C' },
  { id: 'd',   label: 'Zone D' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

/** 30 min … 10 hr, step 30 min */
const DURATION_OPTIONS_MINUTES = Array.from({ length: 20 }, (_, i) => 30 + i * 30);

function formatDurationLabel(totalMinutes) {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return h === 1 ? '1 hr' : `${h} hr`;
  return `${h} hr ${m} min`;
}

export default function FindParking() {
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState('60');

  const [slots, setSlots] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  
  const visibleZones =
    selectedZone === 'all' ? ZONES : ZONES.filter((z) => z.id === selectedZone);

  async function handleFindParking() {
    try {
      const token = localStorage.getItem("access_token");

      console.log(selectedDate); // 2026-04-29
      console.log(selectedHour); // 08
      console.log(selectedMinute); // 00
      console.log(selectedDurationMinutes); // 60

      const timeStart = dayjs(`${selectedDate} ${selectedHour}:${selectedMinute}`)
        .format("YYYY-MM-DD HH:mm:ss");

      const timeEnd = dayjs(timeStart)
        .add(selectedDurationMinutes, "minute")
        .format("YYYY-MM-DD HH:mm:ss");

      console.log(timeStart, timeEnd);

      const res = await fetch(`${ENDPOINT}/protected/searchParking`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "timeStart": timeStart,
          "timeEnd": timeEnd
        })
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to fetch data:", err);
        return;
      }

      const data = await res.json();
      setSlots(data);

      // Fetch recommendations
      await fetchRecommendations(timeStart, timeEnd);

      localStorage.setItem('parking_search', JSON.stringify({
        date: selectedDate,
        hour: selectedHour,
        minute: selectedMinute,
        durationMinutes: Number(selectedDurationMinutes),
      }));
    }
    catch (err) {
      console.error("Failed to fetch data:", err);
    }
    }

  const fetchRecommendations = async (startTime, endTime) => {
    try {
      const res = await fetch(`${ENDPOINT}/protected/parking/recommendations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeStart: startTime,
          timeEnd: endTime,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    }
  };
  
  
  return (
    <div className="fp-page">
      <h1 className="fp-heading">Find Parking</h1>

      {/* ── Section 1: Date & Time picker ── */}
      <SectionTitle>Select Date &amp; Time</SectionTitle>
      <div className="fp-picker-row">
        <GlassCard className="fp-picker-card">
          {/* Date */}
          <div className="fp-field">
            <span className="fp-field-label">Date</span>
            <input
              type="date"
              className="fp-input"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Time */}
          <div className="fp-field">
            <span className="fp-field-label">Time</span>
            <div className="fp-time-group">
              <select
                className="fp-select"
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="fp-time-sep">:</span>
              <select
                className="fp-select"
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(e.target.value)}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div className="fp-field fp-field--duration">
            <span className="fp-field-label">Duration</span>
            <select
              className="fp-select fp-select--duration"
              value={selectedDurationMinutes}
              onChange={(e) => setSelectedDurationMinutes(e.target.value)}
            >
              {DURATION_OPTIONS_MINUTES.map((mins) => (
                <option key={mins} value={String(mins)}>
                  {formatDurationLabel(mins)}
                </option>
              ))}
            </select>
          </div>

          <button className="fp-find-btn" type="button" onClick={handleFindParking}>
            Find
          </button>
        </GlassCard>
      </div>

      {/* ── Section 1.5: Smart Recommendations ── */}
      {recommendations && (
        <>
          <SectionTitle>💡 Smart Recommendations</SectionTitle>
          <div className="fp-recommendations-grid">
            <GlassCard className="fp-recommendation-card fp-rec-nearest">
              <div className="fp-rec-icon">📍</div>
              <h3 className="fp-rec-title">Nearest Zone</h3>
              <div className="fp-rec-zone">{recommendations.nearest_zone.zone}</div>
              <div className="fp-rec-stat">
                <span className="fp-rec-percentage">{recommendations.nearest_zone.availability_percentage}%</span>
                <span className="fp-rec-label">available</span>
              </div>
              <div className="fp-rec-detail">
                {recommendations.nearest_zone.available_slots} of {recommendations.nearest_zone.total_slots} spots free
              </div>
            </GlassCard>

            <GlassCard className="fp-recommendation-card fp-rec-least-busy">
              <div className="fp-rec-icon">🏎️</div>
              <h3 className="fp-rec-title">Least Busy</h3>
              <div className="fp-rec-zone">{recommendations.least_congested_zone.zone}</div>
              <div className="fp-rec-stat">
                <span className="fp-rec-percentage">{recommendations.least_congested_zone.occupancy_percentage}%</span>
                <span className="fp-rec-label">occupied</span>
              </div>
              <div className="fp-rec-detail">
                {recommendations.least_congested_zone.available_slots} of {recommendations.least_congested_zone.total_slots} spots free
              </div>
            </GlassCard>

            <GlassCard className="fp-recommendation-card fp-rec-best">
              <div className="fp-rec-icon">⭐</div>
              <h3 className="fp-rec-title">Best Availability</h3>
              <div className="fp-rec-zone">{recommendations.best_availability_zone.zone}</div>
              <div className="fp-rec-stat">
                <span className="fp-rec-percentage">{recommendations.best_availability_zone.available_slots}</span>
                <span className="fp-rec-label">spots available</span>
              </div>
              <div className="fp-rec-detail">
                {recommendations.best_availability_zone.availability_percentage}% of total capacity
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {/* ── Section 2: Zone filter tabs ── */}
      <SectionTitle>Filter by Zone</SectionTitle>
      <FilterPillGroup
        items={FILTERS}
        activeId={selectedZone}
        onSelect={setSelectedZone}
      />

      

      {/* ── Section 3: Zone cards ── */}
      <SectionTitle>Available Slots</SectionTitle>
      <div className="fp-zones-grid">
        {visibleZones.map((zone) => (
          <GlassCard key={zone.id} className="fp-zone-card">
            <div className="fp-zone-header">
              <div className="fp-zone-badge">{zone.label.split(' ')[1]}</div>
              <div className="fp-zone-meta">
                <span className="fp-zone-name">{zone.label}</span>
                <span className="fp-zone-sub">
                  {slots.filter((s) => s.zoneName === zone.label.split(' ')[1]).length} slots total
                </span>
              </div>
            </div>

            <div className="fp-zone-divider" />

            <div className="fp-slots-label">Available slots</div>
            <div className="fp-slots-grid">
              {/* {(slotsByZone[zone.label.split(' ')[1]] || []).map((slot) => { */}
              {slots
                .filter((s) => s.zoneName === zone.label.split(' ')[1])
                .map((slot) => {  
                const spotId = `${slot.zoneName}${String(slot.zoneNumber).padStart(3, '0')}`;
                return (
                  <Link
                    key={slot.slotId}
                    className="fp-slot"
                    to={`/user/find-parking/reservespot/${encodeURIComponent(spotId)}`}
                    onClick={() => {
                      const raw = localStorage.getItem('parking_search');
                      const existing = raw ? JSON.parse(raw) : {};
                      localStorage.setItem('parking_search', JSON.stringify({
                        ...existing,
                        slotId: slot.slotId,   // ✅ inject slotId at click time
                      }));
                    }}
                  >
                    {spotId}
                  </Link>
                );
              })}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
