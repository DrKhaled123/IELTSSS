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
    recommendations: [],
    detailedStats: {}
  })
  const [achievements, setAchievements] = useState([])

  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS.WEEK)
  const [isLoading, setIsLoading] = useState(false)

  // Load achievements from localStorage
  useEffect(() => {
    const savedAchievements = localStorage.getItem('vocabulary-achievements')
    if (savedAchievements) {
      try {
        setAchievements(JSON.parse(savedAchievements))
      } catch (e) {
        console.error('Failed to parse achievements', e)
      }
    }
  }, [])

  // Helper functions
  const getPeriodStartDate = useCallback((now, period) => {
    const start = new Date(now)
    switch (period) {
      case TIME_PERIODS.TODAY: start.setHours(0, 0, 0, 0); break
      case TIME_PERIODS.WEEK: start.setDate(now.getDate() - 7); break
      case TIME_PERIODS.MONTH: start.setMonth(now.getMonth() - 1); break
      case TIME_PERIODS.QUARTER: start.setMonth(now.getMonth() - 3); break
      case TIME_PERIODS.YEAR: start.setFullYear(now.getFullYear() - 1); break
      case TIME_PERIODS.ALL_TIME: return new Date(0)
      default: start.setDate(now.getDate() - 7)
    }
    return start
  }, [])

  const filterDataByPeriod = useCallback((progress, periodStart) => {
    const filtered = {}
    Object.entries(progress || {}).forEach(([wordId, data]) => {
      if (data.timestamp && new Date(data.timestamp) >= periodStart) {
        filtered[wordId] = data
      }
    })
    return filtered
  }, [])

  const calculateStudyStreak = useCallback((progress, games) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const hasActivity = Object.values(progress || {}).some(p => {
        if (!p.timestamp) return false
        const d = new Date(p.timestamp); d.setHours(0, 0, 0, 0)
        return d.getTime() === checkDate.getTime()
      }) || (games || []).some(g => {
        const d = new Date(g.timestamp); d.setHours(0, 0, 0, 0)
        return d.getTime() === checkDate.getTime()
      })
      if (hasActivity) streak++
      else if (i > 0) break
    }
    return streak
  }, [])

  const calculateAnalytics = useCallback((period = selectedPeriod) => {
    setIsLoading(true)
    try {
      const now = new Date()
      const start = getPeriodStartDate(now, period)

      const pProgress = filterDataByPeriod(userProgress, start)
      const pGames = (gameHistory || []).filter(g => new Date(g.timestamp) >= start)

      // Overview
      const totalWords = Object.keys(pProgress).length
      const masteredWords = Object.values(pProgress).filter(p => p.mastery >= 80).length
      const overview = {
        totalWords,
        masteredWords,
        masteryRate: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0,
        totalGames: pGames.length,
        studyStreak: calculateStudyStreak(userProgress, gameHistory),
        period
      }

      setAnalyticsData({
        overview,
        trends: {},
        recommendations: [],
        detailedStats: {}
      })

      // Update achievements using functional state to check against most recent achievements
      setAchievements(prev => {
        const newAch = []
        if (totalWords >= 10 && !prev.some(a => a.id === 'vocabulary_10')) {
          newAch.push({ id: 'vocabulary_10', title: 'Beginner', description: '10 words learned', icon: '📚', timestamp: new Date().toISOString() })
        }
        if (newAch.length > 0) {
          const updated = [...prev, ...newAch]
          localStorage.setItem('vocabulary-achievements', JSON.stringify(updated))
          return updated
        }
        return prev
      })

    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [userProgress, spacedRepetitionData, gameHistory, selectedPeriod, getPeriodStartDate, filterDataByPeriod, calculateStudyStreak])

  useEffect(() => {
    calculateAnalytics()
  }, [calculateAnalytics])

  const exportAnalytics = useCallback((format = 'json') => {
    const data = {
      analytics: analyticsData,
      achievements: achievements,
      exportDate: new Date().toISOString()
    }
    if (format === 'json') return JSON.stringify(data, null, 2)
    return ''
  }, [analyticsData, achievements])

  return {
    analyticsData,
    achievements,
    selectedPeriod,
    isLoading,
    calculateAnalytics,
    exportAnalytics,
    setSelectedPeriod,
    TIME_PERIODS,
    ACHIEVEMENT_TYPES
  }
}