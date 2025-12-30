import { useState, useCallback, useEffect, useMemo } from 'react'

export function useGrammarQuiz() {
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswers, setUserAnswers] = useState([])
  const [quizResult, setQuizResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [isQuizActive, setIsQuizActive] = useState(false)

  // Quiz types with different scoring weights
  const quizTypes = {
    multiple_choice: { weight: 1, timeLimit: 30 },
    fill_blank: { weight: 1.2, timeLimit: 45 },
    conjugation: { weight: 1.5, timeLimit: 60 },
    sentence_building: { weight: 2, timeLimit: 90 },
    word_order: { weight: 1.8, timeLimit: 75 },
    case_identification: { weight: 1.3, timeLimit: 40 },
    conjunction_choice: { weight: 1.2, timeLimit: 35 },
    translation: { weight: 2.5, timeLimit: 120 },
    error_correction: { weight: 2, timeLimit: 100 },
    plural_formation: { weight: 1.4, timeLimit: 50 }
  }

  // Start a new quiz
  const startQuiz = useCallback((quizData) => {
    setCurrentQuiz(quizData)
    setCurrentQuestion(0)
    setUserAnswers([])
    setQuizResult(null)
    setShowResult(false)
    setTimeRemaining(quizData.questions?.[0]?.timeLimit || 60)
    setIsQuizActive(true)
  }, [])

  // Answer current question
  const answerQuestion = useCallback((answer) => {
    if (!currentQuiz || !isQuizActive) return

    const newAnswers = [...userAnswers]
    newAnswers[currentQuestion] = {
      questionId: currentQuiz.questions[currentQuestion].id,
      answer,
      timeSpent: (currentQuiz.questions[currentQuestion]?.timeLimit || 60) - timeRemaining,
      timestamp: Date.now()
    }
    setUserAnswers(newAnswers)

    // Move to next question or finish quiz
    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setTimeRemaining(currentQuiz.questions[currentQuestion + 1]?.timeLimit || 60)
    } else {
      finishQuiz(newAnswers)
    }
  }, [currentQuiz, currentQuestion, userAnswers, timeRemaining, isQuizActive])

  // Finish quiz and calculate results
  const finishQuiz = useCallback((answers) => {
    if (!currentQuiz) return

    const results = currentQuiz.questions.map((question, index) => {
      const userAnswer = answers[index]
      const isCorrect = checkAnswer(question, userAnswer?.answer)
      
      return {
        questionId: question.id,
        questionType: question.type,
        userAnswer: userAnswer?.answer || '',
        correctAnswer: question.correct,
        isCorrect,
        timeSpent: userAnswer?.timeSpent || 0,
        maxTime: question.timeLimit || 60,
        score: calculateQuestionScore(question, isCorrect, userAnswer?.timeSpent || 0)
      }
    })

    const totalScore = results.reduce((sum, result) => sum + result.score, 0)
    const maxScore = results.reduce((sum, result) => {
      const weight = quizTypes[result.questionType]?.weight || 1
      return sum + (100 * weight)
    }, 0)
    const percentageScore = Math.round((totalScore / maxScore) * 100)

    const quizResult = {
      quizId: currentQuiz.id,
      quizTitle: currentQuiz.title,
      totalQuestions: currentQuiz.questions.length,
      correctAnswers: results.filter(r => r.isCorrect).length,
      incorrectAnswers: results.filter(r => !r.isCorrect).length,
      totalTime: results.reduce((sum, r) => sum + r.timeSpent, 0),
      averageTimePerQuestion: Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length),
      score: percentageScore,
      results,
      completedAt: Date.now()
    }

    setQuizResult(quizResult)
    setShowResult(true)
    setIsQuizActive(false)
    setTimeRemaining(null)

    return quizResult
  }, [currentQuiz, quizTypes])

  // Check if answer is correct based on question type
  const checkAnswer = useCallback((question, userAnswer) => {
    if (!userAnswer || !userAnswer.toString().trim()) return false

    const normalizeAnswer = (answer) => {
      return answer.toString().toLowerCase().trim()
        .replace(/[.,!?;:]/g, '')
        .replace(/\s+/g, ' ')
    }

    const normalizedUserAnswer = normalizeAnswer(userAnswer)
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
        // More flexible checking for sentence building
        return normalizedUserAnswer.includes(normalizedCorrectAnswer.split(' ')[0]) &&
               normalizedUserAnswer.split(' ').length >= normalizedCorrectAnswer.split(' ').length - 1

      case 'error_correction':
        // Check if user identified the error correctly
        return normalizedUserAnswer === normalizedCorrectAnswer

      case 'plural_formation':
        // Check plural formation
        return normalizedUserAnswer === normalizedCorrectAnswer

      default:
        return normalizedUserAnswer === normalizedCorrectAnswer
    }
  }, [])

  // Calculate score for individual question
  const calculateQuestionScore = useCallback((question, isCorrect, timeSpent) => {
    const weight = quizTypes[question.type]?.weight || 1
    const timeLimit = question.timeLimit || 60
    const timeBonus = Math.max(0, (timeLimit - timeSpent) / timeLimit * 20) // Up to 20% time bonus
    
    if (!isCorrect) return 0
    
    const baseScore = 100 * weight
    const finalScore = baseScore + (baseScore * timeBonus / 100)
    
    return Math.round(finalScore)
  }, [quizTypes])

  // Timer effect
  useEffect(() => {
    if (!isQuizActive || timeRemaining === null) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto-submit empty answer
          answerQuestion('')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isQuizActive, timeRemaining, answerQuestion])

  // Get quiz statistics
  const getQuizStats = useCallback(() => {
    if (!quizResult) return null

    const typeStats = {}
    quizResult.results.forEach(result => {
      if (!typeStats[result.questionType]) {
        typeStats[result.questionType] = {
          total: 0,
          correct: 0,
          totalTime: 0,
          averageTime: 0
        }
      }
      
      const stats = typeStats[result.questionType]
      stats.total++
      if (result.isCorrect) stats.correct++
      stats.totalTime += result.timeSpent
      stats.averageTime = stats.totalTime / stats.total
    })

    return {
      overall: {
        score: quizResult.score,
        totalQuestions: quizResult.totalQuestions,
        correctAnswers: quizResult.correctAnswers,
        incorrectAnswers: quizResult.incorrectAnswers,
        averageTime: quizResult.averageTimePerQuestion
      },
      byType: typeStats,
      recommendations: generateRecommendations(typeStats)
    }
  }, [quizResult])

  // Generate personalized recommendations
  const generateRecommendations = useCallback((typeStats) => {
    const recommendations = []

    Object.entries(typeStats).forEach(([type, stats]) => {
      const accuracy = (stats.correct / stats.total) * 100
      const avgTime = stats.averageTime
      const expectedTime = quizTypes[type]?.timeLimit || 60

      if (accuracy < 60) {
        recommendations.push({
          type: 'accuracy',
          questionType: type,
          message: `Focus on ${type.replace('_', ' ')} exercises. Your accuracy is ${Math.round(accuracy)}%.`,
          priority: 'high'
        })
      }

      if (avgTime > expectedTime * 0.9) {
        recommendations.push({
          type: 'speed',
          questionType: type,
          message: `Practice ${type.replace('_', ' ')} exercises faster. Average time: ${Math.round(avgTime)}s.`,
          priority: 'medium'
        })
      }
    })

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [quizTypes])

  // Reset quiz
  const resetQuiz = useCallback(() => {
    setCurrentQuiz(null)
    setCurrentQuestion(0)
    setUserAnswers([])
    setQuizResult(null)
    setShowResult(false)
    setTimeRemaining(null)
    setIsQuizActive(false)
  }, [])

  return {
    currentQuiz,
    currentQuestion,
    userAnswers,
    quizResult,
    showResult,
    timeRemaining,
    isQuizActive,
    quizTypes,
    startQuiz,
    answerQuestion,
    resetQuiz,
    getQuizStats,
    checkAnswer
  }
}