import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md">
            The page encountered an error. Please try reloading or go back to home.
          </p>
          <div className="mt-6 flex gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary text-white font-bold px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Reload Page
            </button>
            <a 
              href="/"
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm inline-block"
            >
              Go to Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
