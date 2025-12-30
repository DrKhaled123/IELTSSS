import { NavLink } from 'react-router-dom'
import { BookOpen, Headphones, Mic, FileText, Brain, Globe, Menu, X, BarChart3, PenTool, Calendar, GraduationCap, Languages } from 'lucide-react'
import { useState, useCallback, useMemo, memo } from 'react'
import ProgressDashboard from './ProgressDashboard'

// Grouped navigation links
const navigationGroups = [
     {
          title: "Core Skills",
          icon: Brain,
          items: [
               { path: '/vocabulary', label: 'Vocabulary', icon: Brain, color: 'hsl(45, 93%, 47%)' },
               { path: '/grammar', label: 'Grammar', icon: Globe, color: 'hsl(330, 85%, 56%)' },
               { path: '/pdf-master', label: 'PDF Master', icon: FileText, color: 'hsl(250, 84%, 54%)' },
               { path: '/pronunciation', label: 'Pronunciation', icon: Mic, color: 'hsl(180, 77%, 47%)' },
               { path: '/content', label: 'Content', icon: Calendar, color: 'hsl(30, 90%, 55%)' },
          ]
     },
     {
          title: "IELTS Preparation",
          icon: GraduationCap,
          items: [
               { path: '/speaking', label: 'Speaking', icon: Mic, color: 'hsl(250, 84%, 54%)' },
               { path: '/writing', label: 'Writing', icon: PenTool, color: 'hsl(280, 84%, 54%)' },
               { path: '/listening', label: 'Listening', icon: Headphones, color: 'hsl(199, 89%, 48%)' },
               { path: '/reading', label: 'Reading', icon: BookOpen, color: 'hsl(142, 71%, 45%)' },
          ]
     }
]

// Memoized NavLink component
const OptimizedNavLink = memo(({ path, label, icon: Icon, color, onClick }) => {
     const linkStyle = useCallback(({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          padding: 'var(--space-md) var(--space-lg)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 'var(--font-medium)',
          color: isActive ? 'white' : 'var(--color-text-secondary)',
          background: isActive ? color : 'transparent',
          border: isActive ? 'none' : '1px solid transparent',
          transition: 'all var(--transition-fast)',
          textDecoration: 'none',
          marginBottom: 'var(--space-xs)',
          width: '100%'
     }), [color])

     return (
          <NavLink
               to={path}
               style={linkStyle}
               onClick={onClick}
               onMouseEnter={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                         e.currentTarget.style.background = 'var(--color-surface-hover)'
                    }
               }}
               onMouseLeave={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                         e.currentTarget.style.background = 'transparent'
                    }
               }}
          >
               <Icon size={20} />
               <span>{label}</span>
          </NavLink>
     )
})

OptimizedNavLink.displayName = 'OptimizedNavLink'

const Navigation = memo(function Navigation() {
     const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
     const [showProgressDashboard, setShowProgressDashboard] = useState(false)

     const handleMobileMenuToggle = useCallback(() => {
          setMobileMenuOpen(prev => !prev)
     }, [])

     const handleProgressDashboardOpen = useCallback(() => {
          setShowProgressDashboard(true)
          setMobileMenuOpen(false)
     }, [])

     const handleProgressDashboardClose = useCallback(() => {
          setShowProgressDashboard(false)
     }, [])

     return (
          <>
               {/* Mobile Toggle Button */}
               <button
                    className="mobile-menu-btn"
                    onClick={handleMobileMenuToggle}
                    style={{
                         position: 'fixed',
                         top: 'var(--space-md)',
                         right: 'var(--space-md)',
                         zIndex: 1000,
                         background: 'var(--color-surface)',
                         border: '1px solid var(--color-border)',
                         borderRadius: 'var(--radius-md)',
                         padding: 'var(--space-sm)',
                         boxShadow: 'var(--shadow-md)',
                         display: 'none' // Hidden by default (desktop)
                    }}
               >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
               </button>

               {/* Sidebar Container */}
               <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '280px',
                    background: 'var(--color-surface)', // Solid background
                    borderRight: '1px solid var(--color-border)',
                    padding: 'var(--space-lg)',
                    overflowY: 'auto',
                    zIndex: 'var(--z-fixed)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out',
                    // Mobile handling in CSS
               }}>
                    {/* Logo area */}
                    <div style={{
                         marginBottom: 'var(--space-xl)',
                         paddingBottom: 'var(--space-lg)',
                         borderBottom: '1px solid var(--color-border)'
                    }}>
                         <div style={{
                              fontSize: 'var(--font-xl)',
                              fontWeight: 'var(--font-bold)',
                              background: 'var(--gradient-primary)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                         }}>
                              IELTS Prep
                         </div>
                    </div>

                    {/* Navigation Groups */}
                    <div style={{ flex: 1 }}>
                         {navigationGroups.map((group, index) => (
                              <div key={index} style={{ marginBottom: 'var(--space-xl)' }}>
                                   <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        color: 'var(--color-text-tertiary)',
                                        fontSize: 'var(--font-sm)',
                                        fontWeight: 'var(--font-bold)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginBottom: 'var(--space-sm)',
                                        paddingLeft: 'var(--space-md)'
                                   }}>
                                        <group.icon size={14} />
                                        {group.title}
                                   </div>
                                   <div>
                                        {group.items.map((item) => (
                                             <OptimizedNavLink
                                                  key={item.path}
                                                  {...item}
                                                  onClick={() => setMobileMenuOpen(false)}
                                             />
                                        ))}
                                   </div>
                              </div>
                         ))}
                    </div>

                    {/* Bottom Utility Area */}
                    <div style={{
                         marginTop: 'auto',
                         borderTop: '1px solid var(--color-border)',
                         paddingTop: 'var(--space-lg)'
                    }}>
                         <button
                              onClick={handleProgressDashboardOpen}
                              style={{
                                   width: '100%',
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: 'var(--space-md)',
                                   padding: 'var(--space-md) var(--space-lg)',
                                   borderRadius: 'var(--radius-md)',
                                   background: 'var(--color-bg-elevated)',
                                   border: '1px solid var(--color-border)',
                                   color: 'var(--color-text)',
                                   cursor: 'pointer',
                                   fontWeight: 'var(--font-medium)'
                              }}
                         >
                              <BarChart3 size={20} />
                              Dashboard
                         </button>
                    </div>
               </nav>

               {/* Mobile Overlay */}
               {mobileMenuOpen && (
                    <div
                         onClick={() => setMobileMenuOpen(false)}
                         style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(0,0,0,0.5)',
                              zIndex: 'var(--z-fixed)' - 1,
                              backdropFilter: 'blur(2px)'
                         }}
                    />
               )}

               <style>{`
                    @media (max-width: 1024px) {
                         .sidebar {
                              transform: translateX(-100%);
                              box-shadow: var(--shadow-xl);
                         }
                         .sidebar.open {
                              transform: translateX(0);
                         }
                         .mobile-menu-btn {
                              display: flex !important;
                         }
                    }
               `}</style>

               <ProgressDashboard
                    isOpen={showProgressDashboard}
                    onClose={handleProgressDashboardClose}
               />
          </>
     )
})

Navigation.displayName = 'Navigation'

export default Navigation
