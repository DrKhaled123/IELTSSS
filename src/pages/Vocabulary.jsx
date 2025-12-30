import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Search, Brain, BookOpen, Volume2, RefreshCw, Globe, Star, TrendingUp,
    Award, Clock, Filter, Download, Upload, Play, Mic, BarChart3,
    FileText, Zap, Target, Users, Calendar, ChevronDown, X, Check,
    AlertCircle, TrendingDown, Settings, Gamepad2, Headphones, MessageSquare,
    Sparkles, Lightbulb
} from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useSpacedRepetition } from '../hooks/useSpacedRepetition'
import { usePDFVocabularyExtractor } from '../hooks/usePDFVocabularyExtractor'
import { useVocabularyGames } from '../hooks/useVocabularyGames'
import { useVocabularySearch } from '../hooks/useVocabularySearch'
import { useVocabularyAnalytics } from '../hooks/useVocabularyAnalytics'
import { useSharedData } from '../hooks/useSharedData'

// Import vocabulary database
import vocabularyDatabase from '../data/vocabulary-database.json'
import VocabularyCalendar from '../components/VocabularyCalendar'
import AIWordSuggestions from '../components/AIWordSuggestions'

export default function Vocabulary() {
    // State management
    const [activeTab, setActiveTab] = useState('learn')
    const [selectedWord, setSelectedWord] = useState(null)
    const [lookupHistory, setLookupHistory] = useState([])
    const [dailyWords, setDailyWords] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [showPDFUpload, setShowPDFUpload] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    // Custom hooks
    const { speak, getGermanVoice, getArabicVoice, getEnglishVoice } = useSpeechSynthesis()
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
    const {
        extractedVocabulary,
        isExtracting,
        extractionProgress,
        extractFromPDF,
        exportVocabulary: exportPDFVocabulary,
        separateContentByLanguage // Add this
    } = usePDFVocabularyExtractor()
    const [separatedContent, setSeparatedContent] = useState(null) // New state
    const {
        gameState,
        currentGame,
        gameHistory,
        achievements,
        startGame,
        submitAnswer,
        endGame,
        getGameStatistics,
        GAME_TYPES,
        GAME_DIFFICULTIES
    } = useVocabularyGames(vocabularyDatabase.vocabulary)
    const {
        searchTerm,
        searchResults,
        isSearching,
        searchHistory,
        filters,
        sortBy,
        sortOrder,
        searchOptions,
        searchVocabulary,
        setFilters,
        clearFilters,
        clearSearch,
        getFilterOptions,
        exportResults,
        SEARCH_OPTIONS,
        FILTER_CATEGORIES,
        SORT_OPTIONS
    } = useVocabularySearch(vocabularyDatabase.vocabulary, cards)
    const {
        analyticsData,
        selectedPeriod,
        isLoading: analyticsLoading,
        exportAnalytics,
        setSelectedPeriod,
        TIME_PERIODS
    } = useVocabularyAnalytics(cards, gameState.answers, gameHistory)

    const {
        getSharedVocabulary,
        addSharedVocabulary,
        updateSyncStatus
    } = useSharedData()
    const [sharedVocabularyList, setSharedVocabularyList] = useState([])

    // Initialize vocabulary database
    const vocabulary = useMemo(() => vocabularyDatabase.vocabulary || [], [])

    // Load daily words
    useEffect(() => {
        const today = new Date().toDateString()
        const daily = vocabulary
            .filter(word => word.level === 'A1' || word.level === 'A2')
            .sort(() => Math.random() - 0.5)
            .slice(0, 5)
        setDailyWords(daily)
    }, [vocabulary])



    // Load shared vocabulary from PDF extraction
    useEffect(() => {
        const loadSharedVocabularyData = async () => {
            try {
                const sharedVocabData = getSharedVocabulary('pdf')
                if (sharedVocabData && sharedVocabData.length > 0) {
                    setSharedVocabularyList(sharedVocabData)

                    // Add shared vocabulary to spaced repetition system
                    sharedVocabData.forEach(word => {
                        if (!cards[word.german]) {
                            addCard(word.german)
                        }
                    })

                    updateSyncStatus('vocabulary', 'synced')
                }
            } catch (error) {
                console.error('Error loading shared vocabulary:', error)
                updateSyncStatus('vocabulary', 'error')
            }
        }

        loadSharedVocabularyData()
    }, [getSharedVocabulary, addCard, updateSyncStatus]) // Removed cards to prevent infinite loops

    // Word lookup function with enhanced features
    const lookupWord = useCallback(async (germanWord) => {
        const word = vocabulary.find(w => w.german.toLowerCase() === germanWord.toLowerCase())
        if (word) {
            setSelectedWord(word)

            // Add to spaced repetition system
            if (!cards[germanWord]) {
                addCard(germanWord)
            }

            // Add to lookup history
            setLookupHistory(prev => [word, ...prev.filter(w => w.german !== germanWord)].slice(0, 20))

            // Track progress
            trackProgress('vocabulary_lookup', germanWord, {
                english: word.english,
                arabic: word.arabic,
                level: word.level,
                category: word.category,
                timestamp: new Date().toISOString()
            })
        }
    }, [vocabulary, cards, addCard, trackProgress])

    // Enhanced pronunciation function
    const speakWord = useCallback((word, language = 'de-DE') => {
        if (word) {
            let voice
            let text

            switch (language) {
                case 'de-DE':
                    voice = getGermanVoice()
                    text = word.german
                    break
                case 'ar':
                    voice = getArabicVoice()
                    text = word.arabic
                    break
                case 'en':
                    voice = getEnglishVoice()
                    text = word.english
                    break
                default:
                    voice = getGermanVoice()
                    text = word.german
            }

            speak(text, {
                rate: 0.8,
                lang: language,
                voice,
                onStart: () => {
                    trackProgress('pronunciation_practice', word.german, {
                        language,
                        timestamp: new Date().toISOString()
                    })
                }
            })
        }
    }, [speak, getGermanVoice, getArabicVoice, getEnglishVoice, trackProgress])

    // Handle speech recognition for pronunciation practice
    const handleSpeechRecognition = useCallback(() => {
        if (isListening) {
            stopListening()
            if (selectedWord && transcript) {
                const accuracy = calculatePronunciationAccuracy(selectedWord.german, transcript)
                trackProgress('pronunciation_attempt', selectedWord.german, {
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

    // Handle PDF upload
    // Handle PDF upload
    const handlePDFUpload = useCallback(async (event) => {
        const file = event.target.files[0]
        if (!file) return

        try {
            const result = await extractFromPDF(file)

            if (result && result.vocabulary) {
                // Add extracted words to spaced repetition
                result.vocabulary.forEach(word => {
                    if (!cards[word.german]) {
                        addCard(word.german)
                    }
                })

                trackProgress('pdf_vocabulary_extracted', file.name, {
                    wordsExtracted: result.vocabulary.length,
                    timestamp: new Date().toISOString()
                })
            }

            // Separate content if full text is available
            if (result && result.pdfInfo && result.pdfInfo.fullText) {
                const separated = separateContentByLanguage(result.pdfInfo.fullText)
                setSeparatedContent(separated)
            }

            setShowPDFUpload(false)
        } catch (error) {
            console.error('PDF processing failed:', error)
        }
    }, [extractFromPDF, cards, addCard, trackProgress])

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

    // Render tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'learn':
                return renderLearnTab()
            case 'ai':
                return renderAISuggestionsTab()
            case 'games':
                return renderGamesTab()
            case 'spaced':
                return renderSpacedRepetitionTab()
            case 'analytics':
                return renderAnalyticsTab()
            case 'pdf':
                return renderPDFTab()
            default:
                return renderLearnTab()
        }
    }

    // Render learn tab
    const renderLearnTab = () => (
        <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            {/* Search Interface */}
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Search size={24} />
                    Advanced Word Lookup
                </h3>

                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search German words or translations..."
                        value={searchTerm}
                        onChange={(e) => searchVocabulary(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => showFilters ? setShowFilters(false) : setShowFilters(true)}
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

                {/* Filters Panel */}
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

                {/* Search Results */}
                {searchResults && searchResults.length > 0 && (
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
                            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                            {searchResults.slice(0, 12).map((word, idx) => (
                                <div
                                    key={idx}
                                    className="card"
                                    onClick={() => lookupWord(word.german)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-xs)' }}>
                                        {word.searchHighlight?.german || word.german}
                                    </h4>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                        {word.searchHighlight?.english || word.english} • {word.arabic}
                                    </p>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                        <span className="badge" style={{ background: 'hsla(45, 93%, 47%, 0.2)' }}>
                                            {word.level}
                                        </span>
                                        <span className="badge" style={{ background: 'hsla(200, 93%, 47%, 0.2)' }}>
                                            {word.category}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Word Details */}
            {selectedWord && (
                <div className="card animate-fadeIn">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Globe size={24} />
                        Word Details
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                        <div>
                            <h4>German</h4>
                            <div style={{
                                fontSize: 'var(--font-2xl)',
                                fontWeight: 'var(--font-bold)',
                                color: 'var(--color-primary)',
                                marginBottom: 'var(--space-md)'
                            }}>
                                {selectedWord.german}
                            </div>
                            <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                                [{selectedWord.pronunciation}]
                            </p>
                            {selectedWord.ipa && (
                                <p style={{ fontSize: 'var(--font-md)', color: 'var(--color-text-tertiary)' }}>
                                    IPA: {selectedWord.ipa}
                                </p>
                            )}
                        </div>

                        <div>
                            <h4>English</h4>
                            <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text)' }}>
                                {selectedWord.english}
                            </p>
                        </div>

                        <div>
                            <h4>Arabic</h4>
                            <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text)', textAlign: 'right' }}>
                                {selectedWord.arabic}
                            </p>
                        </div>
                    </div>

                    {/* Examples */}
                    {selectedWord.examples && (
                        <div style={{
                            marginTop: 'var(--space-lg)',
                            padding: 'var(--space-lg)',
                            background: 'var(--color-bg-elevated)',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            <h4>Examples</h4>
                            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                <div>
                                    <h5>German</h5>
                                    {selectedWord.examples.german?.map((example, idx) => (
                                        <p key={idx} style={{ fontStyle: 'italic' }}>{example}</p>
                                    ))}
                                </div>
                                <div>
                                    <h5>English</h5>
                                    {selectedWord.examples.english?.map((example, idx) => (
                                        <p key={idx} style={{ fontStyle: 'italic' }}>{example}</p>
                                    ))}
                                </div>
                                <div>
                                    <h5>Arabic</h5>
                                    {selectedWord.examples.arabic?.map((example, idx) => (
                                        <p key={idx} style={{ fontStyle: 'italic', textAlign: 'right' }}>{example}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mnemonic & Memorization Aids */}
                    {(selectedWord.mnemonic || selectedWord.visual_cue || selectedWord.memory_hook) && (
                        <div style={{
                            marginTop: 'var(--space-lg)',
                            padding: 'var(--space-lg)',
                            background: 'var(--gradient-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'white'
                        }}>
                            <h4 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <Brain size={20} />
                                Memorization Aids
                            </h4>

                            <div style={{ display: 'grid', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                {selectedWord.mnemonic && (
                                    <div>
                                        <h5 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--font-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mnemonic</h5>
                                        <p style={{ fontSize: 'var(--font-lg)', fontWeight: 'bold' }}>{selectedWord.mnemonic}</p>
                                    </div>
                                )}

                                {selectedWord.visual_cue && (
                                    <div>
                                        <h5 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--font-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visual Cue</h5>
                                        <p>{selectedWord.visual_cue}</p>
                                    </div>
                                )}

                                {selectedWord.memory_hook && (
                                    <div>
                                        <h5 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--font-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Memory Hook</h5>
                                        <p style={{ fontStyle: 'italic' }}>"{selectedWord.memory_hook}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pronunciation Practice */}
                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                        <button className="btn btn-primary" onClick={() => speakWord(selectedWord)}>
                            <Volume2 size={20} />
                            German
                        </button>
                        <button className="btn btn-secondary" onClick={() => speakWord(selectedWord, 'en')}>
                            <Volume2 size={20} />
                            English
                        </button>
                        <button className="btn btn-secondary" onClick={() => speakWord(selectedWord, 'ar')}>
                            <Volume2 size={20} />
                            Arabic
                        </button>

                        {speechRecognitionSupported && (
                            <button
                                className={`btn ${isListening ? 'btn-danger' : 'btn-accent'}`}
                                onClick={handleSpeechRecognition}
                            >
                                <Mic size={20} />
                                {isListening ? 'Stop Recording' : 'Practice Pronunciation'}
                            </button>
                        )}
                    </div>

                    {isListening && (
                        <div style={{
                            marginTop: 'var(--space-md)',
                            padding: 'var(--space-md)',
                            background: 'var(--color-bg-elevated)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <p>Listening... Say: "{selectedWord.german}"</p>
                            {transcript && (
                                <p>You said: "{transcript}"</p>
                            )}
                        </div>
                    )}

                    <div style={{ marginTop: 'var(--space-md)' }}>
                        <button className="btn btn-secondary" onClick={() => setSelectedWord(null)}>
                            <RefreshCw size={20} />
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Daily Words */}
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Clock size={24} />
                    Daily Vocabulary Challenge
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    5 essential words for today ({new Date().toLocaleDateString()})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
                    {dailyWords.map((word, idx) => (
                        <div key={idx} className="card" style={{ textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                {word.german}
                            </h4>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                {word.english}
                            </p>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>
                                {word.arabic}
                            </p>
                            <div style={{ marginTop: 'var(--space-sm)' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => lookupWord(word.german)}
                                    style={{ fontSize: 'var(--font-sm)' }}
                                >
                                    Learn
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Vocabulary Calendar */}
            <VocabularyCalendar progress={progress?.vocabulary || []} />
        </div>
    )


    // Render games tab
    const renderGamesTab = () => (
        <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Gamepad2 size={24} />
                    Vocabulary Games
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
                    <button
                        className="btn btn-accent"
                        onClick={() => startGame(GAME_TYPES.FLASHCARD, GAME_DIFFICULTIES.EASY)}
                        style={{ textAlign: 'center', padding: 'var(--space-xl)' }}
                    >
                        <BookOpen size={24} />
                        <div>Flashcards</div>
                        <small style={{ display: 'block', marginTop: 'var(--space-xs)' }}>Memory practice</small>
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={() => startGame(GAME_TYPES.QUIZ, GAME_DIFFICULTIES.EASY)}
                        style={{ textAlign: 'center', padding: 'var(--space-xl)' }}
                    >
                        <Brain size={24} />
                        <div>Quick Quiz</div>
                        <small style={{ display: 'block', marginTop: 'var(--space-xs)' }}>Test your knowledge</small>
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={() => startGame(GAME_TYPES.MATCHING, GAME_DIFFICULTIES.EASY)}
                        style={{ textAlign: 'center', padding: 'var(--space-xl)' }}
                    >
                        <Target size={24} />
                        <div>Matching</div>
                        <small style={{ display: 'block', marginTop: 'var(--space-xs)' }}>Match words</small>
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={() => startGame(GAME_TYPES.TYPING, GAME_DIFFICULTIES.EASY)}
                        style={{ textAlign: 'center', padding: 'var(--space-xl)' }}
                    >
                        <MessageSquare size={24} />
                        <div>Typing</div>
                        <small style={{ display: 'block', marginTop: 'var(--space-xs)' }}>Type translations</small>
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={() => startGame(GAME_TYPES.LISTENING, GAME_DIFFICULTIES.EASY)}
                        style={{ textAlign: 'center', padding: 'var(--space-xl)' }}
                    >
                        <Headphones size={24} />
                        <div>Listening</div>
                        <small style={{ display: 'block', marginTop: 'var(--space-xs)' }}>Listen and identify</small>
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={() => startGame(GAME_TYPES.SPEAKING, GAME_DIFFICULTIES.EASY)}
                        style={{ textAlign: 'center', padding: 'var(--space-xl)' }}
                    >
                        <Mic size={24} />
                        <div>Speaking</div>
                        <small style={{ display: 'block', marginTop: 'var(--space-xs)' }}>Pronounce words</small>
                    </button>
                </div>
            </div>

            {/* Game Statistics */}
            {gameHistory.length > 0 && (
                <div className="card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <BarChart3 size={24} />
                        Game Statistics
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                        <div>
                            <h4>Games Played</h4>
                            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                                {gameHistory.length}
                            </div>
                        </div>

                        <div>
                            <h4>Average Score</h4>
                            <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-success)' }}>
                                {Math.round(gameHistory.reduce((sum, game) => sum + game.score, 0) / gameHistory.length)}
                            </div>
                        </div>

                        <div>
                            <h4>Best Score</h4>
                            <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-warning)' }}>
                                {Math.max(...gameHistory.map(game => game.score))}
                            </div>
                        </div>

                        <div>
                            <h4>Achievements</h4>
                            <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-accent)' }}>
                                {achievements.length}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    // Render spaced repetition tab
    const renderSpacedRepetitionTab = () => (
        <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Zap size={24} />
                    Spaced Repetition System
                </h3>

                {dueCards.length > 0 ? (
                    <div>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            {dueCards.length} words due for review
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                            {dueCards.slice(0, 6).map((card, idx) => (
                                <div key={idx} className="card">
                                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                        {card.german}
                                    </h4>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                        {card.english}
                                    </p>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                        <span className="badge" style={{ background: 'hsla(45, 93%, 47%, 0.2)' }}>
                                            Level {card.level}
                                        </span>
                                        <span className="badge" style={{ background: 'hsla(200, 93%, 47%, 0.2)' }}>
                                            Streak: {card.streak}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: 'var(--space-md)' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                reviewCard(card.german, 4) // Assume good recall
                                                setSelectedWord(card)
                                            }}
                                        >
                                            Review
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <Check size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-lg)' }} />
                        <h3>All Caught Up!</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            No words due for review right now. Check back later!
                        </p>
                    </div>
                )}
            </div>

            {/* Spaced Repetition Statistics */}
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <BarChart3 size={24} />
                    Learning Statistics
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                    <div>
                        <h4>Total Cards</h4>
                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                            {spacedRepetitionStats.totalCards}
                        </div>
                    </div>

                    <div>
                        <h4>Mastered</h4>
                        <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-success)' }}>
                            {spacedRepetitionStats.masteredCards}
                        </div>
                    </div>

                    <div>
                        <h4>Review Accuracy</h4>
                        <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-warning)' }}>
                            {spacedRepetitionStats.accuracy}%
                        </div>
                    </div>

                    <div>
                        <h4>Longest Streak</h4>
                        <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-accent)' }}>
                            {spacedRepetitionStats.longestStreak}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    // Render analytics tab
    const renderAnalyticsTab = () => (
        <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <BarChart3 size={24} />
                    Learning Analytics
                </h3>

                {/* Period Selector */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <select
                        className="input"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        style={{ marginRight: 'var(--space-md)' }}
                    >
                        <option value={TIME_PERIODS.TODAY}>Today</option>
                        <option value={TIME_PERIODS.WEEK}>This Week</option>
                        <option value={TIME_PERIODS.MONTH}>This Month</option>
                        <option value={TIME_PERIODS.QUARTER}>This Quarter</option>
                        <option value={TIME_PERIODS.YEAR}>This Year</option>
                        <option value={TIME_PERIODS.ALL_TIME}>All Time</option>
                    </select>

                    <button className="btn btn-secondary" onClick={() => handleExport('csv')}>
                        <Download size={20} />
                        Export Analytics
                    </button>
                </div>

                {/* Overview Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                    <div>
                        <h4>Total Words</h4>
                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                            {analyticsData.overview?.totalWords || 0}
                        </div>
                    </div>

                    <div>
                        <h4>Mastered Words</h4>
                        <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-success)' }}>
                            {analyticsData.overview?.masteredWords || 0}
                        </div>
                    </div>

                    <div>
                        <h4>Mastery Rate</h4>
                        <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-warning)' }}>
                            {analyticsData.overview?.masteryRate || 0}%
                        </div>
                    </div>

                    <div>
                        <h4>Study Streak</h4>
                        <div style={{ fontSize: 'var(--font-xl)', color: 'var(--color-accent)' }}>
                            {analyticsData.overview?.studyStreak || 0} days
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                {analyticsData.recommendations && analyticsData.recommendations.length > 0 && (
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        <h4>Recommendations</h4>
                        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                            {analyticsData.recommendations.slice(0, 3).map((rec, idx) => (
                                <div key={idx} style={{
                                    padding: 'var(--space-md)',
                                    background: 'var(--color-bg-elevated)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `4px solid ${rec.priority === 'high' ? 'var(--color-danger)' :
                                        rec.priority === 'medium' ? 'var(--color-warning)' :
                                            'var(--color-info)'
                                        }`
                                }}>
                                    <h5>{rec.title}</h5>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                        {rec.description}
                                    </p>
                                    <button className="btn btn-secondary" style={{ fontSize: 'var(--font-sm)' }}>
                                        {rec.action}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Achievements */}
            {analyticsData.achievements && analyticsData.achievements.length > 0 && (
                <div className="card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Award size={24} />
                        Achievements
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
                        {analyticsData.achievements.slice(0, 6).map((achievement, idx) => (
                            <div key={idx} style={{
                                padding: 'var(--space-md)',
                                textAlign: 'center',
                                background: 'var(--color-bg-elevated)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ fontSize: 'var(--font-2xl)', marginBottom: 'var(--space-sm)' }}>
                                    {achievement.icon}
                                </div>
                                <h5>{achievement.title}</h5>
                                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                    {achievement.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    // Render PDF tab
    const renderPDFTab = () => (
        <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <FileText size={24} />
                    PDF Vocabulary Extraction
                </h3>

                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePDFUpload}
                        style={{ display: 'none' }}
                        id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="btn btn-primary">
                        <Upload size={20} />
                        Upload German PDF
                    </label>
                </div>

                {isExtracting && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <div className="animate-spin" style={{ marginBottom: 'var(--space-lg)' }}>
                            <RefreshCw size={48} />
                        </div>
                        <p>Extracting vocabulary and separating content... {extractionProgress.toFixed(0)}%</p>
                    </div>
                )}

                {separatedContent && (
                    <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <BookOpen size={24} />
                            Bilingual Content Split
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                            Intelligent separation of German and English content from your PDF.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', height: '500px' }}>
                            {/* German Column */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'var(--color-bg-elevated)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: 'var(--space-md)',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    position: 'sticky',
                                    top: 0
                                }}>
                                    German Content ({separatedContent.germanBlocks.length} blocks)
                                </div>
                                <div style={{ padding: 'var(--space-md)', overflowY: 'auto', flex: 1 }}>
                                    {separatedContent.germanBlocks.map((block, idx) => (
                                        <div key={idx} style={{ marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-md)', borderBottom: '1px dashed var(--color-border)' }}>
                                            {block}
                                        </div>
                                    ))}
                                    {separatedContent.germanBlocks.length === 0 && <p style={{ fontStyle: 'italic', color: 'var(--color-text-tertiary)' }}>No clear German blocks found.</p>}
                                </div>
                            </div>

                            {/* English Column */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'var(--color-bg-elevated)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: 'var(--space-md)',
                                    background: 'var(--color-secondary)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    position: 'sticky',
                                    top: 0
                                }}>
                                    English Content ({separatedContent.englishBlocks.length} blocks)
                                </div>
                                <div style={{ padding: 'var(--space-md)', overflowY: 'auto', flex: 1 }}>
                                    {separatedContent.englishBlocks.map((block, idx) => (
                                        <div key={idx} style={{ marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-md)', borderBottom: '1px dashed var(--color-border)' }}>
                                            {block}
                                        </div>
                                    ))}
                                    {separatedContent.englishBlocks.length === 0 && <p style={{ fontStyle: 'italic', color: 'var(--color-text-tertiary)' }}>No clear English blocks found.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {extractedVocabulary.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h4>Extracted Vocabulary ({extractedVocabulary.length} words)</h4>
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleExport('json')}
                            >
                                <Download size={20} />
                                Export
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                            {extractedVocabulary.slice(0, 9).map((word, idx) => (
                                <div key={idx} className="card">
                                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                        {word.german}
                                    </h4>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                        {word.english}
                                    </p>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                        <span className="badge" style={{ background: 'hsla(45, 93%, 47%, 0.2)' }}>
                                            {word.level}
                                        </span>
                                        <span className="badge" style={{ background: 'hsla(200, 93%, 47%, 0.2)' }}>
                                            {word.category}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: 'var(--space-md)' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => lookupWord(word.german)}
                                            style={{ fontSize: 'var(--font-sm)' }}
                                        >
                                            Learn
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
            <header style={{ marginBottom: 'var(--space-2xl)' }}>
                <h1>Advanced Vocabulary System</h1>
                <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                    German to Arabic/English translations with interactive learning features
                </p>
            </header>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-xs)',
                marginBottom: 'var(--space-xl)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 'var(--space-sm)'
            }}>
                {[
                    { id: 'learn', label: 'Learn', icon: BookOpen },
                    { id: 'ai', label: 'AI Suggestions', icon: Sparkles, badge: 'NEW' },
                    { id: 'games', label: 'Games', icon: Gamepad2 },
                    { id: 'spaced', label: 'Spaced Repetition', icon: Zap },
                    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                    { id: 'pdf', label: 'PDF Tools', icon: FileText }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-md) var(--space-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {tab.badge && (
                            <span style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                marginLeft: '8px'
                            }}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {renderTabContent()}

            {/* Game Modal */}
            {gameState.gameActive && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'var(--color-bg-overlay)',
                    zIndex: 'var(--z-modal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--space-2xl)',
                        maxWidth: '800px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3>
                                {gameState.type === GAME_TYPES.FLASHCARD && 'Flashcard Practice'}
                                {gameState.type === GAME_TYPES.QUIZ && 'Quiz Time'}
                                {gameState.type === GAME_TYPES.MATCHING && 'Matching Game'}
                                {gameState.type === GAME_TYPES.TYPING && 'Typing Challenge'}
                                {gameState.type === GAME_TYPES.LISTENING && 'Listening Test'}
                                {gameState.type === GAME_TYPES.SPEAKING && 'Speaking Practice'}
                            </h3>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-bold)' }}>
                                        {gameState.score}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                        Score
                                    </div>
                                </div>
                                <button className="btn btn-secondary" onClick={() => endGame()}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <VocabularyGame
                            game={gameState}
                            onAnswer={handleGameAnswer}
                            speakWord={speakWord}
                            vocabulary={vocabulary}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// Enhanced Vocabulary Game Component
function VocabularyGame({ game, onAnswer, speakWord, vocabulary }) {
    const [selectedAnswer, setSelectedAnswer] = useState('')
    const [startTime, setStartTime] = useState(Date.now())
    const [isFlipped, setIsFlipped] = useState(false)

    const currentQuestion = game.questions[game.currentQuestion]

    if (!currentQuestion) return null

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

    switch (game.type) {
        case 'flashcard':
            return (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <div style={{
                        width: '350px',
                        height: '250px',
                        margin: '0 auto',
                        perspective: '1000px'
                    }}>
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                transformStyle: 'preserve-3d',
                                transition: 'transform 0.6s',
                                cursor: 'pointer'
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
                                gap: 'var(--space-md)'
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
                        marginBottom: 'var(--space-xl)'
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
                        Match German words with their English translations
                    </h3>

                    <div style={{ marginBottom: 'var(--space-xl)' }}>
                        {/* German words */}
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <h4>German</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
                                {currentQuestion.pairs.map((pair, idx) => (
                                    <div key={idx} className="card" style={{ padding: 'var(--space-md)' }}>
                                        {pair.german}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* English words */}
                        <div>
                            <h4>English</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
                                {currentQuestion.shuffledPairs.map((pair, idx) => (
                                    <div key={idx} className="card" style={{ padding: 'var(--space-md)' }}>
                                        {pair.english}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => handleSubmit(selectedAnswer)}>
                            Check Answers
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
}