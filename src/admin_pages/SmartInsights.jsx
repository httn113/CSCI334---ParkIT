import { useEffect, useState, useRef } from "react";
import SectionTitle from "../components/SectionTitle";
import GlassCard from "../components/GlassCard";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import "./SmartInsights.css";

const ENDPOINT = import.meta.env.VITE_API_URL;


// ─── small helpers ───────────────────────────────────────────────────────────
function Badge({ children, variant = "default" }) {
  return <span className={`si-badge si-badge--${variant}`}>{children}</span>;
}

function RetrainButton({ onRetrain, loading }) {
  return (
    <button
      className={`si-retrain-btn${loading ? " si-retrain-btn--loading" : ""}`}
      onClick={onRetrain}
      disabled={loading}
      aria-label="Retrain prediction model"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={loading ? "si-spin" : ""}
        aria-hidden="true"
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
      {loading ? "Retraining…" : "Retrain Model"}
    </button>
  );
}

// ─── chart colours (match existing blue theme) ───────────────────────────────
const CHART_COLORS = {
  predicted: { line: "#3b7de8", fill: "rgba(59,125,232,0.15)", point: "#3b7de8" },
  current: { line: "#4ade80", fill: "rgba(74,222,128,0.12)", point: "#4ade80" },
  grid: "rgba(59,125,232,0.12)",
  text: "#7a8aaa",
};

// ─── bar chart drawn on canvas ────────────────────────────────────────────────
function OccupancyChart({ predictions, currentHour }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!predictions.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const padL = 44, padR = 12, padT = 16, padB = 48;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const maxVal = Math.max(...predictions.map(p => p.total_slots), 1);
    const barW = chartW / predictions.length;

    ctx.clearRect(0, 0, W, H);

    // grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (i / 4) * chartH;
      ctx.beginPath();
      ctx.strokeStyle = CHART_COLORS.grid;
      ctx.lineWidth = 1;
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();
      ctx.fillStyle = CHART_COLORS.text;
      ctx.font = "10px system-ui";
      ctx.textAlign = "right";
      ctx.fillText(Math.round((i / 4) * maxVal), padL - 6, y + 3);
    }

    // bars
    predictions.forEach((p, i) => {
      const x = padL + i * barW;
      const isPast = i < currentHour;
      const isNow = i === currentHour;

      // predicted (full bar, muted)
      const predH = (p.predicted_occupied / maxVal) * chartH;
      ctx.fillStyle = isPast || isNow
        ? "rgba(59,125,232,0.18)"
        : "rgba(59,125,232,0.32)";
      ctx.fillRect(x + 2, padT + chartH - predH, barW - 4, predH);

      // current (available overlay — only for past/now)
      if (isPast || isNow) {
        const avH = (p.predicted_available / maxVal) * chartH;
        ctx.fillStyle = isNow
          ? "rgba(74,222,128,0.55)"
          : "rgba(74,222,128,0.28)";
        ctx.fillRect(x + 2, padT + chartH - avH, barW - 4, avH);
      }

      // "now" marker
      if (isNow) {
        ctx.beginPath();
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.moveTo(x + barW / 2, padT);
        ctx.lineTo(x + barW / 2, padT + chartH);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // x-axis labels (every 3 hours)
      if (i % 3 === 0) {
        ctx.fillStyle = CHART_COLORS.text;
        ctx.font = "10px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(p.label, x + barW / 2, padT + chartH + 16);
      }
    });

    // axis line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(59,125,232,0.25)";
    ctx.lineWidth = 1;
    ctx.moveTo(padL, padT + chartH);
    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.stroke();
  }, [predictions, currentHour]);

  return (
    <canvas
      ref={canvasRef}
      className="si-canvas"
      role="img"
      aria-label="24-hour occupancy prediction chart showing predicted occupied and available parking spots"
    />
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function SmartInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState(null);

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ENDPOINT}/admin/analytics/predict`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },  
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg(null);
    try {
      const res = await fetch(`${ENDPOINT}/admin/analytics/predict/retrain`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        }
      });
      const json = await res.json();
      setRetrainMsg({ ok: res.ok, text: json.message });
      if (res.ok) await fetchPredictions();
    } catch (e) {
      setRetrainMsg({ ok: false, text: "Request failed" });
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => { fetchPredictions(); }, []);

  // derive stats
  const currentHour = 0;
  const now = data?.predictions?.[0];
  const peak = data?.predictions?.reduce(
    (best, p) => (p.predicted_occupied > (best?.predicted_occupied ?? -1) ? p : best),
    null
  );
  const totalSlots = now?.total_slots ?? 0;
  const suffix = data?.sufficient_data ? "" : " (est.)";

  return (
    <div className="si-page">
      {/* ── header row ───────────────────────────────────────── */}
      <div className="si-header">
        <SectionTitle
          title="Smart Insights"
          subtitle="ML-powered 24-hour occupancy forecast"
        />
        <div className="si-header-actions">
          {retrainMsg && (
            <span className={`si-retrain-msg${retrainMsg.ok ? "" : " si-retrain-msg--err"}`}>
              {retrainMsg.text}
            </span>
          )}
          <RetrainButton onRetrain={handleRetrain} loading={retraining} />
        </div>
      </div>

      {/* ── model meta ───────────────────────────────────────── */}
      {data && (
        <div className="si-meta">
          <Badge variant={data.sufficient_data ? "success" : "warn"}>
            {data.sufficient_data ? "Model ready" : "Insufficient data"}
          </Badge>
          {data.model_trained_at && (
            <span className="si-meta-text">
              Last trained:{" "}
              {new Date(data.model_trained_at).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          )}
        </div>
      )}

      {/* ── stat strip ───────────────────────────────────────── */}
      {data && (
        <div className="si-stats-row">
          <div className="glass-card si-stat-wrap">
            <StatCard
              label="Occupied now"
              value={now ? `${now.predicted_occupied}${suffix}` : "—"}
              className="available"
            />
          </div>
          <div className="glass-card si-stat-wrap">
            <StatCard
              label="Available now"
              value={now ? `${now.predicted_available}${suffix}` : "—"}
              className="available"
            />
          </div>
          <div className="glass-card si-stat-wrap">
            <StatCard label="Total slots" value={totalSlots || "—"} />
          </div>
          <div className="glass-card si-stat-wrap">
            <StatCard
              label="Peak hour (predicted)"
              value={peak ? peak.label : "—"}
            />
          </div>
        </div>
      )}

      {/* ── chart ────────────────────────────────────────────── */}
      <div className="glass-card si-chart-card">
        <div className="si-chart-header">
          <p className="si-chart-title">24-hour occupancy forecast</p>
          <div className="si-legend">
            <span className="si-legend-item">
              <span className="si-legend-dot si-legend-dot--pred" />
              Predicted occupied
            </span>
            <span className="si-legend-item">
              <span className="si-legend-dot si-legend-dot--avail" />
              Available (past / now)
            </span>
            <span className="si-legend-item">
              <span className="si-legend-dot si-legend-dot--now" />
              Current hour
            </span>
          </div>
        </div>

        {loading && (
          <div className="si-chart-loader">
            <div className="si-spinner" />
            <span>Loading predictions…</span>
          </div>
        )}

        {error && !loading && (
          <EmptyState
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            }
            title="Could not load predictions"
            body={error}
          />
        )}

        {!loading && !error && data && !data.sufficient_data && (
          <EmptyState
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <polyline points="18 9 12 15 9 12 3 18" />
              </svg>
            }
            title="Not enough data yet"
            body="The model needs at least 5 occupancy log entries to make predictions. Check back once more parking activity has been recorded."
          />
        )}

        {!loading && !error && data?.sufficient_data && (
          <div className="si-canvas-wrap">
            <OccupancyChart
              predictions={data.predictions}
              currentHour={currentHour}
            />
          </div>
        )}
      </div>

      {/* ── hourly table ─────────────────────────────────────── */}
      {!loading && !error && data?.sufficient_data && (
        <div className="glass-card si-table-card">
          <p className="si-chart-title" style={{ padding: "20px 24px 0" }}>
            Hourly breakdown
          </p>
          <div className="si-table-wrap">
            <table className="si-table">
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Predicted occupied</th>
                  <th>Predicted available</th>
                  <th>Total</th>
                  <th>Occupancy %</th>
                </tr>
              </thead>
              <tbody>
                {data.predictions.map((p, i) => {
                  const pct = p.total_slots
                    ? Math.round((p.predicted_occupied / p.total_slots) * 100)
                    : 0;
                  const isNow = i === currentHour;
                  return (
                    <tr key={i} className={isNow ? "si-table-row--now" : ""}>
                      <td>
                        {p.label}
                        {isNow && <Badge variant="info">now</Badge>}
                      </td>
                      <td>{p.predicted_occupied}</td>
                      <td>{p.predicted_available}</td>
                      <td>{p.total_slots}</td>
                      <td>
                        <div className="si-pct-bar-wrap">
                          <div
                            className="si-pct-bar"
                            style={{
                              width: `${pct}%`,
                              background:
                                pct > 80
                                  ? "#f87171"
                                  : pct > 50
                                    ? "#fbbf24"
                                    : "#4ade80",
                            }}
                          />
                          <span>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}