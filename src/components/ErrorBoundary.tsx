import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Catches render-time crashes and shows an actual message instead of a
 * silent blank page. Note: this does NOT catch errors thrown during
 * module import (like the createClient('') bug that caused today's blank
 * page — that fix lives in lib/supabase.ts, since it runs before React
 * even starts). This is the net for whatever crashes at render time next.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('App crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
            background: '#C4491A',
            color: '#fdf6ec',
            fontFamily: 'sans-serif',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 600 }}>Something broke while loading the page.</p>
          <p style={{ fontSize: 13, opacity: 0.85, maxWidth: 480 }}>
            Check the browser console (F12) for the actual error, or check your .env — a missing or
            invalid Supabase URL is a common cause.
          </p>
          <pre
            style={{
              fontSize: 11,
              opacity: 0.7,
              maxWidth: 560,
              overflow: 'auto',
              background: 'rgba(0,0,0,0.25)',
              padding: 12,
              borderRadius: 8,
            }}
          >
            {this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
