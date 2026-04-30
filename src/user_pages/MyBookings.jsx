import { useState, useEffect } from 'react';
import './MyBookings.css';
import SectionTitle from '../components/SectionTitle';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';

const ENDPOINT = import.meta.env.VITE_API_URL;

const MapIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const BookIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

function formatTime(date) {
  if (!date) return '—';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function BookingCard({ booking, now }) {
  const licensePlate = booking.licensePlate ?? '—';
  const brand = booking.brand ?? '—';
  const model = booking.model ?? '—';
  const zoneName = booking.zoneName ?? '—';
  const zoneNumber = booking.zoneNumber ?? '—';
  const spotLabel =
    zoneName !== '—' && zoneNumber !== '—'
      ? `${zoneName}${String(zoneNumber).padStart(3, '0')}`
      : '—';

  const startTime = booking.timeStart ? new Date(booking.timeStart) : null;
  const endTime = booking.timeEnd ? new Date(booking.timeEnd) : null;

  // Status logic:
  // - "Upcoming"  : now < startTime
  // - "Active"    : startTime <= now < endTime
  const isActive = startTime && endTime && now >= startTime && now < endTime;
  const isUpcoming = startTime && now < startTime;

  // For Upcoming: show countdown to start; for Active: show countdown to end
  const countdownTarget = isActive ? endTime : isUpcoming ? startTime : null;
  const diffMs = countdownTarget ? Math.max(0, countdownTarget - now) : 0;
  const countdown = {
    hours: Math.floor(diffMs / 3_600_000),
    minutes: Math.floor((diffMs % 3_600_000) / 60_000),
  };

  const statusLabel = isActive ? 'Active' : isUpcoming ? 'Upcoming' : '—';
  const statusClass = isActive ? 'status-ready' : 'status-upcoming';
  const countdownLabel = isActive ? 'Time Remaining' : 'Starts In';

  // Show date only when start/end are on different dates or not today
  const today = now.toDateString();
  const startDateStr = startTime ? (startTime.toDateString() === today ? '' : formatDate(startTime)) : '—';
  const endDateStr = endTime ? (endTime.toDateString() === today ? '' : formatDate(endTime)) : '—';

  const startDisplay = startTime
    ? startDateStr ? `${startDateStr}, ${formatTime(startTime)}` : formatTime(startTime)
    : '—';
  const endDisplay = endTime
    ? endDateStr ? `${endDateStr}, ${formatTime(endTime)}` : formatTime(endTime)
    : '—';

  return (
    <GlassCard className="booking-card">
      <div className="booking-header">
        <div className="booking-spot-badge">{spotLabel}</div>
        <div className="booking-spot-meta">
          <span className="booking-spot-label">Your Assigned Spot</span>
          <span className="booking-zone">Zone&nbsp;<strong>{zoneName}</strong></span>
        </div>
        <span className={`booking-status-pill ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="booking-divider" />

      <div className="booking-details">
        <div className="booking-detail-item">
          <span className="booking-detail-label">{countdownLabel}</span>
          <span className="booking-detail-value timer">
            {countdown.hours}H&nbsp;{String(countdown.minutes).padStart(2, '0')}M
          </span>
        </div>
        <div className="booking-detail-item">
          <span className="booking-detail-label">Start Time</span>
          <span className="booking-detail-value">{startDisplay}</span>
        </div>
        <div className="booking-detail-item">
          <span className="booking-detail-label">End Time</span>
          <span className="booking-detail-value">{endDisplay}</span>
        </div>
        <div className="booking-detail-item">
          <span className="booking-detail-label">License Plate</span>
          <span className="booking-detail-value plate">{licensePlate}</span>
        </div>
        <div className="booking-detail-item">
          <span className="booking-detail-label">Vehicle</span>
          <span className="booking-detail-value">{brand} {model}</span>
        </div>
      </div>
    </GlassCard>
  );
}

export default function MyBookings() {
  const [now, setNow] = useState(new Date());
  const [user, setUser] = useState('');
  const [activeBookings, setActiveBookings] = useState([]);

  // Fetch active bookings
  useEffect(() => {
    async function fetchActiveBookings() {
      try {
        const res = await fetch(`${ENDPOINT}/protected/myBooking/showBooking`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setUser(data.userName);
        // Include both upcoming and currently active bookings (anything that hasn't ended)
        const active = data.bookings.filter(b => new Date(b.timeEnd) > new Date());
        setActiveBookings(active);
      } catch (err) {
        console.error(err);
      }
    }
    fetchActiveBookings();
  }, []);

  // Clock ticker
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const hasActiveBookings = activeBookings.length > 0;

  return (
    <div className="bookings-page">

      {/* ── Welcome heading ── */}
      <h2 className="bookings-welcome">
        Welcome Back, <span className="bookings-username">{user || 'User'}</span>
      </h2>
      <p className="bookings-datetime">{dayName}, {dateStr} · {timeStr}</p>

      {/* ── Active bookings ── */}
      <SectionTitle>
        Active Bookings
        {hasActiveBookings && (
          <span className="booking-count-badge">{activeBookings.length}</span>
        )}
      </SectionTitle>

      {hasActiveBookings ? (
        activeBookings.map(booking => (
          <BookingCard key={booking.bookingId} booking={booking} now={now} />
        ))
      ) : (
        <GlassCard className="booking-card">
          <p style={{ textAlign: 'center', opacity: 0.6, padding: '1rem 0' }}>No active bookings.</p>
        </GlassCard>
      )}

      {/* ── Spot info cards ── */}
      <SectionTitle style={{ marginTop: 28 }}>Parking Overview</SectionTitle>
      <div className="spot-cards-row">
        <StatCard label="Available Spots" value={10} colorClass="available" />
        <StatCard label="Visitor Spots" value={5} />
      </div>

      {/* ── Quick Actions ── */}
      <SectionTitle style={{ marginTop: 28 }}>Quick Actions</SectionTitle>
      <div className="quick-actions-col">
        <QuickActionCard
          icon={MapIcon}
          iconClassName="map-icon"
          title="View Parking Map"
          subtitle="See all zones &amp; availability"
        />
        <QuickActionCard
          icon={BookIcon}
          iconClassName="book-icon"
          title="Book A Spot"
          subtitle="Reserve your parking space"
          accent
        />
      </div>

      {/* ── Notifications ── */}
      <SectionTitle style={{ marginTop: 28 }}>Notifications</SectionTitle>
      <div className="notification-card peak-alert">
        <div className="notif-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div className="notif-text">
          <span className="notif-title">Peak Hour Alert</span>
          <span className="notif-body">Parking availability will be low between 6–8 PM today.</span>
        </div>
      </div>

    </div>
  );
}