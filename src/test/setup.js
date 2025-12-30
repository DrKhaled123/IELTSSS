import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB for tests
const indexedDB = {
  open: vi.fn(() => ({
    result: {
      objectStoreNames: {
        contains: vi.fn(() => false)
      },
      createObjectStore: vi.fn(() => ({}))
    },
    onsuccess: null,
    onerror: null
  }))
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Setup global mocks
global.indexedDB = indexedDB
global.localStorage = localStorageMock

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Suppress console warnings in tests
vi.spyOn(console, 'warn').mockImplementation(() => {})