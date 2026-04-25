import GlassCard from './GlassCard';
import './StatCard.css';

export default function StatCard({ label, value, colorClass = '' }) {
  return (
    <GlassCard className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span className={`stat-card-number${colorClass ? ` ${colorClass}` : ''}`}>
        {value}
      </span>
    </GlassCard>
  );
}
