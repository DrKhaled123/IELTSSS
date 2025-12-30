import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSpacedRepetition } from './useSpacedRepetition'
import { useProgressTracking } from './useProgressTracking'

// AI-Powered Word Suggestion Engine
export function useAIWordSuggestions(vocabularyDatabase, userCards, learningProgress) {
    const [suggestions, setSuggestions] = useState([])
    const [recommendationContext, setRecommendationContext] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const { getStatistics } = useSpacedRepetition()
    const { progress } = useProgressTracking()

    // Intelligent Word Recommendation Algorithm
    const generateRecommendations = useCallback(async (options = {}) => {
        setIsGenerating(true)
        
        try {
            const {
                count = 5,
                difficulty = null,
                category = null,
                focusAreas = [],
                userLevel = 'A1',
                timeAvailable = 15 // minutes
            } = options

            // Analyze user performance patterns
            const userProfile = analyzeUserProfile()
            
            // Generate context-aware recommendations
            const recommendations = await generateContextAwareSuggestions({
                count,
                difficulty,
                category,
                focusAreas,
                userLevel,
                timeAvailable,
                userProfile
            })

            setSuggestions(recommendations)
            setRecommendationContext({
                generatedAt: new Date().toISOString(),
                context: recommendations.map(r => r.reason),
                userProfile
            })

            return recommendations
        } finally {
            setIsGenerating(false)
        }
    }, [vocabularyDatabase, userCards, learningProgress])

    // User Performance Analysis
    const analyzeUserProfile = useCallback(() => {
        const spacedStats = getStatistics()
        const progressData = progress || {}
        
        // Calculate learning velocity
        const recentActivity = getRecentActivity(7) // Last 7 days
        const learningVelocity = calculateLearningVelocity(recentActivity)
        
        // Identify strengths and weaknesses
        const performanceByCategory = analyzePerformanceByCategory()
        const difficultyComfort = analyzeDifficultyComfort()
        
        // Learning style detection
        const learningStyle = detectLearningStyle()
        
        // Optimal study patterns
        const optimalPatterns = identifyOptimalPatterns()
        
        return {
            learningVelocity,
            performanceByCategory,
            difficultyComfort,
            learningStyle,
            optimalPatterns,
            strengths: identifyStrengths(performanceByCategory),
            weaknesses: identifyWeaknesses(performanceByCategory),
            masteryLevel: calculateMasteryLevel()
        }
    }, [userCards, progress, getStatistics])

    // Context-Aware Suggestion Engine
    const generateContextAwareSuggestions = async (params) => {
        const {
            count,
            difficulty,
            category,
            focusAreas,
            userLevel,
            timeAvailable,
            userProfile
        } = params

        const candidates = filterVocabularyCandidates({
            difficulty,
            category,
            focusAreas,
            userLevel,
            userProfile
        })

        // Score each candidate
        const scoredCandidates = candidates.map(word => ({
            ...word,
            aiScore: calculateAIScore(word, userProfile, params),
            reasons: generateRecommendationReasons(word, userProfile, params)
        }))

        // Sort by AI score and return top recommendations
        return scoredCandidates
            .sort((a, b) => b.aiScore - a.aiScore)
            .slice(0, count)
    }

    // Intelligent Scoring Algorithm
    const calculateAIScore = (word, userProfile, params) => {
        let score = 0
        
        // Base relevance score
        score += calculateRelevanceScore(word, userProfile)
        
        // Difficulty optimization
        score += calculateDifficultyScore(word, userProfile, params.timeAvailable)
        
        // Learning gap alignment
        score += calculateGapAlignmentScore(word, userProfile.weaknesses)
        
        // Semantic similarity bonus
        score += calculateSemanticBonus(word, userProfile.strengths)
        
        // Frequency and importance weighting
        score += calculateImportanceScore(word)
        
        // User preference alignment
        score += calculatePreferenceScore(word, userProfile.learningStyle)
        
        // Temporal factors (time of day, session length)
        score += calculateTemporalScore(params.timeAvailable)
        
        return Math.round(score * 100) / 100
    }

    // Generate explanation for recommendations
    const generateRecommendationReasons = (word, userProfile, params) => {
        const reasons = []
        
        if (userProfile.weaknesses.includes(word.category)) {
            reasons.push(`Strengthen ${word.category} skills`)
        }
        
        if (isOptimalDifficulty(word, userProfile)) {
            reasons.push(`Perfect difficulty level for your current skill`)
        }
        
        if (isHighValueWord(word)) {
            reasons.push(`High-frequency word for IELTS success`)
        }
        
        if (hasSemanticConnection(word, userProfile.strengths)) {
            reasons.push(`Builds on your ${userProfile.strengths[0]} strength`)
        }
        
        if (fitsTimeConstraint(word, params.timeAvailable)) {
            reasons.push(`Optimized for your available study time`)
        }
        
        return reasons
    }

    // Helper functions for scoring calculations
    const calculateRelevanceScore = (word, userProfile) => {
        let score = 50 // Base score
        
        // Category performance bonus
        const categoryPerf = userProfile.performanceByCategory[word.category]
        if (categoryPerf && categoryPerf.accuracy < 70) {
            score += 20 // Focus on weak areas
        }
        
        // Difficulty alignment
        const userComfort = userProfile.difficultyComfort[word.level]
        if (userComfort && userComfort.accuracy > 80) {
            score += 15 // Challenge with slightly harder words
        }
        
        return score
    }

    const calculateDifficultyScore = (word, userProfile, timeAvailable) => {
        const userLevel = userProfile.masteryLevel
        const wordLevel = word.level
        
        // Optimal challenge zone (slightly above comfort level)
        const optimalLevels = {
            'A1': ['A1', 'A2'],
            'A2': ['A2', 'B1'], 
            'B1': ['B1', 'B2'],
            'B2': ['B2', 'C1'],
            'C1': ['C1', 'C2']
        }
        
        const isOptimal = optimalLevels[userLevel]?.includes(wordLevel)
        return isOptimal ? 25 : (wordLevel === userLevel ? 15 : 5)
    }

    const calculateGapAlignmentScore = (word, weaknesses) => {
        return weaknesses.includes(word.category) ? 30 : 10
    }

    const calculateSemanticBonus = (word, strengths) => {
        // Bonus for words related to user's strengths
        const relatedCategories = getRelatedCategories(strengths[0])
        return relatedCategories.includes(word.category) ? 20 : 5
    }

    const calculateImportanceScore = (word) => {
        const frequencyScore = {
            'high': 20,
            'medium': 15,
            'low': 10
        }
        return frequencyScore[word.frequency] || 10
    }

    const calculatePreferenceScore = (word, learningStyle) => {
        // Adapt to learning style preferences
        const styleBonus = {
            'visual': word.visual_cue ? 15 : 5,
            'auditory': word.pronunciation ? 15 : 5,
            'kinesthetic': word.examples ? 15 : 5,
            'mixed': 10
        }
        return styleBonus[learningStyle] || 10
    }

    const calculateTemporalScore = (timeAvailable) => {
        // Optimize for available time
        if (timeAvailable <= 5) return 20 // Quick learning words
        if (timeAvailable <= 15) return 15 // Medium complexity
        return 10 // Full complexity words
    }

    // Utility functions
    const getRecentActivity = (days) => {
        // Mock implementation - would integrate with real progress data
        return Array.from({ length: days }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            wordsLearned: Math.floor(Math.random() * 10) + 5,
            accuracy: Math.random() * 30 + 70
        }))
    }

    const calculateLearningVelocity = (recentActivity) => {
        const totalWords = recentActivity.reduce((sum, day) => sum + day.wordsLearned, 0)
        const avgAccuracy = recentActivity.reduce((sum, day) => sum + day.accuracy, 0) / recentActivity.length
        return {
            wordsPerDay: totalWords / recentActivity.length,
            averageAccuracy: avgAccuracy,
            trend: calculateTrend(recentActivity)
        }
    }

    const analyzePerformanceByCategory = () => {
        const performance = {}
        vocabularyDatabase.forEach(word => {
            if (!performance[word.category]) {
                performance[word.category] = { total: 0, correct: 0, accuracy: 0 }
            }
            performance[word.category].total++
            // Mock accuracy calculation
            if (userCards[word.german]?.streak > 2) {
                performance[word.category].correct++
            }
        })
        
        Object.keys(performance).forEach(category => {
            performance[category].accuracy = 
                (performance[category].correct / performance[category].total) * 100
        })
        
        return performance
    }

    const analyzeDifficultyComfort = () => {
        const comfort = {}
        vocabularyDatabase.forEach(word => {
            if (!comfort[word.level]) {
                comfort[word.level] = { total: 0, successful: 0, accuracy: 0 }
            }
            comfort[word.level].total++
            if (userCards[word.german]?.level >= 3) {
                comfort[word.level].successful++
            }
        })
        
        Object.keys(comfort).forEach(level => {
            comfort[level].accuracy = 
                (comfort[level].successful / comfort[level].total) * 100
        })
        
        return comfort
    }

    const detectLearningStyle = () => {
        // Analyze user behavior to detect learning style
        // This is a simplified implementation
        const visualScore = vocabularyDatabase.filter(w => w.visual_cue && userCards[w.german]).length
        const auditoryScore = vocabularyDatabase.filter(w => w.pronunciation && userCards[w.german]).length
        
        if (visualScore > auditoryScore) return 'visual'
        if (auditoryScore > visualScore) return 'auditory'
        return 'mixed'
    }

    const identifyOptimalPatterns = () => {
        // Analyze when user learns best
        return {
            optimalTimeOfDay: 'morning', // Would be calculated from real data
            optimalSessionLength: 20, // minutes
            preferredDifficulty: 'adaptive'
        }
    }

    const identifyStrengths = (performanceByCategory) => {
        return Object.entries(performanceByCategory)
            .filter(([_, data]) => data.accuracy > 80)
            .map(([category, _]) => category)
    }

    const identifyWeaknesses = (performanceByCategory) => {
        return Object.entries(performanceByCategory)
            .filter(([_, data]) => data.accuracy < 70)
            .map(([category, _]) => category)
    }

    const calculateMasteryLevel = () => {
        const masteredWords = Object.values(userCards).filter(card => card.level >= 4).length
        const totalWords = vocabularyDatabase.length
        const masteryPercentage = (masteredWords / totalWords) * 100
        
        if (masteryPercentage > 80) return 'C1'
        if (masteryPercentage > 60) return 'B2'
        if (masteryPercentage > 40) return 'B1'
        if (masteryPercentage > 20) return 'A2'
        return 'A1'
    }

    // Additional helper functions
    const filterVocabularyCandidates = ({ difficulty, category, focusAreas, userLevel }) => {
        let candidates = [...vocabularyDatabase]
        
        // Filter by learned status (suggest unlearned words)
        candidates = candidates.filter(word => !userCards[word.german])
        
        // Apply difficulty filter
        if (difficulty) {
            candidates = candidates.filter(word => word.level === difficulty)
        }
        
        // Apply category filter
        if (category) {
            candidates = candidates.filter(word => word.category === category)
        }
        
        return candidates
    }

    const isOptimalDifficulty = (word, userProfile) => {
        const userLevel = userProfile.masteryLevel
        const optimalLevels = {
            'A1': ['A1', 'A2'],
            'A2': ['A2', 'B1'],
            'B1': ['B1', 'B2'],
            'B2': ['B2', 'C1'],
            'C1': ['C1', 'C2']
        }
        return optimalLevels[userLevel]?.includes(word.level)
    }

    const isHighValueWord = (word) => {
        return word.frequency === 'high' || word.category === 'ielts-core'
    }

    const hasSemanticConnection = (word, strengths) => {
        if (!strengths || strengths.length === 0) return false
        const related = getRelatedCategories(strengths[0])
        return related.includes(word.category)
    }

    const fitsTimeConstraint = (word, timeAvailable) => {
        const complexityScore = word.difficulty || 1
        const estimatedTime = complexityScore * 2 // minutes
        return estimatedTime <= timeAvailable
    }

    const getRelatedCategories = (category) => {
        const relationships = {
            'verbs': ['actions', 'communication', 'daily-activities'],
            'nouns': ['objects', 'people', 'places'],
            'adjectives': ['descriptions', 'qualities', 'states']
        }
        return relationships[category] || [category]
    }

    const calculateTrend = (activity) => {
        // Simple trend calculation
        const recent = activity.slice(0, 3)
        const older = activity.slice(3, 7)
        
        const recentAvg = recent.reduce((sum, day) => sum + day.wordsLearned, 0) / recent.length
        const olderAvg = older.reduce((sum, day) => sum + day.wordsLearned, 0) / older.length
        
        if (recentAvg > olderAvg * 1.1) return 'improving'
        if (recentAvg < olderAvg * 0.9) return 'declining'
        return 'stable'
    }

    // Public interface
    return {
        suggestions,
        recommendationContext,
        isGenerating,
        generateRecommendations,
        analyzeUserProfile,
        // Utility functions for UI
        getSuggestionReason: (suggestion) => suggestion.reasons?.[0] || 'AI-selected for optimal learning',
        refreshSuggestions: () => generateRecommendations(),
        getConfidenceScore: (suggestion) => Math.round(suggestion.aiScore)
    }
}