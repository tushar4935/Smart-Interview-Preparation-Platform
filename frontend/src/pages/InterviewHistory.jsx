import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const difficultyColor = { Easy: 'bg-green-900 text-green-300', Medium: 'bg-yellow-900 text-yellow-300', Hard: 'bg-red-900 text-red-300', Mixed: 'bg-blue-900 text-blue-300' };

const InterviewHistory = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const { showToast } = useAuth();

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/interviews?page=${p}&limit=10`);
      setInterviews(data.interviews);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    } catch (err) {
      showToast('Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interview record?')) return;
    setDeleting(id);
    try {
      await api.delete(`/interviews/${id}`);
      showToast('Interview deleted');
      fetchHistory(page);
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Interview History</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} interview{total !== 1 ? 's' : ''} completed</p>
        </div>
        <Link to="/interviews" className="btn-primary">New Interview</Link>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-5xl mb-4">📋</p>
          <h2 className="text-xl font-semibold mb-2">No interviews yet</h2>
          <p className="text-gray-400 mb-6">Complete your first mock interview to see it here.</p>
          <Link to="/interviews" className="btn-primary">Start First Interview</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {interviews.map(iv => (
              <div key={iv._id} className="card hover:border-gray-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-semibold">{iv.title}</h3>
                      <span className={`badge text-xs ${difficultyColor[iv.difficulty] || 'bg-gray-800 text-gray-300'}`}>
                        {iv.difficulty}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                      <span>📁 {iv.category}</span>
                      <span>❓ {iv.totalQuestions} questions</span>
                      <span>📅 {new Date(iv.completedAt).toLocaleDateString()}</span>
                      <span>⏱ {Math.round(iv.duration / 60) || 0} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-extrabold ${iv.percentage >= 70 ? 'text-green-400' : iv.percentage >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {iv.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">{iv.totalScore}/{iv.maxScore} pts</div>
                    </div>
                    <div className="w-14 h-14 relative">
                      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={iv.percentage >= 70 ? '#22c55e' : iv.percentage >= 40 ? '#eab308' : '#ef4444'} strokeWidth="3" strokeDasharray={`${iv.percentage} ${100 - iv.percentage}`} strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/interviews/${iv._id}/session`} className="btn-secondary text-xs py-1.5 px-3">Review</Link>
                      <button onClick={() => handleDelete(iv._id)} disabled={deleting === iv._id} className="btn-danger text-xs py-1.5 px-3">
                        {deleting === iv._id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => fetchHistory(page - 1)} disabled={page === 1} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
              <span className="flex items-center px-4 text-sm text-gray-400">Page {page} of {pages}</span>
              <button onClick={() => fetchHistory(page + 1)} disabled={page === pages} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InterviewHistory;
