import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import {
    Search, BookOpen, Volume2, RefreshCw, Globe, Star, TrendingUp,
    Award, Clock, Filter, Download, Play, Mic, BarChart3,
    Zap, Target, X, Check, ShieldAlert, Utensils, Shirt, HeartPulse, Sparkles
} from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useSpacedRepetition } from '../hooks/useSpacedRepetition'
import { useVocabularyGames } from '../hooks/useVocabularyGames'
import { useVocabularySearch } from '../hooks/useVocabularySearch'
import { useVocabularyAnalytics } from '../hooks/useVocabularyAnalytics'
import { useSharedData } from '../hooks/useSharedData'
import { fetchWordAudio } from '../utils/audioFetcher'

// Import vocabulary database
import vocabularyDatabase from '../data/vocabulary-database.json'
import vocabularyExtra from '../data/vocabulary-extra.json'
import VocabularyCalendar from '../components/VocabularyCalendar'

// Enhanced Vocabulary Game Component
const VocabularyGame = memo(function VocabularyGame({ game, onAnswer, speakWord, vocabulary }) {
    const [selectedAnswer, setSelectedAnswer] = useState('')
    const [startTime, setStartTime] = useState(Date.now())
    const [isFlipped, setIsFlipped] = useState(false)

    const currentQuestion = game?.questions?.[game.currentQuestion] || null

    const handleSubmit = () => {
        const timeTaken = (Date.now() - startTime) / 1000
        onAnswer(selectedAnswer, timeTaken)
        setSelectedAnswer('')
        setStartTime(Date.now())
        setIsFlipped(false)
    }

    const handleCardFlip = () => {
        setIsFlipped(!isFlipped)
    }

    const handleSpeak = () => {
        if (currentQuestion.word) {
            speakWord(currentQuestion.word)
        }
    }

    const [matchingState, setMatchingState] = useState({
        selectedWordIdx: null,
        matchedPairs: new Set(),
        wrongPair: null
    })

    // Reset matching state when game changes
    useEffect(() => {
        setMatchingState({
            selectedWordIdx: null,
            matchedPairs: new Set(),
            wrongPair: null
        })
    }, [game.currentQuestion])

    const handleMatchWord = (idx) => {
        if (matchingState.matchedPairs.has(idx)) return
        setMatchingState(prev => ({ ...prev, selectedWordIdx: idx, wrongPair: null }))
    }

    const handleMatchDef = (defIdx) => {
        const { selectedWordIdx, matchedPairs } = matchingState
        if (selectedWordIdx === null || matchedPairs.has(selectedWordIdx)) return
        if (!currentQuestion) return
        const currentWord = currentQuestion.pairs[selectedWordIdx]
        const targetDef = currentQuestion.shuffledPairs[defIdx]

        // Check if the definition matches the selected word
        if (currentWord.definition === targetDef.definition) {
            const newMatched = new Set(matchedPairs)
            newMatched.add(selectedWordIdx)
            setMatchingState(prev => ({
                ...prev,
                matchedPairs: newMatched,
                selectedWordIdx: null,
                wrongPair: null
            }))
        } else {
            setMatchingState(prev => ({ ...prev, wrongPair: defIdx }))
            setTimeout(() => {
                setMatchingState(prev => ({ ...prev, wrongPair: null }))
            }, 1000)
        }
    }

    const isGameComplete = matchingState.matchedPairs.size === (game.questions[game.currentQuestion]?.pairs?.length || 0)

    switch (game.type) {
        case 'flashcard':
            return (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <div style={{
                        width: '350px',
                        height: '250px',
                        margin: '0 auto',
                        perspective: '1000px',
                    }}>
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                transformStyle: 'preserve-3d',
                                transition: 'transform 0.6s',
                                cursor: 'pointer',
                            }}
                            onClick={handleCardFlip}
                        >
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backfaceVisibility: 'hidden',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                background: isFlipped ? 'var(--color-primary)' : 'var(--gradient-secondary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-lg)',
                                fontSize: 'var(--font-xl)',
                                flexDirection: 'column',
                                gap: 'var(--space-md)',
                            }}>
                                <div>{isFlipped ? currentQuestion.answer : currentQuestion.question}</div>
                                {currentQuestion.pronunciation && !isFlipped && (
                                    <div style={{ fontSize: 'var(--font-sm)', opacity: 0.8 }}>
                                        [{currentQuestion.pronunciation}]
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => handleSubmit(true)}>
                            <Check size={20} />
                            I Know This
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleSubmit(false)}>
                            <RefreshCw size={20} />
                            Need Practice
                        </button>
                        <button className="btn btn-accent" onClick={handleSpeak}>
                            <Volume2 size={20} />
                            Listen
                        </button>
                    </div>
                </div>
            )

        case 'quiz':
            return (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-xl)' }}>
                        {currentQuestion.question}
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 'var(--space-lg)',
                        marginBottom: 'var(--space-xl)',
                    }}>
                        {currentQuestion.options.map((option, idx) => (
                            <button
                                key={idx}
                                className={`btn ${selectedAnswer === option ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSelectedAnswer(option)}
                                style={{ padding: 'var(--space-lg)', fontSize: 'var(--font-lg)' }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={!selectedAnswer}>
                            Submit Answer
                        </button>
                        <button className="btn btn-accent" onClick={handleSpeak}>
                            <Volume2 size={20} />
                            Listen
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleSubmit(false)}>
                            Skip
                        </button>
                    </div>
                </div>
            )

        case 'matching':
            return (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-xl)' }}>
                        Match IELTS words with their definitions
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                            <h4 style={{ color: 'var(--color-primary)' }}>Words</h4>
                            {currentQuestion.pairs.map((pair, idx) => {
                                const isMatched = matchingState.matchedPairs.has(idx)
                                const isSelected = matchingState.selectedWordIdx === idx
                                return (
                                    <button
                                        key={idx}
                                        className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                                        style={{
                                            padding: 'var(--space-md)',
                                            justifyContent: 'center',
                                            border: isMatched ? '2px solid var(--color-success)' : isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            background: isMatched ? 'hsla(142, 71%, 45%, 0.1)' : isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                                            color: isSelected ? 'white' : 'var(--color-text)',
                                            opacity: isMatched ? 0.6 : 1,
                                            pointerEvents: isMatched ? 'none' : 'auto'
                                        }}
                                        onClick={() => handleMatchWord(idx)}
                                    >
                                        {pair.word}
                                        {isMatched && <Check size={16} style={{ marginLeft: '8px', color: 'var(--color-success)' }} />}
                                    </button>
                                )
                            })}
                        </div>

                        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                            <h4 style={{ color: 'var(--color-secondary)' }}>Definitions</h4>
                            {currentQuestion.shuffledPairs.map((pair, idx) => {
                                // Find if this definition is already matched
                                // We need to check if ANY matched word corresponds to this definition
                                // This is tricky because we store matched word indices, but definition order is shuffled
                                // So we need to find which word corresponds to this definition
                                const matchedWordIdx = currentQuestion.pairs.findIndex(p => p.definition === pair.definition)
                                const isMatched = matchingState.matchedPairs.has(matchedWordIdx)
                                const isWrong = matchingState.wrongPair === idx

                                return (
                                    <button
                                        key={idx}
                                        className="btn btn-ghost"
                                        style={{
                                            padding: 'var(--space-md)',
                                            textAlign: 'left',
                                            justifyContent: 'flex-start',
                                            border: isMatched ? '2px solid var(--color-success)' : isWrong ? '2px solid var(--color-error)' : '1px solid var(--color-border)',
                                            background: isMatched ? 'hsla(142, 71%, 45%, 0.1)' : isWrong ? 'hsla(0, 71%, 45%, 0.1)' : 'var(--color-surface)',
                                            fontSize: 'var(--font-sm)',
                                            opacity: isMatched ? 0.6 : 1,
                                            pointerEvents: isMatched ? 'none' : 'auto',
                                            height: 'auto',
                                            whiteSpace: 'normal'
                                        }}
                                        onClick={() => handleMatchDef(idx)}
                                    >
                                        {pair.definition}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => handleSubmit(true)}
                            disabled={!isGameComplete}
                        >
                            Finish Game
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleSubmit(false)}>
                            Skip
                        </button>
                    </div>
                </div>
            )

        default:
            return (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <h3>Game Type: {game.type}</h3>
                    <p>Question: {currentQuestion.question}</p>
                    <button className="btn btn-primary" onClick={() => handleSubmit(true)}>
                        Submit Answer
                    </button>
                </div>
            )
    }
})

const Vocabulary = function Vocabulary() {
    // State management
    const [activeTab, setActiveTab] = useState('learn')
    const [selectedWord, setSelectedWord] = useState(null)
    const [lookupHistory, setLookupHistory] = useState([])
    const [dailyWords, setDailyWords] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    // Custom hooks
    const { speak, getArabicVoice, getEnglishVoice } = useSpeechSynthesis()
    const {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        supported: speechRecognitionSupported
    } = useSpeechRecognition()
    const { trackProgress, progress } = useProgressTracking()
    const {
        cards,
        dueCards,
        addCard,
        reviewCard,
        getStatistics,
        getDueCards
    } = useSpacedRepetition()

    // Memoize statistics for performance
    const spacedRepetitionStats = useMemo(() => getStatistics(), [getStatistics, cards, dueCards])
    const vocabulary = useMemo(() => {
        const base = vocabularyDatabase.vocabulary || []
        const extra = vocabularyExtra.vocabulary || []
        const map = new Map()
        base.forEach((w) => {
            if (!w?.word) return
            map.set(String(w.word).toLowerCase(), w)
        })
        extra.forEach((w) => {
            if (!w?.word) return
            map.set(String(w.word).toLowerCase(), { ...map.get(String(w.word).toLowerCase()), ...w })
        })
        return Array.from(map.values())
    }, [])
    const {
        gameState,
        currentGame,
        gameHistory,
        achievements,
        startGame,
        submitAnswer,
        endGame,
        getGameStatistics,
        GAME_TYPES
    } = useVocabularyGames(vocabulary)
    const {
        searchTerm,
        searchResults,
        searchVocabulary,
        setFilters,
        clearFilters,
        getFilterOptions,
        exportResults,
        filters
    } = useVocabularySearch(vocabulary, cards)
    const {
        analyticsData,
        selectedPeriod,
        exportAnalytics,
        setSelectedPeriod,
        TIME_PERIODS
    } = useVocabularyAnalytics(cards, gameState.answers, gameHistory)

    const {
        getSharedVocabulary,
        updateSyncStatus
    } = useSharedData()

    // track if shared vocabulary has been initialized
    const sharedVocabInitialized = useRef(false)

    // Load daily words - efficient random selection
    useEffect(() => {
        if (vocabulary.length === 0) return
        
        const candidates = vocabulary.filter(word => ['A1', 'A2', 'B1', 'B2'].includes(word.level))
        const count = Math.min(candidates.length, 10)
        const selected = []
        const indices = new Set()
        
        while (selected.length < count) {
            const idx = Math.floor(Math.random() * candidates.length)
            if (!indices.has(idx)) {
                indices.add(idx)
                selected.push(candidates[idx])
            }
        }
        
        setDailyWords(selected)
    }, [vocabulary])

    // Load shared vocabulary data
    useEffect(() => {
        if (sharedVocabInitialized.current) return

        const loadSharedVocab = async () => {
            try {
                const sharedData = getSharedVocabulary('pdf')
                if (sharedData && sharedData.length > 0) {
                    sharedVocabInitialized.current = true
                    updateSyncStatus('vocabulary', 'synced')
                }
            } catch (error) {
                console.error('Error loading shared vocabulary:', error)
                updateSyncStatus('vocabulary', 'error')
            }
        }

        loadSharedVocab()
    }, [getSharedVocabulary, updateSyncStatus])

    // Word lookup function with enhanced features
    const lookupWord = useCallback(async (searchWord) => {
        const word = vocabulary.find(w => w.word.toLowerCase() === searchWord.toLowerCase())
        if (word) {
            setSelectedWord(word)

            // Add to spaced repetition system
            if (!cards[searchWord]) {
                addCard(searchWord)
            }

            // Add to lookup history
            setLookupHistory(prev => [word, ...prev.filter(w => w.word !== searchWord)].slice(0, 20))

            // Track progress
            trackProgress('vocabulary_lookup', searchWord, {
                definition: word.definition,
                arabic: word.arabic,
                level: word.level,
                category: word.category,
                timestamp: new Date().toISOString()
            })
        }
    }, [vocabulary, cards, addCard, trackProgress])

    // Enhanced pronunciation function
    const speakWord = useCallback(async (wordData, language = 'en-GB') => {
        if (!wordData) return
        
        // Normalize input
        const word = typeof wordData === 'string' ? { word: wordData } : wordData
        
        // Use pre-generated audio for English if available
        if (language === 'en' || language === 'en-US' || language === 'en-GB') {
            let audioSrc = word.audio
            
            // If no local audio, try to fetch from API
            if (!audioSrc) {
                try {
                    audioSrc = await fetchWordAudio(word.word)
                } catch (e) {
                    console.warn("Failed to fetch audio", e)
                }
            }

            if (audioSrc) {
                const audio = new window.Audio(audioSrc)
                // Use a promise to handle play() errors properly
                audio.play()
                    .then(() => {
                        trackProgress('pronunciation_practice', word.word, {
                            language,
                            method: 'audio-file',
                            timestamp: new Date().toISOString()
                        })
                    })
                    .catch(e => {
                        console.error("Audio playback error:", e)
                        // Fallback to TTS if audio playback fails
                        const voice = getEnglishVoice()
                        speak(word.word, { voice, rate: 0.8, lang: 'en-GB' })
                    })
                return
            }
        }

        // Fallback to synthesis for other languages or missing audio
        let voice
        let text

        switch (language) {
            case 'ar':
                voice = getArabicVoice()
                text = word.arabic || word.word
                break
            case 'en':
            case 'en-US':
            case 'en-GB':
                voice = getEnglishVoice()
                text = word.word
                break
            default:
                voice = getEnglishVoice()
                text = word.word
        }

        speak(text, {
            rate: 1.15,
            lang: language,
            voice,
            onStart: () => {
                trackProgress('pronunciation_practice', word.word, {
                    language,
                    method: 'synthesis',
                    timestamp: new Date().toISOString()
                })
            }
        })
    }, [speak, getArabicVoice, getEnglishVoice, trackProgress])

    // Handle speech recognition for pronunciation practice
    const handleSpeechRecognition = useCallback(() => {
        if (isListening) {
            stopListening()
            if (selectedWord && transcript) {
                const accuracy = calculatePronunciationAccuracy(selectedWord.word, transcript)
                trackProgress('pronunciation_attempt', selectedWord.word, {
                    transcript,
                    accuracy,
                    timestamp: new Date().toISOString()
                })
            }
        } else {
            resetTranscript()
            startListening()
        }
    }, [isListening, stopListening, startListening, resetTranscript, selectedWord, transcript, trackProgress])

    // Calculate pronunciation accuracy
    const calculatePronunciationAccuracy = (expected, actual) => {
        const expectedLower = expected.toLowerCase()
        const actualLower = actual.toLowerCase()

        if (expectedLower === actualLower) return 100

        // Simple similarity calculation
        const similarity = expectedLower.split('').filter(char => actualLower.includes(char)).length / expectedLower.length
        return Math.round(similarity * 100)
    }


    // Handle game answer submission
    const handleGameAnswer = useCallback((answer, timeTaken = 0) => {
        const result = submitAnswer(answer, timeTaken)
        if (result) {
            trackProgress('vocabulary_game_answer', currentGame, {
                isCorrect: result.isCorrect,
                points: result.points,
                timestamp: new Date().toISOString()
            })
        }
    }, [submitAnswer, currentGame, trackProgress])

    // Export vocabulary data
    const handleExport = useCallback((format = 'json') => {
        let data
        let filename

        if (activeTab === 'analytics') {
            data = exportAnalytics(format)
            filename = `vocabulary-analytics-${new Date().toISOString().split('T')[0]}.${format}`
        } else {
            data = exportResults(format)
            filename = `vocabulary-${new Date().toISOString().split('T')[0]}.${format}`
        }

        const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }, [activeTab, exportAnalytics, exportResults])

    // Render learn tab
    const renderLearnTab = () => (
        <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Search size={24} />
                    Advanced Word Lookup
                </h3>

                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <input
                        id="vocabulary-search"
                        name="vocabularySearch"
                        aria-label="Vocabulary search"
                        type="text"
                        className="input"
                        placeholder="Search English words or definitions..."
                        value={searchTerm}
                        onChange={(e) => searchVocabulary(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={20} />
                        Filters
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => handleExport('json')}
                    >
                        <Download size={20} />
                        Export
                    </button>
                </div>

                {showFilters && (
                    <div style={{
                        padding: 'var(--space-lg)',
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--space-md)'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                            <div>
                                <h4>Level</h4>
                                {getFilterOptions().levels.map(level => (
                                    <label key={level} style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>
                                        <input
                                            type="checkbox"
                                            checked={filters.level.includes(level)}
                                            onChange={(e) => {
                                                const newLevels = e.target.checked
                                                    ? [...filters.level, level]
                                                    : filters.level.filter(l => l !== level)
                                                setFilters({ ...filters, level: newLevels })
                                            }}
                                        />
                                        {level}
                                    </label>
                                ))}
                            </div>

                            <div>
                                <h4>Category</h4>
                                {getFilterOptions().categories.map(category => (
                                    <label key={category} style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>
                                        <input
                                            type="checkbox"
                                            checked={filters.category.includes(category)}
                                            onChange={(e) => {
                                                const newCategories = e.target.checked
                                                    ? [...filters.category, category]
                                                    : filters.category.filter(c => c !== category)
                                                setFilters({ ...filters, category: newCategories })
                                            }}
                                        />
                                        {category}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--space-md)' }}>
                            <button className="btn btn-secondary" onClick={clearFilters}>
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}

                {searchResults && searchResults.length > 0 && (
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
                            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                            {searchResults.slice(0, 12).map((word, idx) => {
                                const hi = word.hindi
                                const zh = word.chinese
                                const ur = word.urdu
                                return (
                                <div
                                    key={idx}
                                    className="card"
                                    onClick={() => lookupWord(word.word)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-xs)' }}>
                                        {word.word}
                                    </h4>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                        {word.definition}
                                    </p>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                        gap: '4px',
                                        fontSize: '12px',
                                        color: 'var(--color-text-tertiary)'
                                    }}>
                                        <div>AR: <span dir="rtl">{word.arabic || '—'}</span></div>
                                        <div>HI: {hi || '—'}</div>
                                        <div>ZH: {zh || '—'}</div>
                                        <div>UR: <span dir="rtl">{ur || '—'}</span></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                        <span className="badge" style={{ background: 'hsla(45, 93%, 47%, 0.2)' }}>
                                            {word.level}
                                        </span>
                                        <span className="badge" style={{ background: 'hsla(200, 93%, 47%, 0.2)' }}>
                                            {word.category}
                                        </span>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                )}
            </div>

            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Clock size={24} />
                    Daily Vocabulary Challenge
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
                    {dailyWords.map((word, idx) => (
                        <div key={idx} className="card" style={{ textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                {word.word}
                            </h4>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                {word.definition}
                            </p>
                            <div style={{ marginTop: 'var(--space-sm)' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => lookupWord(word.word)}
                                    style={{ fontSize: 'var(--font-sm)' }}
                                >
                                    Learn
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <VocabularyCalendar progress={progress?.vocabulary || []} />
        </div>
    )

    const renderCategoryTab = (category, icon, title) => (
        <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    {icon}
                    {title}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                    {vocabulary.filter(w => w.category?.toLowerCase() === category.toLowerCase()).map((word, idx) => (
                        <div key={idx} className="card" style={{ cursor: 'pointer' }}>
                            <div onClick={() => lookupWord(word.word)}>
                                <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                    {word.word}
                                </h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                    <span className="badge" style={{ background: 'hsla(45, 93%, 47%, 0.2)', fontSize: '10px' }}>
                                        {word.level}
                                    </span>
                                    {(() => {
                                        const hi = word.hindi
                                        const zh = word.chinese
                                        const ur = word.urdu
                                        return (
                                    <div style={{ display: 'grid', gap: '2px', textAlign: 'right' }}>
                                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)', fontWeight: 'bold' }} dir="rtl">
                                            {word.arabic || '—'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'left' }}>
                                            HI: {hi || '—'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'left' }}>
                                            ZH: {zh || '—'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }} dir="rtl">
                                            {ur || '—'}
                                        </div>
                                    </div>
                                        )
                                    })()}
                                </div>
                            </div>
                            {/* Voice and Translate Icons */}
                            <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border)' }}>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        speakWord(word, 'en-GB')
                                    }}
                                    title="Listen to English pronunciation"
                                    style={{ flex: 1, padding: 'var(--space-xs)', fontSize: 'var(--font-xs)' }}
                                >
                                    <Volume2 size={16} />
                                    Read
                                </button>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        speakWord({ ...word, word: word.arabic }, 'ar-SA')
                                    }}
                                    title="Listen to Arabic translation"
                                    style={{ flex: 1, padding: 'var(--space-xs)', fontSize: 'var(--font-xs)' }}
                                >
                                    <Globe size={16} />
                                    Translate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {vocabulary.filter(w => w.category?.toLowerCase() === category.toLowerCase()).length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-xl)' }}>
                        No words found in this category yet.
                    </p>
                )}
            </div>
        </div>
    )

    const renderAnalyticsTab = () => (
        <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <div className="card">
                <h3>Learning Analytics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                    <div>
                        <h4>Total Words</h4>
                        <div>{analyticsData.overview?.totalWords || 0}</div>
                    </div>
                </div>
            </div>
        </div>
    )


    const renderTabContent = () => {
        switch (activeTab) {
            case 'learn': return renderLearnTab()
            case 'sports': return renderCategoryTab('sports', <Target size={24} />, 'IELTS Sports Vocabulary')
            case 'crimes': return renderCategoryTab('crimes', <ShieldAlert size={24} />, 'Crime & Law Vocabulary')
            case 'food': return renderCategoryTab('restaurants-food', <Utensils size={24} />, 'Restaurants & Food')
            case 'cloths': return renderCategoryTab('cloths', <Shirt size={24} />, 'Clothes & Apparel')
            case 'health': return renderCategoryTab('health-state', <HeartPulse size={24} />, 'Health & Wellbeing')
            case 'faith': return renderCategoryTab('faith', <Sparkles size={24} />, 'Faith & Beliefs')
            case 'travel': return renderCategoryTab('travel', <Globe size={24} />, 'Travel Vocabulary')
            case 'technology': return renderCategoryTab('technology', <Zap size={24} />, 'Technology Vocabulary')
            case 'economy': return renderCategoryTab('economy', <TrendingUp size={24} />, 'Economy & Business')
            case 'environment': return renderCategoryTab('environment', <Globe size={24} />, 'Environment & Nature')
            default: return renderLearnTab()
        }
    }

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
            <header>
                <h1>IELTS Vocabulary Hub</h1>
                <h2 style={{ marginTop: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Advanced Vocabulary System</h2>
            </header>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
                {[
                    { id: 'learn', label: 'LEARN' },
                    { id: 'sports', label: 'SPORTS' },
                    { id: 'crimes', label: 'CRIMES' },
                    { id: 'food', label: 'FOOD' },
                    { id: 'cloths', label: 'CLOTHS' },
                    { id: 'health', label: 'HEALTH' },
                    { id: 'faith', label: 'FAITH' },
                    { id: 'travel', label: 'TRAVEL' },
                    { id: 'technology', label: 'TECH' },
                    { id: 'economy', label: 'ECONOMY' },
                    { id: 'environment', label: 'ENV' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ fontSize: '12px', padding: 'var(--space-sm) var(--space-md)' }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {selectedWord && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)', border: '2px solid var(--color-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', margin: 0 }}>
                            <Globe size={24} />
                            Word Focus: {selectedWord.word}
                        </h3>
                        <button className="btn btn-ghost" onClick={() => setSelectedWord(null)}>
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
                        <div>
                            <h4>English</h4>
                            <div style={{
                                fontSize: 'var(--font-2xl)',
                                fontWeight: 'var(--font-bold)',
                                color: 'var(--color-primary)',
                            }}>
                                {selectedWord.word}
                            </div>
                            <p style={{ color: 'var(--color-text-secondary)' }}>[{selectedWord.pronunciation}]</p>
                        </div>

                        <div>
                            <h4>Definition</h4>
                            <p style={{ fontSize: 'var(--font-md)' }}>{selectedWord.definition}</p>
                        </div>

                        <div>
                            <h4>Arabic</h4>
                            <div style={{ display: 'grid', gap: '6px' }}>
                                <div style={{ fontSize: 'var(--font-lg)', textAlign: 'right' }} dir="rtl">{selectedWord.arabic || '—'}</div>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>Hindi: {selectedWord.hindi || '—'}</div>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>Chinese: {selectedWord.chinese || '—'}</div>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)', textAlign: 'right' }} dir="rtl">Urdu: {selectedWord.urdu || '—'}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => speakWord(selectedWord)}>
                            <Volume2 size={20} />
                            Listen Word
                        </button>
                    </div>
                </div>
            )}

            {renderTabContent()}

            {gameState.gameActive && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <VocabularyGame
                            game={gameState}
                            onAnswer={handleGameAnswer}
                            speakWord={speakWord}
                            vocabulary={vocabulary}
                        />
                        <button onClick={() => endGame()}>Close Game</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Vocabulary
