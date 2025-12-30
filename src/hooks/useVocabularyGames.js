import { useState, useEffect, useCallback, useMemo } from 'react'

// Game types
const GAME_TYPES = {
  FLASHCARD: 'flashcard',
  QUIZ: 'quiz',
  MATCHING: 'matching',
  TYPING: 'typing',
  LISTENING: 'listening',
  SPEAKING: 'speaking',
  WORD_BUILDING: 'word_building',
  CONTEXT: 'context'
}

// Game difficulties
const GAME_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert'
}

export function useVocabularyGames(vocabularyDatabase) {
  const [currentGame, setCurrentGame] = useState(null)
  const [gameState, setGameState] = useState({
    type: null,
    difficulty: GAME_DIFFICULTIES.EASY,
    score: 0,
    highScore: 0,
    currentQuestion: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    streak: 0,
    bestStreak: 0,
    timeElapsed: 0,
    gameActive: false,
    gameComplete: false,
    questions: [],
    answers: []
  })
  
  const [gameHistory, setGameHistory] = useState([])
  const [achievements, setAchievements] = useState([])

  // Load game history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('vocabulary-game-history')
    if (savedHistory) {
      setGameHistory(JSON.parse(savedHistory))
    }
    
    const savedAchievements = localStorage.getItem('vocabulary-game-achievements')
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements))
    }
  }, [])

  // Save game history to localStorage
  useEffect(() => {
    if (gameHistory.length > 0) {
      localStorage.setItem('vocabulary-game-history', JSON.stringify(gameHistory))
    }
  }, [gameHistory])

  // Generate questions for different game types
  const generateQuestions = useCallback((type, difficulty, count = 10, vocabulary = vocabularyDatabase) => {
    const filteredVocab = filterVocabularyByDifficulty(vocabulary, difficulty)
    const questions = []

    switch (type) {
      case GAME_TYPES.FLASHCARD:
        return generateFlashcardQuestions(filteredVocab, count)
      
      case GAME_TYPES.QUIZ:
        return generateQuizQuestions(filteredVocab, count)
      
      case GAME_TYPES.MATCHING:
        return generateMatchingQuestions(filteredVocab, count)
      
      case GAME_TYPES.TYPING:
        return generateTypingQuestions(filteredVocab, count)
      
      case GAME_TYPES.LISTENING:
        return generateListeningQuestions(filteredVocab, count)
      
      case GAME_TYPES.SPEAKING:
        return generateSpeakingQuestions(filteredVocab, count)
      
      case GAME_TYPES.WORD_BUILDING:
        return generateWordBuildingQuestions(filteredVocab, count)
      
      case GAME_TYPES.CONTEXT:
        return generateContextQuestions(filteredVocab, count)
      
      default:
        return []
    }
  }, [vocabularyDatabase])

  // Filter vocabulary by difficulty
  const filterVocabularyByDifficulty = useCallback((vocabulary, difficulty) => {
    const levelMap = {
      [GAME_DIFFICULTIES.EASY]: ['A1'],
      [GAME_DIFFICULTIES.MEDIUM]: ['A1', 'A2'],
      [GAME_DIFFICULTIES.HARD]: ['A2', 'B1'],
      [GAME_DIFFICULTIES.EXPERT]: ['B1', 'B2', 'C1']
    }
    
    const allowedLevels = levelMap[difficulty] || ['A1']
    return vocabulary.filter(word => allowedLevels.includes(word.level))
  }, [])

  // Generate flashcard questions
  const generateFlashcardQuestions = useCallback((vocabulary, count) => {
    const selectedWords = vocabulary.sort(() => Math.random() - 0.5).slice(0, count)
    
    return selectedWords.map((word, index) => ({
      id: `flashcard_${index}`,
      type: GAME_TYPES.FLASHCARD,
      question: word.german,
      answer: word.english,
      arabicAnswer: word.arabic,
      pronunciation: word.pronunciation,
      word: word,
      options: null
    }))
  }, [])

  // Generate quiz questions
  const generateQuizQuestions = useCallback((vocabulary, count) => {
    const selectedWords = vocabulary.sort(() => Math.random() - 0.5).slice(0, count)
    
    return selectedWords.map((word, index) => {
      // Generate wrong options
      const wrongOptions = vocabulary
        .filter(w => w.german !== word.german)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.english)
      
      const options = [word.english, ...wrongOptions].sort(() => Math.random() - 0.5)
      
      return {
        id: `quiz_${index}`,
        type: GAME_TYPES.QUIZ,
        question: `What does "${word.german}" mean?`,
        answer: word.english,
        word: word,
        options
      }
    })
  }, [])

  // Generate matching questions
  const generateMatchingQuestions = useCallback((vocabulary, count) => {
    const selectedWords = vocabulary.sort(() => Math.random() - 0.5).slice(0, Math.min(count, 10))
    
    return {
      id: `matching_${Date.now()}`,
      type: GAME_TYPES.MATCHING,
      question: 'Match the German words with their English translations',
      pairs: selectedWords.map(word => ({
        german: word.german,
        english: word.english,
        id: word.german
      })),
      shuffledPairs: [...selectedWords.map(word => ({
        german: word.german,
        english: word.english,
        id: word.german
      }))].sort(() => Math.random() - 0.5)
    }
  }, [])

  // Generate typing questions
  const generateTypingQuestions = useCallback((vocabulary, count) => {
    const selectedWords = vocabulary.sort(() => Math.random() - 0.5).slice(0, count)
    
    return selectedWords.map((word, index) => ({
      id: `typing_${index}`,
      type: GAME_TYPES.TYPING,
      question: `Type the German word for: "${word.english}"`,
      answer: word.german,
      hint: word.pronunciation,
      word: word,
      options: null
    }))
  }, [])

  // Generate listening questions
  const generateListeningQuestions = useCallback((vocabulary, count) => {
    const selectedWords = vocabulary.sort(() => Math.random() - 0.5).slice(0, count)
    
    return selectedWords.map((word, index) => {
      const wrongOptions = vocabulary
        .filter(w => w.german !== word.german)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.german)
      
      const options = [word.german, ...wrongOptions].sort(() => Math.random() - 0.5)
      
      return {
        id: `listening_${index}`,
        type: GAME_TYPES.LISTENING,
        question: 'Listen and select the correct word',
        answer: word.german,
        english: word.english,
        word: word,
        options,
        audioText: word.german
      }
    })
  }, [])

  // Generate speaking questions
  const generateSpeakingQuestions = useCallback((vocabulary, count) => {
    const selectedWords = vocabulary.sort(() => Math.random() - 0.5).slice(0, count)
    
    return selectedWords.map((word, index) => ({
      id: `speaking_${index}`,
      type: GAME_TYPES.SPEAKING,
      question: `Pronounce: "${word.english}"`,
      answer: word.german,
      pronunciation: word.pronunciation,
      word: word,
      expectedIPA: word.ipa,
      options: null
    }))
  }, [])

  // Generate word building questions
  const generateWordBuildingQuestions = useCallback((vocabulary, count) => {
    const selectedWords = vocabulary.sort(() => Math.random() - 0.5).slice(0, count)
    
    return selectedWords.map((word, index) => {
      const scrambled = word.german.split('').sort(() => Math.random() - 0.5).join('')
      
      return {
        id: `word_building_${index}`,
        type: GAME_TYPES.WORD_BUILDING,
        question: `Unscramble the letters: ${scrambled}`,
        hint: `English: ${word.english}`,
        answer: word.german,
        word: word,
        scrambled,
        options: null
      }
    })
  }, [])

  // Generate context questions
  const generateContextQuestions = useCallback((vocabulary, count) => {
    const selectedWords = vocabulary.sort(() => Math.random() - 0.5).slice(0, count)
    
    return selectedWords.map((word, index) => {
      const example = word.examples?.german?.[0] || `Ich lerne ${word.german}.`
      const blankedExample = example.replace(word.german, '___')
      
      return {
        id: `context_${index}`,
        type: GAME_TYPES.CONTEXT,
        question: `Complete the sentence: ${blankedExample}`,
        answer: word.german,
        word: word,
        context: example,
        options: null
      }
    })
  }, [])

  // Start a new game
  const startGame = useCallback((type, difficulty = GAME_DIFFICULTIES.EASY, customQuestions = null) => {
    const questions = customQuestions || generateQuestions(type, difficulty)
    
    setGameState({
      type,
      difficulty,
      score: 0,
      highScore: getHighScore(type, difficulty),
      currentQuestion: 0,
      totalQuestions: Array.isArray(questions) ? questions.length : questions.pairs?.length || 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      streak: 0,
      bestStreak: 0,
      timeElapsed: 0,
      gameActive: true,
      gameComplete: false,
      questions: Array.isArray(questions) ? questions : [questions],
      answers: []
    })
    
    setCurrentGame(type)
  }, [generateQuestions])

  // Handle answer submission
  const submitAnswer = useCallback((answer, timeTaken = 0) => {
    if (!gameState.gameActive) return
    
    const currentQuestionData = gameState.questions[gameState.currentQuestion]
    if (!currentQuestionData) return
    
    let isCorrect = false
    let points = 0
    
    // Check answer based on game type
    switch (gameState.type) {
      case GAME_TYPES.QUIZ:
      case GAME_TYPES.LISTENING:
        isCorrect = answer.toLowerCase() === currentQuestionData.answer.toLowerCase()
        break
      
      case GAME_TYPES.TYPING:
      case GAME_TYPES.WORD_BUILDING:
      case GAME_TYPES.CONTEXT:
        isCorrect = answer.toLowerCase().trim() === currentQuestionData.answer.toLowerCase()
        break
      
      case GAME_TYPES.FLASHCARD:
        isCorrect = answer === true // User knows the word
        break
      
      case GAME_TYPES.SPEAKING:
        // For speaking, we'll use speech recognition to check accuracy
        isCorrect = answer.confidence >= 0.7
        break
      
      case GAME_TYPES.MATCHING:
        isCorrect = checkMatchingAnswer(answer, currentQuestionData)
        break
      
      default:
        isCorrect = false
    }
    
    // Calculate points based on difficulty and time
    const basePoints = {
      [GAME_DIFFICULTIES.EASY]: 10,
      [GAME_DIFFICULTIES.MEDIUM]: 20,
      [GAME_DIFFICULTIES.HARD]: 30,
      [GAME_DIFFICULTIES.EXPERT]: 50
    }
    
    points = basePoints[gameState.difficulty] || 10
    
    // Bonus points for speed
    if (timeTaken < 5) points += 5
    if (timeTaken < 3) points += 10
    
    // Bonus points for streak
    if (isCorrect) {
      const newStreak = gameState.streak + 1
      if (newStreak >= 3) points += 10
      if (newStreak >= 5) points += 20
      
      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        correctAnswers: prev.correctAnswers + 1,
        streak: newStreak,
        bestStreak: Math.max(newStreak, prev.bestStreak)
      }))
    } else {
      setGameState(prev => ({
        ...prev,
        incorrectAnswers: prev.incorrectAnswers + 1,
        streak: 0
      }))
    }
    
    // Record answer
    const newAnswer = {
      questionId: currentQuestionData.id,
      question: currentQuestionData.question,
      userAnswer: answer,
      correctAnswer: currentQuestionData.answer,
      isCorrect,
      points,
      timeTaken,
      timestamp: Date.now()
    }
    
    setGameState(prev => ({
      ...prev,
      answers: [...prev.answers, newAnswer],
      currentQuestion: prev.currentQuestion + 1,
      gameComplete: prev.currentQuestion + 1 >= prev.totalQuestions
    }))
    
    return { isCorrect, points, newAnswer }
  }, [gameState])

  // Check matching game answer
  const checkMatchingAnswer = useCallback((answer, questionData) => {
    if (!answer || !questionData.pairs) return false
    
    return questionData.pairs.every(pair => {
      const userMatch = answer.find(match => 
        match.german === pair.german && match.english === pair.english
      )
      return userMatch !== undefined
    })
  }, [])

  // End current game
  const endGame = useCallback(() => {
    if (!gameState.gameActive) return
    
    const finalScore = gameState.score
    const highScore = Math.max(finalScore, getHighScore(gameState.type, gameState.difficulty))
    
    // Update high score
    updateHighScore(gameState.type, gameState.difficulty, highScore)
    
    // Save game to history
    const gameRecord = {
      id: `game_${Date.now()}`,
      type: gameState.type,
      difficulty: gameState.difficulty,
      score: finalScore,
      highScore,
      correctAnswers: gameState.correctAnswers,
      incorrectAnswers: gameState.incorrectAnswers,
      totalQuestions: gameState.totalQuestions,
      accuracy: gameState.totalQuestions > 0 
        ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100) 
        : 0,
      bestStreak: gameState.bestStreak,
      timeElapsed: gameState.timeElapsed,
      timestamp: new Date().toISOString(),
      answers: gameState.answers
    }
    
    setGameHistory(prev => [gameRecord, ...prev].slice(0, 100)) // Keep last 100 games
    
    // Check for achievements
    checkAchievements(gameRecord)
    
    setGameState(prev => ({
      ...prev,
      gameActive: false,
      gameComplete: true,
      highScore
    }))
    
    return gameRecord
  }, [gameState])

  // Get high score for game type and difficulty
  const getHighScore = useCallback((type, difficulty) => {
    const key = `highscore_${type}_${difficulty}`
    return parseInt(localStorage.getItem(key) || '0')
  }, [])

  // Update high score
  const updateHighScore = useCallback((type, difficulty, score) => {
    const key = `highscore_${type}_${difficulty}`
    localStorage.setItem(key, score.toString())
  }, [])

  // Check for achievements
  const checkAchievements = useCallback((gameRecord) => {
    const newAchievements = []
    
    // First game achievement
    if (gameHistory.length === 0) {
      newAchievements.push({
        id: 'first_game',
        title: 'First Steps',
        description: 'Complete your first vocabulary game',
        icon: '🎮',
        timestamp: new Date().toISOString()
      })
    }
    
    // Perfect game achievement
    if (gameRecord.accuracy === 100 && gameRecord.totalQuestions >= 10) {
      newAchievements.push({
        id: 'perfect_game',
        title: 'Perfect Score',
        description: 'Complete a game with 100% accuracy',
        icon: '⭐',
        timestamp: new Date().toISOString()
      })
    }
    
    // Speed demon achievement
    if (gameRecord.timeElapsed < 60 && gameRecord.totalQuestions >= 10 && gameRecord.accuracy >= 90) {
      newAchievements.push({
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Complete 10+ questions in under 60 seconds with 90%+ accuracy',
        icon: '⚡',
        timestamp: new Date().toISOString()
      })
    }
    
    // Streak master achievement
    if (gameRecord.bestStreak >= 10) {
      newAchievements.push({
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Achieve a streak of 10 correct answers',
        icon: '🔥',
        timestamp: new Date().toISOString()
      })
    }
    
    // Game master achievement
    const gameTypes = [...new Set(gameHistory.map(g => g.type))]
    if (gameTypes.length >= 5) {
      newAchievements.push({
        id: 'game_master',
        title: 'Game Master',
        description: 'Play all 5 different game types',
        icon: '🏆',
        timestamp: new Date().toISOString()
      })
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements])
      localStorage.setItem('vocabulary-game-achievements', JSON.stringify([...achievements, ...newAchievements]))
    }
  }, [gameHistory, achievements])

  // Get game statistics
  const getGameStatistics = useCallback(() => {
    const stats = {
      totalGames: gameHistory.length,
      totalScore: gameHistory.reduce((sum, game) => sum + game.score, 0),
      averageScore: 0,
      bestScore: 0,
      averageAccuracy: 0,
      totalTime: gameHistory.reduce((sum, game) => sum + game.timeElapsed, 0),
      favoriteGameType: null,
      achievements: achievements.length,
      recentGames: gameHistory.slice(0, 5)
    }
    
    if (gameHistory.length > 0) {
      stats.averageScore = Math.round(stats.totalScore / gameHistory.length)
      stats.bestScore = Math.max(...gameHistory.map(g => g.score))
      stats.averageAccuracy = Math.round(
        gameHistory.reduce((sum, game) => sum + game.accuracy, 0) / gameHistory.length
      )
      
      // Find favorite game type
      const gameTypeCounts = gameHistory.reduce((acc, game) => {
        acc[game.type] = (acc[game.type] || 0) + 1
        return acc
      }, {})
      
      stats.favoriteGameType = Object.entries(gameTypeCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null
    }
    
    return stats
  }, [gameHistory, achievements])

  // Reset game state
  const resetGame = useCallback(() => {
    setGameState({
      type: null,
      difficulty: GAME_DIFFICULTIES.EASY,
      score: 0,
      highScore: 0,
      currentQuestion: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      streak: 0,
      bestStreak: 0,
      timeElapsed: 0,
      gameActive: false,
      gameComplete: false,
      questions: [],
      answers: []
    })
    setCurrentGame(null)
  }, [])

  // Update game timer
  const updateTimer = useCallback(() => {
    if (gameState.gameActive) {
      setGameState(prev => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1
      }))
    }
  }, [gameState.gameActive])

  // Timer effect
  useEffect(() => {
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [updateTimer])

  return {
    // Game state
    gameState,
    currentGame,
    gameHistory,
    achievements,
    
    // Game controls
    startGame,
    submitAnswer,
    endGame,
    resetGame,
    
    // Game utilities
    generateQuestions,
    getGameStatistics,
    getHighScore,
    
    // Constants
    GAME_TYPES,
    GAME_DIFFICULTIES
  }
}