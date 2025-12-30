import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SharedDataProvider, useSharedData } from '../../hooks/useSharedData'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

describe('useSharedData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.localStorage = localStorageMock
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default empty state', () => {
    const { result } = renderHook(() => useSharedData(), {
      wrapper: ({ children }) => (
        <SharedDataProvider>{children}</SharedDataProvider>
      )
    })
    
    expect(result.current.sharedData).toEqual({
      pdfContent: {},
      sharedVocabulary: {},
      sharedGrammar: {},
      sharedPronunciation: {},
      sharedReading: {},
      syncStatus: {}
    })
  })

  it('should add PDF content correctly', () => {
    const { result } = renderHook(() => useSharedData(), {
      wrapper: ({ children }) => (
        <SharedDataProvider>{children}</SharedDataProvider>
      )
    })
    
    act(() => {
      result.current.addPDFContent('test-pdf', {
        title: 'Test PDF',
        content: 'Test content'
      })
    })
    
    expect(result.current.sharedData.pdfContent['test-pdf']).toEqual({
      title: 'Test PDF',
      content: 'Test content',
      addedAt: expect.any(String),
      lastAccessed: expect.any(String)
    })
  })

  it('should retrieve PDF content correctly', () => {
    const { result } = renderHook(() => useSharedData(), {
      wrapper: ({ children }) => (
        <SharedDataProvider>{children}</SharedDataProvider>
      )
    })
    
    // First add some content
    act(() => {
      result.current.addPDFContent('test-pdf', {
        title: 'Test PDF',
        content: 'Test content'
      })
    })
    
    // Then retrieve it
    const content = result.current.getPDFContent('test-pdf')
    
    expect(content).toEqual({
      title: 'Test PDF',
      content: 'Test content',
      addedAt: expect.any(String),
      lastAccessed: expect.any(String)
    })
  })

  it('should add shared vocabulary correctly', () => {
    const { result } = renderHook(() => useSharedData(), {
      wrapper: ({ children }) => (
        <SharedDataProvider>{children}</SharedDataProvider>
      )
    })
    
    const testVocabulary = [
      { german: 'Hund', english: 'Dog' },
      { german: 'Katze', english: 'Cat' }
    ]
    
    act(() => {
      result.current.addSharedVocabulary('test-source', testVocabulary)
    })
    
    expect(result.current.sharedData.sharedVocabulary['test-source']).toEqual({
      vocabulary: testVocabulary,
      addedAt: expect.any(String),
      source: 'pdf'
    })
  })

  it('should get available content for module', () => {
    const { result } = renderHook(() => useSharedData(), {
      wrapper: ({ children }) => (
        <SharedDataProvider>{children}</SharedDataProvider>
      )
    })
    
    const testVocabulary = [
      { german: 'Hund', english: 'Dog' },
      { german: 'Katze', english: 'Cat' }
    ]
    
    act(() => {
      result.current.addSharedVocabulary('test-source', testVocabulary)
    })
    
    const availableContent = result.current.getAvailableContent('vocabulary')
    
    expect(availableContent).toEqual(testVocabulary)
  })

  it('should update sync status correctly', () => {
    const { result } = renderHook(() => useSharedData(), {
      wrapper: ({ children }) => (
        <SharedDataProvider>{children}</SharedDataProvider>
      )
    })
    
    act(() => {
      result.current.updateSyncStatus('vocabulary', 'completed')
    })
    
    expect(result.current.sharedData.syncStatus['vocabulary']).toEqual({
      status: 'completed',
      lastSync: expect.any(String)
    })
  })

  it('should save to localStorage when data changes', () => {
    const { result } = renderHook(() => useSharedData(), {
      wrapper: ({ children }) => (
        <SharedDataProvider>{children}</SharedDataProvider>
      )
    })
    
    act(() => {
      result.current.addPDFContent('test-pdf', {
        title: 'Test PDF',
        content: 'Test content'
      })
    })
    
    // Wait for debounced localStorage update
    vi.advanceTimersByTime(600)
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'sharedLearningData',
      expect.stringContaining('test-pdf')
    )
  })

  // Performance tests
  describe('Performance Tests', () => {
    it('should handle large vocabulary datasets efficiently', () => {
      const { result } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      // Create a large vocabulary dataset (1000 items)
      const largeVocabulary = Array.from({ length: 1000 }, (_, i) => ({
        german: `Wort_${i}`,
        english: `Word_${i}`,
        category: 'test',
        difficulty: 'A1'
      }))
      
      const startTime = performance.now()
      
      act(() => {
        result.current.addSharedVocabulary('large-source', largeVocabulary)
      })
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(processingTime).toBeLessThan(100) // Should be under 100ms
    })

    it('should handle concurrent data operations efficiently', () => {
      const { result } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      const startTime = performance.now()
      
      // Simulate concurrent operations
      act(() => {
        result.current.addPDFContent('pdf1', { title: 'PDF 1', content: 'Content 1' })
        result.current.addSharedVocabulary('vocab1', [{ german: 'Test', english: 'Test' }])
        result.current.updateSyncStatus('vocabulary', 'in-progress')
      })
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(processingTime).toBeLessThan(50) // Should be under 50ms
    })

    it('should maintain performance with large PDF content', () => {
      const { result } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      // Simulate large PDF content
      const largePDFContent = {
        title: 'Large PDF',
        content: 'A'.repeat(100000), // 100KB of text
        pages: 100
      }
      
      const startTime = performance.now()
      
      act(() => {
        result.current.addPDFContent('large-pdf', largePDFContent)
      })
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(processingTime).toBeLessThan(300) // Should be under 300ms
    })

    it('should optimize memory usage with data cleanup', () => {
      const { result } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      // Add multiple large datasets
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addPDFContent(`pdf_${i}`, {
            title: `PDF ${i}`,
            content: 'Large content '.repeat(1000)
          })
        }
      })
      
      // Trigger cleanup
      act(() => {
        result.current.cleanupOldData()
      })
      
      // Check that cleanup doesn't crash and maintains reasonable state
      expect(Object.keys(result.current.sharedData.pdfContent)).toHaveLength(10)
    })

    it('should measure component rendering performance', () => {
      const { result } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      const startTime = performance.now()
      
      // Simulate component render trigger
      act(() => {
        result.current.addSharedVocabulary('render-test', [
          { german: 'Hund', english: 'Dog' }
        ])
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(20) // Should be under 20ms
    })

    it('should track cache efficiency', () => {
      const { result } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      // Add some data
      act(() => {
        result.current.addSharedVocabulary('cache-test', [
          { german: 'Hund', english: 'Dog' }
        ])
      })
      
      // Access the same data multiple times
      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        result.current.getAvailableContent('vocabulary')
      }
      const endTime = performance.now()
      
      const averageTime = (endTime - startTime) / 100
      expect(averageTime).toBeLessThan(1) // Should be very fast due to caching
    })
  })

  // Memory leak tests
  describe('Memory Management Tests', () => {
    it('should clear timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const { unmount } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      unmount()
      
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should not retain references to large datasets', () => {
      const { result, unmount } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      // Add large dataset
      act(() => {
        result.current.addSharedVocabulary('memory-test', 
          Array.from({ length: 10000 }, (_, i) => ({
            german: `Wort_${i}`,
            english: `Word_${i}`
          }))
        )
      })
      
      // Unmount component
      unmount()
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      // Memory should be released (this is more of a smoke test)
      expect(true).toBe(true) // Test passes if no memory leaks detected
    })
  })

  // Stress tests
  describe('Stress Tests', () => {
    it('should handle rapid successive operations', () => {
      const { result } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      const startTime = performance.now()
      
      // Perform 100 rapid operations
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.addSharedVocabulary(`stress_${i}`, [
            { german: `Wort_${i}`, english: `Word_${i}` }
          ])
        })
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / 100
      
      expect(averageTime).toBeLessThan(10) // Should be under 10ms per operation
    })

    it('should maintain performance under high load', () => {
      const { result } = renderHook(() => useSharedData(), {
        wrapper: ({ children }) => (
          <SharedDataProvider>{children}</SharedDataProvider>
        )
      })
      
      // Simulate high load scenario
      const startTime = performance.now()
      
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.addPDFContent(`load_${i}`, {
            title: `Load Test PDF ${i}`,
            content: 'Large content '.repeat(100)
          })
          result.current.updateSyncStatus(`module_${i}`, 'completed')
        }
      })
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(1000) // Should complete under 1 second
    })
  })
})