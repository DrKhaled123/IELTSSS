import { useState, useCallback, useEffect, useMemo } from 'react'

export function useAdaptiveDifficulty() {
  const [userPerformance, setUserPerformance] = useState({})
  const [currentDifficulty, setCurrentDifficulty] = useState('A1')
  const [difficultySettings, setDifficultySettings] = useState({
    A1: { 
      level: 1, 
      complexity: 'basic', 
      timeLimit: 60,
      hintFrequency: 'high',
      errorTolerance: 0.8
    },
    A2: { 
      level: 2, 
      complexity: 'intermediate', 
      timeLimit: 45,
      hintFrequency: 'medium',
      errorTolerance: 0.7
    },
    B1: { 
      level: 3, 
      complexity: 'advanced', 
      timeLimit: 30,
      hintFrequency: 'low',
      errorTolerance: 0.6
    },
    B2: { 
      level: 4, 
      complexity: 'expert', 
      timeLimit: 25,
      hintFrequency: 'minimal',
      errorTolerance: 0.5
    },
    C1: { 
      level: 5, 
      complexity: 'mastery', 
      timeLimit: 20,
      hintFrequency: 'none',
      errorTolerance: 0.4
    }
  })

  // Performance metrics weights
  const performanceWeights = {
    accuracy: 0.4,      // 40% weight on answer accuracy
    speed: 0.2,         // 20% weight on completion speed
    consistency: 0.2,    // 20% weight on consistent performance
    progression: 0.2      // 20% weight on improvement over time
  }

  // Calculate performance score for a specific grammar topic
  const calculatePerformanceScore = useCallback((topicData) => {
    if (!topicData || !topicData.attempts) return 0

    const accuracy = topicData.correctAnswers / topicData.totalAttempts
    const avgTime = topicData.totalTime / topicData.totalAttempts
    const expectedTime = difficultySettings[currentDifficulty]?.timeLimit || 60
    const speedScore = Math.max(0, Math.min(1, expectedTime / avgTime))
    
    // Consistency: how consistent the user's performance is
    const timeVariance = calculateVariance(topicData.timePerAttempt || [])
    const consistencyScore = Math.max(0, 1 - (timeVariance / (expectedTime * expectedTime)))
    
    // Progression: improvement over recent attempts
    const recentScores = (topicData.recentScores || []).slice(-5)
    const progressionScore = recentScores.length >= 2 
      ? Math.max(0, (recentScores[recentScores.length - 1] - recentScores[0]) / 100)
      : 0.5

    const weightedScore = 
      (accuracy * performanceWeights.accuracy) +
      (speedScore * performanceWeights.speed) +
      (consistencyScore * performanceWeights.consistency) +
      (progressionScore * performanceWeights.progression)

    return Math.round(weightedScore * 100)
  }, [currentDifficulty, difficultySettings, performanceWeights])

  // Calculate variance for consistency measurement
  const calculateVariance = (values) => {
    if (!values || values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return variance
  }

  // Update user performance data
  const updatePerformance = useCallback((topicId, attemptData) => {
    setUserPerformance(prev => {
      const current = prev[topicId] || {
        attempts: 0,
        correctAnswers: 0,
        totalTime: 0,
        timePerAttempt: [],
        recentScores: [],
        lastAttempt: null,
        difficultyLevel: currentDifficulty
      }

      const updated = {
        ...current,
        attempts: current.attempts + 1,
        correctAnswers: current.correctAnswers + (attemptData.isCorrect ? 1 : 0),
        totalTime: current.totalTime + attemptData.timeSpent,
        timePerAttempt: [...current.timePerAttempt, attemptData.timeSpent].slice(-10), // Keep last 10 attempts
        recentScores: [...current.recentScores, attemptData.score].slice(-10), // Keep last 10 scores
        lastAttempt: attemptData.timestamp,
        difficultyLevel: currentDifficulty
      }

      return {
        ...prev,
        [topicId]: updated
      }
    })
  }, [currentDifficulty])

  // Determine if user should advance to next difficulty level
  const shouldAdvanceDifficulty = useCallback(() => {
    const topics = Object.keys(userPerformance)
    if (topics.length === 0) return false

    // Check if user performs well consistently across multiple topics
    const highPerformingTopics = topics.filter(topicId => {
      const score = calculatePerformanceScore(userPerformance[topicId])
      return score >= 75 // 75% or better performance
    })

    // Need at least 3 topics with good performance to advance
    return highPerformingTopics.length >= 3 && 
           highPerformingTopics.length / topics.length >= 0.6 // 60% of topics
  }, [userPerformance, calculatePerformanceScore])

  // Determine if user should decrease difficulty
  const shouldDecreaseDifficulty = useCallback(() => {
    const topics = Object.keys(userPerformance)
    if (topics.length === 0 || currentDifficulty === 'A1') return false

    // Check if user struggles consistently across multiple topics
    const strugglingTopics = topics.filter(topicId => {
      const score = calculatePerformanceScore(userPerformance[topicId])
      return score < 40 // Less than 40% performance
    })

    // If struggling with more than 50% of topics, consider decreasing
    return strugglingTopics.length / topics.length >= 0.5
  }, [userPerformance, currentDifficulty, calculatePerformanceScore])

  // Adaptive difficulty adjustment
  const adjustDifficulty = useCallback(() => {
    if (shouldAdvanceDifficulty()) {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1']
      const currentIndex = levels.indexOf(currentDifficulty)
      if (currentIndex < levels.length - 1) {
        setCurrentDifficulty(levels[currentIndex + 1])
        return { action: 'advanced', newLevel: levels[currentIndex + 1] }
      }
    } else if (shouldDecreaseDifficulty()) {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1']
      const currentIndex = levels.indexOf(currentDifficulty)
      if (currentIndex > 0) {
        setCurrentDifficulty(levels[currentIndex - 1])
        return { action: 'decreased', newLevel: levels[currentIndex - 1] }
      }
    }
    return { action: 'unchanged', newLevel: currentDifficulty }
  }, [currentDifficulty, shouldAdvanceDifficulty, shouldDecreaseDifficulty])

  // Get personalized quiz parameters based on current difficulty
  const getQuizParameters = useCallback((questionType) => {
    const settings = difficultySettings[currentDifficulty]
    const baseTimeLimit = settings.timeLimit

    // Adjust time limits based on question complexity
    const timeMultipliers = {
      multiple_choice: 1.0,
      fill_blank: 1.2,
      conjugation: 1.5,
      sentence_building: 2.0,
      word_order: 1.8,
      case_identification: 1.1,
      conjunction_choice: 1.0,
      translation: 2.5,
      error_correction: 2.0,
      plural_formation: 1.4
    }

    return {
      timeLimit: Math.round(baseTimeLimit * (timeMultipliers[questionType] || 1.0)),
      showHints: settings.hintFrequency !== 'none',
      hintFrequency: settings.hintFrequency,
      errorTolerance: settings.errorTolerance,
      complexity: settings.complexity,
      adaptiveHints: generateAdaptiveHints(questionType, settings.complexity)
    }
  }, [currentDifficulty, difficultySettings])

  // Generate adaptive hints based on difficulty and question type
  const generateAdaptiveHints = useCallback((questionType, complexity) => {
    const hintTemplates = {
      basic: {
        multiple_choice: ['Look at the context carefully', 'Consider the gender of the noun', 'Think about the verb conjugation'],
        fill_blank: ['What fits grammatically?', 'Consider the tense', 'Check subject-verb agreement'],
        conjugation: ['Remove the -en ending', 'Add the correct personal ending', 'Check for irregular forms']
      },
      intermediate: {
        multiple_choice: ['Analyze the sentence structure', 'Consider the case requirements', 'Think about word order'],
        fill_blank: ['What case is needed?', 'Consider preposition requirements', 'Check adjective endings'],
        conjugation: ['Is this a separable verb?', 'Consider the auxiliary verb', 'Check for modal verb usage']
      },
      advanced: {
        multiple_choice: ['Analyze subordinate clause structure', 'Consider passive vs active voice', 'Think about subjunctive mood'],
        fill_blank: ['What grammatical function is needed?', 'Consider complex sentence structure', 'Check for idiomatic expressions'],
        conjugation: ['Is subjunctive required?', 'Consider conditional forms', 'Check for special conjugations']
      },
      expert: {
        multiple_choice: ['Analyze complex grammatical structures', 'Consider stylistic requirements', 'Think about register and formality'],
        fill_blank: ['What advanced grammatical concept applies?', 'Consider nuanced meanings', 'Check for complex agreements'],
        conjugation: ['Consider rare verb forms', 'Think about literary usage', 'Check for archaic forms']
      },
      mastery: {
        multiple_choice: ['Analyze sophisticated grammatical patterns', 'Consider academic language requirements', 'Think about complex syntax'],
        fill_blank: ['What expert-level concept applies?', 'Consider specialized terminology', 'Check for complex grammatical interactions'],
        conjugation: ['Consider all possible conjugations', 'Think about exceptional forms', 'Check for highly irregular patterns']
      }
    }

    return hintTemplates[complexity]?.[questionType] || []
  }, [])

  // Get learning recommendations based on performance
  const getRecommendations = useCallback(() => {
    const recommendations = []
    const topics = Object.keys(userPerformance)

    topics.forEach(topicId => {
      const performance = userPerformance[topicId]
      const score = calculatePerformanceScore(performance)
      
      if (score < 40) {
        recommendations.push({
          type: 'struggle',
          topicId,
          message: `Focus on basic concepts for ${topicId}`,
          priority: 'high',
          suggestedActions: ['Review fundamental rules', 'Practice with examples', 'Use more hints']
        })
      } else if (score < 60) {
        recommendations.push({
          type: 'improvement',
          topicId,
          message: `Continue practicing ${topicId} for better mastery`,
          priority: 'medium',
          suggestedActions: ['Try timed exercises', 'Reduce hint usage', 'Focus on accuracy']
        })
      } else if (score > 85) {
        recommendations.push({
          type: 'excellence',
          topicId,
          message: `Excellent performance in ${topicId}!`,
          priority: 'low',
          suggestedActions: ['Try advanced variations', 'Help others learn', 'Explore related topics']
        })
      }
    })

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [userPerformance, calculatePerformanceScore])

  // Get overall learning analytics
  const getAnalytics = useCallback(() => {
    const topics = Object.keys(userPerformance)
    if (topics.length === 0) return null

    const totalAttempts = topics.reduce((sum, topicId) => sum + userPerformance[topicId].attempts, 0)
    const totalCorrect = topics.reduce((sum, topicId) => sum + userPerformance[topicId].correctAnswers, 0)
    const overallAccuracy = totalCorrect / totalAttempts

    const difficultyDistribution = topics.reduce((dist, topicId) => {
      const difficulty = userPerformance[topicId].difficultyLevel
      dist[difficulty] = (dist[difficulty] || 0) + 1
      return dist
    }, {})

    const averagePerformance = topics.reduce((sum, topicId) => 
      sum + calculatePerformanceScore(userPerformance[topicId]), 0) / topics.length

    const improvementTrend = calculateImprovementTrend()

    return {
      overall: {
        totalTopics: topics.length,
        totalAttempts,
        overallAccuracy: Math.round(overallAccuracy * 100),
        averagePerformance: Math.round(averagePerformance),
        currentDifficulty,
        improvementTrend
      },
      byDifficulty: difficultyDistribution,
      topicPerformance: topics.map(topicId => ({
        id: topicId,
        performance: calculatePerformanceScore(userPerformance[topicId]),
        attempts: userPerformance[topicId].attempts,
        accuracy: Math.round((userPerformance[topicId].correctAnswers / userPerformance[topicId].attempts) * 100)
      }))
    }
  }, [userPerformance, currentDifficulty, calculatePerformanceScore])

  // Calculate improvement trend over time
  const calculateImprovementTrend = useCallback(() => {
    const allRecentScores = []
    Object.values(userPerformance).forEach(performance => {
      allRecentScores.push(...performance.recentScores)
    })

    if (allRecentScores.length < 5) return 'insufficient_data'

    const recent = allRecentScores.slice(-10)
    const earlier = allRecentScores.slice(-20, -10)
    
    if (earlier.length === 0) return 'insufficient_data'

    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length
    const earlierAvg = earlier.reduce((sum, score) => sum + score, 0) / earlier.length

    const improvement = ((recentAvg - earlierAvg) / earlierAvg) * 100

    if (improvement > 10) return 'improving'
    if (improvement < -10) return 'declining'
    return 'stable'
  }, [userPerformance])

  // Auto-adjust difficulty based on performance
  useEffect(() => {
    const adjustment = adjustDifficulty()
    if (adjustment.action !== 'unchanged') {
      console.log(`Difficulty ${adjustment.action} to ${adjustment.newLevel}`)
    }
  }, [userPerformance, adjustDifficulty])

  return {
    currentDifficulty,
    difficultySettings,
    userPerformance,
    updatePerformance,
    getQuizParameters,
    getRecommendations,
    getAnalytics,
    adjustDifficulty,
    calculatePerformanceScore
  }
}