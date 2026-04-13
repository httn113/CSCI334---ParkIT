import './Overview.css';
import './ParkingSpots.css';
import './Bookings.css';

export default function Bookings() {
  // TODO: Replace with DB fetch → /api/bookings/stats
  // Expected shape: { total, active, completed, expired }
  const MOCK_ROW_COUNT = 10;
  const bookingStats = { total: MOCK_ROW_COUNT, active: 0, completed: 0, expired: 0 };

  return (
    <div className="bookings-page">

      {/* ── Stat Cards ───────────────────────────────────────────────── */}
      <div className="stat-cards">

        {/* Total Booking ── fetch: bookingStats.total */}
        <div className="stat-card stat-card--bk-total">
          <span className="stat-label">Total Booking</span>
          <span className="stat-value">{bookingStats.total}</span>
        </div>

        {/* Active ── fetch: bookingStats.active */}
        <div className="stat-card stat-card--bk-active">
          <span className="stat-label">Active</span>
          <span className="stat-value">{bookingStats.active}</span>
        </div>

        {/* Completed ── fetch: bookingStats.completed */}
        <div className="stat-card stat-card--bk-completed">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{bookingStats.completed}</span>
        </div>

        {/* Expired ── fetch: bookingStats.expired */}
        <div className="stat-card stat-card--bk-expired">
          <span className="stat-label">Expired</span>
          <span className="stat-value">{bookingStats.expired}</span>
        </div>

      </div>

      {/* ── Search / Filter Card ──────────────────────────────────────── */}
      <div className="ps-filter-card">
        <input
          className="ps-search"
          type="text"
          placeholder="Search bookings..."
        />

        {/* TODO: wire value to filter state when DB is connected */}
        <select className="ps-select" defaultValue="all-status">
          <option value="all-status">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>

        {/* TODO: populate with real spot IDs from DB */}
        <select className="ps-select" defaultValue="all-spots">
          <option value="all-spots">All Spots</option>
          <option value="zone-a">Zone A</option>
          <option value="zone-b">Zone B</option>
          <option value="zone-c">Zone C</option>
          <option value="zone-d">Zone D</option>
        </select>
      </div>

      {/* ── Bookings Table ────────────────────────────────────────────── */}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* TODO: Replace with real booking rows fetched from DB */}
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}>
                <td>#BK-0001</td>
                <td>A-001</td>
                <td>Toyota Camry</td>
                <td>2026-04-03 08:00</td>
                <td>2026-04-03 10:00</td>
                <td>2h 00m</td>
                <td>
                  <span className="ps-badge ps-badge--active">Active</span>
                </td>
                <td>—</td>{/* TODO: wire Actions (View / Cancel) when DB is connected */}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ps-table-footer">
          <span className="ps-table-info">
            Showing {MOCK_ROW_COUNT} of {bookingStats.total} Bookings
          </span>
          <div className="ps-pagination">
            {/* TODO: wire Previous/Next to pagination state when DB is connected */}
            <button className="ps-page-btn" type="button">Previous</button>
            <button className="ps-page-btn" type="button">Next</button>
          </div>
        </div>
      </div>

    </div>
  );
}
