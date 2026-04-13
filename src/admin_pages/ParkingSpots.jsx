import './Overview.css';
import './ParkingSpots.css';

export default function ParkingSpots() {
  const stats = {
    totalSpots: 120,
    occupied: 85,
    available: 25,
    reserved: 10,
  };

  return (
    <div className="parking-spots-page">

      <div className="stat-cards">
        <div className="stat-card stat-card--total">
          <span className="stat-label">Total Spots</span>
          <span className="stat-value">{stats.totalSpots}</span>
        </div>

        <div className="stat-card stat-card--occupied">
          <span className="stat-label">Occupied</span>
          <span className="stat-value">{stats.occupied}</span>
        </div>

        <div className="stat-card stat-card--available">
          <span className="stat-label">Available</span>
          <span className="stat-value">{stats.available}</span>
        </div>

        <div className="stat-card stat-card--reserved">
          <span className="stat-label">Reserved</span>
          <span className="stat-value">{stats.reserved}</span>
        </div>
      </div>

      <div className="ps-filter-card">
        <input
          className="ps-search"
          type="text"
          placeholder="Search spots..."
        />

        <select className="ps-select" defaultValue="all-status">
          <option value="all-status">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="maintenance">Maintenance</option>
        </select>

        <select className="ps-select" defaultValue="all-zone">
          <option value="all-zone">All Zone</option>
          <option value="zone-a">Zone A</option>
          <option value="zone-b">Zone B</option>
          <option value="zone-c">Zone C</option>
          <option value="zone-d">Zone D</option>
        </select>
      </div>

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
            {Array.from({ length: 20 }).map((_, i) => (
              <tr key={i}>
                <td>A-001</td>
                <td>Regular</td>
                <td><span className="ps-badge ps-badge--available">Available</span></td>
                <td>—</td>
                <td>—</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ps-table-footer">
          <span className="ps-table-info">Showing 20 of {stats.totalSpots} Spots</span>
          <div className="ps-pagination">
            <button className="ps-page-btn" type="button">Previous</button>
            <button className="ps-page-btn" type="button">Next</button>
          </div>
        </div>
      </div>

    </div>
  );
}
