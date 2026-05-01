"use client";
import React from "react";

interface State { hasError: boolean; error: Error | null; count: number; }

const STORAGE_KEY = "gesturetalk-error-log";

function logError(error: Error, info: React.ErrorInfo) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const entry = {
      ts: new Date().toISOString(),
      message: error.message,
      stack: error.stack?.slice(0, 500),
      component: info.componentStack?.split("\n")[1]?.trim() ?? "unknown",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing.slice(-49), entry]));
  } catch { /* ignore */ }
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, count: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, info);
    this.setState(s => ({ count: s.count + 1 }));
    console.error("GestureTalk error:", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-6xl">🤟</div>
          <div className="text-center space-y-2 max-w-sm">
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-gray-400 text-sm">
              GestureTalk hit an unexpected error. Your conversation data is safe in localStorage.
            </p>
            {this.state.error && (
              <details className="text-left mt-3">
                <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400">
                  Error details (for developers)
                </summary>
                <pre className="text-xs text-red-400 bg-gray-900 rounded-lg p-3 mt-2 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={this.reset}
              className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl transition-colors min-h-[52px]"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors min-h-[52px] text-sm"
            >
              Reload app
            </button>
          </div>
          <p className="text-xs text-gray-700">Error {this.state.count} — logged locally</p>
        </div>
      );
    }
    return this.props.children;
  }
}
