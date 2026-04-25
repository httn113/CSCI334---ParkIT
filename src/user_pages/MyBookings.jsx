import { useState, useEffect } from 'react';
import './MyBookings.css';
import SectionTitle from '../components/SectionTitle';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';

// TODO: Replace mock data with real user/booking data from backend
const MOCK_USER = 'User';

const MOCK_BOOKING = {
  spot: 'A1',
  zone: 'A',
  endTime: new Date(Date.now() + 90 * 60_000).toISOString(),
  licensePlate: 'ABC-1234',
  brand: 'Mercedes C200',
  status: 'Ready To Park',
};

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

export default function MyBookings() {
  const { spot, zone, endTime, licensePlate, brand, status } = MOCK_BOOKING;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const diffMs = Math.max(0, new Date(endTime) - now);
  const timeRemaining = {
    hours: Math.floor(diffMs / 3_600_000),
    minutes: Math.floor((diffMs % 3_600_000) / 60_000),
  };

  return (
    <div className="bookings-page">

      {/* ── Welcome heading ── */}
      <h2 className="bookings-welcome">
        Welcome Back, <span className="bookings-username">{MOCK_USER}</span>
      </h2>
      <p className="bookings-datetime">{dayName}, {dateStr} · {timeStr}</p>

      {/* ── Active booking card ── */}
      <SectionTitle>Active Booking</SectionTitle>
      <GlassCard className="booking-card">

        {/* Spot + Zone */}
        <div className="booking-header">
          <div className="booking-spot-badge">{spot}</div>
          <div className="booking-spot-meta">
            {/* TODO: Replace with real spot name from backend */}
            <span className="booking-spot-label">Your Assigned Spot</span>
            <span className="booking-zone">Zone&nbsp;<strong>{zone}</strong></span>
          </div>
          <span className={`booking-status-pill ${status === 'Ready To Park' ? 'status-ready' : ''}`}>
            {status}
          </span>
        </div>

        <div className="booking-divider" />

        {/* Details grid */}
        <div className="booking-details">

          <div className="booking-detail-item">
            <span className="booking-detail-label">Time Remaining</span>
            <span className="booking-detail-value timer">
              {timeRemaining.hours}H&nbsp;{String(timeRemaining.minutes).padStart(2, '0')}M
            </span>
          </div>

          <div className="booking-detail-item">
            <span className="booking-detail-label">License Plate</span>
            <span className="booking-detail-value plate">{licensePlate}</span>
          </div>

          <div className="booking-detail-item">
            <span className="booking-detail-label">Brand</span>
            <span className="booking-detail-value">{brand}</span>
          </div>

        </div>
      </GlassCard>

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
