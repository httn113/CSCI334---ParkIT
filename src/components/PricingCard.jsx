import './PricingCard.css';

export default function PricingCard({ tier, onCtaClick, isDisabled }) {
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
        {tier.features.map((line) => {
          const isCheck = line.startsWith('✓');
          const parts = line.split(/(✓|\(Coming Soon\))/g);
          return (
            <li key={line}>
              {parts.map((part, i) => {
                if (part === '✓') return <span key={i} className="pricing-feature-check">{part}</span>;
                if (part === '(Coming Soon)') return <span key={i} className="pricing-feature-soon">{part}</span>;
                return part;
              })}
            </li>
          );
        })}
      </ul>

      <div className="pricing-card-cta">
        <button
          type="button"
          className={`pricing-btn pricing-btn--${tier.variant}${tier.ctaCurrent ? ' pricing-btn--current' : ''}`}
          onClick={onCtaClick}
          disabled={isDisabled}
        >
          {tier.ctaLabel}
        </button>
      </div>
    </article>
  );
}