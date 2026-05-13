import { useState, useEffect } from 'react';
import './Overview.css';
import './ParkingSpots.css';
import './Bookings.css';

const ENDPOINT = import.meta.env.VITE_API_URL;

export default function Bookings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all-status');
  const [zoneFilter, setZoneFilter] = useState('all-spots');

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(`${ENDPOINT}/admin/analytics/bookings/list`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          },
        });
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  if (loading) return <div className="loading">Loading bookings...</div>;
  if (!data) return null;

  // Filter Logic
  const filteredBookings = data.bookings.filter((b) => {
    const matchesSearch = b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all-status' || b.status.toLowerCase() === statusFilter;
    const matchesZone = zoneFilter === 'all-spots' || b.zone.toLowerCase() === zoneFilter.replace('zone-', '');

    return matchesSearch && matchesStatus && matchesZone;
  });

  return (
    <div className="bookings-page">
      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-card--bk-total">
          <span className="stat-label">Total Booking</span>
          <span className="stat-value">{data.stats.total}</span>
        </div>
        <div className="stat-card stat-card--bk-active">
          <span className="stat-label">Active</span>
          <span className="stat-value">{data.stats.active}</span>
        </div>
        <div className="stat-card stat-card--bk-completed">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{data.stats.completed}</span>
        </div>
        <div className="stat-card stat-card--bk-expired">
          <span className="stat-label">Expired</span>
          <span className="stat-value">{data.stats.expired}</span>
        </div>
      </div>

      {/* Filter Card */}
      <div className="ps-filter-card">
        <input
          className="ps-search"
          type="text"
          placeholder="Search ID or Plate..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="ps-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all-status">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>
        <select className="ps-select" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
          <option value="all-spots">All Zones</option>
          <option value="zone-a">Zone A</option>
          <option value="zone-b">Zone B</option>
          <option value="zone-c">Zone C</option>
          <option value="zone-d">Zone D</option>
        </select>
      </div>

      {/* Table */}
      <div className="ps-table-card">
        <table className="ps-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Spot</th>
              <th>Vehicle</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
              <th>Status</th>
              {/* <th>Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((b, i) => (
              <tr key={i}>
                <td>{b.id}</td>
                <td>{b.spot}</td>
                <td>{b.vehicle}</td>
                <td>{b.start}</td>
                <td>{b.end}</td>
                <td>{b.duration}</td>
                <td>
                  <span className={`ps-badge ps-badge--${b.status.toLowerCase()}`}>
                    {b.status}
                  </span>
                </td>
                {/* <td><button className="action-link">View</button></td> */}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ps-table-footer">
          <span className="ps-table-info">
            Showing {filteredBookings.length} of {data.stats.total} Bookings
          </span>
        </div>
      </div>
    </div>
  );
}