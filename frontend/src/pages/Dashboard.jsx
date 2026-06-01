import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const StatCard = ({ icon, label, value, sub, color = 'primary' }) => {
  const colors = { primary: 'from-primary-900/50 to-primary-800/20 border-primary-800', purple: 'from-accent-900/50 to-accent-800/20 border-accent-800', green: 'from-green-900/50 to-green-800/20 border-green-800', yellow: 'from-yellow-900/50 to-yellow-800/20 border-yellow-800' };
  return (
    <div className={`card bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-xs text-gray-400 bg-gray-800 rounded-full px-2 py-0.5">{sub}</span>}
      </div>
      <p className="text-3xl font-extrabold mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const { stats = {}, recentInterviews = [], categoryStats = [], progressData = [], difficultyBreakdown = {} } = data || {};
  const diffData = Object.entries(difficultyBreakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back, {user?.name} 👋</p>
        </div>
        <Link to="/interviews" className="btn-primary">New Interview</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🎯" label="Total Interviews" value={stats.totalInterviews || 0} color="primary" />
        <StatCard icon="📈" label="Average Score" value={`${stats.avgScore || 0}%`} color="green" />
        <StatCard icon="🏆" label="Best Score" value={`${stats.bestScore || 0}%`} color="yellow" />
        <StatCard icon="🔥" label="This Week" value={stats.last7Count || 0} sub="interviews" color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold mb-5">Score Progress (Last 7 Days)</h2>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-4xl mb-3">📊</p>
                <p>Complete interviews to see your progress</p>
              </div>
            </div>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-5">By Difficulty</h2>
          {diffData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={diffData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {diffData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-500 text-sm text-center">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Category Performance */}
      {categoryStats.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-5">Performance by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="category" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="avgScore" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Avg Score %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Interviews */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Recent Interviews</h2>
          <Link to="/history" className="text-sm text-primary-400 hover:text-primary-300">View all →</Link>
        </div>
        {recentInterviews.length > 0 ? (
          <div className="space-y-3">
            {recentInterviews.map(iv => (
              <div key={iv._id} className="flex items-center justify-between bg-gray-800/50 rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors">
                <div>
                  <p className="font-medium text-sm">{iv.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{iv.category} · {iv.difficulty} · {new Date(iv.completedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-lg font-bold ${iv.percentage >= 70 ? 'text-green-400' : iv.percentage >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {iv.percentage}%
                  </div>
                  <Link to={`/interviews/${iv._id}/session`} className="text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg px-2.5 py-1.5 transition-colors">
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🎯</p>
            <p className="text-gray-400 mb-4">No interviews yet. Start practicing!</p>
            <Link to="/interviews" className="btn-primary">Take First Interview</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
