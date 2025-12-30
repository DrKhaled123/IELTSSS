import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console and potentially to error reporting service
        console.error('Error Boundary caught an error:', error, errorInfo)
        
        this.setState({
            error,
            errorInfo
        })

        // You could also send to an error reporting service here
        // logErrorToService(error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        
        // Optionally reload the page
        if (this.props.reloadOnReset) {
            window.location.reload()
        }
    }

    render() {
        if (this.state.hasError) {
            const { fallback } = this.props
            
            // If custom fallback is provided, use it
            if (fallback) {
                return typeof fallback === 'function' ? fallback(this.state.error) : fallback
            }

            // Default error UI
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    padding: 'var(--space-xl)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-error)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-xl)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <AlertTriangle 
                            size={48} 
                            style={{ 
                                color: 'var(--color-error)',
                                marginBottom: 'var(--space-lg)'
                            }} 
                        />
                        
                        <h2 style={{ 
                            color: 'var(--color-text)',
                            marginBottom: 'var(--space-md)',
                            fontSize: 'var(--font-xl)'
                        }}>
                            Something went wrong
                        </h2>
                        
                        <p style={{ 
                            color: 'var(--color-text-secondary)',
                            marginBottom: 'var(--space-lg)',
                            lineHeight: 1.6
                        }}>
                            {this.state.error?.message || 'An unexpected error occurred while loading this component.'}
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details style={{
                                textAlign: 'left',
                                marginBottom: 'var(--space-lg)',
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-md)'
                            }}>
                                <summary style={{
                                    cursor: 'pointer',
                                    fontWeight: 'var(--font-medium)',
                                    marginBottom: 'var(--space-sm)',
                                    color: 'var(--color-text)'
                                }}>
                                    Error Details (Development Only)
                                </summary>
                                <pre style={{
                                    fontSize: 'var(--font-sm)',
                                    color: 'var(--color-text-secondary)',
                                    overflow: 'auto',
                                    maxHeight: '200px',
                                    background: 'var(--color-bg)',
                                    padding: 'var(--space-sm)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    {this.state.error && this.state.error.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)',
                                    padding: 'var(--space-sm) var(--space-lg)',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    fontSize: 'var(--font-medium)',
                                    fontWeight: 'var(--font-medium)',
                                    transition: 'all var(--transition-fast)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--color-primary-hover)'
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'var(--color-primary)'
                                }}
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>

                            <button
                                onClick={() => window.history.back()}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)',
                                    padding: 'var(--space-sm) var(--space-lg)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    fontSize: 'var(--font-medium)',
                                    fontWeight: 'var(--font-medium)',
                                    transition: 'all var(--transition-fast)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--color-surface-hover)'
                                    e.target.style.borderColor = 'var(--color-primary)'
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'var(--color-surface)'
                                    e.target.style.borderColor = 'var(--color-border)'
                                }}
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary