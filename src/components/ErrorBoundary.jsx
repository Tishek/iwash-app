import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    try { console.error('[ErrorBoundary] error:', error); } catch {}
    try { console.error('[ErrorBoundary] info:', info?.componentStack || info); } catch {}
    if (typeof this.props.onError === 'function') {
      try { this.props.onError(error, info); } catch {}
    }
  }

  render() {
    if (this.state.hasError) {
      // Nerenderuj nic rušivého; jen nechej app dál běžet
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

