import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const categories = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'DSA', 'System Design', 'Behavioral', 'HR', 'CSS', 'SQL', 'MongoDB', 'Mixed'];
const difficulties = ['Easy', 'Medium', 'Hard', 'Mixed'];
const questionCounts = [5, 10, 15, 20];

const Interviews = () => {
  const [config, setConfig] = useState({ category: 'JavaScript', difficulty: 'Mixed', questionCount: 10, title: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const handleChange = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const startInterview = async () => {
    setError('');
    setLoading(true);
    try {
      const title = config.title || `${config.category} Interview - ${new Date().toLocaleDateString()}`;
      const { data } = await api.post('/interviews/start', { ...config, title });
      if (data.success) {
        showToast('Interview started! Good luck! 🎯');
        navigate(`/interviews/${data.interview._id}/session`, { state: { interview: data.interview } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Start Mock Interview</h1>
        <p className="text-gray-400">Configure your interview session and test your knowledge.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold">Interview Settings</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Session Title (optional)</label>
            <input
              type="text" value={config.title} onChange={e => handleChange('title', e.target.value)}
              className="input-field" placeholder="e.g. React Senior Interview Prep"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleChange('category', cat)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${config.category === cat ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Difficulty</label>
            <div className="flex gap-2">
              {difficulties.map(d => (
                <button
                  key={d}
                  onClick={() => handleChange('difficulty', d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${config.difficulty === d ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Number of Questions</label>
            <div className="flex gap-2">
              {questionCounts.map(n => (
                <button
                  key={n}
                  onClick={() => handleChange('questionCount', n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${config.questionCount === n ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary card */}
        <div className="card flex flex-col">
          <h2 className="text-lg font-semibold mb-6">Session Summary</h2>
          <div className="space-y-4 flex-1">
            {[
              ['Category', config.category],
              ['Difficulty', config.difficulty],
              ['Questions', config.questionCount],
              ['Est. Duration', `${config.questionCount * 2} mins`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center text-sm border-b border-gray-800 pb-3">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium text-white">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-primary-900/30 border border-primary-800 rounded-xl mb-6">
            <h3 className="text-sm font-semibold text-primary-300 mb-2">Tips for Success</h3>
            <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
              <li>Find a quiet place with no distractions</li>
              <li>Answer as completely as possible</li>
              <li>Use STAR method for behavioral questions</li>
              <li>Think out loud and explain your reasoning</li>
            </ul>
          </div>

          <button onClick={startInterview} disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Starting...' : '🚀 Start Interview'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Interviews;
