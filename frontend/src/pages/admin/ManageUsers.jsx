import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toggling, setToggling] = useState(null);
  const { showToast } = useAuth();

  const fetchUsers = async (p = 1, q = search) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/users?page=${p}&limit=15&search=${q}`);
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle`);
      setUsers(u => u.map(user => user._id === id ? data.user : user));
      showToast(`User ${data.user.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      showToast('Failed to update user', 'error');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link>
          </div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} registered users</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="input-field flex-1" placeholder="Search by name or email..."
        />
        <button type="submit" className="btn-primary px-6">Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); fetchUsers(1, ''); }} className="btn-secondary px-4">Clear</button>}
      </form>

      {loading ? <LoadingSpinner fullScreen={false} size="md" /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/80 border-b border-gray-700">
                <tr>
                  {['User', 'Email', 'Interviews', 'Avg Score', 'Joined', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-center">{u.totalInterviews}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={u.averageScore >= 70 ? 'text-green-400' : u.averageScore >= 40 ? 'text-yellow-400' : 'text-gray-400'}>
                        {u.averageScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${u.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {u.isActive ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(u._id)}
                        disabled={toggling === u._id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.isActive ? 'bg-red-900/50 text-red-300 hover:bg-red-900' : 'bg-green-900/50 text-green-300 hover:bg-green-900'}`}
                      >
                        {toggling === u._id ? '...' : u.isActive ? 'Ban' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">No users found</div>
          )}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => fetchUsers(page - 1)} disabled={page === 1} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
          <span className="flex items-center px-4 text-sm text-gray-400">Page {page} of {pages}</span>
          <button onClick={() => fetchUsers(page + 1)} disabled={page === pages} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
