import { useState, useEffect, useCallback, useMemo } from 'react'

// Search filters and options
const SEARCH_OPTIONS = {
  INCLUDE_EXAMPLES: 'includeExamples',
  INCLUDE_PRONUNCIATION: 'includePronunciation',
  INCLUDE_CONTEXT: 'includeContext',
  FUZZY_SEARCH: 'fuzzySearch',
  EXACT_MATCH: 'exactMatch',
  CASE_SENSITIVE: 'caseSensitive'
}

const FILTER_CATEGORIES = {
  LEVEL: 'level',
  CATEGORY: 'category',
  TYPE: 'type',
  GENDER: 'gender',
  DIFFICULTY: 'difficulty',
  FREQUENCY: 'frequency'
}

const SORT_OPTIONS = {
  ALPHABETICAL: 'alphabetical',
  RELEVANCE: 'relevance',
  DIFFICULTY: 'difficulty',
  FREQUENCY: 'frequency',
  LEVEL: 'level',
  RECENTLY_ADDED: 'recentlyAdded',
  MASTERY_LEVEL: 'masteryLevel'
}

export function useVocabularySearch(vocabularyDatabase, userProgress = {}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [filters, setFilters] = useState({
    level: [],
    category: [],
    type: [],
    gender: [],
    difficulty: [],
    frequency: []
  })
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.ALPHABETICAL)
  const [sortOrder, setSortOrder] = useState('asc')
  const [searchOptions, setSearchOptions] = useState({
    [SEARCH_OPTIONS.INCLUDE_EXAMPLES]: true,
    [SEARCH_OPTIONS.INCLUDE_PRONUNCIATION]: true,
    [SEARCH_OPTIONS.INCLUDE_CONTEXT]: false,
    [SEARCH_OPTIONS.FUZZY_SEARCH]: false,
    [SEARCH_OPTIONS.EXACT_MATCH]: false,
    [SEARCH_OPTIONS.CASE_SENSITIVE]: false
  })

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('vocabulary-search-history')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Save search history to localStorage
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('vocabulary-search-history', JSON.stringify(searchHistory.slice(0, 20)))
    }
  }, [searchHistory])

  // Advanced search with multiple criteria
  const searchVocabulary = useCallback((term, customFilters = {}, customSort = {}) => {
    setIsSearching(true)
    
    try {
      const {
        term: searchQuery = searchTerm,
        filters: searchFilters = { ...filters, ...customFilters },
        sort: searchSort = customSort.sort || sortBy,
        order: searchOrder = customSort.order || sortOrder,
        options: searchOptionsConfig = { ...searchOptions }
      } = customFilters.term !== undefined ? customFilters : { term }

      let results = [...vocabularyDatabase]

      // Apply text search
      if (searchQuery && searchQuery.trim()) {
        results = applyTextSearch(results, searchQuery, searchOptionsConfig)
      }

      // Apply filters
      results = applyFilters(results, searchFilters)

      // Apply sorting
      results = applySorting(results, searchSort, searchOrder, searchQuery, userProgress)

      setSearchResults(results)

      // Add to search history
      if (searchQuery && searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
        setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 19)])
      }

      return results
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      return []
    } finally {
      setIsSearching(false)
    }
  }, [vocabularyDatabase, searchTerm, filters, sortBy, sortOrder, searchOptions, searchHistory, userProgress])

  // Apply text search with various options
  const applyTextSearch = useCallback((vocabulary, term, options) => {
    if (!term || !term.trim()) return vocabulary

    const searchTerms = term.trim().split(/\s+/).filter(t => t.length > 0)
    const results = []

    vocabulary.forEach(word => {
      let relevanceScore = 0
      let matches = []

      searchTerms.forEach(searchTerm => {
        const searchLower = searchTerm.toLowerCase()
        const searchExact = options[SEARCH_OPTIONS.EXACT_MATCH] ? searchTerm : searchLower

        // Search in German word
        if (options[SEARCH_OPTIONS.CASE_SENSITIVE]) {
          if (word.german.includes(searchExact)) {
            relevanceScore += 10
            matches.push({ field: 'german', text: word.german })
          }
        } else {
          if (word.german.toLowerCase().includes(searchLower)) {
            relevanceScore += 10
            matches.push({ field: 'german', text: word.german })
          }
        }

        // Search in English translation
        if (word.english.toLowerCase().includes(searchLower)) {
          relevanceScore += 8
          matches.push({ field: 'english', text: word.english })
        }

        // Search in Arabic translation
        if (word.arabic.includes(searchTerm)) {
          relevanceScore += 8
          matches.push({ field: 'arabic', text: word.arabic })
        }

        // Search in pronunciation
        if (options[SEARCH_OPTIONS.INCLUDE_PRONUNCIATION] && word.pronunciation) {
          if (word.pronunciation.toLowerCase().includes(searchLower)) {
            relevanceScore += 5
            matches.push({ field: 'pronunciation', text: word.pronunciation })
          }
        }

        // Search in examples
        if (options[SEARCH_OPTIONS.INCLUDE_EXAMPLES] && word.examples) {
          Object.values(word.examples).forEach(examples => {
            examples.forEach(example => {
              if (example.toLowerCase().includes(searchLower)) {
                relevanceScore += 3
                matches.push({ field: 'examples', text: example })
              }
            })
          })
        }

        // Search in context
        if (options[SEARCH_OPTIONS.INCLUDE_CONTEXT] && word.context) {
          if (word.context.toLowerCase().includes(searchLower)) {
            relevanceScore += 2
            matches.push({ field: 'context', text: word.context })
          }
        }

        // Fuzzy search (simple implementation)
        if (options[SEARCH_OPTIONS.FUZZY_SEARCH]) {
          const fuzzyScore = calculateFuzzyScore(word.german.toLowerCase(), searchLower)
          if (fuzzyScore > 0.7) {
            relevanceScore += fuzzyScore * 5
            matches.push({ field: 'german', text: word.german, fuzzy: true })
          }
        }
      })

      if (relevanceScore > 0) {
        results.push({
          ...word,
          relevanceScore,
          matches,
          searchHighlight: generateSearchHighlight(word, searchTerms, options)
        })
      }
    })

    return results
  }, [])

  // Apply filters to results
  const applyFilters = useCallback((vocabulary, activeFilters) => {
    return vocabulary.filter(word => {
      // Level filter
      if (activeFilters.level && activeFilters.level.length > 0) {
        if (!activeFilters.level.includes(word.level)) return false
      }

      // Category filter
      if (activeFilters.category && activeFilters.category.length > 0) {
        if (!activeFilters.category.includes(word.category)) return false
      }

      // Type filter
      if (activeFilters.type && activeFilters.type.length > 0) {
        if (!activeFilters.type.includes(word.type)) return false
      }

      // Gender filter
      if (activeFilters.gender && activeFilters.gender.length > 0) {
        if (!word.gender || !activeFilters.gender.includes(word.gender)) return false
      }

      // Difficulty filter
      if (activeFilters.difficulty && activeFilters.difficulty.length > 0) {
        if (!activeFilters.difficulty.includes(word.difficulty?.toString())) return false
      }

      // Frequency filter
      if (activeFilters.frequency && activeFilters.frequency.length > 0) {
        const wordFreq = word.frequency || 'unknown'
        if (!activeFilters.frequency.includes(wordFreq)) return false
      }

      return true
    })
  }, [])

  // Apply sorting to results
  const applySorting = useCallback((vocabulary, sortType, order, searchQuery, progress) => {
    const sorted = [...vocabulary].sort((a, b) => {
      let comparison = 0

      switch (sortType) {
        case SORT_OPTIONS.ALPHABETICAL:
          comparison = a.german.localeCompare(b.german, 'de')
          break

        case SORT_OPTIONS.RELEVANCE:
          comparison = (b.relevanceScore || 0) - (a.relevanceScore || 0)
          break

        case SORT_OPTIONS.DIFFICULTY:
          comparison = (a.difficulty || 1) - (b.difficulty || 1)
          break

        case SORT_OPTIONS.FREQUENCY:
          const freqOrder = { high: 3, medium: 2, low: 1, unknown: 0 }
          comparison = (freqOrder[b.frequency] || 0) - (freqOrder[a.frequency] || 0)
          break

        case SORT_OPTIONS.LEVEL:
          const levelOrder = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 }
          comparison = (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0)
          break

        case SORT_OPTIONS.RECENTLY_ADDED:
          comparison = 0 // Would need timestamp data
          break

        case SORT_OPTIONS.MASTERY_LEVEL:
          const aMastery = progress[a.german]?.mastery || 0
          const bMastery = progress[b.german]?.mastery || 0
          comparison = aMastery - bMastery
          break

        default:
          comparison = a.german.localeCompare(b.german, 'de')
      }

      return order === 'desc' ? -comparison : comparison
    })

    return sorted
  }, [])

  // Calculate fuzzy search score (simple Levenshtein distance)
  const calculateFuzzyScore = useCallback((str1, str2) => {
    if (str1 === str2) return 1.0
    if (str1.length === 0 || str2.length === 0) return 0.0

    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }

    const distance = matrix[str2.length][str1.length]
    const maxLength = Math.max(str1.length, str2.length)
    return 1 - distance / maxLength
  }, [])

  // Generate search highlight text
  const generateSearchHighlight = useCallback((word, searchTerms, options) => {
    const highlights = {}

    searchTerms.forEach(term => {
      const searchLower = term.toLowerCase()

      // Highlight German
      if (word.german.toLowerCase().includes(searchLower)) {
        highlights.german = word.german.replace(
          new RegExp(`(${term})`, 'gi'),
          '<mark>$1</mark>'
        )
      }

      // Highlight English
      if (word.english.toLowerCase().includes(searchLower)) {
        highlights.english = word.english.replace(
          new RegExp(`(${term})`, 'gi'),
          '<mark>$1</mark>'
        )
      }

      // Highlight Arabic
      if (word.arabic.includes(term)) {
        highlights.arabic = word.arabic.replace(
          new RegExp(`(${term})`, 'g'),
          '<mark>$1</mark>'
        )
      }
    })

    return highlights
  }, [])

  // Get available filter options
  const getFilterOptions = useCallback(() => {
    const levels = [...new Set(vocabularyDatabase.map(w => w.level))].sort()
    const categories = [...new Set(vocabularyDatabase.map(w => w.category))].sort()
    const types = [...new Set(vocabularyDatabase.map(w => w.type))].sort()
    const genders = [...new Set(vocabularyDatabase.map(w => w.gender).filter(Boolean))].sort()
    const difficulties = [...new Set(vocabularyDatabase.map(w => w.difficulty).filter(Boolean))].sort()
    const frequencies = [...new Set(vocabularyDatabase.map(w => w.frequency).filter(Boolean))].sort()

    return { levels, categories, types, genders, difficulties, frequencies }
  }, [vocabularyDatabase])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      level: [],
      category: [],
      type: [],
      gender: [],
      difficulty: [],
      frequency: []
    })
  }, [])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setSearchResults([])
  }, [])

  // Get search suggestions
  const getSearchSuggestions = useCallback((query, limit = 5) => {
    if (!query || query.length < 2) return []

    const queryLower = query.toLowerCase()
    const suggestions = []

    vocabularyDatabase.forEach(word => {
      if (word.german.toLowerCase().startsWith(queryLower)) {
        suggestions.push({
          text: word.german,
          type: 'german',
          word: word
        })
      } else if (word.english.toLowerCase().startsWith(queryLower)) {
        suggestions.push({
          text: word.english,
          type: 'english',
          word: word
        })
      }
    })

    return suggestions
      .sort((a, b) => a.text.localeCompare(b.text))
      .slice(0, limit)
  }, [vocabularyDatabase])

  // Export search results
  const exportResults = useCallback((format = 'json') => {
    const data = {
      results: searchResults,
      searchTerm,
      filters,
      sortBy,
      sortOrder,
      searchOptions,
      timestamp: new Date().toISOString(),
      totalResults: searchResults.length
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      const headers = ['German', 'English', 'Arabic', 'Level', 'Category', 'Type', 'Relevance']
      const rows = searchResults.map(word => [
        word.german,
        word.english,
        word.arabic,
        word.level,
        word.category,
        word.type,
        word.relevanceScore || 0
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return data
  }, [searchResults, searchTerm, filters, sortBy, sortOrder, searchOptions])

  // Advanced search with boolean operators
  const advancedSearch = useCallback((query) => {
    // Parse boolean operators (AND, OR, NOT)
    const terms = query.split(/\s+(AND|OR|NOT)\s+/i)
    const operators = query.match(/\s+(AND|OR|NOT)\s+/gi) || []

    let results = [...vocabularyDatabase]

    terms.forEach((term, index) => {
      const operator = operators[index - 1]?.toUpperCase().trim()
      
      if (operator === 'NOT') {
        results = results.filter(word => 
          !word.german.toLowerCase().includes(term.toLowerCase()) &&
          !word.english.toLowerCase().includes(term.toLowerCase())
        )
      } else if (operator === 'AND') {
        results = results.filter(word =>
          word.german.toLowerCase().includes(term.toLowerCase()) ||
          word.english.toLowerCase().includes(term.toLowerCase())
        )
      } else if (operator === 'OR' || index === 0) {
        const tempResults = vocabularyDatabase.filter(word =>
          word.german.toLowerCase().includes(term.toLowerCase()) ||
          word.english.toLowerCase().includes(term.toLowerCase())
        )
        
        if (index === 0) {
          results = tempResults
        } else {
          results = [...new Set([...results, ...tempResults])]
        }
      }
    })

    setSearchResults(results)
    return results
  }, [vocabularyDatabase])

  return {
    // Search state
    searchTerm,
    searchResults,
    isSearching,
    searchHistory,
    filters,
    sortBy,
    sortOrder,
    searchOptions,

    // Search methods
    searchVocabulary,
    advancedSearch,
    getSearchSuggestions,

    // Filter methods
    setFilters,
    clearFilters,
    getFilterOptions,

    // Sort methods
    setSortBy,
    setSortOrder,

    // Options methods
    setSearchOptions,

    // Utility methods
    clearSearch,
    exportResults,

    // Constants
    SEARCH_OPTIONS,
    FILTER_CATEGORIES,
    SORT_OPTIONS
  }
}