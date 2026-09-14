import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import AdminNavDrawer from '../../components/AdminNavDrawer';

export default function UserManagementwithNavDrawer() {
  const navigate = useNavigate();
  const { unreadCount } = useAppContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ limit: 50 });
      const data = res.data;
      if (data?.users) {
        setUsers(data.users.map(u => ({
          id: u.id || u._id,
          name: u.fullName || u.name || 'Unknown',
          email: u.email || '',
          role: u.role === 'shopkeeper' ? 'Shopkeeper' : u.role === 'super_admin' ? 'Super Admin' : 'Customer',
          roleColor: u.role === 'shopkeeper' ? 'bg-marketplace-orange/10 text-marketplace-orange' : u.role === 'super_admin' ? 'bg-error-red/10 text-error-red' : 'bg-primary/10 text-primary',
          status: u.isBlocked ? 'Blocked' : 'Active',
          login: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never',
          img: u.profilePic || u.avatar || '',
          isBlocked: u.isBlocked || false
        })));
        setTotalUsers(data.total || data.users.length);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isBlocked ? 'unblock' : 'block'} ${user.name}?`)) return;
    try {
      await adminAPI.toggleBlockUser(user.id, user.isBlocked);
      fetchUsers();
    } catch (err) {
      alert('Failed to update user: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      

<header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-lg py-sm bg-surface-slate dark:bg-inverse-surface shadow-sm">
<div className="flex items-center gap-sm">
<button className="p-xs rounded-full hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer" onClick={() => navigate('/admin')}>
<span className="material-symbols-outlined text-primary dark:text-inverse-primary" style={{fontSize: '24px'}}>arrow_back</span>
</button>
<h1 className="font-headline-lg text-headline-lg font-bold text-primary dark:text-inverse-primary ml-xs">Users & Access</h1>
</div>
<div className="flex items-center gap-2 md:gap-3">
<button 
  onClick={() => navigate('/')} 
  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-trust-blue/10 text-trust-blue hover:bg-trust-blue hover:text-white text-xs font-bold transition-all border border-trust-blue/20 shadow-sm cursor-pointer"
  title="Switch to Customer Storefront"
>
  <span className="material-symbols-outlined text-[16px]">storefront</span>
  <span>Customer Store</span>
</button>
<button 
  onClick={() => navigate('/shopkeeper')} 
  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-marketplace-orange/10 text-marketplace-orange hover:bg-marketplace-orange hover:text-white text-xs font-bold transition-all border border-marketplace-orange/20 shadow-sm cursor-pointer"
  title="Switch to Shopkeeper Dashboard"
>
  <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
  <span>Shopkeeper Portal</span>
</button>
<button className="p-xs rounded-full hover:bg-surface-container-high transition-colors duration-200 active:scale-95 transition-transform relative" onClick={() => navigate('/admin/notifications')}>
<span className="material-symbols-outlined text-on-surface-variant dark:text-outline">notifications</span>
{unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-error-red rounded-full"></span>}
</button>
<button className="p-xs rounded-full hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
<span className="material-symbols-outlined text-on-surface-variant dark:text-outline">menu</span>
</button>
<div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-label-sm">
            SA
        </div>
</div>
</header>
<main className="pt-24 pb-32 px-md md:px-lg max-w-container-max mx-auto md:ml-20">

<div className="mb-xl">
<h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">User Management</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant">Oversee all platform accounts and moderate access levels.</p>
</div>

<div className="grid grid-cols-1 md:grid-cols-12 gap-md mb-xl">

<div className="md:col-span-8 bg-surface-container-lowest p-sm rounded-xl shadow-sm flex items-center gap-sm border border-border-gray focus-within:border-primary transition-colors">
<span className="material-symbols-outlined text-outline">search</span>
<input
  value={search}
  onChange={e => setSearch(e.target.value)}
  className="w-full bg-transparent border-none focus:ring-0 text-body-md font-body-md"
  placeholder="Search by name or email..."
  type="text"
/>
</div>

<div className="md:col-span-4 grid grid-cols-2 gap-md">
<div className="bg-surface-container p-sm rounded-xl flex flex-col justify-center">
<span className="text-label-sm font-label-sm text-on-surface-variant">TOTAL USERS</span>
<span className="text-title-md font-title-md text-primary">{isLoading ? '...' : totalUsers.toLocaleString()}</span>
</div>
<div className="bg-tertiary-container/10 p-sm rounded-xl flex flex-col justify-center border-l-4 border-tertiary-container">
<span className="text-label-sm font-label-sm text-on-tertiary-fixed-variant">ACTIVE NOW</span>
<span className="text-title-md font-title-md text-tertiary-container">{isLoading ? '...' : users.filter(u => !u.isBlocked).length.toLocaleString()}</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-border-gray md:pl-4">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-slate border-b border-border-gray">
<th className="px-lg py-md text-label-sm font-label-sm text-on-surface-variant">USER DETAILS</th>
<th className="px-lg py-md text-label-sm font-label-sm text-on-surface-variant">ROLE</th>
<th className="px-lg py-md text-label-sm font-label-sm text-on-surface-variant">STATUS</th>
<th className="px-lg py-md text-label-sm font-label-sm text-on-surface-variant">LAST LOGIN</th>
<th className="px-lg py-md text-label-sm font-label-sm text-on-surface-variant text-right">ACTIONS</th>
</tr>
</thead>
<tbody className="divide-y divide-border-gray">
{isLoading ? (
  <tr><td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">Loading users...</td></tr>
) : filteredUsers.length === 0 ? (
  <tr><td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">No users found.</td></tr>
) : filteredUsers.map(user => (
<tr key={user.id} className="hover:bg-surface-slate transition-colors group">
<td className="px-lg py-md">
<div className="flex items-center gap-md">
<div className="w-10 h-10 rounded-full bg-surface-dim overflow-hidden flex-shrink-0 flex items-center justify-center text-on-surface-variant font-bold">
{user.img ? <img className="w-full h-full object-cover" src={user.img} alt={user.name} /> : user.name.substring(0, 2).toUpperCase()}
</div>
<div>
<div className="font-title-md text-body-lg text-on-surface">{user.name}</div>
<div className="font-body-md text-body-md text-on-surface-variant">{user.email}</div>
</div>
</div>
</td>
<td className="px-lg py-md">
<span className={`px-sm py-1 ${user.roleColor} font-label-sm text-label-sm rounded-full`}>{user.role}</span>
</td>
<td className="px-lg py-md">
<div className={`flex items-center gap-xs ${user.status === 'Active' ? 'text-success-green' : 'text-error-red'}`}>
<span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-success-green' : 'bg-error-red'}`}></span>
<span className="font-body-md text-body-md">{user.status}</span>
</div>
</td>
<td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">{user.login}</td>
<td className="px-lg py-md text-right">
<button
  onClick={() => handleToggleBlock(user)}
  className={`px-md py-sm rounded-lg transition-all text-label-sm font-label-sm ${user.isBlocked ? 'bg-success-green/10 text-success-green hover:bg-success-green hover:text-white' : 'bg-error-red/10 text-error-red hover:bg-error-red hover:text-white'}`}
>
  {user.isBlocked ? 'Unblock' : 'Block'}
</button>
</td>
</tr>
))}
</tbody>
</table>
</div>

<div className="px-lg py-md border-t border-border-gray flex items-center justify-between">
<span className="font-body-md text-body-md text-on-surface-variant">Showing {filteredUsers.length} of {totalUsers.toLocaleString()} users</span>
</div>
</div>
</main>

<AdminNavDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
