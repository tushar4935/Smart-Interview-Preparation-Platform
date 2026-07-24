import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      // backend intentionally responds the same either way; treat any response as done
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold">🎯</Link>
          <h1 className="text-2xl font-bold mt-3">Reset your password</h1>
          <p className="text-gray-400 mt-1">We'll email you a reset link</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📬</div>
              <p className="text-gray-200 font-medium mb-2">Check your inbox</p>
              <p className="text-sm text-gray-400 mb-6">If an account exists for that email, a reset link is on its way. In local dev the link is printed to the server console.</p>
              <Link to="/login" className="btn-primary">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field" placeholder="you@example.com"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-gray-400">
                <Link to="/login" className="text-primary-400 hover:text-primary-300">Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
