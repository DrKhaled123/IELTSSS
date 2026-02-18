import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import { SharedDataProvider } from '../../hooks/useSharedData'

vi.mock('../../pages/Reading', () => ({
  default: () => <div>Interactive Reading Module</div>,
}))

vi.mock('../../pages/Vocabulary', () => ({
  default: () => <div>Advanced Vocabulary System</div>,
}))

// Mock ProgressDashboard integration
vi.mock('../../components/ProgressDashboard', () => ({
  default: () => <div data-testid="progress-dashboard">Mock Dashboard</div>
}))

vi.mock('../../hooks/useVocabularySearch', () => ({
  useVocabularySearch: () => ({
    results: [],
    loading: false,
    searchTerm: '',
    setSearchTerm: vi.fn(),
    options: { filters: {}, sort: {} }
  })
}))

vi.mock('../../hooks/useVocabularyGames', () => ({
  useVocabularyGames: () => ({
    gameState: { gameActive: false, score: 0, answers: [] },
    startGame: vi.fn(),
    endGame: vi.fn(),
    submitAnswer: vi.fn(),
    GAME_TYPES: { FLASHCARD: 'flashcard', QUIZ: 'quiz' }
  })
}))

vi.mock('../../hooks/useVocabularyAnalytics', () => ({
  useVocabularyAnalytics: () => ({
    stats: { totalWords: 0, masteryRate: 0 },
    getDailyStats: () => [],
    getWordStrengthData: () => []
  })
}))

vi.mock('../../hooks/usePDFVocabularyExtractor', () => ({
  usePDFVocabularyExtractor: () => ({
    extractorState: { isExtracting: false, progress: 0 },
    extractFromPDF: vi.fn().mockResolvedValue([])
  })
}))

vi.mock('../../hooks/useSpeechSynthesis', () => ({
  useSpeechSynthesis: () => ({ speak: vi.fn(), supported: true })
}))

vi.mock('../../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({ startListening: vi.fn(), supported: true })
}))

// Mock PDF processing hooks
vi.mock('../../hooks/usePDFProcessor', () => ({
  usePDFProcessor: () => ({
    processingState: { isLoading: false, progress: 0, error: null },
    quickScan: vi.fn().mockResolvedValue({
      fullText: 'Sample PDF Content with some German words like Apfel and Haus.',
      title: 'Test PDF',
      pageCount: 1,
      wordCount: 10
    }),
    searchInPDF: vi.fn().mockResolvedValue([])
  })
}))

vi.mock('../../hooks/useProgressTracking', () => ({
  useProgressTracking: () => ({
    trackProgress: vi.fn(),
    progress: { vocabulary: [], stats: { streakDays: 0, wordsMastered: 0, totalStudyTime: 0 } },
    calculateOverallProgress: () => ({
      overallProgress: 0,
      totalActivities: 0,
      achievements: [],
      streak: 0
    }),
    getProgressStats: () => ({ academicGoal: 7.5, currentLevel: 6.5 })
  })
}))

describe('App Navigation Integration', () => {
  beforeEach(() => {
    // Basic local storage mock
    const store = {}
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString() }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
      removeItem: vi.fn((key) => { delete store[key] })
    }
    vi.clearAllMocks()
  })

  const TestApp = () => (
    <SharedDataProvider>
      <App />
    </SharedDataProvider>
  )

  it('should render the learning workflow routes', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/vocabulary']}>
        <TestApp />
      </MemoryRouter>
    )

    await screen.findByText('Advanced Vocabulary System', {}, { timeout: 20000 })

    unmount()

    render(
      <MemoryRouter initialEntries={['/reading']}>
        <TestApp />
      </MemoryRouter>
    )

    await screen.findByText(/Interactive Reading Module/i, {}, { timeout: 20000 })
  })
})
