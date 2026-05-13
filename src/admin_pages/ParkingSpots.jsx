import { useState, useEffect } from 'react';
import './Overview.css';
import './ParkingSpots.css';

const ENDPOINT = import.meta.env.VITE_API_URL;


export default function ParkingSpots() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all-status');
  const [zoneFilter, setZoneFilter] = useState('all-zone');

  useEffect(() => {
    async function fetchParkingData() {
      try {
        const res = await fetch(`${ENDPOINT}/admin/analytics/slotStatus`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          },
        });

        if (!res.ok) {
          const errData = await res.json();
          console.error("Error response:", errData);
          setLoading(false); // Stop loading even on error
          return;
        }

        const result = await res.json();
        console.log("Success:", result);

        setData(result); // Update state
        setLoading(false); // CRITICAL: This allows the component to render the table
      }
      catch (err) {
        console.error("Fetch error:", err);
        setLoading(false); // Stop loading on network failure
      }
    }
    fetchParkingData();
  }, []);


  if (loading) return <div className="loading">Loading live parking map...</div>;

  // Filter logic for the table
  const filteredSlots = data.slots.filter((slot) => {
    const matchesSearch = slot.spotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.currentVehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all-status' || slot.status.toLowerCase() === statusFilter;
    const matchesZone = zoneFilter === 'all-zone' || slot.zone === zoneFilter.replace('zone-', '').toUpperCase();

    return matchesSearch && matchesStatus && matchesZone;
  });

  return (
    <div className="parking-spots-page">
      {/* 1. Dynamic Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-card--total">
          <span className="stat-label">Total Spots</span>
          <span className="stat-value">{data.total_capacity}</span>
        </div>
        <div className="stat-card stat-card--occupied">
          <span className="stat-label">Occupied</span>
          <span className="stat-value">{data.occupied}</span>
        </div>
        <div className="stat-card stat-card--available">
          <span className="stat-label">Available</span>
          <span className="stat-value">{data.available}</span>
        </div>
        <div className="stat-card stat-card--reserved">
          <span className="stat-label">Reserved</span>
          <span className="stat-value">{data.reserved}</span>
        </div>
      </div>

      {/* 2. Controls */}
      <div className="ps-filter-card">
        <input
          className="ps-search"
          type="text"
          placeholder="Search plate or spot..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="ps-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all-status">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
        </select>

        <select
          className="ps-select"
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
        >
          <option value="all-zone">All Zones</option>
          {Object.keys(data.zone_breakdown).map(zone => (
            <option key={zone} value={`zone-${zone.toLowerCase()}`}>Zone {zone}</option>
          ))}
        </select>
      </div>

      {/* 3. Live Table */}
      <div className="ps-table-card">
        <table className="ps-table">
          <thead>
            <tr>
              <th>Spot Number</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Current Vehicle</th>
            </tr>
          </thead>
          <tbody>
            {filteredSlots.map((slot, i) => (
              <tr key={i}>
                <td>{slot.spotNumber}</td>
                <td>{slot.type}</td>
                <td>
                  <span className={`ps-badge ps-badge--${slot.status.toLowerCase()}`}>
                    {slot.status}
                  </span>
                </td>
                <td>{slot.assignedTo}</td>
                <td>{slot.currentVehicle}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ps-table-footer">
          <span className="ps-table-info">
            Showing {filteredSlots.length} of {data.total_capacity} Spots
          </span>
        </div>
      </div>
    </div>
  );
}