import { useState, useEffect, useCallback } from 'react'
import useIndexedDB from './useIndexedDB'

/**
 * Enhanced Learning Profile Hook
 * Manages user profile, tasks, achievements, and comprehensive progress tracking
 */
export const useLearningProfile = () => {
     const { isReady, stores, addOrUpdate, get, getAll, getByIndex, count } = useIndexedDB()

     const [profile, setProfile] = useState(null)
     const [dailyTasks, setDailyTasks] = useState([])
     const [achievements, setAchievements] = useState([])
     const [progressStats, setProgressStats] = useState({
          totalStudyTime: 0,
          currentStreak: 0,
          longestStreak: 0,
          tasksCompleted: 0,
          vocabularyMastered: 0,
          skillsProgress: {
               reading: 0,
               writing: 0,
               listening: 0,
               speaking: 0,
               vocabulary: 0,
               grammar: 0,
               pronunciation: 0
          }
     })
     const [loading, setLoading] = useState(true)

     // Initialize or load user profile
     useEffect(() => {
          if (!isReady) return

          const loadProfile = async () => {
               try {
                    let userProfile = await get(stores.PROFILE, 'main')

                    if (!userProfile) {
                         // Create default profile
                         userProfile = {
                              id: 'main',
                              name: 'IELTS Learner',
                              targetBand: 7.0,
                              currentLevel: 'B1',
                              examDate: null,
                              createdAt: new Date().toISOString(),
                              lastUpdated: new Date().toISOString(),
                              studyGoal: 30, // minutes per day
                              preferences: {
                                   notifications: true,
                                   darkMode: true,
                                   voiceSpeed: 1.0
                              }
                         }

                         await addOrUpdate(stores.PROFILE, userProfile)
                    }

                    setProfile(userProfile)
                    await loadDashboardData()
                    setLoading(false)
               } catch (error) {
                    console.error('Error loading profile:', error)
                    setLoading(false)
               }
          }

          loadProfile()
     }, [isReady])

     // Load dashboard data
     const loadDashboardData = useCallback(async () => {
          try {
               // Load today's tasks
               const today = new Date().toISOString().split('T')[0]
               const todayTasks = await getByIndex(stores.TASKS, 'date', today)
               setDailyTasks(todayTasks || [])

               // Load achievements
               const allAchievements = await getAll(stores.ACHIEVEMENTS)
               setAchievements(allAchievements || [])

               // Calculate progress statistics
               await calculateProgressStats()
          } catch (error) {
               console.error('Error loading dashboard data:', error)
          }
     }, [getByIndex, getAll, stores])

     // Calculate comprehensive progress statistics
     const calculateProgressStats = useCallback(async () => {
          try {
               // Get all study sessions
               const sessions = await getAll(stores.SESSIONS)
               const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)

               // Calculate streak
               const streak = await calculateStreak()

               // Get completed tasks count
               const completedTasks = await count(stores.TASKS)

               // Get vocabulary mastery
               const vocab = await getAll(stores.VOCABULARY)
               const masteredVocab = vocab.filter(w => w.masteryLevel >= 4).length

               // Get skills progress
               const skillsData = await getAll(stores.SKILLS)
               const skills = {
                    reading: calculateSkillAverage(skillsData, 'reading'),
                    writing: calculateSkillAverage(skillsData, 'writing'),
                    listening: calculateSkillAverage(skillsData, 'listening'),
                    speaking: calculateSkillAverage(skillsData, 'speaking'),
                    vocabulary: calculateSkillAverage(skillsData, 'vocabulary'),
                    grammar: calculateSkillAverage(skillsData, 'grammar'),
                    pronunciation: calculateSkillAverage(skillsData, 'pronunciation')
               }

               setProgressStats({
                    totalStudyTime: totalTime,
                    currentStreak: streak.current,
                    longestStreak: streak.longest,
                    tasksCompleted: completedTasks,
                    vocabularyMastered: masteredVocab,
                    skillsProgress: skills
               })
          } catch (error) {
               console.error('Error calculating stats:', error)
          }
     }, [getAll, count, stores])

     // Calculate skill average from recent sessions
     const calculateSkillAverage = (skillsData, skillName) => {
          const filtered = skillsData.filter(s => s.skill === skillName)
          if (filtered.length === 0) return 0

          // Take last 10 sessions for this skill
          const recent = filtered.slice(-10)
          const avg = recent.reduce((sum, s) => sum + (s.score || 0), 0) / recent.length
          return Math.round(avg)
     }

     // Calculate study streak
     const calculateStreak = useCallback(async () => {
          try {
               const sessions = await getAll(stores.SESSIONS)
               if (!sessions || sessions.length === 0) return { current: 0, longest: 0 }

               // Sort by date
               const sorted = sessions.sort((a, b) =>
                    new Date(b.startTime) - new Date(a.startTime)
               )

               let currentStreak = 0
               let longestStreak = 0
               let tempStreak = 0
               let lastDate = null

               sorted.forEach(session => {
                    const sessionDate = new Date(session.startTime).toDateString()

                    if (!lastDate) {
                         tempStreak = 1
                    } else {
                         const dayDiff = Math.floor(
                              (new Date(lastDate) - new Date(sessionDate)) / (1000 * 60 * 60 * 24)
                         )

                         if (dayDiff === 1) {
                              tempStreak++
                         } else if (dayDiff > 1) {
                              longestStreak = Math.max(longestStreak, tempStreak)
                              tempStreak = 1
                         }
                    }

                    lastDate = sessionDate
               })

               currentStreak = tempStreak
               longestStreak = Math.max(longestStreak, tempStreak)

               return { current: currentStreak, longest: longestStreak }
          } catch (error) {
               console.error('Error calculating streak:', error)
               return { current: 0, longest: 0 }
          }
     }, [getAll, stores])

     // Add or update a task
     const addTask = useCallback(async (taskData) => {
          try {
               const task = {
                    ...taskData,
                    date: taskData.date || new Date().toISOString().split('T')[0],
                    completed: taskData.completed || false,
                    createdAt: taskData.createdAt || new Date().toISOString()
               }

               const id = await addOrUpdate(stores.TASKS, task)
               await loadDashboardData()
               return id
          } catch (error) {
               console.error('Error adding task:', error)
               throw error
          }
     }, [addOrUpdate, loadDashboardData, stores])

     // Toggle task completion
     const toggleTask = useCallback(async (taskId) => {
          try {
               const task = dailyTasks.find(t => t.id === taskId)
               if (!task) return

               const updated = {
                    ...task,
                    completed: !task.completed,
                    completedAt: !task.completed ? new Date().toISOString() : null
               }

               await addOrUpdate(stores.TASKS, updated)
               await loadDashboardData()

               // Check for achievements
               if (updated.completed) {
                    await checkAchievements()
               }
          } catch (error) {
               console.error('Error toggling task:', error)
          }
     }, [dailyTasks, addOrUpdate, loadDashboardData, stores])

     // Record a study session
     const recordStudySession = useCallback(async (module, duration, score = null) => {
          try {
               const session = {
                    module,
                    duration, // in minutes
                    score,
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + duration * 60000).toISOString()
               }

               await addOrUpdate(stores.SESSIONS, session)

               // Also update skills progress if score provided
               if (score !== null) {
                    await addOrUpdate(stores.SKILLS, {
                         skill: module,
                         score,
                         date: new Date().toISOString().split('T')[0]
                    })
               }

               await calculateProgressStats()
          } catch (error) {
               console.error('Error recording session:', error)
          }
     }, [addOrUpdate, calculateProgressStats, stores])

     // Record vocabulary learning
     const recordVocabulary = useCallback(async (word, definition, masteryLevel = 1) => {
          try {
               const vocabEntry = {
                    word,
                    definition,
                    masteryLevel, // 1-5 scale
                    lastReviewed: new Date().toISOString(),
                    reviewCount: 1,
                    category: 'general'
               }

               await addOrUpdate(stores.VOCABULARY, vocabEntry)
               await calculateProgressStats()
          } catch (error) {
               console.error('Error recording vocabulary:', error)
          }
     }, [addOrUpdate, calculateProgressStats, stores])

     // Check and unlock achievements
     const checkAchievements = useCallback(async () => {
          try {
               const completedCount = dailyTasks.filter(t => t.completed).length
               const { currentStreak } = progressStats

               const potentialAchievements = [
                    {
                         id: 'first_task',
                         title: '🎯 First Step',
                         description: 'Complete your first task',
                         condition: completedCount >= 1
                    },
                    {
                         id: 'task_master_5',
                         title: '⭐ Task Master',
                         description: 'Complete 5 tasks in one day',
                         condition: completedCount >= 5
                    },
                    {
                         id: 'streak_7',
                         title: '🔥 Week Warrior',
                         description: '7-day study streak',
                         condition: currentStreak >= 7
                    },
                    {
                         id: 'streak_30',
                         title: '💎 Monthly Master',
                         description: '30-day study streak',
                         condition: currentStreak >= 30
                    },
                    {
                         id: 'vocab_100',
                         title: '📚 Word Wizard',
                         description: 'Master 100 vocabulary words',
                         condition: progressStats.vocabularyMastered >= 100
                    }
               ]

               for (const achievement of potentialAchievements) {
                    if (achievement.condition) {
                         const existing = await get(stores.ACHIEVEMENTS, achievement.id)
                         if (!existing) {
                              await addOrUpdate(stores.ACHIEVEMENTS, {
                                   ...achievement,
                                   unlockedDate: new Date().toISOString(),
                                   category: 'milestone'
                              })
                         }
                    }
               }

               await loadDashboardData()
          } catch (error) {
               console.error('Error checking achievements:', error)
          }
     }, [dailyTasks, progressStats, get, addOrUpdate, loadDashboardData, stores])

     // Update user profile
     const updateProfile = useCallback(async (updates) => {
          try {
               const updated = {
                    ...profile,
                    ...updates,
                    lastUpdated: new Date().toISOString()
               }

               await addOrUpdate(stores.PROFILE, updated)
               setProfile(updated)
          } catch (error) {
               console.error('Error updating profile:', error)
               throw error
          }
     }, [profile, addOrUpdate, stores])

     return {
          // State
          profile,
          dailyTasks,
          achievements,
          progressStats,
          loading,

          // Actions
          addTask,
          toggleTask,
          recordStudySession,
          recordVocabulary,
          updateProfile,
          refreshDashboard: loadDashboardData,
          checkAchievements
     }
}

export default useLearningProfile
