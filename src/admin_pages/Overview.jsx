import { useEffect, useState } from 'react';
import './Overview.css';


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

    </div>
  );
}
