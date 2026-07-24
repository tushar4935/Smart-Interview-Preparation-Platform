import React from 'react';

// catches render crashes so one broken page doesn't blank the whole app
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-4">😵</div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">The page hit an unexpected error. Reloading usually fixes it.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Reload page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
