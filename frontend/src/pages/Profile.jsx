import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const skillOptions = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'MongoDB', 'SQL', 'AWS', 'Docker', 'Git', 'CSS', 'DSA'];

const Profile = () => {
  const { user, updateUser, showToast } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', targetRole: user?.targetRole || '', skills: user?.skills || [] });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [tab, setTab] = useState('profile');

  const toggleSkill = (skill) => {
    setForm(f => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill] }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirm) return setPwError('Passwords do not match');
    if (pwForm.newPassword.length < 6) return setPwError('New password must be at least 6 characters');
    setChangingPw(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showToast('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 flex items-center gap-5">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-3xl font-extrabold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <p className="text-xs mt-1">
            <span className={`badge ${user?.role === 'admin' ? 'bg-accent-900 text-accent-300' : 'bg-gray-800 text-gray-400'}`}>
              {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
            </span>
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
        {['profile', 'security'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`capitalize px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'profile' ? '👤 Profile' : '🔒 Security'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleProfileSave} className="card space-y-5">
          <h2 className="text-lg font-semibold">Profile Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Target Role</label>
            <input type="text" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} className="input-field" placeholder="e.g. Senior Frontend Engineer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
            <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="input-field resize-none" placeholder="Tell us about yourself..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Skills</label>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map(skill => (
                <button type="button" key={skill} onClick={() => toggleSkill(skill)} className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${form.skills.includes(skill) ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-400">{user?.totalInterviews || 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Interviews</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{user?.averageScore || 0}%</p>
              <p className="text-xs text-gray-400 mt-0.5">Avg Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-400">{form.skills.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Skills</p>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      )}

      {tab === 'security' && (
        <form onSubmit={handlePasswordChange} className="card space-y-5">
          <h2 className="text-lg font-semibold">Change Password</h2>
          {pwError && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">{pwError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} className="input-field" required />
          </div>
          <button type="submit" disabled={changingPw} className="btn-primary w-full">
            {changingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Profile;
