import { useState, useRef } from 'react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import './AICamera.css';

const ENDPOINT = import.meta.env.VITE_API_URL;
const AI_ENDPOINT = import.meta.env.VITE_API_AI_URL;

const MODES = [
  { id: 'entry', label: 'Entry gate' },
  { id: 'exit', label: 'Exit gate' },
  { id: 'slot', label: 'Slot detection' },
];

const MODE_META = {
  entry: {
    title: 'Entry gate detection',
    subtitle: 'Upload a photo of the vehicle at the entry gate. The system will read the plate and grant or deny access.',
    verifyEndpoint: 'auth/parking/entry',
    needsSlot: false,
  },
  exit: {
    title: 'Exit gate detection',
    subtitle: 'Upload a photo of the vehicle at the exit gate. The system will log the departure and mark the booking completed.',
    verifyEndpoint: 'auth/parking/exit',
    needsSlot: false,
  },
  slot: {
    title: 'Slot detection',
    subtitle: 'Upload a photo of a parking slot and enter the slot ID. The system checks whether the vehicle matches the active booking.',
    verifyEndpoint: 'auth/parking/slot',
    needsSlot: true,
  },
};

const RESULT_META = {
  'Access Granted': { tone: 'green', icon: '✓' },
  'Exit Granted': { tone: 'green', icon: '✓' },
  'Correct Parking': { tone: 'green', icon: '✓' },
  'Access Denied': { tone: 'red', icon: '✕' },
  'Exit Denied': { tone: 'red', icon: '✕' },
  'No Car Detected': { tone: 'red', icon: '✕' },
  'No Booking But Car Detected': { tone: 'yellow', icon: '!' },
  'Parking in Wrong Spot': { tone: 'yellow', icon: '!' },
};

// ── SVG icons ────────────────────────────────────────────────────────────────
function IconEntry() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconExit() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconSlot() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

const MODE_ICONS = { entry: <IconEntry />, exit: <IconExit />, slot: <IconSlot /> };

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ preview, onChange }) {
  const ref = useRef(null);
  return (
    <div
      className={`aic-upload-zone${preview ? ' aic-upload-zone--filled' : ''}`}
      onClick={() => ref.current.click()}
    >
      {preview ? (
        <>
          <img src={preview} alt="preview" className="aic-preview-img" />
          <span className="aic-preview-overlay">Click to replace</span>
        </>
      ) : (
        <div className="aic-upload-placeholder">
          <div className="aic-upload-icon-wrap">
            <IconUpload />
          </div>
          <p className="aic-upload-label">Click to upload image</p>
          <p className="aic-upload-hint">JPG, PNG supported</p>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AICamera() {
  const [mode, setMode] = useState('entry');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [slotId, setSlotId] = useState('');
  const [slotError, setSlotError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [detectedPlate, setDetectedPlate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [log, setLog] = useState([]);

  const meta = MODE_META[mode];

  function handleModeChange(id) {
    setMode(id);
    setFile(null);
    setPreview(null);
    setSlotId('');
    setSlotError('');
    setResult(null);
    setDetectedPlate(null);
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setDetectedPlate(null);
  }

  async function runDetection() {
    if (!file) return;
    if (meta.needsSlot && !slotId.trim()) {
      setSlotError('Slot ID is required.');
      return;
    }
    setSlotError('');
    setLoading(true);
    setResult(null);
    setDetectedPlate(null);

    try {
      const form = new FormData();
      form.append('file', file);

      const detectRes = await fetch(`${AI_ENDPOINT}/ai/detect`, {
        method: 'POST',
        body: form,
      });

      if (!detectRes.ok) {
        setResult('Detection failed');
        setLoading(false);
        return;
      }

      const detectData = await detectRes.json();
      const plate = detectData.licensePlate;

      if (!plate) {
        setResult('No Car Detected');
        setLog(prev => [{
          id: Date.now(),
          mode: MODES.find(m => m.id === mode)?.label,
          message: 'No Car Detected',
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        }, ...prev].slice(0, 20));
        setLoading(false);
        return;
      }

      setDetectedPlate(plate);

      const verifyBody = { licensePlate: plate };
      if (meta.needsSlot) verifyBody.slotId = parseInt(slotId.trim());

      const verifyRes = await fetch(`${ENDPOINT}/${meta.verifyEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(verifyBody),
      });

      const verifyData = await verifyRes.json();
      const msg = verifyData.message || verifyData.error || 'Unknown response';

      setResult(msg);
      setLog(prev => [{
        id: Date.now(),
        mode: MODES.find(m => m.id === mode)?.label,
        message: msg,
        plate,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        ...(meta.needsSlot && { slotId }),
      }, ...prev].slice(0, 20));
    } catch (err) {
      console.error(err);
      setResult('Request failed');
    }
    setLoading(false);
  }

  const resultMeta = result
    ? (RESULT_META[result] || { tone: 'yellow', icon: '?' })
    : null;

  const canRun = !!file && !loading && !(meta.needsSlot && !slotId.trim());

  return (
    <div className="aic-page">

      {/* ── Mode tabs ── */}
      <div className="aic-tabs">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`aic-tab${mode === m.id ? ' aic-tab--active' : ''}`}
            onClick={() => handleModeChange(m.id)}
          >
            {MODE_ICONS[m.id]}
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="aic-grid">

        {/* ── Left: Upload panel ── */}
        <div className="aic-panel">
          <div className="aic-panel-header">
            <div className="aic-panel-icon">
              <IconCamera />
            </div>
            <div className="aic-panel-titles">
              <p className="aic-panel-title">{meta.title}</p>
              <p className="aic-panel-subtitle">{meta.subtitle}</p>
            </div>
          </div>

          <UploadZone preview={preview} onChange={handleFile} />

          {meta.needsSlot && (
            <div className="aic-slot-field">
              <label className="aic-slot-label" htmlFor="slotId">Slot ID</label>
              <input
                id="slotId"
                type="number"
                min="1"
                placeholder="e.g. 3"
                value={slotId}
                className="aic-slot-input"
                onChange={e => { setSlotId(e.target.value); setSlotError(''); }}
              />
              {slotError && <span className="aic-slot-error">{slotError}</span>}
            </div>
          )}

          <button
            className={`aic-run-btn${loading ? ' aic-run-btn--loading' : ''}`}
            disabled={!canRun}
            onClick={canRun ? runDetection : undefined}
          >
            {loading ? (
              <>
                <span className="aic-run-btn-spinner" />
                Processing…
              </>
            ) : (
              <>
                <IconPlay />
                {!file ? 'Upload an image first' : meta.needsSlot && !slotId.trim() ? 'Enter a slot ID' : 'Run Detection'}
              </>
            )}
          </button>
        </div>

        {/* ── Right: Result panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {result ? (
            <div className="aic-result-card">
              <div className="aic-result-header">
                <div className={`aic-result-icon aic-result-icon--${resultMeta.tone}`}>
                  {resultMeta.icon}
                </div>
                <div className="aic-result-title-group">
                  <span className="aic-result-label">Detection result</span>
                  <p className={`aic-result-verdict aic-result-verdict--${resultMeta.tone}`}>
                    {result}
                  </p>
                </div>
              </div>

              <div className="aic-result-divider" />

              <div className="aic-result-meta">
                <div className="aic-result-meta-item">
                  <span className="aic-result-meta-key">Mode</span>
                  <span className="aic-result-meta-val">{MODES.find(m => m.id === mode)?.label}</span>
                </div>
                {detectedPlate && (
                  <div className="aic-result-meta-item">
                    <span className="aic-result-meta-key">Plate detected</span>
                    <span className="aic-result-meta-val">{detectedPlate}</span>
                  </div>
                )}
                {meta.needsSlot && slotId && (
                  <div className="aic-result-meta-item">
                    <span className="aic-result-meta-key">Slot</span>
                    <span className="aic-result-meta-val">#{slotId}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="aic-panel">
              <div className="aic-empty">
                <div className="aic-empty-icon">
                  <IconCamera />
                </div>
                <p className="aic-empty-title">No result yet</p>
                <p className="aic-empty-body">
                  Upload an image and run detection to see the verdict here.
                </p>
              </div>
            </div>
          )}

          {/* ── Detection log ── */}
          {log.length > 0 && (
            <div className="aic-log-card">
              <div className="aic-log-header">
                <p className="aic-log-title">Recent detections</p>
                <button className="aic-log-view-all" onClick={() => setModalOpen(true)}>
                  View all →
                </button>
              </div>
              <div className="aic-log-list">
                {log.slice(0, 4).map(entry => {
                  const m = RESULT_META[entry.message] || { tone: 'yellow', icon: '?' };
                  const borderColor = m.tone === 'green' ? 'rgba(74,222,128,0.3)'
                    : m.tone === 'red' ? 'rgba(248,113,113,0.3)'
                      : 'rgba(251,191,36,0.3)';
                  const textColor = m.tone === 'green' ? '#4ade80'
                    : m.tone === 'red' ? '#f87171'
                      : '#fbbf24';
                  return (
                    <div key={entry.id} className="aic-log-row">
                      <div
                        className="aic-log-dot"
                        style={{ border: `1px solid ${borderColor}`, color: textColor }}
                      >
                        {m.icon}
                      </div>
                      <div className="aic-log-info">
                        <p className="aic-log-msg">{entry.message}</p>
                        <p className="aic-log-sub">
                          {entry.mode}
                          {entry.plate ? ` · ${entry.plate}` : ''}
                          {entry.slotId ? ` · Slot #${entry.slotId}` : ''}
                        </p>
                      </div>
                      <span className="aic-log-time">{entry.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Full log modal ── */}
      <Modal title="Detection log" open={modalOpen} onClose={() => setModalOpen(false)} wide>
        {log.length === 0 ? (
          <EmptyState title="No detections yet" body="Run a detection to see history here." />
        ) : (
          log.map((entry, i) => {
            const m = RESULT_META[entry.message] || { tone: 'yellow', icon: '?' };
            const borderColor = m.tone === 'green' ? 'rgba(74,222,128,0.3)'
              : m.tone === 'red' ? 'rgba(248,113,113,0.3)'
                : 'rgba(251,191,36,0.3)';
            const textColor = m.tone === 'green' ? '#4ade80'
              : m.tone === 'red' ? '#f87171'
                : '#fbbf24';
            return (
              <div key={entry.id} className="aic-modal-row">
                <div
                  className="aic-modal-dot"
                  style={{ border: `1px solid ${borderColor}`, color: textColor }}
                >
                  {m.icon}
                </div>
                <div className="aic-modal-info">
                  <p className="aic-modal-msg">{entry.message}</p>
                  <p className="aic-modal-sub">
                    {entry.mode}
                    {entry.plate ? ` · ${entry.plate}` : ''}
                    {entry.slotId ? ` · Slot #${entry.slotId}` : ''}
                    {' · '}{entry.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </Modal>

    </div>
  );
}