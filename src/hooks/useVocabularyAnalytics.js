import { useState, useEffect, useCallback, useMemo } from 'react'

// Analytics time periods
const TIME_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  ALL_TIME: 'all_time'
}

// Achievement types
const ACHIEVEMENT_TYPES = {
  VOCABULARY_MILESTONE: 'vocabulary_milestone',
  STREAK_ACHIEVEMENT: 'streak_achievement',
  MASTERY_LEVEL: 'mastery_level',
  GAME_MASTER: 'game_master',
  CONSISTENCY: 'consistency',
  IMPROVEMENT: 'improvement'
}

export function useVocabularyAnalytics(userProgress, spacedRepetitionData, gameHistory) {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    trends: {},
    achievements: [],
    recommendations: [],
    detailedStats: {}
  })
  
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS.WEEK)
  const [isLoading, setIsLoading] = useState(false)

  // Load achievements from localStorage
  useEffect(() => {
    const savedAchievements = localStorage.getItem('vocabulary-achievements')
    if (savedAchievements) {
      setAnalyticsData(prev => ({
        ...prev,
        achievements: JSON.parse(savedAchievements)
      }))
    }
  }, [])

  // Calculate comprehensive analytics
  const calculateAnalytics = useCallback((period = TIME_PERIODS.WEEK) => {
    setIsLoading(true)
    
    try {
      const now = new Date()
      const periodStart = getPeriodStartDate(now, period)
      
      // Filter data by period
      const periodProgress = filterDataByPeriod(userProgress, periodStart)
      const periodGameHistory = filterGameHistoryByPeriod(gameHistory, periodStart)
      const periodSpacedRepetition = filterSpacedRepetitionByPeriod(spacedRepetitionData, periodStart)
      
      // Calculate overview metrics
      const overview = calculateOverviewMetrics(
        periodProgress,
        periodGameHistory,
        periodSpacedRepetition,
        period
      )
      
      // Calculate trends
      const trends = calculateTrends(userProgress, gameHistory, period)
      
      // Get detailed statistics
      const detailedStats = calculateDetailedStats(
        periodProgress,
        periodGameHistory,
        periodSpacedRepetition
      )
      
      // Generate recommendations
      const recommendations = generateRecommendations(
        overview,
        trends,
        detailedStats
      )
      
      // Check for new achievements
      const newAchievements = checkAchievements(
        overview,
        trends,
        detailedStats,
        period
      )
      
      setAnalyticsData({
        overview,
        trends,
        achievements: [...analyticsData.achievements, ...newAchievements],
        recommendations,
        detailedStats
      })
      
      // Save new achievements
      if (newAchievements.length > 0) {
        const allAchievements = [...analyticsData.achievements, ...newAchievements]
        localStorage.setItem('vocabulary-achievements', JSON.stringify(allAchievements))
      }
      
    } catch (error) {
      console.error('Analytics calculation error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userProgress, spacedRepetitionData, gameHistory, analyticsData.achievements])

  // Get period start date
  const getPeriodStartDate = useCallback((now, period) => {
    const start = new Date(now)
    
    switch (period) {
      case TIME_PERIODS.TODAY:
        start.setHours(0, 0, 0, 0)
        break
      case TIME_PERIODS.WEEK:
        start.setDate(now.getDate() - 7)
        break
      case TIME_PERIODS.MONTH:
        start.setMonth(now.getMonth() - 1)
        break
      case TIME_PERIODS.QUARTER:
        start.setMonth(now.getMonth() - 3)
        break
      case TIME_PERIODS.YEAR:
        start.setFullYear(now.getFullYear() - 1)
        break
      case TIME_PERIODS.ALL_TIME:
        return new Date(0) // Beginning of time
      default:
        start.setDate(now.getDate() - 7)
    }
    
    return start
  }, [])

  // Filter progress data by period
  const filterDataByPeriod = useCallback((progress, periodStart) => {
    const filtered = {}
    
    Object.entries(progress).forEach(([wordId, data]) => {
      if (data.timestamp && new Date(data.timestamp) >= periodStart) {
        filtered[wordId] = data
      }
    })
    
    return filtered
  }, [])

  // Filter game history by period
  const filterGameHistoryByPeriod = useCallback((gameHistory, periodStart) => {
    return gameHistory.filter(game => 
      new Date(game.timestamp) >= periodStart
    )
  }, [])

  // Filter spaced repetition data by period
  const filterSpacedRepetitionByPeriod = useCallback((spacedRepetitionData, periodStart) => {
    const filtered = {}
    
    Object.entries(spacedRepetitionData).forEach(([wordId, data]) => {
      if (data.lastReviewed && new Date(data.lastReviewed) >= periodStart) {
        filtered[wordId] = data
      }
    })
    
    return filtered
  }, [])

  // Calculate overview metrics
  const calculateOverviewMetrics = useCallback((
    progress,
    gameHistory,
    spacedRepetition,
    period
  ) => {
    const totalWords = Object.keys(progress).length
    const masteredWords = Object.values(progress).filter(p => p.mastery >= 80).length
    const averageMastery = totalWords > 0 
      ? Object.values(progress).reduce((sum, p) => sum + (p.mastery || 0), 0) / totalWords
      : 0
    
    // Game statistics
    const totalGames = gameHistory.length
    const averageScore = totalGames > 0
      ? gameHistory.reduce((sum, game) => sum + game.score, 0) / totalGames
      : 0
    const bestScore = totalGames > 0
      ? Math.max(...gameHistory.map(game => game.score))
      : 0
    
    // Spaced repetition statistics
    const totalReviews = Object.values(spacedRepetition).reduce((sum, data) => sum + data.reviewCount, 0)
    const correctReviews = Object.values(spacedRepetition).reduce((sum, data) => sum + data.correctCount, 0)
    const reviewAccuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0
    
    // Study streak
    const studyStreak = calculateStudyStreak(progress, gameHistory)
    
    // Time spent studying (estimated)
    const timeSpent = calculateTimeSpent(progress, gameHistory)
    
    return {
      totalWords,
      masteredWords,
      averageMastery: Math.round(averageMastery),
      masteryRate: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0,
      totalGames,
      averageScore: Math.round(averageScore),
      bestScore,
      totalReviews,
      reviewAccuracy: Math.round(reviewAccuracy),
      studyStreak,
      timeSpent,
      period
    }
  }, [])

  // Calculate trends
  const calculateTrends = useCallback((progress, gameHistory, period) => {
    const now = new Date()
    const previousPeriodStart = getPeriodStartDate(now, period)
    const currentPeriodStart = getPeriodStartDate(now, period)
    
    const currentData = filterDataByPeriod(progress, currentPeriodStart)
    const previousData = filterDataByPeriod(progress, previousPeriodStart)
    
    // Vocabulary growth trend
    const currentWords = Object.keys(currentData).length
    const previousWords = Object.keys(previousData).length
    const vocabularyGrowth = previousWords > 0 
      ? ((currentWords - previousWords) / previousWords) * 100
      : 0
    
    // Mastery improvement trend
    const currentAvgMastery = currentWords > 0
      ? Object.values(currentData).reduce((sum, p) => sum + (p.mastery || 0), 0) / currentWords
      : 0
    const previousAvgMastery = previousWords > 0
      ? Object.values(previousData).reduce((sum, p) => sum + (p.mastery || 0), 0) / previousWords
      : 0
    const masteryImprovement = previousAvgMastery > 0
      ? ((currentAvgMastery - previousAvgMastery) / previousAvgMastery) * 100
      : 0
    
    // Game performance trend
    const currentGames = gameHistory.filter(game => 
      new Date(game.timestamp) >= currentPeriodStart
    )
    const previousGames = gameHistory.filter(game => 
      new Date(game.timestamp) >= previousPeriodStart && 
      new Date(game.timestamp) < currentPeriodStart
    )
    
    const currentAvgScore = currentGames.length > 0
      ? currentGames.reduce((sum, game) => sum + game.score, 0) / currentGames.length
      : 0
    const previousAvgScore = previousGames.length > 0
      ? previousGames.reduce((sum, game) => sum + game.score, 0) / previousGames.length
      : 0
    
    const scoreImprovement = previousAvgScore > 0
      ? ((currentAvgScore - previousAvgScore) / previousAvgScore) * 100
      : 0
    
    return {
      vocabularyGrowth: Math.round(vocabularyGrowth * 10) / 10,
      masteryImprovement: Math.round(masteryImprovement * 10) / 10,
      scoreImprovement: Math.round(scoreImprovement * 10) / 10,
      consistency: calculateConsistency(progress, gameHistory, period),
      momentum: calculateMomentum(currentData, currentGames)
    }
  }, [getPeriodStartDate, filterDataByPeriod])

  // Calculate detailed statistics
  const calculateDetailedStats = useCallback((
    progress,
    gameHistory,
    spacedRepetition
  ) => {
    // Level distribution
    const levelDistribution = {}
    Object.values(progress).forEach(p => {
      const level = p.level || 'unknown'
      levelDistribution[level] = (levelDistribution[level] || 0) + 1
    })
    
    // Category distribution
    const categoryDistribution = {}
    Object.values(progress).forEach(p => {
      const category = p.category || 'unknown'
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1
    })
    
    // Difficulty distribution
    const difficultyDistribution = {}
    Object.values(progress).forEach(p => {
      const difficulty = p.difficulty || 1
      difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + 1
    })
    
    // Game type performance
    const gameTypePerformance = {}
    gameHistory.forEach(game => {
      if (!gameTypePerformance[game.type]) {
        gameTypePerformance[game.type] = {
          games: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0
        }
      }
      
      const perf = gameTypePerformance[game.type]
      perf.games++
      perf.totalScore += game.score
      perf.averageScore = Math.round(perf.totalScore / perf.games)
      perf.bestScore = Math.max(perf.bestScore, game.score)
    })
    
    // Learning patterns
    const learningPatterns = analyzeLearningPatterns(progress, spacedRepetition)
    
    return {
      levelDistribution,
      categoryDistribution,
      difficultyDistribution,
      gameTypePerformance,
      learningPatterns
    }
  }, [])

  // Calculate study streak
  const calculateStudyStreak = useCallback((progress, gameHistory) => {
    const today = new Date()
    let streak = 0
    
    for (let i = 0; i < 365; i++) { // Check up to a year
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      checkDate.setHours(0, 0, 0, 0)
      
      const hasProgress = Object.values(progress).some(p => {
        if (!p.timestamp) return false
        const progressDate = new Date(p.timestamp)
        progressDate.setHours(0, 0, 0, 0)
        return progressDate.getTime() === checkDate.getTime()
      })
      
      const hasGame = gameHistory.some(game => {
        const gameDate = new Date(game.timestamp)
        gameDate.setHours(0, 0, 0, 0)
        return gameDate.getTime() === checkDate.getTime()
      })
      
      if (hasProgress || hasGame) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    
    return streak
  }, [])

  // Calculate time spent studying
  const calculateTimeSpent = useCallback((progress, gameHistory) => {
    // Estimate time from progress (5 minutes per word lookup)
    const progressTime = Object.keys(progress).length * 5
    
    // Game time (actual recorded time)
    const gameTime = gameHistory.reduce((sum, game) => sum + (game.timeElapsed || 0), 0)
    
    return progressTime + gameTime
  }, [])

  // Calculate consistency
  const calculateConsistency = useCallback((progress, gameHistory, period) => {
    const days = period === TIME_PERIODS.WEEK ? 7 : 
                 period === TIME_PERIODS.MONTH ? 30 : 
                 period === TIME_PERIODS.QUARTER ? 90 : 365
    
    let activeDays = 0
    
    for (let i = 0; i < days; i++) {
      const checkDate = new Date()
      checkDate.setDate(checkDate.getDate() - i)
      checkDate.setHours(0, 0, 0, 0)
      
      const hasActivity = Object.values(progress).some(p => {
        if (!p.timestamp) return false
        const progressDate = new Date(p.timestamp)
        progressDate.setHours(0, 0, 0, 0)
        return progressDate.getTime() === checkDate.getTime()
      }) || gameHistory.some(game => {
        const gameDate = new Date(game.timestamp)
        gameDate.setHours(0, 0, 0, 0)
        return gameDate.getTime() === checkDate.getTime()
      })
      
      if (hasActivity) activeDays++
    }
    
    return Math.round((activeDays / days) * 100)
  }, [])

  // Calculate learning momentum
  const calculateMomentum = useCallback((progress, games) => {
    const recentActivity = Object.values(progress).filter(p => {
      if (!p.timestamp) return false
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000)
      return new Date(p.timestamp).getTime() > threeDaysAgo
    }).length
    
    const recentGames = games.filter(game => {
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000)
      return new Date(game.timestamp).getTime() > threeDaysAgo
    }).length
    
    return {
      score: recentActivity + (recentGames * 2),
      level: recentActivity > 10 ? 'high' : recentActivity > 5 ? 'medium' : 'low'
    }
  }, [])

  // Analyze learning patterns
  const analyzeLearningPatterns = useCallback((progress, spacedRepetition) => {
    const bestTimeOfDay = {}
    const bestDayOfWeek = {}
    const retentionRate = {}
    
    Object.values(progress).forEach(p => {
      if (!p.timestamp) return
      
      const date = new Date(p.timestamp)
      const hour = date.getHours()
      const day = date.getDay()
      
      bestTimeOfDay[hour] = (bestTimeOfDay[hour] || 0) + 1
      bestDayOfWeek[day] = (bestDayOfWeek[day] || 0) + 1
    })
    
    Object.entries(spacedRepetition).forEach(([wordId, data]) => {
      const retention = data.correctCount / Math.max(data.reviewCount, 1)
      const difficulty = data.difficulty || 1
      retentionRate[difficulty] = (retentionRate[difficulty] || []).concat(retention)
    })
    
    return {
      bestTimeOfDay: Object.entries(bestTimeOfDay).sort(([,a], [,b]) => b - a)[0]?.[0],
      bestDayOfWeek: Object.entries(bestDayOfWeek).sort(([,a], [,b]) => b - a)[0]?.[0],
      averageRetentionByDifficulty: Object.entries(retentionRate).reduce((acc, [difficulty, rates]) => {
        acc[difficulty] = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
        return acc
      }, {})
    }
  }, [])

  // Generate recommendations
  const generateRecommendations = useCallback((overview, trends, detailedStats) => {
    const recommendations = []
    
    // Vocabulary growth recommendations
    if (overview.masteryRate < 50) {
      recommendations.push({
        type: 'vocabulary',
        priority: 'high',
        title: 'Increase Vocabulary Practice',
        description: 'Focus on learning 5-10 new words daily to improve your mastery rate.',
        action: 'Start daily vocabulary sessions'
      })
    }
    
    // Consistency recommendations
    if (trends.consistency < 70) {
      recommendations.push({
        type: 'consistency',
        priority: 'medium',
        title: 'Improve Study Consistency',
        description: 'Try to study at the same time each day for better retention.',
        action: 'Set up a study schedule'
      })
    }
    
    // Game performance recommendations
    if (overview.averageScore < 70) {
      recommendations.push({
        type: 'games',
        priority: 'medium',
        title: 'Practice with Games',
        description: 'Regular game practice can improve your vocabulary retention and speed.',
        action: 'Try flashcard or quiz games'
      })
    }
    
    // Spaced repetition recommendations
    if (overview.reviewAccuracy < 80) {
      recommendations.push({
        type: 'spaced_repetition',
        priority: 'high',
        title: 'Focus on Difficult Words',
        description: 'Some words need more practice. Use spaced repetition for better retention.',
        action: 'Review difficult words'
      })
    }
    
    // Level-based recommendations
    const weakLevels = Object.entries(detailedStats.levelDistribution)
      .filter(([, count]) => count < 5)
      .map(([level]) => level)
    
    if (weakLevels.length > 0) {
      recommendations.push({
        type: 'level_balance',
        priority: 'low',
        title: 'Balance Your Learning',
        description: `Focus on ${weakLevels.join(', ')} levels to create a balanced vocabulary foundation.`,
        action: `Study ${weakLevels[0]} level words`
      })
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [])

  // Check for new achievements
  const checkAchievements = useCallback((overview, trends, detailedStats, period) => {
    const newAchievements = []
    
    // Vocabulary milestones
    if (overview.totalWords >= 10 && !hasAchievement('vocabulary_10')) {
      newAchievements.push(createAchievement(
        'vocabulary_10',
        'Vocabulary Beginner',
        'Learn 10 German words',
        '📚',
        ACHIEVEMENT_TYPES.VOCABULARY_MILESTONE
      ))
    }
    
    if (overview.totalWords >= 50 && !hasAchievement('vocabulary_50')) {
      newAchievements.push(createAchievement(
        'vocabulary_50',
        'Vocabulary Expert',
        'Learn 50 German words',
        '🎓',
        ACHIEVEMENT_TYPES.VOCABULARY_MILESTONE
      ))
    }
    
    if (overview.totalWords >= 100 && !hasAchievement('vocabulary_100')) {
      newAchievements.push(createAchievement(
        'vocabulary_100',
        'Vocabulary Master',
        'Learn 100 German words',
        '🏆',
        ACHIEVEMENT_TYPES.VOCABULARY_MILESTONE
      ))
    }
    
    // Streak achievements
    if (overview.studyStreak >= 7 && !hasAchievement('streak_7')) {
      newAchievements.push(createAchievement(
        'streak_7',
        'Week Warrior',
        'Study for 7 consecutive days',
        '🔥',
        ACHIEVEMENT_TYPES.STREAK_ACHIEVEMENT
      ))
    }
    
    if (overview.studyStreak >= 30 && !hasAchievement('streak_30')) {
      newAchievements.push(createAchievement(
        'streak_30',
        'Month Champion',
        'Study for 30 consecutive days',
        '💎',
        ACHIEVEMENT_TYPES.STREAK_ACHIEVEMENT
      ))
    }
    
    // Mastery achievements
    if (overview.masteryRate >= 80 && overview.totalWords >= 20 && !hasAchievement('mastery_80')) {
      newAchievements.push(createAchievement(
        'mastery_80',
        'Mastery Expert',
        'Achieve 80% mastery rate with 20+ words',
        '⭐',
        ACHIEVEMENT_TYPES.MASTERY_LEVEL
      ))
    }
    
    return newAchievements
  }, [analyticsData.achievements])

  // Helper function to check if achievement exists
  const hasAchievement = useCallback((achievementId) => {
    return analyticsData.achievements.some(a => a.id === achievementId)
  }, [analyticsData.achievements])

  // Create achievement object
  const createAchievement = useCallback((id, title, description, icon, type) => ({
    id,
    title,
    description,
    icon,
    type,
    timestamp: new Date().toISOString()
  }), [])

  // Export analytics data
  const exportAnalytics = useCallback((format = 'json') => {
    const data = {
      analytics: analyticsData,
      userProgress,
      gameHistory,
      spacedRepetitionData,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvData = [
        ['Metric', 'Value'],
        ['Total Words', analyticsData.overview.totalWords || 0],
        ['Mastered Words', analyticsData.overview.masteredWords || 0],
        ['Mastery Rate', `${analyticsData.overview.masteryRate || 0}%`],
        ['Total Games', analyticsData.overview.totalGames || 0],
        ['Average Score', analyticsData.overview.averageScore || 0],
        ['Study Streak', analyticsData.overview.studyStreak || 0],
        ['Time Spent (minutes)', analyticsData.overview.timeSpent || 0]
      ]
      
      return csvData.map(row => row.join(',')).join('\n')
    }
    
    return data
  }, [analyticsData, userProgress, gameHistory, spacedRepetitionData])

  // Update analytics when dependencies change
  useEffect(() => {
    calculateAnalytics(selectedPeriod)
  }, [calculateAnalytics, selectedPeriod])

  return {
    // Analytics data
    analyticsData,
    selectedPeriod,
    isLoading,
    
    // Methods
    calculateAnalytics,
    exportAnalytics,
    
    // Setters
    setSelectedPeriod,
    
    // Constants
    TIME_PERIODS,
    ACHIEVEMENT_TYPES
  }
}