import '@testing-library/jest-dom'
import { vi } from 'vitest'

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

global.indexedDB = {
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
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  configurable: true,
})

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [],
    }),
  },
  configurable: true,
})

global.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
  constructor(text) {
    this.text = text
    this.lang = 'en-US'
    this.rate = 1
    this.pitch = 1
    this.voice = null
    this.onend = null
    this.onerror = null
  }
}

Object.defineProperty(window, 'speechSynthesis', {
  value: {
    getVoices: vi.fn(() => []),
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  },
  configurable: true,
})

global.AudioContext = class AudioContext {
  constructor() {
    this.destination = {}
  }
  createMediaStreamSource() {
    return { connect: vi.fn(), disconnect: vi.fn() }
  }
  createScriptProcessor() {
    return { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null }
  }
  close() {
    return Promise.resolve()
  }
}

vi.mock('vosk-browser', () => {
  class MockRecognizer {
    constructor() {
      this._handlers = new Map()
    }
    on(event, handler) {
      this._handlers.set(event, handler)
    }
    acceptWaveform() {}
    free() {}
  }

  return {
    createModel: vi.fn(async () => ({
      Recognizer: MockRecognizer,
      free: vi.fn(),
    })),
  }
})


// Suppress console warnings in tests
vi.spyOn(console, 'warn').mockImplementation(() => {})
