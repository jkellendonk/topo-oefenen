import { Component } from 'react'
import { clearQuizSession } from '../sessionStore.js'

class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Topo Oefenen crashed:', error, info)
  }

  reset = () => {
    // A corrupt in-progress session is the most likely repeat-crash cause; drop it defensively.
    clearQuizSession()
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="app">
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2>😵 Er ging iets mis</h2>
          <p className="sub">
            De app is vastgelopen. Probeer opnieuw te beginnen — je scores blijven gewoon bewaard.
          </p>
          <button className="start-btn" onClick={this.reset}>
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
