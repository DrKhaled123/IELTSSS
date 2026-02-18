import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Optimized lazy loading hook for large JSON datasets
 * Splits vocabulary database into chunks for progressive loading
 */

const CHUNK_SIZE = 500 // Words per chunk
const PRELOAD_AHEAD = 2 // Number of chunks to preload ahead

export function useLazyVocabularyLoader() {
  const [data, setData] = useState(null)
  const [loadedChunks, setLoadedChunks] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  
  const chunksRef = useRef([])
  const abortControllerRef = useRef(null)

  const loadVocabulary = useCallback(async (options = {}) => {
    const { 
      onProgress = () => {},
      priorityCategories = ['academic', 'common'],
      lazy = true 
    } = options

    setIsLoading(true)
    setError(null)
    setProgress(0)

    // Cancel any previous loading
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const AC = (typeof window !== 'undefined' && window.AbortController)
      ? window.AbortController
      : (typeof globalThis !== 'undefined' && globalThis.AbortController ? globalThis.AbortController : null)
    abortControllerRef.current = AC ? new AC() : null

    try {
      // Dynamic import for code splitting
      const module = await import('../data/vocabulary-database.json')
      const vocabularyData = module.default || module
      const extraModule = await import('../data/vocabulary-extra.json')
      const vocabularyExtra = extraModule.default || extraModule

      const baseWords = vocabularyData?.words || vocabularyData?.vocabulary || []
      const extraWords = vocabularyExtra?.words || vocabularyExtra?.vocabulary || []
      if (!Array.isArray(baseWords)) {
        throw new Error('Invalid vocabulary data structure')
      }

      const mergedMap = new Map()
      baseWords.forEach((w) => {
        if (!w?.word) return
        mergedMap.set(String(w.word).toLowerCase(), w)
      })
      extraWords.forEach((w) => {
        if (!w?.word) return
        const key = String(w.word).toLowerCase()
        mergedMap.set(key, { ...mergedMap.get(key), ...w })
      })
      const allWords = Array.from(mergedMap.values())
      
      if (!lazy) {
        // Load all at once for small datasets
        setData({ ...vocabularyData, words: allWords })
        setLoadedChunks(1)
        setTotalChunks(1)
        setProgress(100)
        setIsLoading(false)
        return { ...vocabularyData, words: allWords }
      }

      // Split into chunks for progressive loading
      const chunks = []
      for (let i = 0; i < allWords.length; i += CHUNK_SIZE) {
        chunks.push(allWords.slice(i, i + CHUNK_SIZE))
      }

      chunksRef.current = chunks
      setTotalChunks(chunks.length)

      // Priority loading: Load high-priority categories first
      const priorityWords = allWords.filter(word => 
        priorityCategories.some(cat => 
          word.category?.toLowerCase().includes(cat.toLowerCase())
        )
      )

      // Load first chunk immediately
      const firstChunk = chunks[0] || []
      const initialData = {
        ...vocabularyData,
        words: [...firstChunk, ...priorityWords.slice(0, CHUNK_SIZE)],
        _loadedChunks: 1,
        _totalWords: allWords.length
      }

      setData(initialData)
      setLoadedChunks(1)
      setProgress(Math.round((1 / chunks.length) * 100))
      onProgress(1, chunks.length)

      // Load remaining chunks in background
      loadRemainingChunks(chunks, vocabularyData, onProgress)

      setIsLoading(false)
      return initialData

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load vocabulary:', err)
        setError(err.message || 'Failed to load vocabulary')
      }
      setIsLoading(false)
      throw err
    }
  }, [])

  const loadRemainingChunks = useCallback(async (chunks, fullData, onProgress) => {
    for (let i = 1; i < chunks.length; i++) {
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      // Add small delay between chunks to prevent blocking UI
      await new Promise(resolve => setTimeout(resolve, 50))

      setData(prev => {
        if (!prev) return null
        const newWords = [...prev.words, ...chunks[i]]
        return {
          ...prev,
          words: newWords,
          _loadedChunks: i + 1
        }
      })

      setLoadedChunks(i + 1)
      const newProgress = Math.round(((i + 1) / chunks.length) * 100)
      setProgress(newProgress)
      onProgress(i + 1, chunks.length)
    }
  }, [])

  const loadMore = useCallback(async (count = 1) => {
    const currentChunk = loadedChunks
    const targetChunk = Math.min(currentChunk + count, totalChunks)
    
    for (let i = currentChunk; i < targetChunk; i++) {
      if (chunksRef.current[i]) {
        setData(prev => {
          if (!prev) return null
          return {
            ...prev,
            words: [...prev.words, ...chunksRef.current[i]],
            _loadedChunks: i + 1
          }
        })
      }
    }
    
    setLoadedChunks(targetChunk)
  }, [loadedChunks, totalChunks])

  const searchInChunks = useCallback((query) => {
    if (!query || !chunksRef.current.length) return []
    
    const results = []
    const lowerQuery = query.toLowerCase()
    
    for (const chunk of chunksRef.current) {
      for (const word of chunk) {
        if (
          word.word?.toLowerCase().includes(lowerQuery) ||
          word.arabic?.toLowerCase().includes(lowerQuery) ||
          word.hindi?.toLowerCase().includes(lowerQuery) ||
          word.chinese?.toLowerCase().includes(lowerQuery) ||
          word.urdu?.toLowerCase().includes(lowerQuery) ||
          word.definition?.toLowerCase().includes(lowerQuery)
        ) {
          results.push(word)
          if (results.length >= 20) break // Limit results for performance
        }
      }
      if (results.length >= 20) break
    }
    
    return results
  }, [])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    progress,
    loadedChunks,
    totalChunks,
    loadVocabulary,
    loadMore,
    searchInChunks,
    isComplete: loadedChunks === totalChunks && totalChunks > 0
  }
}

/**
 * Preload critical vocabulary categories
 */
export function usePreloadVocabulary() {
  const [preloaded, setPreloaded] = useState(false)

  const preload = useCallback(async (categories = ['academic', 'ielts-core']) => {
    try {
      // Use requestIdleCallback for non-critical preloading
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(async () => {
          const module = await import('../data/vocabulary-database.json')
          const data = module.default || module
          
          // Filter and cache priority words in memory
          const priorityWords = data.words?.filter(word => 
            categories.some(cat => 
              word.category?.toLowerCase().includes(cat.toLowerCase()) ||
              word.tags?.some(tag => tag.toLowerCase().includes(cat.toLowerCase()))
            )
          ) || []

          // Store in session cache
          window.__VOCAB_CACHE__ = {
            priority: priorityWords,
            timestamp: Date.now()
          }
          
          setPreloaded(true)
        }, { timeout: 2000 })
      } else {
        setPreloaded(true)
      }
    } catch (err) {
      console.error('Preload failed:', err)
    }
  }, [])

  return { preload, preloaded }
}

export default useLazyVocabularyLoader
