import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We&apos;ve encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 text-left text-xs overflow-auto max-w-full rounded border border-gray-300 dark:border-gray-700">
              {this.state.error && this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

export default ErrorBoundary;
