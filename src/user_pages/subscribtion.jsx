import './Subscribtion.css';

const TIERS = [
  {
    id: 'standard',
    variant: 'standard',
    name: 'Standard',
    price: 'Free',
    priceNote: '',
    includes: null,
    features: [
      'Book spots online up to 2 days in advance.',
      'Single booking up to 3 hours.',
      'Standard booking fees.',
      'Contactless payment: quick entry and exit using QR codes or e-wallets.',
      'Loyalty points: earn points for every hour parked.',
    ],
    ctaLabel: 'Current plan',
    ctaCurrent: true,
  },
  {
    id: 'premium',
    variant: 'premium',
    name: 'Premium',
    price: '$15.99',
    priceNote: '/month',
    includes: 'Everything in Standard, plus:',
    features: [
      'Lower booking fees during non-busy times.',
      'Single booking up to 24 hours.',
      '“Time expiring” alerts; extend your parking session from your phone.',
      'Special gift voucher during your birthday month.',
      'Double loyalty points per hour during non-busy times.',
      'Lower penalty pricing if you exceed your booked hours.',
      'Oversized and minivan spots.',
    ],
    ctaLabel: 'Upgrade to Premium',
    ctaCurrent: false,
  },
  {
    id: 'gold',
    variant: 'gold',
    name: 'Gold',
    price: '$49.99',
    priceNote: '/month',
    includes: 'Everything in Premium, plus:',
    features: [
      'Priority spots, always available.',
      '24 hours of free parking each month.',
      'Book for non-registered vehicles (friends and family) for up to 4 hours.',
      'Standard rates apply for time beyond your booked window.',
    ],
    ctaLabel: 'Upgrade to Gold',
    ctaCurrent: false,
  },
];

const COMPARISON_ROWS = [
  {
    feature: 'Max duration',
    standard: { kind: 'text', value: '3 hours' },
    premium: { kind: 'text', value: '24 hours' },
    gold: { kind: 'text', value: 'Unlimited' },
  },
  {
    feature: 'Off-peak rates',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: true },
    gold: { kind: 'bool', value: true },
  },
  {
    feature: 'Live alerts',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: true },
    gold: { kind: 'bool', value: true },
  },
  {
    feature: 'Lower penalty',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: true },
    gold: { kind: 'bool', value: true },
  },
  {
    feature: 'Priority spots',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: false },
    gold: { kind: 'bool', value: true },
  },
  {
    feature: 'Guest booking',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: false },
    gold: { kind: 'bool', value: true },
  },
];

function CompareCell({ cell }) {
  if (cell.kind === 'text') {
    return <span className="subscribtion-compare-text">{cell.value}</span>;
  }
  return (
    <span
      className={
        cell.value
          ? 'subscribtion-compare-icon subscribtion-compare-icon--yes'
          : 'subscribtion-compare-icon subscribtion-compare-icon--no'
      }
      aria-label={cell.value ? 'Included' : 'Not included'}
    >
      {cell.value ? '✓' : '✗'}
    </span>
  );
}

export default function Subscribtion() {
  return (
    <div className="subscribtion-page">
      <header className="subscribtion-hero">
        <h1 className="subscribtion-hero-title">Subscription</h1>
        <p className="subscribtion-hero-sub">
          Pick the plan that fits how you park. Upgrade anytime for longer bookings, better rates off-peak, and extra perks.
        </p>
      </header>

      <div className="subscribtion-grid">
        {TIERS.map((tier) => (
          <article
            key={tier.id}
            className={`subscribtion-card subscribtion-card--${tier.variant}`}
          >
            <h2 className="subscribtion-card-name">{tier.name}</h2>
            <div className="subscribtion-price-row">
              <span className="subscribtion-price">{tier.price}</span>
              {tier.priceNote ? (
                <span className="subscribtion-price-note">{tier.priceNote}</span>
              ) : null}
            </div>
            {tier.includes ? (
              <p className="subscribtion-includes">{tier.includes}</p>
            ) : (
              <p className="subscribtion-includes subscribtion-includes--lead">
                Our no-cost tier for everyday parking.
              </p>
            )}
            <ul className="subscribtion-features">
              {tier.features.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="subscribtion-card-cta">
              <button
                type="button"
                className={`subscribtion-btn subscribtion-btn--${tier.variant}${tier.ctaCurrent ? ' subscribtion-btn--current' : ''}`}
              >
                {tier.ctaLabel}
              </button>
            </div>
          </article>
        ))}
      </div>

      <section className="subscribtion-compare" aria-labelledby="subscribtion-compare-heading">
        <h2 id="subscribtion-compare-heading" className="subscribtion-compare-title">
          Compare plans
        </h2>
        <div className="subscribtion-compare-scroll">
          <table className="subscribtion-compare-table">
            <thead>
              <tr>
                <th scope="col" className="subscribtion-compare-feature">
                  Features
                </th>
                <th scope="col">Standard</th>
                <th scope="col">Premium</th>
                <th scope="col">Gold</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="subscribtion-compare-feature">
                    {row.feature}
                  </th>
                  <td>
                    <CompareCell cell={row.standard} />
                  </td>
                  <td>
                    <CompareCell cell={row.premium} />
                  </td>
                  <td>
                    <CompareCell cell={row.gold} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
