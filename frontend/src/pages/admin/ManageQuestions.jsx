import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORIES = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'DSA', 'System Design', 'Behavioral', 'HR', 'CSS', 'SQL', 'MongoDB'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const emptyForm = { text: '', category: 'JavaScript', difficulty: 'Medium', expectedAnswer: '', keywords: '', timeLimit: 120 };

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filterCat, setFilterCat] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { showToast } = useAuth();

  const fetchQuestions = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (filterCat) params.append('category', filterCat);
      const { data } = await api.get(`/admin/questions?${params}`);
      setQuestions(data.questions);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    } catch {
      showToast('Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [filterCat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return showToast('Question text is required', 'error');
    setSaving(true);
    const payload = { ...form, keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean) };
    try {
      if (editId) {
        await api.put(`/questions/${editId}`, payload);
        showToast('Question updated!');
      } else {
        await api.post('/questions', payload);
        showToast('Question created!');
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      fetchQuestions(page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save question', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (q) => {
    setForm({ text: q.text, category: q.category, difficulty: q.difficulty, expectedAnswer: q.expectedAnswer || '', keywords: (q.keywords || []).join(', '), timeLimit: q.timeLimit || 120 });
    setEditId(q._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    setDeleting(id);
    try {
      await api.delete(`/questions/${id}`);
      showToast('Question deleted');
      fetchQuestions(page);
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const diffColor = { Easy: 'bg-green-900 text-green-300', Medium: 'bg-yellow-900 text-yellow-300', Hard: 'bg-red-900 text-red-300' };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="mb-1"><Link to="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link></div>
          <h1 className="text-2xl font-bold">Manage Questions</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} questions in database</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Question'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-4 border-primary-800">
          <h2 className="text-lg font-semibold">{editId ? 'Edit Question' : 'New Question'}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Question Text *</label>
            <textarea rows={3} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} className="input-field resize-none" placeholder="Enter the interview question..." required />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="input-field">
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Time Limit (sec)</label>
              <input type="number" value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: Number(e.target.value) })} className="input-field" min={30} max={600} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Expected Answer</label>
            <textarea rows={3} value={form.expectedAnswer} onChange={e => setForm({ ...form, expectedAnswer: e.target.value })} className="input-field resize-none" placeholder="Model answer for scoring..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Keywords (comma-separated)</label>
            <input type="text" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} className="input-field" placeholder="closure, scope, hoisting" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editId ? 'Update Question' : 'Create Question'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilterCat('')} className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${!filterCat ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${filterCat === c ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{c}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner fullScreen={false} /> : (
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">No questions found. Add your first question above.</div>
          ) : questions.map(q => (
            <div key={q._id} className="card hover:border-gray-700 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium mb-2 leading-relaxed">{q.text}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-gray-800 text-gray-300 text-xs">{q.category}</span>
                    <span className={`badge text-xs ${diffColor[q.difficulty]}`}>{q.difficulty}</span>
                    <span className="badge bg-gray-800 text-gray-400 text-xs">⏱ {q.timeLimit}s</span>
                    {q.createdBy && <span className="badge bg-gray-800 text-gray-400 text-xs">by {q.createdBy.name}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(q)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                  <button onClick={() => handleDelete(q._id)} disabled={deleting === q._id} className="btn-danger text-xs py-1.5 px-3">
                    {deleting === q._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => fetchQuestions(page - 1)} disabled={page === 1} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
          <span className="flex items-center px-4 text-sm text-gray-400">Page {page} of {pages}</span>
          <button onClick={() => fetchQuestions(page + 1)} disabled={page === pages} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
};

export default ManageQuestions;
