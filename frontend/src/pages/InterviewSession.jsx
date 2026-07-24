import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSpeech } from '../utils/useSpeech';
import { downloadInterviewReport } from '../utils/report';
import LoadingSpinner from '../components/LoadingSpinner';

const CODE_LANGS = ['javascript', 'python', 'java', 'cpp', 'typescript'];

const InterviewSession = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, showToast } = useAuth();

  const [interview, setInterview] = useState(location.state?.interview || null);
  const [loading, setLoading] = useState(!location.state?.interview);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [startTime, setStartTime] = useState(Date.now());
  const [sessionStartTime] = useState(Date.now());

  const answers = interview?.answers || [];
  const currentQ = answers[currentIndex];
  const isCode = currentQ?.type === 'code';

  const appendVoice = useCallback((text) => setAnswer((a) => (a ? `${a} ${text}` : text)), []);
  const speech = useSpeech(appendVoice);

  const questionTime = useMemo(() => {
    const fromQuestions = interview?.questions?.[currentIndex]?.timeLimit;
    return fromQuestions || (isCode ? 300 : 120);
  }, [interview, currentIndex, isCode]);

  useEffect(() => {
    if (!interview) {
      api.get(`/interviews/${id}`)
        .then((res) => setInterview(res.data.interview))
        .catch(() => showToast('Could not load interview', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, interview, showToast]);

  // per-question countdown; auto-submits when it hits zero
  useEffect(() => {
    if (completed || feedback) return undefined;
    setTimeLeft(questionTime);
    setStartTime(Date.now());
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, completed, feedback, questionTime]);

  const submitAnswer = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    if (speech.listening) speech.toggle();
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const { data } = await api.put(`/interviews/${id}/answer`, {
        questionIndex: currentIndex,
        userAnswer: answer,
        timeTaken,
        language: isCode ? language : undefined,
        followUp: true,
      });
      setFeedback(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit answer', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [id, currentIndex, answer, submitting, showToast, startTime, isCode, language, speech]);

  const nextQuestion = () => {
    if (currentIndex + 1 >= answers.length) {
      finishInterview();
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswer('');
      setFeedback(null);
    }
  };

  const finishInterview = async () => {
    try {
      const duration = Math.round((Date.now() - sessionStartTime) / 1000);
      const { data } = await api.put(`/interviews/${id}/complete`, { duration });
      setResults(data.interview);
      setCompleted(true);
    } catch {
      showToast('Failed to complete interview', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!interview) return <div className="text-center py-20 text-gray-400">Interview not found</div>;

  if (completed && results) {
    const pct = results.percentage;
    const grade = pct >= 80 ? { label: 'Excellent', color: 'text-green-400', emoji: '🏆' }
      : pct >= 60 ? { label: 'Good', color: 'text-blue-400', emoji: '👍' }
      : pct >= 40 ? { label: 'Average', color: 'text-yellow-400', emoji: '📚' }
      : { label: 'Needs Work', color: 'text-red-400', emoji: '💪' };
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 animate-slide-up">
        <div className="card text-center mb-6">
          <div className="text-6xl mb-4">{grade.emoji}</div>
          <h1 className="text-3xl font-extrabold mb-1">Interview Complete!</h1>
          <p className="text-gray-400 mb-6">{results.title}</p>
          <div className={`text-7xl font-extrabold mb-2 ${grade.color}`}>{pct}%</div>
          <p className={`text-xl font-semibold mb-6 ${grade.color}`}>{grade.label}</p>
          <div className="flex justify-center gap-8 text-sm text-gray-400 mb-8">
            <div><p className="text-2xl font-bold text-white">{results.totalScore}</p><p>Points Earned</p></div>
            <div><p className="text-2xl font-bold text-white">{results.answeredQuestions}</p><p>Answered</p></div>
            <div><p className="text-2xl font-bold text-white">{Math.round(results.duration / 60)}m</p><p>Duration</p></div>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">Dashboard</button>
            <button onClick={() => downloadInterviewReport(results, user?.name)} className="btn-secondary">⬇ PDF Report</button>
            <button onClick={() => navigate('/interviews')} className="btn-primary">New Interview</button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-5">Answer Review</h2>
          <div className="space-y-5">
            {results.answers.map((a, i) => (
              <div key={i} className={`border rounded-xl p-4 ${a.score >= 7 ? 'border-green-800 bg-green-900/10' : a.score >= 4 ? 'border-yellow-800 bg-yellow-900/10' : 'border-red-800 bg-red-900/10'}`}>
                <div className="flex justify-between items-start mb-2 gap-3">
                  <p className="font-medium text-sm flex-1">Q{i + 1}. {a.questionText}</p>
                  <span className={`font-bold text-lg shrink-0 ${a.score >= 7 ? 'text-green-400' : a.score >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>{a.score}/10</span>
                </div>
                {a.verdict && <p className="text-xs font-semibold text-gray-300 mb-2">{a.verdict}</p>}
                {a.userAnswer && <pre className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3 mb-2 whitespace-pre-wrap font-sans">{a.userAnswer}</pre>}
                <p className="text-xs text-gray-400 italic mb-2">{a.feedback || 'No feedback'}</p>
                {a.improvements?.length > 0 && (
                  <div className="text-xs text-amber-300/90">
                    <span className="font-semibold">To improve: </span>{a.improvements.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) return <div className="text-center py-20 text-gray-400">Loading question...</div>;
  const progress = ((currentIndex + (feedback ? 1 : 0)) / answers.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-semibold text-lg">{interview.title}</h1>
          <p className="text-sm text-gray-400">{interview.category} · {interview.difficulty}{isCode ? ' · Coding' : ''}</p>
        </div>
        <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-xl ${timeLeft <= 30 ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-gray-800 text-gray-200'}`}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Question {currentIndex + 1} of {answers.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full">
          <div className="h-2 bg-primary-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card mb-5">
        <div className="flex items-start gap-3">
          <span className="bg-primary-900 text-primary-300 rounded-lg px-2.5 py-1 text-sm font-mono font-bold shrink-0">Q{currentIndex + 1}</span>
          <p className="text-lg leading-relaxed font-medium">{currentQ.questionText}</p>
        </div>
      </div>

      {!feedback ? (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-300">{isCode ? 'Your Solution' : 'Your Answer'}</label>
            <div className="flex items-center gap-2">
              {isCode && (
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg text-xs px-2 py-1 text-gray-200">
                  {CODE_LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
              {!isCode && speech.supported && (
                <button
                  onClick={speech.toggle}
                  className={`text-xs py-1 px-2.5 rounded-lg border transition-colors ${speech.listening ? 'bg-red-900/40 border-red-700 text-red-300 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'}`}
                >
                  {speech.listening ? '● Listening' : '🎤 Voice'}
                </button>
              )}
            </div>
          </div>

          {isCode ? (
            <div className="rounded-xl overflow-hidden border border-gray-700">
              <Editor
                height="340px"
                theme="vs-dark"
                language={language}
                value={answer}
                onChange={(v) => setAnswer(v || '')}
                options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, tabSize: 2 }}
              />
            </div>
          ) : (
            <textarea
              rows={7}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="input-field resize-none"
              placeholder="Type your answer here... Be as detailed as possible."
            />
          )}

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">{answer.length} characters</span>
            <div className="flex gap-3">
              <button onClick={finishInterview} className="btn-secondary text-sm">End Interview</button>
              <button onClick={submitAnswer} disabled={submitting || !answer.trim()} className="btn-primary">
                {submitting ? 'Scoring...' : 'Submit Answer →'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`card border ${feedback.score >= 7 ? 'border-green-700 bg-green-900/10' : feedback.score >= 4 ? 'border-yellow-700 bg-yellow-900/10' : 'border-red-700 bg-red-900/10'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Feedback</h3>
              <span className={`badge text-[10px] ${feedback.source === 'ai' ? 'bg-accent-900/60 text-accent-300 border border-accent-700' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                {feedback.source === 'ai' ? '✨ AI graded' : 'Keyword graded'}
              </span>
            </div>
            <span className={`text-3xl font-extrabold ${feedback.score >= 7 ? 'text-green-400' : feedback.score >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
              {feedback.score}/10
            </span>
          </div>
          {feedback.verdict && <p className="text-sm font-semibold text-gray-200 mb-2">{feedback.verdict}</p>}
          <p className="text-gray-300 text-sm mb-4">{feedback.feedback}</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {feedback.strengths?.length > 0 && (
              <div className="bg-green-900/15 border border-green-800/60 rounded-xl p-3">
                <p className="text-xs font-semibold text-green-300 mb-1">Strengths</p>
                <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                  {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {feedback.improvements?.length > 0 && (
              <div className="bg-amber-900/15 border border-amber-800/60 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-300 mb-1">To Improve</p>
                <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                  {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>

          {feedback.followUp && (
            <div className="bg-primary-900/20 border border-primary-800/60 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-primary-300 mb-1">Interviewer follow-up</p>
              <p className="text-sm text-gray-200">{feedback.followUp}</p>
            </div>
          )}

          <button onClick={nextQuestion} className="btn-primary w-full">
            {currentIndex + 1 >= answers.length ? 'See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
