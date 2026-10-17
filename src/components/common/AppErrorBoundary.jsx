import React from 'react';

export default class AppErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('PoultryPro rendering failed', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return <main className="min-h-dvh bg-[#F8FAF9] flex items-center justify-center p-5">
      <div role="alert" className="max-w-lg rounded-2xl border bg-white p-6 space-y-4 text-[#1F2937]">
        <h1 className="text-xl font-bold">PoultryPro could not load this page</h1>
        <p className="text-sm">An unexpected page error occurred. Retry loading the page. If it continues, share the browser console error with support.</p>
        <button onClick={() => window.location.reload()} className="rounded-lg bg-[#15803D] px-4 py-3 text-white">Reload page</button>
        <a href="/" className="ml-4 text-[#2563EB] underline">Go to homepage</a>
      </div>
    </main>;
  }
}
