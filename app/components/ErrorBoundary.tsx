// components/ErrorBoundary.tsx
'use client';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6 text-center gap-6">
          <span className="text-6xl" aria-hidden="true">😕</span>
          <div>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm max-w-xs">
              GestureTalk encountered an unexpected error. This is usually caused by a temporary
              browser issue or a lost camera connection.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleReset}
              className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-semibold px-6 min-h-[44px] rounded-xl transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm px-6 min-h-[44px] rounded-xl transition-colors"
            >
              Reload page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre className="text-left text-xs text-red-400 bg-gray-900 border border-gray-800 rounded-lg p-4 max-w-lg overflow-auto max-h-48">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
