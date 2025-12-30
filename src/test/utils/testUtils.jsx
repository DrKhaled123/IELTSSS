import { render } from '@testing-library/react'
import { SharedDataProvider } from '../../hooks/useSharedData'

// Custom render function with providers
export function renderWithProviders(ui, { initialEntries = ['/'] } = {}) {
  function Wrapper({ children }) {
    return (
      <SharedDataProvider>
        {children}
      </SharedDataProvider>
    )
  }
  
  return render(ui, { wrapper: Wrapper })
}

// Re-export everything from RTL
export * from '@testing-library/react'