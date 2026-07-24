import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against double-run in strict mode
    ran.current = true;
    if (!token) { setStatus('error'); return; }
    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const content = {
    verifying: { emoji: '⏳', title: 'Verifying your email…', text: 'Hang tight for a second.' },
    success: { emoji: '✅', title: 'Email verified', text: 'Your account is all set.' },
    error: { emoji: '⚠️', title: 'Verification failed', text: 'This link is invalid or has expired. Request a new one from your profile.' },
  }[status];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="card">
          <div className="text-5xl mb-4">{content.emoji}</div>
          <h1 className="text-xl font-bold mb-2">{content.title}</h1>
          <p className="text-gray-400 mb-6">{content.text}</p>
          <Link to={status === 'success' ? '/dashboard' : '/login'} className="btn-primary">
            {status === 'success' ? 'Go to dashboard' : 'Back to login'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
