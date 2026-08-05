export default function StatusBadge({ status }) {
  const styles = {
    pending: { bg: '#FEF3C7', color: '#D97706' },
    approved: { bg: '#DCFCE7', color: '#16A34A' },
    active: { bg: '#DCFCE7', color: '#16A34A' },
    completed: { bg: '#DCFCE7', color: '#16A34A' },
    ready: { bg: '#DBEAFE', color: '#2563EB' },
    accepted: { bg: '#DBEAFE', color: '#2563EB' },
    preparing: { bg: '#E0E7FF', color: '#4F46E5' },
    rejected: { bg: '#FEE2E2', color: '#DC2626' },
    blocked: { bg: '#FEE2E2', color: '#DC2626' },
    cancelled: { bg: '#FEE2E2', color: '#DC2626' },
    inactive: { bg: '#F1F5F9', color: '#64748B' },
  };

  const s = styles[status?.toLowerCase()] || styles.pending;

  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
      background: s.bg, color: s.color, lineHeight: '1.4',
    }}>
      {status}
    </span>
  );
}
