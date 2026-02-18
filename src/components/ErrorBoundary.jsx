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
                    padding: '32px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        background: '#ffffff',
                        border: '1px solid #ef4444',
                        borderRadius: '12px',
                        padding: '32px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}>
                        <AlertTriangle 
                            size={48} 
                            style={{ 
                                color: '#ef4444',
                                marginBottom: '24px'
                            }} 
                        />
                        
                        <h2 style={{ 
                            color: '#1f2937',
                            marginBottom: '16px',
                            fontSize: '24px'
                        }}>
                            Something went wrong
                        </h2>
                        
                        <p style={{ 
                            color: '#6b7280',
                            marginBottom: '24px',
                            lineHeight: 1.6
                        }}>
                            {this.state.error?.message || 'An unexpected error occurred while loading this component.'}
                        </p>

                        {(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'development') && this.state.errorInfo && (
                            <details style={{
                                textAlign: 'left',
                                marginBottom: '24px',
                                background: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '16px'
                            }}>
                                <summary style={{
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    marginBottom: '8px',
                                    color: '#1f2937'
                                }}>
                                    Error Details (Development Only)
                                </summary>
                                <pre style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    overflow: 'auto',
                                    maxHeight: '200px',
                                    background: '#ffffff',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    {this.state.error && this.state.error.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    background: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#1d4ed8'
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#2563eb'
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
                                    gap: '8px',
                                    padding: '8px 16px',
                                    background: '#ffffff',
                                    color: '#1f2937',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#f3f4f6'
                                    e.target.style.borderColor = '#2563eb'
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#ffffff'
                                    e.target.style.borderColor = '#e5e7eb'
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
