import { useState, useRef } from 'react';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import SectionTitle from '../components/SectionTitle';
import FormField from '../components/FormField';
import FilterPillGroup from '../components/FilterPillGroup';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import QuickActionCard from '../components/QuickActionCard';

const ENDPOINT = import.meta.env.VITE_API_URL;

const MODES = [
  { id: 'entry', label: 'Entry gate' },
  { id: 'exit', label: 'Exit gate' },
  { id: 'slot', label: 'Slot detection' },
];

const MODE_META = {
  entry: {
    title: 'Entry gate detection',
    subtitle: 'Upload a photo of the vehicle at the entry gate. The system will read the plate and grant or deny access.',
    endpoint: '/auth/test/entryDetection',
    needsSlot: false,
  },
  exit: {
    title: 'Exit gate detection',
    subtitle: 'Upload a photo of the vehicle at the exit gate. The system will log the departure.',
    endpoint: '/auth/test/exitDetection',
    needsSlot: false,
  },
  slot: {
    title: 'Slot detection',
    subtitle: 'Upload a photo of a parking slot and enter the slot ID. The system checks whether the vehicle matches the active booking.',
    endpoint: '/auth/test/slotDetection',
    needsSlot: true,
  },
};

const RESULT_META = {
  'Access Granted': { color: '#4ade80', icon: '✓', label: 'Granted' },
  'Exit Granted': { color: '#4ade80', icon: '✓', label: 'Granted' },
  'Correct Parking': { color: '#4ade80', icon: '✓', label: 'Correct' },
  'Access Denied': { color: '#f87171', icon: '✕', label: 'Denied' },
  'Exit Denied': { color: '#f87171', icon: '✕', label: 'Denied' },
  'No Car Detected': { color: '#f87171', icon: '✕', label: 'No car' },
  'No Booking But Car Detected': { color: '#fbbf24', icon: '!', label: 'Warning' },
  'Parking in Wrong Spot': { color: '#fbbf24', icon: '!', label: 'Warning' },
};

function UploadZone({ preview, onChange }) {
  const ref = useRef(null);
  return (
    <div
      onClick={() => ref.current.click()}
      style={{
        border: '1.5px dashed rgba(59, 125, 232, 0.35)',
        borderRadius: 14,
        minHeight: 170,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        background: preview ? 'transparent' : 'rgba(10, 26, 66, 0.4)',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,125,232,0.65)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(59,125,232,0.35)'}
    >
      {preview ? (
        <img
          src={preview}
          alt="preview"
          style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain', borderRadius: 10 }}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7baaf7" strokeWidth="1.5" style={{ marginBottom: 10 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p style={{ margin: 0, fontSize: 13, color: '#7baaf7', fontWeight: 600 }}>Click to upload image</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7a8aaa' }}>JPG, PNG supported</p>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
    </div>
  );
}

export default function AICamera() {
  const [mode, setMode] = useState('entry');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [slotId, setSlotId] = useState('');
  const [slotError, setSlotError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
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
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
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

    const form = new FormData();
    form.append('file', file);
    if (meta.needsSlot) form.append('id', slotId.trim());

    try {
      const res = await fetch(`${ENDPOINT}/analytics/predict`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: form,
      });
      const data = await res.json();
      const msg = data.message || data.error || 'Unknown response';
      setResult(msg);
      setLog(prev => [{
        id: Date.now(),
        mode: MODES.find(m => m.id === mode)?.label,
        message: msg,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        ...(meta.needsSlot && { slotId }),
      }, ...prev].slice(0, 20));
    } catch {
      setResult('Request failed');
    }
    setLoading(false);
  }

  const resultMeta = result ? (RESULT_META[result] || { color: '#fbbf24', icon: '?', label: 'Unknown' }) : null;

  const RunIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );

  const LogIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );

  return (
    <div className="overview-page">

      {/* ── Mode selector ── */}
      <FilterPillGroup items={MODES} activeId={mode} onSelect={handleModeChange} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── Left: upload panel ── */}
        <GlassCard style={{ padding: '24px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
            {meta.title}
          </p>
          <p style={{ margin: '0 0 18px', fontSize: '0.8rem', color: '#7a8aaa', lineHeight: 1.6 }}>
            {meta.subtitle}
          </p>

          <UploadZone preview={preview} onChange={handleFile} />

          {meta.needsSlot && (
            <div style={{ marginTop: 14 }}>
              <FormField label="Slot ID" htmlFor="slotId" error={slotError}>
                <input
                  id="slotId"
                  type="number"
                  min="1"
                  placeholder="e.g. 3"
                  value={slotId}
                  onChange={e => { setSlotId(e.target.value); setSlotError(''); }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(10, 26, 66, 0.6)',
                    border: '1px solid rgba(59, 125, 232, 0.3)',
                    borderRadius: 10,
                    color: '#ffffff',
                    padding: '10px 14px',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </FormField>
            </div>
          )}

          {/* Run detection — uses QuickActionCard as the primary CTA */}
          <div style={{ marginTop: 16 }}>
            <QuickActionCard
              icon={RunIcon}
              iconClassName="book-icon"
              title={loading ? 'Processing…' : 'Run detection'}
              subtitle={!file ? 'Upload an image first' : meta.needsSlot && !slotId ? 'Enter a slot ID too' : 'Click to analyse the image'}
              accent={!!file && !loading}
              onClick={(!file || loading) ? undefined : runDetection}
            />
          </div>
        </GlassCard>

        {/* ── Right: result + log ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {result ? (
            <>
              {/* Stat cards for mode + result */}
              <div style={{ display: 'flex', gap: 12 }}>
                <StatCard label="Mode" value={MODES.find(m => m.id === mode)?.label.split(' ')[0]} />
                <StatCard
                  label="Result"
                  value={resultMeta?.icon}
                  colorClass={resultMeta?.color === '#4ade80' ? 'available' : ''}
                />
              </div>

              {/* Result message card */}
              <GlassCard style={{ padding: '20px 24px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a8aaa' }}>
                  Detection result
                </p>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: resultMeta?.color || '#ffffff' }}>
                  {result}
                </p>
                {meta.needsSlot && slotId && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#7a8aaa' }}>Slot {slotId}</p>
                )}
              </GlassCard>
            </>
          ) : (
            <EmptyState
              title="No result yet"
              body="Upload an image and run detection to see the result here."
            />
          )}

          {/* ── Detection log ── */}
          {log.length > 0 && (
            <GlassCard style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>Recent detections</p>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{ fontSize: '0.75rem', color: '#7baaf7', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                >
                  View all →
                </button>
              </div>
              {log.slice(0, 3).map(entry => {
                const m = RESULT_META[entry.message] || { color: '#fbbf24', icon: '?' };
                return (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 0',
                    borderBottom: '1px solid rgba(59, 125, 232, 0.12)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(10, 26, 66, 0.6)',
                      border: `1px solid ${m.color}44`,
                      fontSize: 14, fontWeight: 700, color: m.color,
                    }}>
                      {m.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>{entry.message}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a8aaa' }}>
                        {entry.mode}{entry.slotId ? ` · Slot ${entry.slotId}` : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#7a8aaa', whiteSpace: 'nowrap' }}>{entry.time}</span>
                  </div>
                );
              })}
            </GlassCard>
          )}

          {/* View full log action */}
          {log.length > 3 && (
            <QuickActionCard
              icon={LogIcon}
              iconClassName="map-icon"
              title="View detection log"
              subtitle={`${log.length} detections recorded this session`}
              onClick={() => setModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* ── Full log modal ── */}
      <Modal title="Detection log" open={modalOpen} onClose={() => setModalOpen(false)} wide>
        {log.length === 0 ? (
          <EmptyState title="No detections yet" body="Run a detection to see history here." />
        ) : (
          log.map((entry, i) => {
            const m = RESULT_META[entry.message] || { color: '#fbbf24', icon: '?' };
            return (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 0',
                borderBottom: i < log.length - 1 ? '1px solid rgba(59, 125, 232, 0.12)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(10, 26, 66, 0.6)',
                  border: `1px solid ${m.color}55`,
                  fontSize: 15, fontWeight: 700, color: m.color,
                }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>{entry.message}</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#7a8aaa' }}>
                    {entry.mode}{entry.slotId ? ` · Slot ${entry.slotId}` : ''} · {entry.time}
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