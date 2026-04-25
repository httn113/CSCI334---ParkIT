import './QuickActionCard.css';

export default function QuickActionCard({
  icon,
  iconClassName = '',
  title,
  subtitle,
  accent = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`quick-action-card${accent ? ' accent' : ''}`}
      onClick={onClick}
    >
      <div className={`quick-action-icon${iconClassName ? ` ${iconClassName}` : ''}`}>
        {icon}
      </div>
      <div className="quick-action-text">
        <span className="quick-action-title">{title}</span>
        <span className="quick-action-sub">{subtitle}</span>
      </div>
      <svg
        className="quick-action-arrow"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}
