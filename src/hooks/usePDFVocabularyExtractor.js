import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePDFProcessor } from './usePDFProcessor'

// German vocabulary patterns and rules
const GERMAN_WORD_PATTERNS = {
  // Common German word patterns
  nouns: /\b[A-ZÄÖÜ][a-zäöüß]+(?:s)?\b/g,
  verbs: /\b[a-zäöüß]+(?:en|eln|ern|eln|ern|ieren|fizieren)\b/g,
  adjectives: /\b[a-zäöüß]+(?:isch|lich|ig|bar|haft|sam|los|voll)\b/g,
  adverbs: /\b[a-zäöüß]+(?:weise|lings|halber)\b/g,
  prepositions: /\b(aus|bei|mit|nach|von|zu|an|auf|in|über|unter|vor|zwischen|durch|für|gegen|ohne|um|seit|während|trotz)\b/gi,
  conjunctions: /\b(und|oder|aber|denn|weil|wenn|dass|obwohl|ob|sowohl|als|weder|entweder)\b/gi,
  articles: /\b(der|die|das|ein|eine|einen|einem|eine|eines|dem|den|des)\b/gi
}

// Common German stop words to exclude
const GERMAN_STOP_WORDS = new Set([
  'der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'eine', 'eines', 'dem', 'den', 'des',
  'und', 'oder', 'aber', 'denn', 'weil', 'wenn', 'dass', 'obwohl', 'ob', 'sowohl', 'als', 'weder', 'entweder',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'sie', 'Sie',
  'mein', 'dein', 'sein', 'ihr', 'unser', 'euer',
  'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes',
  'ist', 'sind', 'war', 'waren', 'habe', 'hast', 'hat', 'haben', 'habt',
  'kann', 'kannst', 'können', 'könnt', 'will', 'willst', 'wollen', 'wollt',
  'soll', 'sollst', 'sollen', 'sollt', 'muss', 'musst', 'müssen', 'müsst',
  'nicht', 'kein', 'keine', 'keinen', 'keinem', 'keines', 'nichts',
  'auch', 'nur', 'schon', 'noch', 'wieder', 'wieder', 'mal', 'bloß',
  'hier', 'dort', 'da', 'dorthin', 'her', 'hin',
  'jetzt', 'dann', 'früher', 'später', 'heute', 'morgen', 'gestern',
  'sehr', 'ganz', 'besonders', 'besonders', 'ziemlich', 'etwas', 'viele', 'wenige'
])

// CEFR level indicators based on word complexity
const CEFR_INDICATORS = {
  A1: {
    patterns: [
      /\b(hallo|danke|bitte|ja|nein|guten tag|auf wiedersehen|tschüss)\b/gi,
      /\b(ich|du|er|sie|es|wir|ihr|sie|Sie)\b/gi,
      /\b(sein|haben|gehen|kommen|sprechen|essen|trinken|wohnen|arbeiten|lernen)\b/gi
    ],
    maxWordLength: 8
  },
  A2: {
    patterns: [
      /\b(entschuldigen|verstehen|erklären|wiederholen|versuchen|erinnern|bedeuten)\b/gi,
      /\b(obwohl|weil|wenn|dass|ob|falls|sobald|solange)\b/gi
    ],
    maxWordLength: 12
  },
  B1: {
    patterns: [
      /\b(entscheiden|entwickeln|erfolgreich|interessant|wichtig|möglich|notwendig)\b/gi,
      /\b(beziehen|beziehen|bezieht|bezog|bezogen|beziehst|bezieht)\b/gi
    ],
    maxWordLength: 15
  },
  B2: {
    patterns: [
      /\b(unbedingt|zusammenhängend|berücksichtigen|unabhängig|tatsächlich)\b/gi,
      /\b(herausfinden|mitteilen|nachweisen|stattfinden|stattfinden|stattfand)\b/gi
    ],
    maxWordLength: 18
  },
  C1: {
    patterns: [
      /\b(hervorragend|zweifellos|außergewöhnlich|herausragend|beeindruckend)\b/gi,
      /\b(berücksichtigen|berücksichtigt|berücksichtigte|berücksichtigten)\b/gi
    ],
    maxWordLength: 25
  }
}

export function usePDFVocabularyExtractor() {
  const [extractedVocabulary, setExtractedVocabulary] = useState([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractionError, setExtractionError] = useState(null)
  const [categorizedWords, setCategorizedWords] = useState({})

  const { quickScan, processingState } = usePDFProcessor()

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
        includeContext = true,
        contextLength = 50
      } = options

      // Extract all German words
      const allWords = text.match(/\b[A-ZÄÖÜ][a-zäöüß]+|[a-zäöüß]+\b/g) || []

      // Filter and process words
      const wordFrequency = {}
      const wordContexts = {}

      for (let i = 0; i < allWords.length; i++) {
        const word = allWords[i].toLowerCase()

        // Skip stop words if not included
        if (!includeStopWords && GERMAN_STOP_WORDS.has(word)) {
          continue
        }

        // Count frequency
        wordFrequency[word] = (wordFrequency[word] || 0) + 1

        // Store context if needed
        if (includeContext) {
          if (!wordContexts[word]) {
            wordContexts[word] = []
          }

          const contextStart = Math.max(0, i - 5)
          const contextEnd = Math.min(allWords.length, i + 6)
          const context = allWords.slice(contextStart, contextEnd).join(' ')

          if (!wordContexts[word].includes(context)) {
            wordContexts[word].push(context)
          }
        }

        // Update progress
        if (i % 100 === 0) {
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
        const wordAnalysis = analyzeWord(word, text)

        // Determine CEFR level
        const cefrLevel = determineCEFRLevel(word, wordAnalysis)

        // Extract examples from context
        const examples = includeContext ? extractExamples(word, wordContexts[word], 3) : []

        vocabulary.push({
          german: word,
          frequency,
          category: wordAnalysis.category,
          type: wordAnalysis.type,
          level: cefrLevel,
          gender: wordAnalysis.gender,
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
  const analyzeWord = useCallback((word, fullText) => {
    const analysis = {
      category: 'unknown',
      type: 'unknown',
      gender: null
    }

    // Check for noun (capitalized in German)
    if (word.charAt(0).match(/[A-ZÄÖÜ]/)) {
      analysis.category = 'nouns'
      analysis.type = 'noun'

      // Determine gender based on articles in context
      const contextRegex = new RegExp(`\\b(der|die|das|ein|eine)\\s+${word}\\b`, 'gi')
      const matches = fullText.match(contextRegex)
      if (matches) {
        const articles = matches.map(m => m.toLowerCase().split(' ')[0])
        if (articles.includes('der') || articles.includes('ein')) analysis.gender = 'masculine'
        if (articles.includes('die') || articles.includes('eine')) analysis.gender = 'feminine'
        if (articles.includes('das')) analysis.gender = 'neutral'
      }
    }

    // Check for verbs
    if (word.match(/(en|eln|ern|ieren|fizieren)$/i)) {
      analysis.category = 'verbs'
      analysis.type = 'verb'
    }

    // Check for adjectives
    if (word.match(/(isch|lich|ig|bar|haft|sam|los|voll)$/i)) {
      analysis.category = 'adjectives'
      analysis.type = 'adjective'
    }

    // Check for adverbs
    if (word.match(/(weise|lings|halber)$/i)) {
      analysis.category = 'adverbs'
      analysis.type = 'adverb'
    }

    // Check for prepositions
    if (word.match(/^(aus|bei|mit|nach|von|zu|an|auf|in|über|unter|vor|zwischen|durch|für|gegen|ohne|um|seit|während|trotz)$/i)) {
      analysis.category = 'prepositions'
      analysis.type = 'preposition'
    }

    // Check for conjunctions
    if (word.match(/^(und|oder|aber|denn|weil|wenn|dass|obwohl|ob|sowohl|als|weder|entweder)$/i)) {
      analysis.category = 'conjunctions'
      analysis.type = 'conjunction'
    }

    return analysis
  }, [])

  // Determine CEFR level based on word characteristics
  const determineCEFRLevel = useCallback((word, analysis) => {
    const wordLength = word.length

    // Check against CEFR patterns
    for (const [level, indicators] of Object.entries(CEFR_INDICATORS)) {
      for (const pattern of indicators.patterns) {
        if (word.match(pattern)) {
          return level
        }
      }

      if (wordLength <= indicators.maxWordLength) {
        // Additional heuristics based on word complexity
        const hasUmlaut = /[äöü]/.test(word)
        const hasSpecialChars = /[ß]/.test(word)
        const hasComplexStructure = /[aeiou]{3,}|[bcdfghjklmnpqrstvwxyz]{4,}/.test(word)

        if (level === 'A1' && !hasUmlaut && !hasSpecialChars && !hasComplexStructure) {
          return level
        }
        if (level === 'A2' && (hasUmlaut || hasSpecialChars) && !hasComplexStructure) {
          return level
        }
        if (level === 'B1' && hasComplexStructure) {
          return level
        }
      }
    }

    // Default level based on word length and complexity
    if (wordLength <= 6) return 'A1'
    if (wordLength <= 10) return 'A2'
    if (wordLength <= 14) return 'B1'
    if (wordLength <= 18) return 'B2'
    return 'C1'
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

    // Base difficulty by CEFR level
    const levelDifficulty = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 }
    difficulty += levelDifficulty[level] - 1

    // Adjust by word length
    if (word.length > 15) difficulty += 1
    if (word.length > 20) difficulty += 1

    // Adjust by frequency (inverse - rare words are harder)
    if (frequency === 1) difficulty += 1
    if (frequency >= 5) difficulty -= 0.5

    // Adjust by complexity
    if (/[äöüß]/.test(word)) difficulty += 0.5
    if (word.includes('-')) difficulty += 0.5

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
      const headers = ['German', 'Frequency', 'Category', 'Type', 'Level', 'Gender', 'Difficulty']
      const rows = extractedVocabulary.map(word => [
        word.german,
        word.frequency,
        word.category,
        word.type,
        word.level,
        word.gender || '',
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
    determineCEFRLevel,
    separateContentByLanguage
  }
}

// Helper to separate content by language
function separateContentByLanguage(text) {
  if (!text) return { germanBlocks: [], englishBlocks: [], mixedBlocks: [] }

  const blocks = text.split(/\n\s*\n/) // Split by double newline (paragraphs)
  const result = {
    germanBlocks: [],
    englishBlocks: [],
    mixedBlocks: []
  }

  blocks.forEach(block => {
    const trimmedBlock = block.trim()
    if (!trimmedBlock) return

    const germanScore = calculateGermanScore(trimmedBlock)
    const englishScore = calculateEnglishScore(trimmedBlock)

    if (germanScore > englishScore && germanScore > 0.3) {
      result.germanBlocks.push(trimmedBlock)
    } else if (englishScore > germanScore && englishScore > 0.3) {
      result.englishBlocks.push(trimmedBlock)
    } else {
      result.mixedBlocks.push(trimmedBlock)
    }
  })

  return result
}

function calculateGermanScore(text) {
  let score = 0
  const totalWords = text.split(/\s+/).length
  if (totalWords === 0) return 0

  // Check for Umlauts and Eszett (strong indicators)
  const umlautCount = (text.match(/[äöüßÄÖÜ]/g) || []).length
  score += (umlautCount / totalWords) * 3

  // Check for German articles and common words
  const germanCommonWords = /\b(der|die|das|und|ist|in|den|von|zu|mit|sind)\b/gi
  const commonMatchCount = (text.match(germanCommonWords) || []).length
  score += (commonMatchCount / totalWords) * 2

  // Check for capitalization of nouns (heuristic: words starting with uppercase inside sentences)
  // This is a bit rough but helps
  const capitalizedInside = (text.match(/[.!?]\s+[A-Z]/g) || []).length // Sentence starts (ignore)
  const allCapitalized = (text.match(/[A-Z][a-z]+/g) || []).length
  // High ratio of capitalized words (nouns) is German-like
  if (allCapitalized / totalWords > 0.25) score += 0.5

  return Math.min(score, 1) // Cap at 1
}

function calculateEnglishScore(text) {
  let score = 0
  const totalWords = text.split(/\s+/).length
  if (totalWords === 0) return 0

  // Check for English articles and common words
  const englishCommonWords = /\b(the|and|is|in|of|to|with|are|for|that|this)\b/gi
  const commonMatchCount = (text.match(englishCommonWords) || []).length
  score += (commonMatchCount / totalWords) * 2

  // Penalty for Umlauts
  const umlautCount = (text.match(/[äöüßÄÖÜ]/g) || []).length
  if (umlautCount > 0) score -= 0.5

  return Math.min(Math.max(score, 0), 1) // Cap between 0 and 1
}