import { useAuth } from '../context/AuthContext';
import { MdMenu, MdNotifications } from 'react-icons/md';
import { useAppContext } from '../context/AppContext';
import './Header.css';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const { unreadCount } = useAppContext();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'SA';

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuClick}>
          <MdMenu size={24} />
        </button>
      </div>
      <div className="header-right">
        <button className="header-notif-btn">
          <MdNotifications size={22} />
          {unreadCount > 0 && <span className="header-notif-badge">{unreadCount}</span>}
        </button>
        <div className="header-user">
          <div className="header-avatar">{initials}</div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name || 'Super Admin'}</span>
            <span className="header-user-role">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
