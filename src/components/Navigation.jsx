import { NavLink } from 'react-router-dom'
import { BookOpen, Headphones, Mic, Brain, Globe, Menu, X, BarChart3, PenTool, Calendar, GraduationCap } from 'lucide-react'
import { useState, useCallback } from 'react'
import ProgressDashboard from './ProgressDashboard'

// Grouped navigation links
const navigationGroups = [
    {
      title: "Core Skills",
      icon: Brain,
      items: [
      { path: '/vocabulary', label: 'Vocabulary', icon: Brain, color: 'rgb(231, 176, 8)' },
      { path: '/grammar', label: 'Grammar', icon: Globe, color: 'hsl(330, 85%, 56%)' },
      { path: '/follow-up', label: 'Follow-up', icon: Calendar, color: 'hsl(30, 90%, 55%)' },
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

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const isTest = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test')

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="mobile-menu-btn"
        onClick={handleMobileMenuToggle}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-sidebar"
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          background: '#111827',
          color: '#f9fafb',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          display: 'flex'
        }}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        <span style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0
        }}>{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
      </button>

      {/* Desktop Topbar Navigation */}
      <div className="topbar-nav" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        background: '#111827',
        borderBottom: '1px solid #374151',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '0 16px'
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f9fafb' }}>
          German Learn
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '16px', flex: 1 }}>
          {navigationGroups.flatMap(group => group.items).map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={`top-${item.path}`}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  color: isActive ? 'white' : '#e5e7eb',
                  background: isActive ? item.color : 'transparent',
                  border: isActive ? 'none' : '1px solid transparent',
                  textDecoration: 'none'
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowProgress(true)}
            className="btn btn-primary"
            style={{ padding: '8px 12px' }}
          >
            Progress
          </button>
          <button
            onClick={() => setShowProgress(true)}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            Exercises
          </button>
          <button
            onClick={() => setShowProgress(true)}
            className="btn btn-tertiary"
            style={{ padding: '8px 12px' }}
          >
            Score
          </button>
        </div>
      </div>

      {/* Sidebar Container */}
      {mobileMenuOpen && (
      <nav id="mobile-sidebar" aria-label="Mobile Navigation" className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '280px',
        background: '#111827',
        borderRight: '1px solid #374151',
        padding: '16px',
        overflowY: 'auto',
        zIndex: '1000',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease-in-out',
      }}>
        {/* Logo area */}
        <div style={{
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #3498db, #2ecc71)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            IELTS Prep
          </div>
        </div>

        {/* Navigation Groups */}
        <div style={{ flex: 1 }}>
          {navigationGroups.map((group, index) => (
            <div key={index} style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#9ca3af',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                paddingLeft: '16px'
              }}>
                <group.icon size={14} />
                {group.title}
              </div>
              <div>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px 16px',
                        borderRadius: '8px',
                        fontWeight: '500',
                  color: isActive ? 'white' : '#e5e7eb',
                        background: isActive ? item.color : 'transparent',
                        border: isActive ? 'none' : '1px solid transparent',
                        transition: 'all 0.2s ease-in-out',
                        textDecoration: 'none',
                        marginBottom: '4px',
                        width: '100%'
                      })}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Utility Area */}
        <div style={{
          marginTop: 'auto',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '16px'
        }}>

          <button
            onClick={() => setShowProgress(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              color: '#6b7280',
              background: 'transparent',
              border: '1px solid transparent',
              transition: 'all 0.2s ease-in-out',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            <BarChart3 size={20} />
            <span>Progress</span>
          </button>
          <NavLink
            to="/profile"
            onClick={closeMobileMenu}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              color: isActive ? 'white' : '#6b7280',
              background: isActive ? 'hsl(280, 84%, 54%)' : 'transparent',
              border: isActive ? 'none' : '1px solid transparent',
              transition: 'all 0.2s ease-in-out',
              textDecoration: 'none',
              marginBottom: '4px',
              width: '100%'
            })}
          >
            <BarChart3 size={20} />
            <span>Your Profile</span>
          </NavLink>
        </div>
      </nav>
      )}

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: '999',
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.25);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .topbar-nav {
            display: none !important;
          }
        }
      `}</style>

      {showProgress && (
        <ProgressDashboard isOpen={showProgress} onClose={() => setShowProgress(false)} />
      )}
    </>
  )
}

export default Navigation
