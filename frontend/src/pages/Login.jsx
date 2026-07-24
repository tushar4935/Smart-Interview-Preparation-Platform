import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold">🎯</Link>
          <h1 className="text-2xl font-bold mt-3">Welcome back</h1>
          <p className="text-gray-400 mt-1">Sign in to continue your interview prep</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-5 bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                name="email" type="email" required autoComplete="email"
                value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                name="password" type="password" required autoComplete="current-password"
                value={form.password} onChange={handleChange}
                className="input-field" placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-primary-300">Forgot your password?</Link>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                Create one free
              </Link>
            </p>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-800">
            <p className="text-xs text-center text-gray-500 mb-3">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ email: 'demo@example.com', password: 'demo123' })}
                className="text-xs bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-gray-300 transition-colors"
              >
                User Demo
              </button>
              <button
                type="button"
                onClick={() => setForm({ email: 'admin@example.com', password: 'admin123' })}
                className="text-xs bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-gray-300 transition-colors"
              >
                Admin Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
