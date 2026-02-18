import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Navigation from '../../components/Navigation'
import { SharedDataProvider } from '../../hooks/useSharedData'

// Mock ProgressDashboard
vi.mock('../../components/ProgressDashboard', () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? (
      <div data-testid="progress-dashboard">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}))

describe('Navigation Component', () => {
  beforeEach(() => {
    // Reset window.matchMedia mock for flexible testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('should render navigation links correctly', () => {
    render(
      <SharedDataProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </SharedDataProvider>
    )

    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary')).toBeInTheDocument()
    expect(screen.getByText('Grammar')).toBeInTheDocument()
  })

  it('should render logo correctly', () => {
    render(
      <SharedDataProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </SharedDataProvider>
    )

    const logo = screen.getByText('German Learn')
    expect(logo).toBeInTheDocument()
  })

  it('should toggle mobile menu when button is clicked', () => {
    // Set mobile view
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(
      <SharedDataProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </SharedDataProvider>
    )

    // Mobile menu button should be accessible even if CSS hides it from visual layout in JSDOM
    const mobileMenuButton = screen.getByRole('button', { name: /open menu/i, hidden: true })
    expect(mobileMenuButton).toBeInTheDocument()

    // Click to open mobile menu
    fireEvent.click(mobileMenuButton)

    // Mobile menu should now be visible
    const mobileMenu = screen.getByRole('navigation', { name: /mobile navigation/i, hidden: true })
    expect(mobileMenu).toBeInTheDocument()
  })

  it('should open progress dashboard when button is clicked', () => {
    render(
      <SharedDataProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </SharedDataProvider>
    )

    const progressButton = screen.getByText('Progress')
    fireEvent.click(progressButton)

    expect(screen.getByTestId('progress-dashboard')).toBeInTheDocument()
  })

  it('should close mobile menu when link is clicked', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(
      <SharedDataProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </SharedDataProvider>
    )

    const mobileMenuButton = screen.getByRole('button', { name: /open menu/i, hidden: true })
    fireEvent.click(mobileMenuButton)

    const vocabularyLink = screen.getAllByText('Vocabulary')[1] // Second one is in mobile menu
    fireEvent.click(vocabularyLink)

    // Mobile menu should be closed (button label changes to Open menu)
    expect(screen.getByRole('button', { name: /open menu/i, hidden: true })).toBeInTheDocument()
  })

  it('should have correct active link styling', () => {
    render(
      <SharedDataProvider>
        <MemoryRouter initialEntries={['/vocabulary']}>
          <Navigation />
        </MemoryRouter>
      </SharedDataProvider>
    )

    const vocabularyLink = screen.getByRole('link', { name: 'Vocabulary' })
    expect(vocabularyLink).toHaveStyle({
      color: 'rgb(255, 255, 255)',
      background: 'rgb(231, 176, 8)'
    })
  })
})
