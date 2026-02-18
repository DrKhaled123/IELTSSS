import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Navigation from './components/Navigation'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load page components for better performance
const Reading = lazy(() => import('./pages/Reading'))
const Vocabulary = lazy(() => import('./pages/Vocabulary'))
const Grammar = lazy(() => import('./pages/Grammar'))
const Listening = lazy(() => import('./pages/Listening'))
const Speaking = lazy(() => import('./pages/Speaking'))
const Writing = lazy(() => import('./pages/Writing'))
const ContentLife = lazy(() => import('./pages/ContentLife'))
const Profile = lazy(() => import('./pages/Profile'))

const PageLoader = () => (
     <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '16px'
     }}>
          <div style={{
               width: '40px',
               height: '40px',
               border: '3px solid #e5e7eb',
               borderTop: '3px solid #2563eb',
               borderRadius: '50%',
               animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280' }}>Loading...</p>
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
                    padding: '32px',
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
        .card {
             border-radius: 16px;
             padding: 20px;
             box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .btn {
             transition: transform 0.08s ease, box-shadow 0.08s ease;
        }
        .btn:active {
             transform: scale(0.98);
             box-shadow: 0 0 0 rgba(0,0,0,0.1);
        }
        body {
             background-color: #0f172a;
             color: #e5e7eb;
        }
        :root {
             --color-primary: #2563eb;
             --color-secondary: #10b981;
             --color-accent: #f59e0b;
        }
               `}</style>
                    <ErrorBoundary>
                         <Suspense fallback={<PageLoader />}>
                              <Routes>
                                   <Route path="/" element={<Navigate to="/reading" replace />} />
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
                                   <Route path="/follow-up" element={
                                        <ErrorBoundary>
                                             <ContentLife />
                                        </ErrorBoundary>
                                   } />
                                   <Route path="/profile" element={
                                        <ErrorBoundary>
                                             <Profile />
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
