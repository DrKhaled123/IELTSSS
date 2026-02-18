import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePDFProcessor } from './usePDFProcessor'

// English word patterns and rules
const ENGLISH_WORD_PATTERNS = {
  nouns: /\b[a-zA-Z]+(?:tion|ment|ness|ity|ence|ance|age|ism|ist)\b/g,
  verbs: /\b[a-zA-Z]+(?:ize|ise|ate|ify|en)\b/g,
  adjectives: /\b[a-zA-Z]+(?:able|ible|al|ful|ic|ive|less|ous|y)\b/g,
  adverbs: /\b[a-zA-Z]+(?:ly)\b/g,
  prepositions: /\b(of|in|to|for|with|on|at|from|by|about|as|into|like|through|after|over|between|out|against|during|without|before|under|around|among)\b/gi,
  conjunctions: /\b(and|that|but|or|as|if|when|because|while|where|after|so|though|since|until|whether|before|although|nor|like|once|unless|now|except)\b/gi,
  articles: /\b(the|a|an)\b/gi
}

// Common English stop words to exclude
const ENGLISH_STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
  'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'is', 'are', 'was', 'were', 'had', 'has', 'can', 'could', 'should',
  'would', 'may', 'might', 'must', 'shall'
])

// CEFR level indicators (Academic focused)
const CEFR_INDICATORS = {
  A1: {
    patterns: [
      /\b(hello|book|school|student|teacher|house|car)\b/gi
    ],
    maxWordLength: 5
  },
  A2: {
    patterns: [
      /\b(understand|describe|explain|repeat|language|sentence)\b/gi
    ],
    maxWordLength: 7
  },
  B1: {
    patterns: [
      /\b(environment|education|technology|communication|transport)\b/gi
    ],
    maxWordLength: 9
  },
  B2: {
    patterns: [
      /\b(significant|consequence|implication|maintenance|regulation)\b/gi
    ],
    maxWordLength: 11
  },
  C1: {
    patterns: [
      /\b(comprehensive|implementation|infrastructure|methodology)\b/gi
    ],
    maxWordLength: 13
  }
}

export function usePDFVocabularyExtractor() {
  const [extractedVocabulary, setExtractedVocabulary] = useState([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractionError, setExtractionError] = useState(null)
  const [categorizedWords, setCategorizedWords] = useState({})

  const { quickScan } = usePDFProcessor()

  // Extract vocabulary from PDF text
  const extractVocabularyFromText = useCallback(async (text, options = {}) => {
    setIsExtracting(true)
    setExtractionProgress(0)
    setExtractionError(null)

    try {
      const {
        includeStopWords = false,
        minFrequency = 1,
        maxWords = 500,
        includeContext = true
      } = options

      // Extract all English words
      const allWords = text.match(/\b[a-zA-Z]+(?:'[a-z]+)?\b/g) || []

      // Filter and process words
      const wordFrequency = {}
      const wordContexts = {}

      for (let i = 0; i < allWords.length; i++) {
        const word = allWords[i].toLowerCase()

        // Skip stop words if not included
        if (!includeStopWords && ENGLISH_STOP_WORDS.has(word)) {
          continue
        }

        // Skip short words that might be noise
        if (word.length < 3) continue

        // Count frequency
        wordFrequency[word] = (wordFrequency[word] || 0) + 1

        // Store context if needed
        if (includeContext) {
          if (!wordContexts[word]) {
            wordContexts[word] = []
          }

          if (wordContexts[word].length < 3) {
            const contextStart = Math.max(0, i - 10)
            const contextEnd = Math.min(allWords.length, i + 10)
            const context = allWords.slice(contextStart, contextEnd).join(' ')
            wordContexts[word].push(context)
          }
        }

        // Update progress
        if (i % 500 === 0) {
          setExtractionProgress((i / allWords.length) * 50)
        }
      }

      // Filter by minimum frequency
      const filteredWords = Object.entries(wordFrequency)
        .filter(([_, freq]) => freq >= minFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxWords)

      // Analyze and categorize words
      const vocabulary = []

      for (let i = 0; i < filteredWords.length; i++) {
        const [word, frequency] = filteredWords[i]

        // Determine word type and category
        const wordAnalysis = analyzeWord(word)

        // Determine CEFR level
        const cefrLevel = determineCEFRLevel(word)

        // Extract examples from context
        const examples = includeContext ? extractExamples(word, wordContexts[word], 3) : []

        vocabulary.push({
          word: word,
          frequency,
          category: wordAnalysis.category,
          type: wordAnalysis.type,
          level: cefrLevel,
          examples,
          context: wordContexts[word]?.[0] || '',
          difficulty: calculateDifficulty(word, cefrLevel, frequency)
        })

        // Update progress
        setExtractionProgress(50 + (i / filteredWords.length) * 50)
      }

      // Categorize words by type and level
      const categorized = categorizeWords(vocabulary)
      setCategorizedWords(categorized)

      setExtractedVocabulary(vocabulary)
      return vocabulary

    } catch (error) {
      setExtractionError(error.message)
      throw error
    } finally {
      setIsExtracting(false)
      setExtractionProgress(100)
    }
  }, [])

  // Analyze a single word
  const analyzeWord = useCallback((word) => {
    const analysis = {
      category: 'general',
      type: 'unknown'
    }

    // Heuristic suffixes for types
    if (word.endsWith('tion') || word.endsWith('ment') || word.endsWith('ness')) {
      analysis.type = 'noun'
      analysis.category = 'academic'
    } else if (word.endsWith('ize') || word.endsWith('ate') || word.endsWith('ify')) {
      analysis.type = 'verb'
      analysis.category = 'academic'
    } else if (word.endsWith('ly')) {
      analysis.type = 'adverb'
    } else if (word.endsWith('al') || word.endsWith('ic') || word.endsWith('ive')) {
      analysis.type = 'adjective'
    }

    return analysis
  }, [])

  // Determine CEFR level based on word characteristics
  const determineCEFRLevel = useCallback((word) => {
    const wordLength = word.length

    // Simple length and complexity heuristic without full dictionary
    if (wordLength <= 4) return 'A1'
    if (wordLength <= 6) return 'A2'
    if (wordLength <= 8) return 'B1'
    if (wordLength <= 10) return 'B2'
    if (wordLength <= 12) return 'C1'
    return 'C2'
  }, [])

  // Extract examples from context
  const extractExamples = useCallback((word, contexts, maxExamples = 3) => {
    if (!contexts || contexts.length === 0) return []

    return contexts
      .slice(0, maxExamples)
      .map(context => {
        // Highlight the word in context
        const highlightedContext = context.replace(
          new RegExp(`\\b${word}\\b`, 'gi'),
          `**${word}**`
        )
        return highlightedContext
      })
  }, [])

  // Calculate difficulty score
  const calculateDifficulty = useCallback((word, level, frequency) => {
    let difficulty = 1
    const levelDifficulty = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 5 }
    difficulty += levelDifficulty[level] - 1

    // Adjust by frequency (inverse - rare words are harder)
    if (frequency === 1) difficulty += 0.5

    return Math.max(1, Math.min(5, difficulty))
  }, [])

  // Categorize words by type and level
  const categorizeWords = useCallback((vocabulary) => {
    const categorized = {
      byType: {},
      byLevel: {},
      byCategory: {}
    }

    vocabulary.forEach(word => {
      // By type
      if (!categorized.byType[word.type]) {
        categorized.byType[word.type] = []
      }
      categorized.byType[word.type].push(word)

      // By level
      if (!categorized.byLevel[word.level]) {
        categorized.byLevel[word.level] = []
      }
      categorized.byLevel[word.level].push(word)

      // By category
      if (!categorized.byCategory[word.category]) {
        categorized.byCategory[word.category] = []
      }
      categorized.byCategory[word.category].push(word)
    })

    return categorized
  }, [])

  // Extract vocabulary from PDF file
  const extractFromPDF = useCallback(async (pdfFile, options = {}) => {
    try {
      // First, get PDF content using PDF processor
      const pdfContent = await quickScan(pdfFile)

      // Extract vocabulary from the text content
      const vocabulary = await extractVocabularyFromText(pdfContent.fullText || pdfContent.content, options)

      return {
        vocabulary,
        pdfInfo: {
          id: pdfFile,
          title: pdfContent.title,
          pageCount: pdfContent.pageCount,
          wordCount: pdfContent.wordCount
        },
        extractionStats: {
          totalWords: vocabulary.length,
          byLevel: vocabulary.reduce((acc, word) => {
            acc[word.level] = (acc[word.level] || 0) + 1
            return acc
          }, {}),
          byCategory: vocabulary.reduce((acc, word) => {
            acc[word.category] = (acc[word.category] || 0) + 1
            return acc
          }, {})
        }
      }
    } catch (error) {
      setExtractionError(error.message)
      throw error
    }
  }, [quickScan, extractVocabularyFromText])

  // Export extracted vocabulary
  const exportVocabulary = useCallback((format = 'json') => {
    const data = {
      vocabulary: extractedVocabulary,
      categorized: categorizedWords,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      const headers = ['Word', 'Frequency', 'Category', 'Type', 'Level', 'Difficulty']
      const rows = extractedVocabulary.map(word => [
        word.word,
        word.frequency,
        word.category,
        word.type,
        word.level,
        word.difficulty
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return data
  }, [extractedVocabulary, categorizedWords])

  // Clear extracted vocabulary
  const clearExtractedVocabulary = useCallback(() => {
    setExtractedVocabulary([])
    setCategorizedWords({})
    setExtractionError(null)
    setExtractionProgress(0)
  }, [])

  return {
    extractedVocabulary,
    categorizedWords,
    isExtracting,
    extractionProgress,
    extractionError,
    extractVocabularyFromText,
    extractFromPDF,
    exportVocabulary,
    clearExtractedVocabulary,
    analyzeWord,
    determineCEFRLevel
  }
}