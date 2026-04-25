import './EmptyState.css';

export default function EmptyState({ title, body }) {
  return (
    <div className="empty-state">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-body">{body}</p>
    </div>
  );
}
