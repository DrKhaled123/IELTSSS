import { useState, useCallback, useMemo } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

export function useGrammarPDFExtractor() {
  const [extractionState, setExtractionState] = useState({
    isProcessing: false,
    progress: 0,
    currentFile: null,
    extractedContent: null,
    error: null
  })

  // IELTS Grammar patterns to extract from PDFs
  const grammarPatterns = useMemo(() => ({
    // English Tenses
    tenses: [
      /have\s+\w+ed\b/gi, // Present Perfect
      /has\s+\w+ed\b/gi,
      /had\s+\w+ed\b/gi, // Past Perfect
      /will\s+\w+\b/gi, // Future
      /would\s+\w+\b/gi, // Conditional
      /is\s+\w+ing\b/gi, // Continuous
      /are\s+\w+ing\b/gi
    ],

    // Articles
    articles: [
      /the\s+\w+/gi,
      /a\s+\w+/gi,
      /an\s+\w+/gi
    ],

    // Prepositions
    prepositions: [
      /\b(in|on|at|by|for|with|about|of|to|from)\b/gi
    ],

    // Grammar rule indicators
    ruleIndicators: [
      /Present Perfect/gi,
      /Past Simple/gi,
      /Future Simple/gi,
      /Passive Voice/gi,
      /Conditional/gi,
      /Reported Speech/gi,
      /Relative Clauses/gi
    ],

    // Exercise patterns
    exercisePatterns: [
      /Exercise\s+\d+/gi,
      /Task\s+\d+/gi,
      /Fill\s+in\s+the\s+blanks/gi,
      /Complete\s+the\s+sentences/gi,
      /Choose\s+the\s+correct/gi
    ]
  }), [])

  // Extract text from PDF
  const extractTextFromPDF = useCallback(async (file) => {
    try {
      setExtractionState(prev => ({
        ...prev,
        isProcessing: true,
        progress: 0,
        currentFile: file.name,
        error: null
      }))

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      const pages = []
      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')

        fullText += pageText + '\n'
        pages.push({
          pageNumber: i,
          text: pageText,
          wordCount: pageText.split(/\s+/).length
        })

        // Update progress
        setExtractionState(prev => ({
          ...prev,
          progress: (i / pdf.numPages) * 100
        }))
      }

      const extractedContent = {
        id: `pdf_${Date.now()}`,
        fileName: file.name,
        pages,
        fullText,
        wordCount: fullText.split(/\s+/).length,
        metadata: {
          pageCount: pdf.numPages,
          fileSize: file.size,
          extractedAt: Date.now()
        }
      }

      setExtractionState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        extractedContent,
        error: null
      }))

      return extractedContent

    } catch (error) {
      setExtractionState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 0,
        error: `PDF extraction failed: ${error.message}`
      }))
      throw error
    }
  }, [])

  // Extract grammar rules from PDF content
  const extractGrammarRules = useCallback((pdfContent) => {
    if (!pdfContent || !pdfContent.fullText) return []

    const grammarRules = []
    const text = pdfContent.fullText

    // Extract Tense Examples
    const tenseExamples = extractTenseExamples(text)
    grammarRules.push(...tenseExamples)

    // Extract preposition usage
    const prepositionExamples = extractPrepositionExamples(text)
    grammarRules.push(...prepositionExamples)

    // Extract grammar rule explanations
    const ruleExplanations = extractRuleExplanations(text)
    grammarRules.push(...ruleExplanations)

    // Extract exercises
    const exercises = extractExercises(text, pdfContent.pages)
    grammarRules.push(...exercises)

    return grammarRules
  }, [])

  // Extract tense examples from text
  const extractTenseExamples = useCallback((text) => {
    const examples = []

    // Find tense patterns
    grammarPatterns.tenses.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          examples.push({
            type: 'tense_example',
            structure: match,
            context: extractContext(text, match, 50)
          })
        })
      }
    })

    return examples
  }, [grammarPatterns])


  // Extract preposition examples
  const extractPrepositionExamples = useCallback((text) => {
    const prepositionExamples = []

    grammarPatterns.prepositions.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const context = extractContext(text, match, 100)
          prepositionExamples.push({
            type: 'preposition_example',
            preposition: match,
            context
          })
        })
      }
    })

    return prepositionExamples
  }, [grammarPatterns])

  // Extract rule explanations
  const extractRuleExplanations = useCallback((text) => {
    const explanations = []

    grammarPatterns.ruleIndicators.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const context = extractContext(text, match, 200)

          explanations.push({
            type: 'rule_explanation',
            rule: match,
            explanation: context,
            category: 'grammar_rule'
          })
        })
      }
    })

    return explanations
  }, [grammarPatterns])

  // Extract exercises from text
  const extractExercises = useCallback((text, pages) => {
    const exercises = []

    grammarPatterns.exercisePatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const context = extractContext(text, match, 150)
          exercises.push({
            type: 'exercise',
            instruction: match,
            context,
            pageNumber: 1 // Simplified: would need generic logic for page num
          })
        })
      }
    })

    return exercises
  }, [grammarPatterns])

  // Extract context around a match
  const extractContext = useCallback((text, match, contextLength) => {
    const matchIndex = text.indexOf(match)
    if (matchIndex === -1) return ''

    const start = Math.max(0, matchIndex - contextLength)
    const end = Math.min(text.length, matchIndex + match.length + contextLength)

    return text.substring(start, end).trim()
  }, [])

  // Process PDF and extract grammar content
  const processPDF = useCallback(async (file) => {
    try {
      // Extract text from PDF
      const pdfContent = await extractTextFromPDF(file)

      // Extract grammar rules and examples
      const grammarRules = extractGrammarRules(pdfContent)

      // Organize extracted content by categories
      const organizedContent = organizeExtractedContent(grammarRules)

      const processedContent = {
        ...pdfContent,
        grammarRules,
        organizedContent,
        processedAt: Date.now()
      }

      setExtractionState(prev => ({
        ...prev,
        extractedContent: processedContent
      }))

      return processedContent

    } catch (error) {
      console.error('PDF processing failed:', error)
      throw error
    }
  }, [extractTextFromPDF, extractGrammarRules])

  // Organize extracted content by categories
  const organizeExtractedContent = useCallback((grammarRules) => {
    const organized = {
      tenses: [],
      prepositions: [],
      exercises: [],
      rules: [],
      examples: []
    }

    grammarRules.forEach(rule => {
      switch (rule.type) {
        case 'tense_example':
          organized.tenses.push(rule)
          break
        case 'preposition_example':
          organized.prepositions.push(rule)
          break
        case 'exercise':
          organized.exercises.push(rule)
          break
        case 'rule_explanation':
          organized.rules.push(rule)
          break
        default:
          organized.examples.push(rule)
      }
    })

    return organized
  }, [])

  // Generate grammar exercises from extracted content
  const generateExercisesFromContent = useCallback((extractedContent) => {
    if (!extractedContent || !extractedContent.grammarRules) return []

    const generatedExercises = []

    // Generate exercises from tense examples
    const tenseExamples = extractedContent.grammarRules.filter(rule =>
      rule.type === 'tense_example'
    )

    tenseExamples.forEach(example => {
      if (generatedExercises.length < 10) {
        generatedExercises.push({
          id: `generated_tense_${generatedExercises.length}`,
          type: 'multiple_choice',
          question: `Identify the tense in: "${example.structure}"`,
          context: example.context,
          difficulty: 'B2',
          source: 'pdf_extraction'
        })
      }
    })

    return generatedExercises
  }, [])

  // Reset extraction state
  const resetExtraction = useCallback(() => {
    setExtractionState({
      isProcessing: false,
      progress: 0,
      currentFile: null,
      extractedContent: null,
      error: null
    })
  }, [])

  return {
    extractionState,
    processPDF,
    extractGrammarRules,
    generateExercisesFromContent,
    resetExtraction
  }
}