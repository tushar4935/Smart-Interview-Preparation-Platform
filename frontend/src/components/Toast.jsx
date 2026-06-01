import React from 'react';
import { useAuth } from '../context/AuthContext';

const Toast = () => {
  const { toast } = useAuth();
  if (!toast) return null;

  const colors = {
    success: 'bg-green-900 border-green-700 text-green-100',
    error: 'bg-red-900 border-red-700 text-red-100',
    warning: 'bg-yellow-900 border-yellow-700 text-yellow-100',
    info: 'bg-blue-900 border-blue-700 text-blue-100',
  };
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm border rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl animate-slide-up ${colors[toast.type]}`}>
      <span className="text-lg font-bold">{icons[toast.type]}</span>
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
};

export default Toast;
