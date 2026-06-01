import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Interviews from './pages/Interviews';
import InterviewSession from './pages/InterviewSession';
import InterviewHistory from './pages/InterviewHistory';
import Resume from './pages/Resume';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageQuestions from './pages/admin/ManageQuestions';

const App = () => (
  <AuthProvider>
    <Router>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <Toast />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
          <Route path="/interviews/:id/session" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><InterviewHistory /></ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><ManageQuestions /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  </AuthProvider>
);

export default App;
