import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Resume = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const { showToast } = useAuth();

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resumes');
      setResumes(data.resumes);
    } catch {
      showToast('Failed to load resumes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResumes(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      return showToast('Only PDF and Word documents allowed', 'error');
    }
    if (file.size > 5 * 1024 * 1024) {
      return showToast('File must be under 5MB', 'error');
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      await api.post('/resumes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Resume uploaded successfully!');
      fetchResumes();
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      showToast('Resume deleted');
      fetchResumes();
    } catch {
      showToast('Failed to delete resume', 'error');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/resumes/${id}/default`);
      showToast('Set as default resume');
      fetchResumes();
    } catch {
      showToast('Failed to update default', 'error');
    }
  };

  const getIcon = (mime) => {
    if (mime === 'application/pdf') return '📄';
    return '📝';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Resume Manager</h1>
        <p className="text-gray-400">Upload and manage your resumes. Supports PDF, DOC, DOCX (max 5MB).</p>
      </div>

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`card border-2 border-dashed cursor-pointer transition-all text-center py-12 mb-8 ${dragOver ? 'border-primary-500 bg-primary-900/20' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900/50'}`}
      >
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleUpload(e.target.files[0])} />
        <div className="text-5xl mb-4">{uploading ? '⏳' : '📤'}</div>
        {uploading ? (
          <p className="text-gray-300 font-medium">Uploading your resume...</p>
        ) : (
          <>
            <p className="text-gray-200 font-semibold mb-1">Drop your resume here or click to browse</p>
            <p className="text-sm text-gray-500">PDF, DOC, DOCX — max 5MB</p>
          </>
        )}
      </div>

      {/* Resume list */}
      {resumes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">📂</p>
          <p className="font-medium mb-1">No resumes uploaded yet</p>
          <p className="text-sm">Upload your first resume above to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Resumes ({resumes.length})</h2>
          {resumes.map(r => (
            <div key={r._id} className={`card flex flex-col sm:flex-row sm:items-center gap-4 ${r.isDefault ? 'border-primary-700' : ''}`}>
              <div className="text-4xl">{getIcon(r.mimeType)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{r.originalName}</p>
                  {r.isDefault && <span className="badge bg-primary-900 text-primary-300 border border-primary-700 text-xs shrink-0">Default</span>}
                </div>
                <p className="text-xs text-gray-400">{formatSize(r.fileSize)} · Uploaded {new Date(r.uploadedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!r.isDefault && (
                  <button onClick={() => handleSetDefault(r._id)} className="btn-secondary text-xs py-1.5 px-3">
                    Set Default
                  </button>
                )}
                <a
                  href={`/uploads/resumes/${r.fileName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  View
                </a>
                <button onClick={() => handleDelete(r._id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resume;
