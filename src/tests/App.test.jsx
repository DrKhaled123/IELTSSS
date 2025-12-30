import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

// Mocking modules that might cause issues in test environment
vi.mock('../hooks/useSpeechSynthesis', () => ({
     useSpeechSynthesis: () => ({
          speak: vi.fn(),
          cancel: vi.fn(),
          supported: true,
          voices: [],
          getGermanVoice: () => null,
          getEnglishVoice: () => null,
          getArabicVoice: () => null
     })
}))

vi.mock('../hooks/useSpeechRecognition', () => ({
     useSpeechRecognition: () => ({
          startListening: vi.fn(),
          stopListening: vi.fn(),
          resetTranscript: vi.fn(),
          isListening: false,
          transcript: '',
          supported: true
     })
}))

import { SharedDataProvider } from '../hooks/useSharedData'

describe('App Smoke Tests', () => {
     it('renders without crashing', () => {
          render(
               <SharedDataProvider>
                    <BrowserRouter>
                         <App />
                    </BrowserRouter>
               </SharedDataProvider>
          )
          // Check if navigation link or branding remains
          expect(screen.getByText(/German Learn/i)).toBeInTheDocument()
     })
})
