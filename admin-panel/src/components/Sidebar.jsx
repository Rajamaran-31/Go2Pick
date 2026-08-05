import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdDashboard, MdPeople, MdStorefront, MdPendingActions, MdStore, MdReceipt, MdLogout } from 'react-icons/md';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: MdDashboard, label: 'Dashboard', end: true },
  { path: '/customers', icon: MdPeople, label: 'Customers' },
  { path: '/shopkeepers', icon: MdStorefront, label: 'Shopkeepers' },
  { path: '/requests', icon: MdPendingActions, label: 'Requests' },
  { path: '/shops', icon: MdStore, label: 'Shops' },
  { path: '/orders', icon: MdReceipt, label: 'Orders' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">PKU</div>
        <div>
          <h1 className="sidebar-title">Go2Pick</h1>
          <p className="sidebar-subtitle">Super Admin</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <MdLogout size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
