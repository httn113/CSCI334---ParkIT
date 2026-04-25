import './GlassCard.css';

export default function GlassCard({ children, className = '' }) {
  return (
    <div className={`glass-card${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
