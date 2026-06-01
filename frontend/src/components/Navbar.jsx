import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`text-sm font-medium transition-colors ${location.pathname === to ? 'text-primary-400' : 'text-gray-300 hover:text-white'}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
            <span className="text-2xl">🎯</span>
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">InterviewPrep</span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-6">
              {navLink('/dashboard', 'Dashboard')}
              {navLink('/interviews', 'Interviews')}
              {navLink('/history', 'History')}
              {navLink('/resume', 'Resume')}
              {user.role === 'admin' && navLink('/admin', 'Admin')}
            </div>
          )}

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-xl px-3 py-2 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-200 hidden sm:block">{user.name}</span>
                  <span className="text-gray-400 text-xs">{menuOpen ? '▲' : '▼'}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl py-1 animate-fade-in">
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Profile</Link>
                    {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Admin Panel</Link>}
                    <hr className="border-gray-700 my-1" />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </div>
            )}

            {user && (
              <button className="md:hidden text-gray-400 hover:text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            )}
          </div>
        </div>

        {user && menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3 border-t border-gray-800 pt-3">
            {navLink('/dashboard', 'Dashboard')}
            {navLink('/interviews', 'Interviews')}
            {navLink('/history', 'History')}
            {navLink('/resume', 'Resume')}
            {navLink('/profile', 'Profile')}
            {user.role === 'admin' && navLink('/admin', 'Admin')}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
