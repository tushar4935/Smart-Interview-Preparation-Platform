import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '🤖', title: 'AI-Scored Answers', desc: 'Get instant keyword-based scoring and detailed feedback on every answer.' },
  { icon: '📂', title: 'Multi-Category Prep', desc: 'JavaScript, React, Node.js, Python, DSA, System Design, Behavioral & more.' },
  { icon: '📄', title: 'Resume Management', desc: 'Upload, manage, and set your default resume in PDF/DOC formats.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Track progress, visualize scores, and identify weak areas over time.' },
  { icon: '🕐', title: 'Timed Interviews', desc: 'Simulate real interview pressure with configurable time limits.' },
  { icon: '🏆', title: 'Performance History', desc: 'Review all past interviews and compare your improvement trajectory.' },
];

const categories = ['JavaScript', 'React', 'Node.js', 'Python', 'DSA', 'System Design', 'Behavioral', 'SQL'];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-gray-950 to-accent-600/10 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary-900/50 border border-primary-700/50 rounded-full px-4 py-1.5 text-sm text-primary-300 mb-6">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            Trusted by 10,000+ job seekers
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 leading-tight">
            Ace Your Next
            <span className="block bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text text-transparent">
              Tech Interview
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice with real-world questions, get instant AI feedback, track your progress,
            and land your dream job faster with our comprehensive interview preparation platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link to="/interviews" className="btn-primary text-lg py-3 px-8">Start Practice</Link>
                <Link to="/dashboard" className="btn-secondary text-lg py-3 px-8">View Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg py-3 px-8">Start Free Today</Link>
                <Link to="/login" className="btn-secondary text-lg py-3 px-8">Sign In</Link>
              </>
            )}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {categories.map(cat => (
              <span key={cat} className="badge bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1 text-sm">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['500+', 'Interview Questions'], ['12+', 'Tech Categories'], ['10K+', 'Users Trained'], ['95%', 'Success Rate']].map(([n, l]) => (
            <div key={l}>
              <p className="text-4xl font-extrabold text-primary-400 mb-1">{n}</p>
              <p className="text-gray-400 text-sm">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-gray-400 max-w-xl mx-auto">A complete ecosystem built to help you prepare, practice, and perform at your peak.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card hover:border-primary-700 transition-colors group">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-400 transition-colors">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center card border-primary-800 bg-gradient-to-br from-primary-900/30 to-accent-900/20">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Hired?</h2>
          <p className="text-gray-400 mb-8">Join thousands of developers who used InterviewPrep to land their dream jobs.</p>
          {user ? (
            <Link to="/interviews" className="btn-primary text-lg py-3 px-10">Start Mock Interview</Link>
          ) : (
            <Link to="/register" className="btn-primary text-lg py-3 px-10">Create Free Account</Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 InterviewPrep Platform. Built with React, Node.js & MongoDB.</p>
      </footer>
    </div>
  );
};

export default Home;
