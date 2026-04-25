import './FilterPillGroup.css';

export default function FilterPillGroup({ items, activeId, onSelect, className = '' }) {
  return (
    <div className={`filter-pill-group${className ? ` ${className}` : ''}`}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`filter-pill${activeId === item.id ? ' active' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
