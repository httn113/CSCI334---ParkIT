import { useEffect, useState } from 'react';
import './Overview.css';
import Modal from '../components/Modal.jsx';

const ENDPOINT = import.meta.env.VITE_API_URL;


export default function Overview() {
  // TODO: Replace this hardcoded object with a database fetch.
  // Example: const [stats, setStats] = useState(null);
  //          useEffect(() => { fetch('/api/parking/stats').then(r => r.json()).then(setStats); }, []);
  // Expected response shape: { totalCapacity, occupied, available, reserved }
  // const stats = {
  //   totalCapacity: 120, // Total number of parking spots in the lot
  //   occupied: 85,       // Spots currently occupied by a vehicle
  //   available: 25,      // Spots currently free and open for use
  //   reserved: 10,       // Spots pre-booked / held by a reservation
  // };

  const [stats, setStats] = useState({
    totalCapacity: null, // Total number of parking spots in the lot
    occupied: null,       // Spots currently occupied by a vehicle
    available: null,      // Spots currently free and open for use
    reserved: null,       // Spots pre-booked / held by a reservation
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${ENDPOINT}/admin/analytics/slotStatus`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          },
        });
        if (!res.ok) {
          const err = await res.json();
          console.log("Error response:", err);
          return;
        }
        const data = await res.json();
        console.log(data);
        setStats(data)
      }
      catch (err) {
        console.log(err);
      }
    }

    // Fetch immediately
    fetchStats();

    // Then fetch every 5 seconds for real-time updates
    const interval = setInterval(fetchStats, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [])

  // TODO: Replace with a real-time fetch → /api/activity/recent (returns last N events, sorted newest-first)
  // useEffect(() => { fetch('/api/activity/recent').then(r => r.json()).then(setRecentActivities); }, []);
  // Expected shape per item: { id, type, plate, vehicle, time }
  // type values: 'Vehicle Entered' | 'Booking Created' | 'Vehicle Exited' | 'Booking Expired'
  // const recentActivities = [
  //   { id: 1, type: 'Vehicle Entered',  plate: 'ABC-1234', vehicle: 'Toyota Camry',  time: '10:32 AM' }, // TODO: replace with DB data
  //   { id: 2, type: 'Booking Created',  plate: 'XYZ-5678', vehicle: 'Mercedes C300', time: '10:28 AM' }, // TODO: replace with DB data
  //   { id: 3, type: 'Vehicle Exited',   plate: 'DEF-9012', vehicle: 'BMW X7',        time: '10:21 AM' }, // TODO: replace with DB data
  //   { id: 4, type: 'Booking Expired',  plate: 'GHI-3456', vehicle: 'Nissan GT-R',   time: '10:15 AM' }, // TODO: replace with DB data
  // ];

  const [recentActivities, setRecentActivities] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setError] = useState(null);
  const [seedSuccess, setSeedSuccess] = useState(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`${ENDPOINT}/admin/analytics/recent-activity?limit=50`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        setRecentActivities(data.activities);
      } catch (err) {
        console.log(err);
      }
    }
    fetchActivity();
  }, []);

  // Maps activity type → CSS modifier class for the coloured badge
  const badgeClass = {
    'Vehicle Entered':  'activity-badge--entered',  // Blue
    'Booking Created':  'activity-badge--created',  // Yellow
    'Vehicle Exited':   'activity-badge--exited',   // Red
    'Booking Expired':  'activity-badge--expired',  // Orange
  };

  const handleSeedClick = async () => {
    setSeeding(true);
    setError(null);
    setSeedSuccess(null);

    try {
      const res = await fetch(`${ENDPOINT}/admin/seed`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json"
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Seeding failed");
        return;
      }

      const data = await res.json();
      setSeedSuccess("✓ Database seeded successfully! Refreshing data...");
      setShowSeedConfirm(false);

      // Refresh stats after seeding
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err.message || "Network error during seeding");
    } finally {
      setSeeding(false);
    }
  };


  return (
    <div className="overview-page">
      <div className="stat-cards">

        {/* Total Capacity ── fetch: stats.totalCapacity */}
        <div className="stat-card stat-card--total">
          <span className="stat-label">Total Capacity</span>
          <span className="stat-value">{stats.total_capacity}</span>
        </div>

        {/* Occupied ── fetch: stats.occupied */}
        <div className="stat-card stat-card--occupied">
          <span className="stat-label">Occupied</span>
          <span className="stat-value">{stats.occupied}</span>
        </div>

        {/* Available ── fetch: stats.available */}
        <div className="stat-card stat-card--available">
          <span className="stat-label">Available</span>
          <span className="stat-value">{stats.available}</span>
        </div>

        {/* Reserved ── fetch: stats.reserved */}
        <div className="stat-card stat-card--reserved">
          <span className="stat-label">Reserved</span>
          <span className="stat-value">{stats.reserved}</span>
        </div>

      </div>

      {/* ── Recent Activity ─────────────────────────────────────────────
          TODO: swap recentActivities mock array above with a live DB fetch
          ──────────────────────────────────────────────────────────────── */}
      <div className="recent-activity">
        <h2 className="recent-activity__title">Recent Activity</h2>
        <div className="activity-list">
          {recentActivities.map((item) => (
            <div className="activity-item" key={item.id}>
              <span className={`activity-badge ${badgeClass[item.type] || ''}`}>
                {item.type}
              </span>
              <div className="activity-details">
                <span className="activity-plate">{item.plate}</span>
                <span className="activity-vehicle">{item.vehicle}</span>
              </div>
              <span className="activity-time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Seed Data Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowSeedConfirm(true)}
          disabled={seeding}
          style={{
            padding: '10px 16px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: seeding ? 'not-allowed' : 'pointer',
            opacity: seeding ? 0.6 : 1,
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          {seeding ? 'Seeding...' : '🌱 Generate Test Data'}
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        title="Generate Test Data"
        open={showSeedConfirm}
        onClose={() => !seeding && setShowSeedConfirm(false)}
      >
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#f08080', marginBottom: '12px', fontWeight: 600 }}>
            ⚠️ This will delete all existing data!
          </p>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            The system will generate:
          </p>
          <ul style={{ marginBottom: '20px', color: '#666' }}>
            <li>✓ 5 parking zones (A-E) with 100 total spots</li>
            <li>✓ 100 test users with vehicles</li>
            <li>✓ 300 sample bookings</li>
            <li>✓ 500+ occupancy logs</li>
            <li>✓ AI model trained</li>
          </ul>

          {seedError && (
            <div style={{
              backgroundColor: '#ffe0e0',
              color: '#d32f2f',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              Error: {seedError}
            </div>
          )}

          {seedSuccess && (
            <div style={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              {seedSuccess}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSeedClick}
              disabled={seeding}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: seeding ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: seeding ? 0.6 : 1
              }}
            >
              {seeding ? 'Seeding in progress...' : 'Yes, Generate Data'}
            </button>
            <button
              onClick={() => setShowSeedConfirm(false)}
              disabled={seeding}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#e0e0e0',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: seeding ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: seeding ? 0.6 : 1
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
