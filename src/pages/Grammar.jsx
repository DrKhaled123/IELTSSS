import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BookOpen,
  Brain,
  CheckCircle,
  X,
  Award,
  Clock,
  TrendingUp,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Mic,
  Volume2,
  FileText,
  BarChart3,
  Target,
  Zap,
  Settings,
  Download,
  Upload,
  BookMarked,
  Star,
  Trophy,
  AlertCircle,
  Lightbulb
} from 'lucide-react'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useGrammarQuiz } from '../hooks/useGrammarQuiz'
import { useAdaptiveDifficulty } from '../hooks/useAdaptiveDifficulty'
import { useGrammarAnalytics } from '../hooks/useGrammarAnalytics'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useGrammarPDFExtractor } from '../hooks/useGrammarPDFExtractor'
import { useSharedData } from '../hooks/useSharedData'

// Import grammar database
import grammarDatabase from '../data/grammar-database.json'
import BilingualContainer from '../components/BilingualContainer'

export default function Grammar() {
  // State management
  const [selectedRule, setSelectedRule] = useState(null)
  const [currentView, setCurrentView] = useState('lessons') // lessons, quiz, analytics, pdf
  const [currentLevel, setCurrentLevel] = useState('A1')
  const [userAnswers, setUserAnswers] = useState({})
  const [showHints, setShowHints] = useState(true)
  const [practiceMode, setPracticeMode] = useState('guided') // guided, free, test
  const [showPronunciation, setShowPronunciation] = useState(true)
  const [pdfFile, setPdfFile] = useState(null)
  const [extractedContent, setExtractedContent] = useState(null)

  // Custom hooks
  const { trackProgress } = useProgressTracking()
  const {
    currentQuiz,
    currentQuestion,
    quizResult,
    showResult,
    timeRemaining,
    isQuizActive,
    startQuiz,
    answerQuestion,
    resetQuiz,
    getQuizStats
  } = useGrammarQuiz()

  const {
    currentDifficulty,
    userPerformance,
    updatePerformance,
    getQuizParameters,
    getRecommendations,
    getAnalytics,
    adjustDifficulty
  } = useAdaptiveDifficulty()

  const {
    analyticsData,
    loading: analyticsLoading,
    calculateAnalytics,
    exportAnalytics,
    achievementDefinitions
  } = useGrammarAnalytics()

  const {
    speak,
    speakWithHighlighting,
    cancel,
    getGermanVoice,
    supported: speechSupported
  } = useSpeechSynthesis()

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    supported: recognitionSupported
  } = useSpeechRecognition()

  const {
    extractionState,
    processPDF,
    extractGrammarRules,
    generateExercisesFromContent,
    resetExtraction
  } = useGrammarPDFExtractor()

  const {
    getSharedGrammar,
    addSharedGrammar,
    updateSyncStatus
  } = useSharedData()
  const [sharedGrammarRules, setSharedGrammarRules] = useState([])

  // Filter and organize grammar rules
  const filteredRules = useMemo(() => {
    return grammarDatabase.grammarRules.filter(rule => rule.level === currentLevel)
  }, [currentLevel])

  const rulesByCategory = useMemo(() => {
    const categorized = {}
    filteredRules.forEach(rule => {
      if (!categorized[rule.category]) {
        categorized[rule.category] = []
      }
      categorized[rule.category].push(rule)
    })
    return categorized
  }, [filteredRules])

  // Handle rule selection
  const handleRuleSelect = useCallback((rule) => {
    setSelectedRule(rule)
    setCurrentView('lesson_detail')

    trackProgress('grammar_lesson', 'started', {
      ruleId: rule.id,
      title: rule.title,
      level: rule.level,
      timestamp: new Date().toISOString()
    })
  }, [trackProgress])

  // Handle quiz generation from rule
  const handleStartQuiz = useCallback((rule) => {
    const quizParams = getQuizParameters(rule.exercises[0]?.type || 'multiple_choice')
    const quizQuestions = rule.exercises.map(exercise => ({
      ...exercise,
      timeLimit: quizParams.timeLimit,
      showHints: showHints && quizParams.showHints,
      errorTolerance: quizParams.errorTolerance
    }))

    const quiz = {
      id: `quiz_${rule.id}_${Date.now()}`,
      title: `Quiz: ${rule.title}`,
      ruleId: rule.id,
      questions: quizQuestions,
      difficulty: currentDifficulty,
      estimatedTime: quizQuestions.reduce((sum, q) => sum + (q.timeLimit || 60), 0)
    }

    startQuiz(quiz)
    setCurrentView('quiz')
    setSelectedRule(rule)
  }, [getQuizParameters, startQuiz, showHints, currentDifficulty])

  // Handle quiz answer
  const handleQuizAnswer = useCallback((answer) => {
    if (!currentQuiz) return

    answerQuestion(answer)

    // Update performance tracking
    const currentQuestionData = currentQuiz.questions[currentQuestion]
    const isCorrect = checkAnswer(currentQuestionData, answer)

    updatePerformance(currentQuiz.ruleId, {
      isCorrect,
      timeSpent: (currentQuestionData?.timeLimit || 60) - timeRemaining,
      score: isCorrect ? 100 : 0,
      timestamp: Date.now()
    })

    trackProgress('grammar_exercise', 'completed', {
      ruleId: currentQuiz.ruleId,
      questionId: currentQuestionData.id,
      isCorrect,
      difficulty: currentDifficulty,
      timestamp: new Date().toISOString()
    })
  }, [answerQuestion, currentQuiz, currentQuestion, timeRemaining, updatePerformance, trackProgress, currentDifficulty])

  // Check answer correctness
  const checkAnswer = useCallback((question, answer) => {
    if (!answer || !answer.toString().trim()) return false

    const normalizeAnswer = (ans) => {
      return ans.toString().toLowerCase().trim()
        .replace(/[.,!?;:]/g, '')
        .replace(/\s+/g, ' ')
    }

    const normalizedUserAnswer = normalizeAnswer(answer)
    const normalizedCorrectAnswer = normalizeAnswer(question.correct)

    switch (question.type) {
      case 'multiple_choice':
      case 'case_identification':
      case 'conjunction_choice':
        return normalizedUserAnswer === normalizedCorrectAnswer

      case 'fill_blank':
      case 'conjugation':
      case 'translation':
        return normalizedUserAnswer === normalizedCorrectAnswer

      case 'sentence_building':
      case 'word_order':
        return normalizedUserAnswer.includes(normalizedCorrectAnswer.split(' ')[0]) &&
          normalizedUserAnswer.split(' ').length >= normalizedCorrectAnswer.split(' ').length - 1

      case 'error_correction':
      case 'plural_formation':
        return normalizedUserAnswer === normalizedCorrectAnswer

      default:
        return normalizedUserAnswer === normalizedCorrectAnswer
    }
  }, [])

  // Handle pronunciation
  const handlePronunciation = useCallback((text, language = 'de') => {
    if (!speechSupported || !showPronunciation) return

    const voice = language === 'de' ? getGermanVoice() : null
    speak(text, {
      voice,
      rate: 0.8,
      lang: language,
      onStart: () => {
        trackProgress('pronunciation', 'started', {
          text,
          language,
          timestamp: new Date().toISOString()
        })
      },
      onEnd: () => {
        trackProgress('pronunciation', 'completed', {
          text,
          language,
          timestamp: new Date().toISOString()
        })
      }
    })
  }, [speak, speechSupported, showPronunciation, getGermanVoice, trackProgress])

  // Handle speech recognition for pronunciation practice
  const handleSpeechPractice = useCallback(() => {
    if (!recognitionSupported || !selectedRule) return

    const practiceText = selectedRule.examples[0]?.german || ''
    if (!practiceText) return

    startListening()

    // Stop listening after 5 seconds
    setTimeout(() => {
      stopListening()

      // Compare transcript with original
      const similarity = calculateSimilarity(practiceText, transcript)

      trackProgress('pronunciation_practice', 'completed', {
        original: practiceText,
        transcript,
        similarity,
        timestamp: new Date().toISOString()
      })
    }, 5000)
  }, [recognitionSupported, selectedRule, startListening, stopListening, transcript, trackProgress])

  // Calculate text similarity for pronunciation feedback
  const calculateSimilarity = (text1, text2) => {
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)

    const commonWords = words1.filter(word => words2.includes(word))
    const similarity = commonWords.length / Math.max(words1.length, words2.length)

    return Math.round(similarity * 100)
  }

  // Handle PDF upload and processing
  const handlePDFUpload = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file || file.type !== 'application/pdf') return

    setPdfFile(file)
    try {
      const processedContent = await processPDF(file)
      setExtractedContent(processedContent)
      setCurrentView('pdf_content')

      trackProgress('pdf_grammar_extraction', 'completed', {
        fileName: file.name,
        extractedRules: processedContent.grammarRules?.length || 0,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('PDF processing failed:', error)
    }
  }, [processPDF, trackProgress])

  // Generate exercises from PDF content
  const handleGenerateExercises = useCallback(() => {
    if (!extractedContent) return

    const generatedExercises = generateExercisesFromContent(extractedContent)
    if (generatedExercises.length > 0) {
      const customQuiz = {
        id: `pdf_quiz_${Date.now()}`,
        title: 'Quiz from PDF Content',
        ruleId: 'pdf_extracted',
        questions: generatedExercises,
        difficulty: currentDifficulty,
        estimatedTime: generatedExercises.reduce((sum, q) => sum + (q.timeLimit || 60), 0)
      }

      startQuiz(customQuiz)
      setCurrentView('quiz')
    }
  }, [extractedContent, generateExercisesFromContent, startQuiz, currentDifficulty])

  // Calculate analytics
  useEffect(() => {
    if (analyticsData) return

    // Mock user data for demonstration
    const mockUserData = {
      achievements: [],
      exerciseHistory: [],
      topicProgress: {}
    }

    calculateAnalytics(mockUserData, [], userPerformance)
  }, [analyticsData, calculateAnalytics, userPerformance])

  // Load shared grammar rules from PDF extraction
  useEffect(() => {
    const loadSharedGrammarData = async () => {
      try {
        const sharedGrammarData = getSharedGrammar('pdf')
        if (sharedGrammarData && sharedGrammarData.length > 0) {
          setSharedGrammarRules(sharedGrammarData)
          updateSyncStatus('grammar', 'synced')
        }
      } catch (error) {
        console.error('Error loading shared grammar:', error)
        updateSyncStatus('grammar', 'error')
      }
    }

    loadSharedGrammarData()
  }, [getSharedGrammar, updateSyncStatus])

  // Render different views
  const renderLessonsView = () => (
    <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <BookOpen size={24} />
        Grammar Lessons - {currentLevel}
      </h3>

      {/* Level Selection */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          {['A1', 'A2', 'B1', 'B2', 'C1'].map(level => (
            <button
              key={level}
              className={`btn ${currentLevel === level ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentLevel(level)}
              style={{ minWidth: '80px' }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Practice Mode Selection */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h4>Practice Mode</h4>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button
            className={`btn ${practiceMode === 'guided' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPracticeMode('guided')}
          >
            <Lightbulb size={16} />
            Guided
          </button>
          <button
            className={`btn ${practiceMode === 'free' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPracticeMode('free')}
          >
            <BookOpen size={16} />
            Free Practice
          </button>
          <button
            className={`btn ${practiceMode === 'test' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPracticeMode('test')}
          >
            <Target size={16} />
            Test Mode
          </button>
        </div>
      </div>

      {/* Settings */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h4>Settings</h4>
        <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <input
              type="checkbox"
              checked={showHints}
              onChange={(e) => setShowHints(e.target.checked)}
              style={{ marginRight: 'var(--space-sm)' }}
            />
            Show Hints
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <input
              type="checkbox"
              checked={showPronunciation}
              onChange={(e) => setShowPronunciation(e.target.checked)}
              style={{ marginRight: 'var(--space-sm)' }}
            />
            Pronunciation
          </label>
        </div>
      </div>

      {/* Grammar Rules by Category */}
      {Object.entries(rulesByCategory).map(([category, rules]) => (
        <div key={category} style={{ marginBottom: 'var(--space-xl)' }}>
          <h4 style={{
            textTransform: 'capitalize',
            marginBottom: 'var(--space-md)',
            color: 'var(--color-primary)'
          }}>
            {category.replace('_', ' ')}
          </h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {rules.map(rule => (
              <div
                key={rule.id}
                className="card"
                onClick={() => handleRuleSelect(rule)}
                style={{
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  border: selectedRule?.id === rule.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: selectedRule?.id === rule.id ? 'var(--color-surface)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedRule?.id !== rule.id) {
                    e.currentTarget.style.background = 'var(--color-surface-hover)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRule?.id !== rule.id) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <BookOpen size={24} color="white" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-text)' }}>
                      {rule.title}
                    </h5>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--space-xs)'
                    }}>
                      <span style={{
                        padding: 'var(--space-xs) var(--space-sm)',
                        background: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-xs)'
                      }}>
                        {rule.level}
                      </span>
                      <span>•</span>
                      <span>{rule.category.replace('_', ' ')}</span>
                    </div>
                    <p style={{
                      margin: '0',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--color-text-tertiary)',
                      lineHeight: 1.4
                    }}>
                      {rule.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const renderLessonDetailView = () => {
    if (!selectedRule) return null

    return (
      <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3>{selectedRule.title}</h3>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentView('lessons')}
          >
            Back to Lessons
          </button>
        </div>

        <BilingualContainer
          title="Lesson Details"
          germanContent={
            <div>
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ color: 'var(--color-primary)' }}>Erklärung</h4>
                <p style={{ fontSize: 'var(--font-lg)', lineHeight: 1.6 }}>
                  {selectedRule.germanExplanation || "Erklärung nicht verfügbar."}
                </p>
              </div>
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ color: 'var(--color-primary)' }}>Beispiele</h4>
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                  {selectedRule.examples.map((example, index) => (
                    <div key={`de-${index}`} className="card" style={{ padding: 'var(--space-md)', borderLeft: '4px solid var(--color-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 'var(--font-md)' }}>{example.german}</strong>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                          {showPronunciation && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: 'var(--space-xs) var(--space-sm)' }}
                              onClick={() => handlePronunciation(example.german)}
                            >
                              <Volume2 size={14} />
                            </button>
                          )}
                          {recognitionSupported && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: 'var(--space-xs) var(--space-sm)' }}
                              onClick={handleSpeechPractice}
                            >
                              <Mic size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
          englishContent={
            <div>
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ color: 'var(--color-secondary)' }}>Explanation</h4>
                <p style={{ fontSize: 'var(--font-lg)', lineHeight: 1.6 }}>
                  {selectedRule.explanation}
                </p>
              </div>
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ color: 'var(--color-secondary)' }}>Examples</h4>
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                  {selectedRule.examples.map((example, index) => (
                    <div key={`en-${index}`} className="card" style={{ padding: 'var(--space-md)', borderLeft: '4px solid var(--color-secondary)' }}>
                      <div style={{ fontSize: 'var(--font-md)' }}>
                        {example.english}
                      </div>
                      {example.translation && (
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-xs)' }}>
                          {example.translation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />

        {/* Tables */}
        {selectedRule.tables && selectedRule.tables.length > 0 && (
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h4>Grammar Tables</h4>
            {selectedRule.tables.map((table, index) => (
              <div key={index} className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                <h5>{table.title}</h5>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface)' }}>
                        {table.headers.map((header, i) => (
                          <th key={i} style={{
                            padding: 'var(--space-sm)',
                            textAlign: 'left',
                            borderBottom: '2px solid var(--color-border)',
                            fontWeight: 'var(--font-semibold)'
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          {row.map((cell, j) => (
                            <td key={j} style={{
                              padding: 'var(--space-sm)',
                              textAlign: j === 0 ? 'left' : 'center'
                            }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Exercises */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h4>Exercises</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
            {selectedRule.exercises.map((exercise, index) => (
              <button
                key={exercise.id}
                className="card"
                style={{
                  padding: 'var(--space-lg)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  textAlign: 'left'
                }}
                onClick={() => handleStartQuiz(selectedRule)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface-hover)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div>
                  <div style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    Exercise {index + 1}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-primary)',
                    fontWeight: 'var(--font-semibold)',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    {exercise.type.replace('_', ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                    {exercise.question}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Quiz Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => handleStartQuiz(selectedRule)}
            style={{ fontSize: 'var(--font-lg)', padding: 'var(--space-md) var(--space-xl)' }}
          >
            <Target size={20} />
            Start Quiz
          </button>
        </div>
      </div>
    )
  }

  const renderQuizView = () => {
    if (!currentQuiz) return null

    const currentQuestionData = currentQuiz.questions[currentQuestion]

    return (
      <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3>{currentQuiz.title}</h3>
          <button
            className="btn btn-secondary"
            onClick={() => {
              resetQuiz()
              setCurrentView('lessons')
            }}
          >
            Exit Quiz
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-sm)'
          }}>
            <span>Question {currentQuestion + 1} of {currentQuiz.questions.length}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Clock size={16} />
              {Math.max(0, timeRemaining)}s
            </span>
          </div>
          <div style={{
            height: '8px',
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${((currentQuestion + 1) / currentQuiz.questions.length) * 100}%`,
              background: 'var(--gradient-primary)',
              transition: 'width var(--transition-base)'
            }} />
          </div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>
            {currentQuestionData.type.replace('_', ' ').toUpperCase()}
          </h4>

          <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-md)'
          }}>
            <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text)', marginBottom: 'var(--space-lg)' }}>
              {currentQuestionData.question}
            </p>

            {/* Hint */}
            {showHints && currentQuestionData.hint && (
              <div style={{
                padding: 'var(--space-md)',
                background: 'hsla(45, 93%, 47%, 0.1)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-lg)'
              }}>
                <strong>💡 Hint:</strong> {currentQuestionData.hint}
              </div>
            )}

            {/* Answer Input */}
            <QuizAnswerInput
              question={currentQuestionData}
              onAnswer={handleQuizAnswer}
              timeRemaining={timeRemaining}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderAnalyticsView = () => (
    <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <BarChart3 size={24} />
          Grammar Analytics
        </h3>
        <button
          className="btn btn-secondary"
          onClick={() => exportAnalytics()}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {analyticsLoading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div className="animate-spin" style={{ margin: '0 auto var(--space-lg)' }}>
            <Settings size={32} />
          </div>
          <p>Loading analytics...</p>
        </div>
      ) : analyticsData ? (
        <div>
          {/* Overview Stats */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h4>Overview</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
              <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                  {analyticsData.overallStats.totalExercises}
                </div>
                <div>Total Exercises</div>
              </div>

              <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-success)' }}>
                  {analyticsData.overallStats.overallAccuracy}%
                </div>
                <div>Overall Accuracy</div>
              </div>

              <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-secondary)' }}>
                  {analyticsData.overallStats.currentLevel}
                </div>
                <div>Current Level</div>
              </div>

              <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-accent)' }}>
                  {analyticsData.overallStats.studyStreak}
                </div>
                <div>Day Streak</div>
              </div>
            </div>
          </div>

          {/* Weak Areas */}
          {analyticsData.weakAreas.length > 0 && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h4 style={{ color: 'var(--color-error)', marginBottom: 'var(--space-md)' }}>
                <AlertCircle size={20} style={{ marginRight: 'var(--space-sm)' }} />
                Areas for Improvement
              </h4>
              <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                {analyticsData.weakAreas.map((area, index) => (
                  <div key={index} className="card" style={{ padding: 'var(--space-md)' }}>
                    <h5 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-sm)' }}>
                      {area.topicId.replace('_', ' ').toUpperCase()}
                    </h5>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
                      Accuracy: {area.accuracy}%
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                      {area.recommendedActions.map((action, i) => (
                        <div key={i}>• {action}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div>
            <h4 style={{ marginBottom: 'var(--space-md)' }}>
              <Trophy size={20} style={{ marginRight: 'var(--space-sm)' }} />
              Recent Achievements
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
              {analyticsData.achievements.slice(0, 6).map((achievement, index) => (
                <div key={index} className="card" style={{
                  padding: 'var(--space-md)',
                  textAlign: 'center',
                  border: '2px solid var(--color-primary)'
                }}>
                  <div style={{ fontSize: 'var(--font-2xl)', marginBottom: 'var(--space-sm)' }}>
                    {achievement.icon}
                  </div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-xs)' }}>
                    {achievement.title}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                    {achievement.description}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-accent)', marginTop: 'var(--space-sm)' }}>
                    {achievement.points} points
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  const renderPDFView = () => (
    <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <FileText size={24} />
        PDF Grammar Extraction
      </h3>

      {/* PDF Upload */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h4>Upload PDF for Grammar Extraction</h4>
        <div style={{
          border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-2xl)',
          textAlign: 'center',
          background: 'var(--color-bg-elevated)'
        }}>
          <input
            type="file"
            accept=".pdf"
            onChange={handlePDFUpload}
            style={{ display: 'none' }}
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" style={{ cursor: 'pointer' }}>
            <Upload size={48} style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)' }} />
            <div style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text)', marginBottom: 'var(--space-sm)' }}>
              Click to upload PDF or drag and drop
            </div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
              Extract grammar rules, examples, and exercises
            </div>
          </label>
        </div>
      </div>

      {/* Extraction Progress */}
      {extractionState.isProcessing && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h4>Processing PDF...</h4>
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <div style={{
              height: '8px',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${extractionState.progress}%`,
                background: 'var(--gradient-primary)',
                transition: 'width var(--transition-base)'
              }} />
            </div>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            {extractionState.progress}% - {extractionState.currentFile}
          </p>
        </div>
      )}

      {/* Extracted Content */}
      {extractedContent && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h4>Extracted Content</h4>
            <button
              className="btn btn-primary"
              onClick={handleGenerateExercises}
            >
              <Target size={16} />
              Generate Exercises
            </button>
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {/* Grammar Rules */}
            {extractedContent.grammarRules && extractedContent.grammarRules.length > 0 && (
              <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <h5>Grammar Rules Found: {extractedContent.grammarRules.length}</h5>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {extractedContent.grammarRules.slice(0, 5).map((rule, index) => (
                    <div key={index} style={{
                      padding: 'var(--space-sm)',
                      background: 'var(--color-bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-xs)',
                      fontSize: 'var(--font-sm)'
                    }}>
                      <strong>{rule.type.replace('_', ' ').toUpperCase()}:</strong> {rule.fullMatch || rule.context}
                    </div>
                  ))}
                  {extractedContent.grammarRules.length > 5 && (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      ... and {extractedContent.grammarRules.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Statistics */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h5>Content Statistics</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>Pages</div>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-bold)' }}>
                    {extractedContent.pages?.length || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>Words</div>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-bold)' }}>
                    {extractedContent.wordCount || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Quiz Answer Input Component
  const QuizAnswerInput = ({ question, onAnswer, timeRemaining }) => {
    const [userAnswer, setUserAnswer] = useState('')

    const handleSubmit = () => {
      if (userAnswer.trim()) {
        onAnswer(userAnswer)
        setUserAnswer('')
      }
    }

    const renderInput = () => {
      switch (question.type) {
        case 'multiple_choice':
        case 'case_identification':
        case 'conjunction_choice':
          return (
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`btn ${userAnswer === option ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setUserAnswer(option)}
                  style={{
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    padding: 'var(--space-md)'
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )

        case 'sentence_building':
        case 'word_order':
          return (
            <textarea
              className="input textarea"
              placeholder="Type your sentence here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmit()
                }
              }}
              style={{ minHeight: '100px' }}
            />
          )

        default:
          return (
            <input
              type="text"
              className="input"
              placeholder="Type your answer here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit()
                }
              }}
            />
          )
      }
    }

    return (
      <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          {renderInput()}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!userAnswer.trim() || timeRemaining <= 0}
        >
          Submit
        </button>
      </div>
    )
  }

  return (
    <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1>Comprehensive Grammar Learning</h1>
        <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
          Master German grammar with adaptive learning, interactive exercises, and detailed analytics
        </p>
      </header>

      {/* Navigation Tabs */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', borderBottom: '1px solid var(--color-border)' }}>
          {[
            { id: 'lessons', label: 'Lessons', icon: BookOpen },
            { id: 'quiz', label: 'Quiz', icon: Target },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'pdf', label: 'PDF Extraction', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn ${currentView === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentView(tab.id)}
              style={{
                borderRadius: 0,
                borderBottom: currentView === tab.id ? '2px solid var(--color-primary)' : 'none',
                margin: 0
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current View */}
      {currentView === 'lessons' && renderLessonsView()}
      {currentView === 'lesson_detail' && renderLessonDetailView()}
      {currentView === 'quiz' && renderQuizView()}
      {currentView === 'analytics' && renderAnalyticsView()}
      {currentView === 'pdf' && renderPDFView()}
      {currentView === 'pdf_content' && renderPDFView()}
    </div>
  )
}