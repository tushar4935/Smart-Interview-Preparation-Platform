import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { showToast } = useAuth();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      showToast('Password reset. You can log in now.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold">🎯</Link>
          <h1 className="text-2xl font-bold mt-3">Choose a new password</h1>
        </div>

        <div className="card">
          {!token ? (
            <div className="text-center text-gray-400">
              <p className="mb-4">This reset link is missing its token.</p>
              <Link to="/forgot-password" className="btn-primary">Request a new link</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                <input type="password" required autoComplete="new-password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                <input type="password" required autoComplete="new-password" value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="input-field" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
