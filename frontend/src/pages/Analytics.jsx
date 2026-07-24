import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Cell,
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton } from '../components/Skeleton';

const scoreColor = (v) => (v >= 70 ? '#22c55e' : v >= 50 ? '#eab308' : '#ef4444');

const tooltipStyle = {
  contentStyle: { background: '#111827', border: '1px solid #374151', borderRadius: 12, fontSize: 12 },
  labelStyle: { color: '#9ca3af' },
};

const Analytics = () => {
  const { showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/analytics')
      .then((res) => setData(res.data))
      .catch(() => showToast('Could not load analytics', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h1 className="text-xl font-bold mb-2">No analytics yet</h1>
        <p className="text-gray-400 mb-6">Complete a few interviews and your strengths, weak areas, and progress will show up here.</p>
        <Link to="/interviews" className="btn-primary">Start an interview</Link>
      </div>
    );
  }

  const { categoryPerformance, difficultyPerformance, timeline, scoreDistribution, weakest, strongest, topImprovements, aiCoverage, avgTimePerQuestion } = data;
  const aiTotal = (aiCoverage?.ai || 0) + (aiCoverage?.keyword || 0);
  const aiPct = aiTotal ? Math.round((aiCoverage.ai / aiTotal) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Analytics</h1>
        <p className="text-gray-400">Where you're strong, where you're weak, and how you're trending.</p>
      </div>

      {/* highlight cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card border-red-800/60">
          <p className="text-xs text-gray-400 mb-1">Weakest area</p>
          {weakest ? (
            <>
              <p className="text-lg font-bold text-red-400">{weakest.category}</p>
              <p className="text-sm text-gray-400">{weakest.avgScore}% avg · {weakest.answered} answers</p>
            </>
          ) : <p className="text-gray-500">Not enough data</p>}
        </div>
        <div className="card border-green-800/60">
          <p className="text-xs text-gray-400 mb-1">Strongest area</p>
          {strongest ? (
            <>
              <p className="text-lg font-bold text-green-400">{strongest.category}</p>
              <p className="text-sm text-gray-400">{strongest.avgScore}% avg · {strongest.answered} answers</p>
            </>
          ) : <p className="text-gray-500">Not enough data</p>}
        </div>
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">Avg time / question</p>
          <p className="text-lg font-bold">{avgTimePerQuestion}s</p>
          <p className="text-sm text-gray-400">{aiPct}% AI-graded</p>
        </div>
      </div>

      {weakest && (
        <div className="card bg-primary-900/10 border-primary-800/50">
          <p className="text-sm">
            <span className="font-semibold text-primary-300">Suggestion: </span>
            Your lowest category is <span className="font-semibold">{weakest.category}</span> at {weakest.avgScore}%.
            Focus your next few sessions there to lift your overall score fastest.
          </p>
        </div>
      )}

      {/* category performance */}
      <div className="card">
        <h2 className="font-semibold mb-4">Category performance (avg score)</h2>
        {categoryPerformance.length === 0 ? (
          <p className="text-sm text-gray-500">Only "Mixed" interviews so far — pick a specific category to see this break down.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, categoryPerformance.length * 34)}>
            <BarChart data={categoryPerformance} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
              <YAxis type="category" dataKey="category" stroke="#9ca3af" fontSize={12} width={110} />
              <Tooltip {...tooltipStyle} cursor={{ fill: '#1f2937', opacity: 0.4 }} />
              <Bar dataKey="avgScore" radius={[0, 6, 6, 0]}>
                {categoryPerformance.map((c, i) => <Cell key={i} fill={scoreColor(c.avgScore)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* progress over time */}
        <div className="card">
          <h2 className="font-semibold mb-4">Progress over time</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeline} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* score distribution */}
        <div className="card">
          <h2 className="font-semibold mb-4">Answer score distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={scoreDistribution} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="range" stroke="#6b7280" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} />
              <Tooltip {...tooltipStyle} cursor={{ fill: '#1f2937', opacity: 0.4 }} />
              <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* difficulty */}
        <div className="card">
          <h2 className="font-semibold mb-4">Performance by difficulty</h2>
          <div className="space-y-3">
            {difficultyPerformance.map((d) => (
              <div key={d.difficulty}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{d.difficulty} <span className="text-gray-500">({d.count})</span></span>
                  <span className="font-semibold" style={{ color: scoreColor(d.avgScore) }}>{d.avgScore}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full">
                  <div className="h-2 rounded-full" style={{ width: `${d.avgScore}%`, background: scoreColor(d.avgScore) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* recurring improvements */}
        <div className="card">
          <h2 className="font-semibold mb-4">Most common improvement notes</h2>
          {topImprovements.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing recurring yet — keep practicing.</p>
          ) : (
            <ul className="space-y-2">
              {topImprovements.map((t, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 pr-3">{t.text}</span>
                  <span className="badge bg-amber-900/40 text-amber-300 border border-amber-800 shrink-0">×{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
