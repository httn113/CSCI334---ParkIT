import { useEffect, useRef, useState } from 'react';
import './Overview.css';

const ENDPOINT = import.meta.env.VITE_API_URL;

function get(path) {
  return fetch(`${ENDPOINT}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
  })
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);
}

function PeakChart({ data, busiest }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || !ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: 'bar',
      data: {
        labels: data.map(h => `${h.hour}h`),
        datasets: [{
          data: data.map(h => h.count),
          backgroundColor: data.map(h => h.hour === busiest ? '#378ADD' : '#B5D4F4'),
          borderRadius: 2,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 }, autoSkip: true, maxTicksLimit: 8 } },
          y: { ticks: { font: { size: 10 } }, beginAtZero: true },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, busiest]);

  return (
    <div style={{ position: 'relative', height: 180 }}>
      <canvas ref={ref} role="img" aria-label="Bar chart of occupancy count by hour of day" />
    </div>
  );
}

function TrendChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || !ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          data: data.map(d => d.count),
          borderColor: '#378ADD',
          backgroundColor: 'rgba(55,138,221,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 }, autoSkip: true, maxTicksLimit: 6 } },
          y: { ticks: { font: { size: 10 } }, beginAtZero: true },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <div style={{ position: 'relative', height: 180 }}>
      <canvas ref={ref} role="img" aria-label="Line chart of daily occupancy count" />
    </div>
  );
}

const badgeClass = {
  'Vehicle Entered': 'activity-badge--entered',
  'Booking Created': 'activity-badge--created',
  'Vehicle Exited': 'activity-badge--exited',
  'Booking Expired': 'activity-badge--expired',
};

const pillStyle = (status) => {
  const map = {
    Active: { background: '#E1F5EE', color: '#0F6E56' },
    Upcoming: { background: '#E6F1FB', color: '#185FA5' },
    Completed: { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' },
  };
  return {
    display: 'inline-block', padding: '2px 8px',
    borderRadius: 99, fontSize: 11, fontWeight: 500,
    ...(map[status] || map.Completed),
  };
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [peak, setPeak] = useState(null);
  const [util, setUtil] = useState(null);
  const [trend, setTrend] = useState(null);
  const [activity, setActivity] = useState([]);
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    if (!window.Chart) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    async function loadAll() {
      const [s, p, u, t, a, b] = await Promise.all([
        get('/admin/analytics/slotStatus'),
        get('/admin/analytics/peakHours'),
        get('/admin/utilisation'),
        get('/admin/analytics/trends'),
        get('/admin/analytics/recent-activity?limit=8'),
        get('/admin/analytics/bookings/list'),
      ]);
      if (s) setStats(s);
      if (p) setPeak(p);
      if (u) setUtil(u);
      if (t) setTrend(t);
      if (a) setActivity(a.activities || []);
      if (b) setBookings(b);
    }

    loadAll();
    const id = setInterval(loadAll, 30_000);
    return () => clearInterval(id);
  }, []);

  const maxUtil = Math.max(...(util?.utilisation || []).map(z => z.utilisation_rate), 1);

  return (
    <div className="overview-page">

      {/* ── Slot status — reuses stat-card classes from Overview.css ── */}
      <div className="stat-cards">
        <div className="stat-card stat-card--total">
          <span className="stat-label">Total capacity</span>
          <span className="stat-value">{stats?.total_capacity ?? '—'}</span>
        </div>
        <div className="stat-card stat-card--occupied">
          <span className="stat-label">Occupied</span>
          <span className="stat-value">{stats?.occupied ?? '—'}</span>
        </div>
        <div className="stat-card stat-card--available">
          <span className="stat-label">Available</span>
          <span className="stat-value">{stats?.available ?? '—'}</span>
        </div>
        <div className="stat-card stat-card--reserved">
          <span className="stat-label">Reserved</span>
          <span className="stat-value">{stats?.reserved ?? '—'}</span>
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.5rem' }}>
        <div className="recent-activity" style={{ marginBottom: 0 }}>
          <h2 className="recent-activity__title">Peak hours</h2>
          <PeakChart data={peak?.hours_detail} busiest={peak?.busiest_hour} />
        </div>
        <div className="recent-activity" style={{ marginBottom: 0 }}>
          <h2 className="recent-activity__title">Occupancy trend</h2>
          <TrendChart data={trend?.trends} />
        </div>
      </div>

      {/* ── Zone utilisation + Recent activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.5rem' }}>
        <div className="recent-activity" style={{ marginBottom: 0 }}>
          <h2 className="recent-activity__title">Zone utilisation</h2>
          {(util?.utilisation || []).map(z => (
            <div key={z.zone} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '0.5px solid var(--color-border-tertiary)',
              fontSize: 13,
            }}>
              <span style={{ width: 24, fontWeight: 500 }}>{z.zone}</span>
              <div style={{ flex: 1, height: 6, background: 'var(--color-border-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, background: '#378ADD',
                  width: `${(z.utilisation_rate / maxUtil * 100).toFixed(1)}%`,
                }} />
              </div>
              <span style={{ width: 38, textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                {z.utilisation_rate}%
              </span>
            </div>
          ))}
        </div>

        {/* Reuses activity-list / activity-item / activity-badge from Overview.css */}
        <div className="recent-activity" style={{ marginBottom: 0 }}>
          <h2 className="recent-activity__title">Recent activity</h2>
          <div className="activity-list">
            {activity.map(item => (
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

      {/* ── Bookings list ── */}
      <div className="recent-activity">
        <h2 className="recent-activity__title">
          Bookings
          {bookings?.stats && (
            <span style={{ fontWeight: 400, fontSize: 13, marginLeft: 12, color: 'var(--color-text-secondary)' }}>
              Total {bookings.stats.total} · Active {bookings.stats.active} · Upcoming {bookings.stats.upcoming} · Completed {bookings.stats.completed}
            </span>
          )}
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['ID', 'Spot', 'Vehicle', 'Start', 'End', 'Duration', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '6px 8px', fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                    borderBottom: '0.5px solid var(--color-border-tertiary)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(bookings?.bookings || []).map(b => (
                <tr key={b.id}>
                  <td style={{ padding: '8px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)' }}>{b.id}</td>
                  <td style={{ padding: '8px', borderBottom: '0.5px solid var(--color-border-tertiary)', fontWeight: 500 }}>{b.spot}</td>
                  <td style={{ padding: '8px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{b.vehicle}</td>
                  <td style={{ padding: '8px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{b.start}</td>
                  <td style={{ padding: '8px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{b.end}</td>
                  <td style={{ padding: '8px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{b.duration}</td>
                  <td style={{ padding: '8px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <span style={pillStyle(b.status)}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}