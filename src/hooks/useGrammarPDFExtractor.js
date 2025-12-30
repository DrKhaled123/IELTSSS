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

  // Grammar patterns to extract from PDFs
  const grammarPatterns = useMemo(() => ({
    // Verb conjugation patterns
    verbConjugation: [
      /ich\s+(\w+e)/gi,
      /du\s+(\w+st)/gi,
      /er\/sie\/es\s+(\w+t)/gi,
      /wir\s+(\w+n)/gi,
      /ihr\s+(\w+t)/gi,
      /sie\/Sie\s+(\w+n)/gi
    ],
    
    // Case patterns
    nominative: [
      /der\s+(\w+)/gi,
      /die\s+(\w+)/gi,
      /das\s+(\w+)/gi
    ],
    accusative: [
      /den\s+(\w+)/gi,
      /die\s+(\w+)/gi,
      /das\s+(\w+)/gi
    ],
    dative: [
      /dem\s+(\w+)/gi,
      /der\s+(\w+)/gi,
      /dem\s+(\w+)/gi
    ],
    genitive: [
      /des\s+(\w+)/gi,
      /der\s+(\w+)/gi,
      /des\s+(\w+)/gi
    ],
    
    // Preposition patterns
    prepositions: [
      /\b(in|an|auf|über|unter|vor|nach|zu|mit|von|bei|seit|aus|für|gegen|ohne|durch|um)\b/gi
    ],
    
    // Grammar rule indicators
    ruleIndicators: [
      /Präteritum/gi,
      /Perfekt/gi,
      /Plusquamperfekt/gi,
      /Futur I/gi,
      /Futur II/gi,
      /Konjunktiv I/gi,
      /Konjunktiv II/gi,
      /Passiv/gi,
      /Aktiv/gi
    ],
    
    // Exercise patterns
    exercisePatterns: [
      /Übung\s+\d+/gi,
      /Aufgabe\s+\d+/gi,
      /Setzen\s+Sie\s+(ein|aus|an|auf)/gi,
      /Ergänzen\s+Sie/gi,
      /Bilden\s+Sie/gi
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

    // Extract verb conjugations
    const verbConjugations = extractVerbConjugations(text)
    grammarRules.push(...verbConjugations)

    // Extract case usage examples
    const caseExamples = extractCaseExamples(text)
    grammarRules.push(...caseExamples)

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

  // Extract verb conjugations from text
  const extractVerbConjugations = useCallback((text) => {
    const conjugations = []
    
    // Find conjugation patterns
    grammarPatterns.verbConjugation.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const parts = match.match(/(\w+)\s+(\w+)/)
          if (parts && parts.length >= 3) {
            conjugations.push({
              type: 'verb_conjugation',
              pronoun: parts[1],
              verbForm: parts[2],
              fullMatch: match,
              context: extractContext(text, match, 50)
            })
          }
        })
      }
    })

    return conjugations
  }, [grammarPatterns])

  // Extract case examples from text
  const extractCaseExamples = useCallback((text) => {
    const caseExamples = []
    
    Object.entries({
      nominative: grammarPatterns.nominative,
      accusative: grammarPatterns.accusative,
      dative: grammarPatterns.dative,
      genitive: grammarPatterns.genitive
    }).forEach(([caseType, patterns]) => {
      patterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
          matches.forEach(match => {
            const parts = match.match(/(der|die|das|den|dem|des)\s+(\w+)/i)
            if (parts && parts.length >= 3) {
              caseExamples.push({
                type: 'case_example',
                caseType,
                article: parts[1],
                noun: parts[2],
                fullMatch: match,
                context: extractContext(text, match, 50)
              })
            }
          })
        }
      })
    })

    return caseExamples
  }, [grammarPatterns])

  // Extract preposition examples
  const extractPrepositionExamples = useCallback((text) => {
    const prepositionExamples = []
    
    grammarPatterns.prepositions.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          // Extract surrounding context to understand usage
          const context = extractContext(text, match, 100)
          
          prepositionExamples.push({
            type: 'preposition_example',
            preposition: match,
            context,
            caseType: determinePrepositionCase(match, context)
          })
        })
      }
    })

    return prepositionExamples
  }, [grammarPatterns])

  // Extract rule explanations
  const extractRuleExplanations = useCallback((text) => {
    const explanations = []
    
    // Look for rule indicators and extract surrounding text
    grammarPatterns.ruleIndicators.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const context = extractContext(text, match, 200)
          
          explanations.push({
            type: 'rule_explanation',
            rule: match,
            explanation: context,
            category: categorizeRule(match)
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
            pageNumber: findPageNumber(pages, match),
            exerciseType: categorizeExercise(match)
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

  // Determine preposition case
  const determinePrepositionCase = useCallback((preposition, context) => {
    const accusativePreps = ['durch', 'für', 'gegen', 'ohne', 'um']
    const dativePreps = ['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu']
    const twoWayPreps = ['in', 'an', 'auf', 'über', 'unter', 'vor', 'zwischen']
    
    if (accusativePreps.includes(preposition.toLowerCase())) return 'accusative'
    if (dativePreps.includes(preposition.toLowerCase())) return 'dative'
    if (twoWayPreps.includes(preposition.toLowerCase())) {
      // Analyze context to determine case
      const motionIndicators = ['gehe', 'komme', 'fahre', 'lege', 'stelle']
      const locationIndicators = ['bin', 'sitze', 'stehe', 'liegt', 'befindet']
      
      const contextLower = context.toLowerCase()
      if (motionIndicators.some(indicator => contextLower.includes(indicator))) {
        return 'accusative'
      } else if (locationIndicators.some(indicator => contextLower.includes(indicator))) {
        return 'dative'
      }
    }
    
    return 'unknown'
  }, [])

  // Categorize grammar rule
  const categorizeRule = useCallback((rule) => {
    const ruleLower = rule.toLowerCase()
    
    if (ruleLower.includes('präteritum')) return 'past_tense'
    if (ruleLower.includes('perfekt')) return 'perfect_tense'
    if (ruleLower.includes('konjunktiv')) return 'subjunctive'
    if (ruleLower.includes('passiv')) return 'passive_voice'
    if (ruleLower.includes('futur')) return 'future_tense'
    
    return 'general'
  }, [])

  // Categorize exercise type
  const categorizeExercise = useCallback((exercise) => {
    const exerciseLower = exercise.toLowerCase()
    
    if (exerciseLower.includes('einsetzen')) return 'fill_blank'
    if (exerciseLower.includes('ergänzen')) return 'completion'
    if (exerciseLower.includes('bilden')) return 'sentence_building'
    if (exerciseLower.includes('übung') || exerciseLower.includes('aufgabe')) return 'general_practice'
    
    return 'unknown'
  }, [])

  // Find page number for text
  const findPageNumber = useCallback((pages, text) => {
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].text.includes(text)) {
        return i + 1
      }
    }
    return null
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
      verbs: [],
      cases: [],
      prepositions: [],
      exercises: [],
      rules: [],
      examples: []
    }

    grammarRules.forEach(rule => {
      switch (rule.type) {
        case 'verb_conjugation':
          organized.verbs.push(rule)
          break
        case 'case_example':
          organized.cases.push(rule)
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
    
    // Generate exercises from verb conjugations
    const verbConjugations = extractedContent.grammarRules.filter(rule => 
      rule.type === 'verb_conjugation'
    )
    
    verbConjugations.forEach(conjugation => {
      if (generatedExercises.length < 10) { // Limit to 10 exercises
        generatedExercises.push({
          id: `generated_verb_${generatedExercises.length}`,
          type: 'conjugation',
          question: `Conjugate the verb for "${conjugation.pronoun}":`,
          context: conjugation.context,
          correct: conjugation.verbForm,
          difficulty: 'A1',
          source: 'pdf_extraction'
        })
      }
    })

    // Generate exercises from case examples
    const caseExamples = extractedContent.grammarRules.filter(rule => 
      rule.type === 'case_example'
    )
    
    caseExamples.forEach(example => {
      if (generatedExercises.length < 20) {
        generatedExercises.push({
          id: `generated_case_${generatedExercises.length}`,
          type: 'multiple_choice',
          question: `Which article is correct for "${example.noun}" in ${example.caseType} case?`,
          options: generateArticleOptions(example.noun, example.caseType),
          correct: example.article,
          context: example.context,
          difficulty: 'A2',
          source: 'pdf_extraction'
        })
      }
    })

    return generatedExercises
  }, [])

  // Generate article options for multiple choice
  const generateArticleOptions = useCallback((noun, caseType) => {
    const baseOptions = ['der', 'die', 'das', 'den', 'dem', 'des']
    
    // Add some plausible distractors
    const distractors = baseOptions.filter(option => option !== 'der' && option !== 'die' && option !== 'das')
    
    return [
      ...baseOptions.slice(0, 3),
      ...distractors.slice(0, 1)
    ].sort(() => Math.random() - 0.5)
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