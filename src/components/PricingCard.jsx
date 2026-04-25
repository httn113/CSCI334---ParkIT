import './PricingCard.css';

export default function PricingCard({ tier }) {
  return (
    <article className={`pricing-card pricing-card--${tier.variant}`}>
      <h2 className="pricing-card-name">{tier.name}</h2>

      <div className="pricing-price-row">
        <span className="pricing-price">{tier.price}</span>
        {tier.priceNote && (
          <span className="pricing-price-note">{tier.priceNote}</span>
        )}
      </div>

      {tier.includes ? (
        <p className="pricing-includes">{tier.includes}</p>
      ) : (
        <p className="pricing-includes pricing-includes--lead">
          Our no-cost tier for everyday parking.
        </p>
      )}

      <ul className="pricing-features">
        {tier.features.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="pricing-card-cta">
        <button
          type="button"
          className={`pricing-btn pricing-btn--${tier.variant}${tier.ctaCurrent ? ' pricing-btn--current' : ''}`}
        >
          {tier.ctaLabel}
        </button>
      </div>
    </article>
  );
}
