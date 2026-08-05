import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, color = 'accent', trend }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className={`stat-icon stat-icon-${color}`}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {trend && <span className={`stat-trend ${trend > 0 ? 'up' : 'down'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
      </div>
    </div>
  );
}
