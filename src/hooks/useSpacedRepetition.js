import { useState, useEffect, useCallback } from 'react'

// Spaced Repetition Algorithm based on SM-2 (SuperMemo 2)
const INITIAL_EASINESS = 2.5
const MIN_EASINESS = 1.3
const EASINESS_FACTOR = 0.1

export function useSpacedRepetition() {
    const [cards, setCards] = useState({})
    const [dueCards, setDueCards] = useState([])

    // Initialize or load card data from localStorage
    useEffect(() => {
        const savedCards = localStorage.getItem('vocabulary-spaced-repetition')
        if (savedCards) {
            try {
                setCards(JSON.parse(savedCards))
            } catch (error) {
                console.error('Failed to parse spaced repetition cards:', error)
            }
        }
    }, [])

    // Save cards to localStorage whenever they change
    useEffect(() => {
        if (Object.keys(cards).length > 0) {
            localStorage.setItem('vocabulary-spaced-repetition', JSON.stringify(cards))
        }
    }, [cards])

    // Calculate next review interval based on SM-2 algorithm
    const calculateNextReview = useCallback((card, quality) => {
        // Quality: 0-5 (0=total blackout, 5=perfect response)
        if (quality < 3) {
            // Reset to first interval if quality is poor
            return {
                interval: 1,
                repetitions: 0,
                easiness: Math.max(card.easiness - EASINESS_FACTOR, MIN_EASINESS),
                nextReview: Date.now() + (1 * 24 * 60 * 60 * 1000) // 1 day
            }
        }

        let newEasiness = card.easiness + (EASINESS_FACTOR * (5 - quality))
        newEasiness = Math.max(newEasiness, MIN_EASINESS)

        let newInterval
        let newRepetitions = card.repetitions + 1

        if (newRepetitions === 1) {
            newInterval = 1
        } else if (newRepetitions === 2) {
            newInterval = 6
        } else {
            newInterval = Math.round(card.interval * newEasiness)
        }

        return {
            interval: newInterval,
            repetitions: newRepetitions,
            easiness: newEasiness,
            nextReview: Date.now() + (newInterval * 24 * 60 * 60 * 1000)
        }
    }, [])

    // Add new card to the system
    const addCard = useCallback((wordId) => {
        const now = Date.now()
        const newCard = {
            wordId,
            interval: 1,
            repetitions: 0,
            easiness: INITIAL_EASINESS,
            nextReview: now + (1 * 24 * 60 * 60 * 1000), // 1 day
            lastReviewed: now,
            quality: null,
            reviewCount: 0,
            correctCount: 0,
            streak: 0,
            mastered: false
        }

        setCards(prev => ({
            ...prev,
            [wordId]: newCard
        }))
    }, [])

    // Review a card and update its schedule
    const reviewCard = useCallback((wordId, quality) => {
        setCards(prev => {
            const card = prev[wordId]
            if (!card) return prev

            const nextReview = calculateNextReview(card, quality)
            const isCorrect = quality >= 3
            const newStreak = isCorrect ? card.streak + 1 : 0

            const updatedCard = {
                ...card,
                ...nextReview,
                lastReviewed: Date.now(),
                quality,
                reviewCount: card.reviewCount + 1,
                correctCount: card.correctCount + (isCorrect ? 1 : 0),
                streak: newStreak,
                mastered: newStreak >= 5 && card.correctCount / card.reviewCount >= 0.8
            }

            return {
                ...prev,
                [wordId]: updatedCard
            }
        })
    }, [calculateNextReview])

    // Get cards that are due for review
    const getDueCards = useCallback(() => {
        const now = Date.now()
        const due = []

        Object.entries(cards).forEach(([wordId, card]) => {
            if (card.nextReview <= now && !card.mastered) {
                // We'll trust the caller to have the vocabulary or use a global one
                due.push({
                    german: wordId,
                    spacedRepetition: card
                })
            }
        })

        // Sort by priority
        due.sort((a, b) => a.spacedRepetition.easiness - b.spacedRepetition.easiness)

        return due
    }, [cards])

    // Automatically update due cards when cards change
    useEffect(() => {
        const now = Date.now()
        const due = []

        Object.entries(cards).forEach(([wordId, card]) => {
            if (card.nextReview <= now && !card.mastered) {
                due.push({
                    german: wordId,
                    spacedRepetition: card
                })
            }
        })

        // Sort by priority
        due.sort((a, b) => a.spacedRepetition.easiness - b.spacedRepetition.easiness)

        setDueCards(due)
    }, [cards])

    // Get cards due for review in next X days
    const getUpcomingCards = useCallback((days = 7) => {
        const now = Date.now()
        const futureTime = now + (days * 24 * 60 * 60 * 1000)
        const upcoming = []

        Object.entries(cards).forEach(([wordId, card]) => {
            if (card.nextReview > now && card.nextReview <= futureTime) {
                upcoming.push({
                    wordId,
                    nextReview: card.nextReview,
                    daysUntilReview: Math.ceil((card.nextReview - now) / (24 * 60 * 60 * 1000))
                })
            }
        })

        return upcoming.sort((a, b) => a.nextReview - b.nextReview)
    }, [cards])

    // Get learning statistics
    const getStatistics = useCallback(() => {
        const totalCards = Object.keys(cards).length
        const masteredCards = Object.values(cards).filter(card => card.mastered).length
        const dueCardsCount = dueCards.length
        const totalReviews = Object.values(cards).reduce((sum, card) => sum + card.reviewCount, 0)
        const correctReviews = Object.values(cards).reduce((sum, card) => sum + card.correctCount, 0)
        const accuracy = totalReviews > 0 ? (correctReviews / totalReviews * 100).toFixed(1) : 0

        // Calculate average easiness factor
        const easinessFactors = Object.values(cards).map(card => card.easiness)
        const avgEasiness = easinessFactors.length > 0
            ? (easinessFactors.reduce((sum, ef) => sum + ef, 0) / easinessFactors.length).toFixed(2)
            : INITIAL_EASINESS

        // Calculate longest streak
        const longestStreak = Math.max(...Object.values(cards).map(card => card.streak), 0)

        return {
            totalCards,
            masteredCards,
            dueCardsCount,
            totalReviews,
            correctReviews,
            accuracy,
            avgEasiness,
            longestStreak,
            masteryRate: totalCards > 0 ? ((masteredCards / totalCards) * 100).toFixed(1) : 0
        }
    }, [cards, dueCards])

    // Reset a card's progress
    const resetCard = useCallback((wordId) => {
        setCards(prev => ({
            ...prev,
            [wordId]: {
                interval: 1,
                repetitions: 0,
                easiness: INITIAL_EASINESS,
                nextReview: Date.now() + (1 * 24 * 60 * 60 * 1000),
                lastReviewed: Date.now(),
                quality: null,
                reviewCount: 0,
                correctCount: 0,
                streak: 0,
                mastered: false
            }
        }))
    }, [])

    // Delete a card from the system
    const deleteCard = useCallback((wordId) => {
        setCards(prev => {
            const newCards = { ...prev }
            delete newCards[wordId]
            return newCards
        })
    }, [])

    // Get cards by difficulty level
    const getCardsByLevel = useCallback((level) => {
        const levelCards = Object.entries(cards)
            .filter(([_, card]) => {
                if (level === 'new') return card.reviewCount === 0
                if (level === 'learning') return card.reviewCount > 0 && !card.mastered
                if (level === 'mature') return card.repetitions >= 3
                if (level === 'mastered') return card.mastered
                return true
            })
            .map(([wordId, card]) => ({ wordId, ...card }))

        return levelCards
    }, [cards])

    // Export data for backup
    const exportData = useCallback(() => {
        return {
            cards,
            exportDate: new Date().toISOString(),
            version: '1.0'
        }
    }, [cards])

    // Import data from backup
    const importData = useCallback((data) => {
        if (data.cards && typeof data.cards === 'object') {
            setCards(data.cards)
            return true
        }
        return false
    }, [])

    // Clear all data
    const clearAllData = useCallback(() => {
        setCards({})
        localStorage.removeItem('vocabulary-spaced-repetition')
    }, [])

    return {
        cards,
        dueCards,
        addCard,
        reviewCard,
        getDueCards,
        getUpcomingCards,
        getStatistics,
        resetCard,
        deleteCard,
        getCardsByLevel,
        exportData,
        importData,
        clearAllData
    }
}