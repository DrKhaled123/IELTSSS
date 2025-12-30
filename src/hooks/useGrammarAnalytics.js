import { useState, useCallback, useEffect, useMemo } from 'react'

export function useGrammarAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    overallStats: null,
    topicPerformance: {},
    weakAreas: [],
    strongAreas: [],
    learningPath: [],
    achievements: [],
    weeklyProgress: [],
    monthlyProgress: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Achievement definitions
  const achievementDefinitions = useMemo(() => [
    {
      id: 'grammar_novice',
      title: 'Grammar Beginner',
      description: 'Complete 10 grammar exercises',
      icon: '📝',
      condition: { type: 'total_exercises', value: 10 },
      points: 50,
      category: 'milestone'
    },
    {
      id: 'grammar_intermediate',
      title: 'Grammar Learner',
      description: 'Complete 50 grammar exercises',
      icon: '📚',
      condition: { type: 'total_exercises', value: 50 },
      points: 100,
      category: 'milestone'
    },
    {
      id: 'grammar_advanced',
      title: 'Grammar Expert',
      description: 'Complete 100 grammar exercises',
      icon: '🎓',
      condition: { type: 'total_exercises', value: 100 },
      points: 200,
      category: 'milestone'
    },
    {
      id: 'accuracy_master',
      title: 'Accuracy Master',
      description: 'Achieve 95% accuracy in 10 consecutive exercises',
      icon: '🎯',
      condition: { type: 'accuracy_streak', value: { accuracy: 95, streak: 10 } },
      points: 150,
      category: 'skill'
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Complete exercises 50% faster than average time',
      icon: '⚡',
      condition: { type: 'speed', value: 0.5 },
      points: 100,
      category: 'skill'
    },
    {
      id: 'level_master',
      title: 'Level Master',
      description: 'Master all topics at A2 level',
      icon: '🏆',
      condition: { type: 'level_mastery', value: 'A2' },
      points: 300,
      category: 'milestone'
    },
    {
      id: 'consistency_king',
      title: 'Consistency King',
      description: 'Maintain 80%+ accuracy for 30 days',
      icon: '👑',
      condition: { type: 'consistency', value: { accuracy: 80, days: 30 } },
      points: 250,
      category: 'skill'
    },
    {
      id: 'grammar_polyglot',
      title: 'Grammar Polyglot',
      description: 'Master grammar rules in all cases (nominative, accusative, dative, genitive)',
      icon: '🌍',
      condition: { type: 'case_mastery', value: ['nominative', 'accusative', 'dative', 'genitive'] },
      points: 400,
      category: 'expert'
    }
  ], [])

  // Calculate comprehensive analytics from user data
  const calculateAnalytics = useCallback((userData, exerciseHistory, topicProgress) => {
    setLoading(true)
    setError(null)

    try {
      // Overall statistics
      const totalExercises = exerciseHistory.length
      const correctAnswers = exerciseHistory.filter(ex => ex.isCorrect).length
      const overallAccuracy = totalExercises > 0 ? (correctAnswers / totalExercises) * 100 : 0
      const totalTime = exerciseHistory.reduce((sum, ex) => sum + ex.timeSpent, 0)
      const averageTime = totalExercises > 0 ? totalTime / totalExercises : 0

      // Performance by topic
      const topicStats = {}
      Object.keys(topicProgress).forEach(topicId => {
        const topic = topicProgress[topicId]
        const topicExercises = exerciseHistory.filter(ex => ex.topicId === topicId)
        
        topicStats[topicId] = {
          totalAttempts: topic.attempts || topicExercises.length,
          correctAnswers: topic.correctAnswers || topicExercises.filter(ex => ex.isCorrect).length,
          accuracy: topic.accuracy || (topicExercises.length > 0 ? (topicExercises.filter(ex => ex.isCorrect).length / topicExercises.length) * 100 : 0),
          averageTime: topic.averageTime || (topicExercises.length > 0 ? topicExercises.reduce((sum, ex) => sum + ex.timeSpent, 0) / topicExercises.length : 0),
          difficulty: topic.difficulty || 'A1',
          lastAttempt: topic.lastAttempt,
          masteryLevel: calculateMasteryLevel(topic.accuracy || 0, topic.attempts || 0)
        }
      })

      // Identify weak and strong areas
      const weakAreas = Object.entries(topicStats)
        .filter(([_, stats]) => stats.accuracy < 60 && stats.totalAttempts >= 3)
        .map(([topicId, stats]) => ({
          topicId,
          accuracy: stats.accuracy,
          recommendedActions: generateWeakAreaRecommendations(topicId, stats)
        }))
        .sort((a, b) => a.accuracy - b.accuracy)

      const strongAreas = Object.entries(topicStats)
        .filter(([_, stats]) => stats.accuracy >= 85 && stats.totalAttempts >= 3)
        .map(([topicId, stats]) => ({
          topicId,
          accuracy: stats.accuracy,
          masteryLevel: stats.masteryLevel
        }))
        .sort((a, b) => b.accuracy - a.accuracy)

      // Generate learning path
      const learningPath = generateLearningPath(topicStats, weakAreas)

      // Check achievements
      const newAchievements = checkAchievements(userData, exerciseHistory, topicStats)

      // Calculate weekly and monthly progress
      const weeklyProgress = calculateProgressPeriod(exerciseHistory, 7)
      const monthlyProgress = calculateProgressPeriod(exerciseHistory, 30)

      const analytics = {
        overallStats: {
          totalExercises,
          correctAnswers,
          overallAccuracy: Math.round(overallAccuracy),
          totalTime,
          averageTime: Math.round(averageTime),
          currentLevel: calculateCurrentLevel(topicStats),
          studyStreak: calculateStudyStreak(exerciseHistory),
          totalStudyTime: calculateTotalStudyTime(exerciseHistory)
        },
        topicPerformance: topicStats,
        weakAreas,
        strongAreas,
        learningPath,
        achievements: newAchievements,
        weeklyProgress,
        monthlyProgress,
        lastUpdated: Date.now()
      }

      setAnalyticsData(analytics)
      setLoading(false)
      return analytics

    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [])

  // Calculate mastery level for a topic
  const calculateMasteryLevel = useCallback((accuracy, attempts) => {
    if (attempts < 3) return 'beginner'
    
    const weightedScore = (accuracy * 0.7) + (Math.min(attempts / 10, 1) * 30) // 70% accuracy, 30% practice
    
    if (weightedScore >= 90) return 'mastered'
    if (weightedScore >= 75) return 'advanced'
    if (weightedScore >= 60) return 'intermediate'
    if (weightedScore >= 40) return 'developing'
    return 'beginner'
  }, [])

  // Generate recommendations for weak areas
  const generateWeakAreaRecommendations = useCallback((topicId, stats) => {
    const recommendations = {
      'definite_articles': [
        'Review noun gender rules',
        'Practice with common objects',
        'Use definite article charts'
      ],
      'present_tense_regular': [
        'Practice verb conjugation patterns',
        'Focus on personal endings',
        'Use regular verb drills'
      ],
      'accusative_case': [
        'Practice identifying direct objects',
        'Review masculine article changes',
        'Use accusative preposition exercises'
      ],
      'separable_verbs': [
        'Memorize common prefixes',
        'Practice word order with separables',
        'Use prefix flashcards'
      ]
    }

    return recommendations[topicId] || [
      'Review fundamental concepts',
      'Practice with examples',
      'Use additional learning resources'
    ]
  }, [])

  // Generate personalized learning path
  const generateLearningPath = useCallback((topicStats, weakAreas) => {
    const path = []
    const masteredTopics = Object.entries(topicStats)
      .filter(([_, stats]) => stats.masteryLevel === 'mastered')
      .map(([topicId]) => topicId)

    // Suggest next topics based on current level and weak areas
    const topicDependencies = {
      'definite_articles': ['indefinite_articles', 'possessive_articles'],
      'present_tense_regular': ['present_tense_irregular', 'perfect_tense'],
      'accusative_case': ['dative_case', 'genitive_case'],
      'separable_verbs': ['modal_verbs', 'perfect_tense'],
      'modal_verbs': ['subordinate_clauses', 'conditional_sentences'],
      'perfect_tense': ['past_tense', 'passive_voice'],
      'subordinate_clauses': ['relative_clauses', 'passive_voice'],
      'relative_clauses': ['subjunctive_i', 'subjunctive_ii'],
      'passive_voice': ['subjunctive_ii', 'conditional_sentences']
    }

    // Add weak areas to learning path with priority
    weakAreas.forEach(area => {
      if (!path.find(item => item.topicId === area.topicId)) {
        path.push({
          topicId: area.topicId,
          priority: 'high',
          reason: 'Weak area identified',
          estimatedTime: calculateEstimatedTime(area.topicId, area.accuracy),
          prerequisites: []
        })
      }
    })

    // Add next logical topics
    Object.entries(topicStats).forEach(([topicId, stats]) => {
      if (stats.masteryLevel === 'advanced' && !path.find(item => item.topicId === topicId)) {
        const nextTopics = topicDependencies[topicId] || []
        nextTopics.forEach(nextTopic => {
          if (!masteredTopics.includes(nextTopic) && !path.find(item => item.topicId === nextTopic)) {
            path.push({
              topicId: nextTopic,
              priority: 'medium',
              reason: 'Next logical progression',
              estimatedTime: calculateEstimatedTime(nextTopic, 70),
              prerequisites: [topicId]
            })
          }
        })
      }
    })

    return path.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.estimatedTime - b.estimatedTime
    })
  }, [])

  // Calculate estimated time to master a topic
  const calculateEstimatedTime = useCallback((topicId, currentAccuracy) => {
    const baseTimes = {
      'definite_articles': 30,
      'indefinite_articles': 25,
      'present_tense_regular': 45,
      'present_tense_irregular': 60,
      'accusative_case': 50,
      'dative_case': 60,
      'separable_verbs': 55,
      'modal_verbs': 65,
      'perfect_tense': 70,
      'subordinate_clauses': 80,
      'relative_clauses': 75,
      'passive_voice': 85,
      'subjunctive_i': 90,
      'subjunctive_ii': 100,
      'conditional_sentences': 95
    }

    const baseTime = baseTimes[topicId] || 60
    const accuracyMultiplier = Math.max(0.5, (100 - currentAccuracy) / 100)
    return Math.round(baseTime * accuracyMultiplier)
  }, [])

  // Check and unlock achievements
  const checkAchievements = useCallback((userData, exerciseHistory, topicStats) => {
    const newAchievements = []

    achievementDefinitions.forEach(achievement => {
      // Skip if already earned
      if (userData.achievements?.includes(achievement.id)) return

      let unlocked = false

      switch (achievement.condition.type) {
        case 'total_exercises':
          unlocked = exerciseHistory.length >= achievement.condition.value
          break

        case 'accuracy_streak':
          const recentExercises = exerciseHistory.slice(-achievement.condition.value.streak)
          const allAccurate = recentExercises.every(ex => {
            const accuracy = (ex.correctAnswers / ex.totalQuestions) * 100
            return accuracy >= achievement.condition.value.accuracy
          })
          unlocked = allAccurate && recentExercises.length === achievement.condition.value.streak
          break

        case 'speed':
          const userAvgTime = exerciseHistory.reduce((sum, ex) => sum + ex.timeSpent, 0) / exerciseHistory.length
          const expectedTime = 60 // Average expected time
          unlocked = userAvgTime <= (expectedTime * achievement.condition.value)
          break

        case 'level_mastery':
          const levelTopics = Object.entries(topicStats).filter(([_, stats]) => 
            stats.difficulty === achievement.condition.value && stats.masteryLevel === 'mastered'
          )
          unlocked = levelTopics.length >= 5 // Master at least 5 topics at this level
          break

        case 'consistency':
          const last30Days = exerciseHistory.filter(ex => 
            ex.timestamp > Date.now() - (30 * 24 * 60 * 60 * 1000)
          )
          const dailyAccuracy = {}
          last30Days.forEach(ex => {
            const day = new Date(ex.timestamp).toDateString()
            if (!dailyAccuracy[day]) dailyAccuracy[day] = []
            dailyAccuracy[day].push((ex.correctAnswers / ex.totalQuestions) * 100)
          })
          
          const consistentDays = Object.values(dailyAccuracy).filter(dayAcc => 
            dayAcc.reduce((sum, acc) => sum + acc, 0) / dayAcc.length >= achievement.condition.value.accuracy
          ).length
          
          unlocked = consistentDays >= achievement.condition.value.days
          break

        case 'case_mastery':
          const masteredCases = achievement.condition.value.filter(caseName => {
            const caseTopics = Object.entries(topicStats).filter(([_, stats]) => 
              stats.masteryLevel === 'mastered' && 
              (stats.category === 'cases' || stats.topicId.includes(caseName))
            )
            return caseTopics.length > 0
          })
          unlocked = masteredCases.length === achievement.condition.value.length
          break
      }

      if (unlocked) {
        newAchievements.push({
          ...achievement,
          unlockedAt: Date.now(),
          points: achievement.points
        })
      }
    })

    return newAchievements
  }, [achievementDefinitions])

  // Calculate progress for specific time period
  const calculateProgressPeriod = useCallback((exerciseHistory, days) => {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    const periodExercises = exerciseHistory.filter(ex => ex.timestamp > cutoff)
    
    if (periodExercises.length === 0) return []

    const dailyStats = {}
    periodExercises.forEach(ex => {
      const day = new Date(ex.timestamp).toDateString()
      if (!dailyStats[day]) {
        dailyStats[day] = {
          exercises: 0,
          correctAnswers: 0,
          totalTime: 0,
          accuracy: 0
        }
      }
      
      dailyStats[day].exercises++
      dailyStats[day].correctAnswers += ex.correctAnswers
      dailyStats[day].totalTime += ex.timeSpent
    })

    // Calculate daily accuracy
    Object.keys(dailyStats).forEach(day => {
      const stats = dailyStats[day]
      stats.accuracy = stats.exercises > 0 ? (stats.correctAnswers / stats.exercises) * 100 : 0
    })

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [])

  // Calculate current German level
  const calculateCurrentLevel = useCallback((topicStats) => {
    const topics = Object.values(topicStats)
    if (topics.length === 0) return 'A1'

    const avgMastery = topics.reduce((sum, topic) => {
      const masteryValues = { beginner: 1, developing: 2, intermediate: 3, advanced: 4, mastered: 5 }
      return sum + (masteryValues[topic.masteryLevel] || 1)
    }, 0) / topics.length

    if (avgMastery >= 4.5) return 'C1'
    if (avgMastery >= 3.5) return 'B2'
    if (avgMastery >= 2.5) return 'B1'
    if (avgMastery >= 1.5) return 'A2'
    return 'A1'
  }, [])

  // Calculate study streak
  const calculateStudyStreak = useCallback((exerciseHistory) => {
    if (exerciseHistory.length === 0) return 0

    const today = new Date().toDateString()
    const sortedHistory = [...exerciseHistory].sort((a, b) => b.timestamp - a.timestamp)
    
    let streak = 0
    let currentDate = new Date()
    
    while (streak === 0 || sortedHistory.some(ex => 
      new Date(ex.timestamp).toDateString() === currentDate.toDateString()
    )) {
      if (new Date(currentDate).toDateString() === today) {
        streak++
      } else {
        // Check if there's activity for previous day
        const prevDay = new Date(currentDate)
        prevDay.setDate(prevDay.getDate() - 1)
        
        if (sortedHistory.some(ex => 
          new Date(ex.timestamp).toDateString() === prevDay.toDateString()
        )) {
          streak++
        } else {
          break
        }
      }
      
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  }, [])

  // Calculate total study time
  const calculateTotalStudyTime = useCallback((exerciseHistory) => {
    const totalMinutes = exerciseHistory.reduce((sum, ex) => sum + (ex.timeSpent / 60), 0)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.round(totalMinutes % 60)
    
    return { hours, minutes, totalMinutes }
  }, [])

  // Export analytics data
  const exportAnalytics = useCallback(() => {
    const exportData = {
      ...analyticsData,
      exportedAt: Date.now(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grammar-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [analyticsData])

  return {
    analyticsData,
    loading,
    error,
    achievementDefinitions,
    calculateAnalytics,
    exportAnalytics,
    calculateMasteryLevel,
    generateLearningPath
  }
}