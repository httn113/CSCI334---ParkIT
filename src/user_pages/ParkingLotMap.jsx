import './ParkingLotMap.css';

const ZONES = ['A', 'B', 'C', 'D'];
const SLOT_NUMBERS = [1, 2, 3, 4, 5];

/** keys like "A-1" … "D-5" */
export function bookingSpotKeys(bookings) {
  const keys = new Set();
  for (const b of bookings) {
    const z = b.zoneName;
    const n = b.zoneNumber;
    if (z == null || z === '—' || n == null || n === '—') continue;
    const zone = String(z).trim().toUpperCase();
    const num = Number(n);
    if (!ZONES.includes(zone) || !Number.isFinite(num) || num < 1 || num > 5) continue;
    keys.add(`${zone}-${num}`);
  }
  return keys;
}

export default function ParkingLotMap({ highlightedKeys = new Set() }) {
  return (
    <div className="parking-lot-map" role="img" aria-label="Parking lot layout: zones A through D, five spots each">
      <div className="parking-lot-map__header">
        <span className="parking-lot-map__corner" aria-hidden />
        {SLOT_NUMBERS.map((n) => (
          <span key={n} className="parking-lot-map__col-head">
            {String(n).padStart(3, '0')}
          </span>
        ))}
      </div>
      {ZONES.map((zone) => (
        <div key={zone} className="parking-lot-map__row">
          <span className="parking-lot-map__zone-label">Zone {zone}</span>
          {SLOT_NUMBERS.map((n) => {
            const key = `${zone}-${n}`;
            const mine = highlightedKeys.has(key);
            return (
              <div
                key={key}
                className={`parking-lot-map__slot${mine ? ' parking-lot-map__slot--yours' : ''}`}
                title={mine ? 'Your booking' : `Zone ${zone} · Spot ${String(n).padStart(3, '0')}`}
              >
                {mine ? '●' : ''}
              </div>
            );
          })}
        </div>
      ))}
      {highlightedKeys.size > 0 && (
        <p className="parking-lot-map__legend">
          Highlighted spots match your active bookings (reference only).
        </p>
      )}
    </div>
  );
}
