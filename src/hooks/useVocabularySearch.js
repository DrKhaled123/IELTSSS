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
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Failed to parse search history:', error)
      }
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
      setSearchTerm(searchQuery)

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

        // Search in Word
        if (options[SEARCH_OPTIONS.CASE_SENSITIVE]) {
          if (word.word.includes(searchExact)) {
            relevanceScore += 10
            matches.push({ field: 'word', text: word.word })
          }
        } else {
          if (word.word.toLowerCase().includes(searchLower)) {
            relevanceScore += 10
            matches.push({ field: 'word', text: word.word })
          }
        }

        // Search in Definition
        if (word.definition.toLowerCase().includes(searchLower)) {
          relevanceScore += 8
          matches.push({ field: 'definition', text: word.definition })
        }

        const translationFields = [
          { key: 'arabic', score: 8 },
          { key: 'hindi', score: 7 },
          { key: 'chinese', score: 7 },
          { key: 'urdu', score: 7 }
        ]
        translationFields.forEach(({ key, score }) => {
          const value = word?.[key]
          if (typeof value === 'string' && value.includes(searchTerm)) {
            relevanceScore += score
            matches.push({ field: key, text: value })
          }
        })

        // Search in pronunciation
        if (options[SEARCH_OPTIONS.INCLUDE_PRONUNCIATION] && word.pronunciation) {
          if (word.pronunciation.toLowerCase().includes(searchLower)) {
            relevanceScore += 5
            matches.push({ field: 'pronunciation', text: word.pronunciation })
          }
        }

        // Search in examples
        if (options[SEARCH_OPTIONS.INCLUDE_EXAMPLES] && word.examples) {
          word.examples.forEach(example => {
            if (example.toLowerCase().includes(searchLower)) {
              relevanceScore += 3
              matches.push({ field: 'examples', text: example })
            }
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
          const fuzzyScore = calculateFuzzyScore(word.word.toLowerCase(), searchLower)
          if (fuzzyScore > 0.7) {
            relevanceScore += fuzzyScore * 5
            matches.push({ field: 'word', text: word.word, fuzzy: true })
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

      // Difficulty filter
      if (activeFilters.difficulty && activeFilters.difficulty.length > 0) {
        if (!activeFilters.difficulty.includes(word.difficulty?.toString())) return false
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
          comparison = a.word.localeCompare(b.word, 'en')
          break

        case SORT_OPTIONS.RELEVANCE:
          comparison = (b.relevanceScore || 0) - (a.relevanceScore || 0)
          break

        case SORT_OPTIONS.DIFFICULTY:
          comparison = (a.difficulty || 1) - (b.difficulty || 1)
          break

        case SORT_OPTIONS.FREQUENCY:
          comparison = 0 // Removed frequency sort logic for simplicity unless frequency field exists
          break

        case SORT_OPTIONS.LEVEL: {
          const levelOrder = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 }
          comparison = (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0)
          break
        }

        case SORT_OPTIONS.MASTERY_LEVEL: {
          const aMastery = progress[a.word]?.mastery || 0
          const bMastery = progress[b.word]?.mastery || 0
          comparison = aMastery - bMastery
          break
        }

        default:
          comparison = a.word.localeCompare(b.word, 'en')
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

      // Highlight Word
      if (word.word.toLowerCase().includes(searchLower)) {
        highlights.word = word.word.replace(
          new RegExp(`(${term})`, 'gi'),
          '<mark>$1</mark>'
        )
      }

      // Highlight Definition
      if (word.definition.toLowerCase().includes(searchLower)) {
        highlights.definition = word.definition.replace(
          new RegExp(`(${term})`, 'gi'),
          '<mark>$1</mark>'
        )
      }

      const highlightFields = ['arabic', 'hindi', 'chinese', 'urdu']
      highlightFields.forEach((key) => {
        const value = word?.[key]
        if (typeof value === 'string' && value.includes(term)) {
          highlights[key] = value.replace(new RegExp(`(${term})`, 'g'), '<mark>$1</mark>')
        }
      })
    })

    return highlights
  }, [])

  // Get available filter options
  const getFilterOptions = useCallback(() => {
    const levels = [...new Set(vocabularyDatabase.map(w => w.level))].sort()
    const categories = [...new Set(vocabularyDatabase.map(w => w.category))].sort()
    const types = [...new Set(vocabularyDatabase.map(w => w.type))].sort()
    const difficulties = [...new Set(vocabularyDatabase.map(w => w.difficulty).filter(Boolean))].sort()

    return { levels, categories, types, difficulties }
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
      if (word.word.toLowerCase().startsWith(queryLower)) {
        suggestions.push({
          text: word.word,
          type: 'word',
          word: word
        })
      } else if (word.definition.toLowerCase().startsWith(queryLower)) {
        suggestions.push({
          text: word.definition,
          type: 'definition',
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
      const headers = ['Word', 'Definition', 'Arabic', 'Hindi', 'Chinese', 'Urdu', 'Level', 'Category', 'Type', 'Relevance']
      const rows = searchResults.map(word => [
        word.word,
        word.definition,
        word.arabic || '',
        word.hindi || '',
        word.chinese || '',
        word.urdu || '',
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
          !word.word.toLowerCase().includes(term.toLowerCase()) &&
          !word.definition.toLowerCase().includes(term.toLowerCase())
        )
      } else if (operator === 'AND') {
        results = results.filter(word =>
          word.word.toLowerCase().includes(term.toLowerCase()) ||
          word.definition.toLowerCase().includes(term.toLowerCase())
        )
      } else if (operator === 'OR' || index === 0) {
        const tempResults = vocabularyDatabase.filter(word =>
          word.word.toLowerCase().includes(term.toLowerCase()) ||
          word.definition.toLowerCase().includes(term.toLowerCase())
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
    searchTerm,
    searchResults,
    isSearching,
    searchHistory,
    filters,
    sortBy,
    sortOrder,
    searchOptions,
    searchVocabulary,
    advancedSearch,
    getSearchSuggestions,
    setFilters,
    clearFilters,
    getFilterOptions,
    setSortBy,
    setSortOrder,
    setSearchOptions,
    clearSearch,
    exportResults,
    SEARCH_OPTIONS,
    FILTER_CATEGORIES,
    SORT_OPTIONS
  }
}
