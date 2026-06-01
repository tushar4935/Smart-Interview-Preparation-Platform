import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const { stats = {}, recentUsers = [], topPerformers = [] } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-0.5">Platform overview and management</p>
        </div>
        <span className="badge bg-accent-900 text-accent-300 border border-accent-700 px-3 py-1">👑 Admin</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats.totalUsers || 0, icon: '👥', color: 'text-primary-400' },
          { label: 'Interviews Done', value: stats.totalInterviews || 0, icon: '🎯', color: 'text-green-400' },
          { label: 'Questions', value: stats.totalQuestions || 0, icon: '❓', color: 'text-yellow-400' },
          { label: 'Resumes', value: stats.totalResumes || 0, icon: '📄', color: 'text-accent-400' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-3xl mb-2">{s.icon}</p>
            <p className={`text-3xl font-extrabold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-sm text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/admin/users" className="card hover:border-primary-700 transition-colors text-center py-8 group">
          <p className="text-3xl mb-2">👥</p>
          <p className="font-semibold group-hover:text-primary-400 transition-colors">Manage Users</p>
        </Link>
        <Link to="/admin/questions" className="card hover:border-accent-700 transition-colors text-center py-8 group">
          <p className="text-3xl mb-2">❓</p>
          <p className="font-semibold group-hover:text-accent-400 transition-colors">Manage Questions</p>
        </Link>
        <Link to="/interviews" className="card hover:border-green-700 transition-colors text-center py-8 group">
          <p className="text-3xl mb-2">🎯</p>
          <p className="font-semibold group-hover:text-green-400 transition-colors">Take Interview</p>
        </Link>
        <Link to="/dashboard" className="card hover:border-yellow-700 transition-colors text-center py-8 group">
          <p className="text-3xl mb-2">📊</p>
          <p className="font-semibold group-hover:text-yellow-400 transition-colors">My Dashboard</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No users yet</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map(u => (
                <div key={u._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-700 rounded-xl flex items-center justify-center text-sm font-bold shrink-0">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs badge ${u.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {u.isActive ? 'Active' : 'Banned'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-5">Top Performers</h2>
          {topPerformers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((u, i) => (
                <div key={u._id} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.totalInterviews} interviews</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm">{u.averageScore}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
