import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Navigation from './components/Navigation'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load page components for better performance
const PDFMaster = lazy(() => import('./pages/PDFMaster'))
const Reading = lazy(() => import('./pages/Reading'))
const Vocabulary = lazy(() => import('./pages/Vocabulary'))
const Grammar = lazy(() => import('./pages/Grammar'))
const Pronunciation = lazy(() => import('./pages/Pronunciation'))
const Listening = lazy(() => import('./pages/Listening'))
const Speaking = lazy(() => import('./pages/Speaking'))
const Writing = lazy(() => import('./pages/Writing'))
const ContentLife = lazy(() => import('./pages/ContentLife'))

// Loading component for route transitions
const PageLoader = () => (
     <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: 'var(--space-lg)'
     }}>
          <div style={{
               width: '40px',
               height: '40px',
               border: '3px solid var(--color-border)',
               borderTop: '3px solid var(--color-primary)',
               borderRadius: '50%',
               animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
     </div>
)

function App() {
     return (
          <div className="app-container" style={{
               minHeight: '100vh',
               display: 'flex',
               flexDirection: 'column'
          }}>
               <Navigation />
               <main className="main-content" style={{
                    flex: 1,
                    padding: 'var(--space-xl)',
                    width: '100%',
                    maxWidth: '1600px', // Limit max width for large screens
                    margin: '0 auto'  // Center content area
               }}>
                    <style>{`
                    .app-container {
                         padding-left: 280px; /* Sidebar width */
                    }
                    @media (max-width: 1024px) {
                         .app-container {
                              padding-left: 0;
                         }
                         .main-content {
                              padding-top: 60px !important; /* Space for mobile toggle */
                         }
                    }
               `}</style>
                    <ErrorBoundary>
                         <Suspense fallback={<PageLoader />}>
                              <Routes>
                                   <Route path="/" element={<Navigate to="/reading" replace />} />
                                   <Route path="/pdf-master" element={
                                        <ErrorBoundary>
                                             <PDFMaster />
                                        </ErrorBoundary>
                                   } />
                                   <Route path="/reading" element={
                                        <ErrorBoundary>
                                             <Reading />
                                        </ErrorBoundary>
                                   } />
                                   <Route path="/vocabulary" element={
                                        <ErrorBoundary>
                                             <Vocabulary />
                                        </ErrorBoundary>
                                   } />
                                   <Route path="/grammar" element={
                                        <ErrorBoundary>
                                             <Grammar />
                                        </ErrorBoundary>
                                   } />
                                   <Route path="/pronunciation" element={
                                        <ErrorBoundary>
                                             <Pronunciation />
                                        </ErrorBoundary>
                                   } />
                                   <Route path="/listening" element={
                                        <ErrorBoundary>
                                             <Listening />
                                        </ErrorBoundary>
                                   } />
                                   <Route path="/speaking" element={
                                        <ErrorBoundary>
                                             <Speaking />
                                        </ErrorBoundary>
                                   } />
                                   <Route path="/writing" element={
                                        <ErrorBoundary>
                                             <Writing />
                                        </ErrorBoundary>
                                   } />
                                   <Route path="/content" element={
                                        <ErrorBoundary>
                                             <ContentLife />
                                        </ErrorBoundary>
                                   } />
                              </Routes>
                         </Suspense>
                    </ErrorBoundary>
               </main>
          </div>
     )
}

export default App
