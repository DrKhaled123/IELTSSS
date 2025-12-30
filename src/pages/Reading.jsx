import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
    BookOpen,
    Volume2,
    Play,
    Pause,
    Languages,
    HelpCircle,
    Settings,
    Bookmark,
    BookmarkCheck,
    RotateCcw,
    SkipForward,
    SkipBack,
    Gauge,
    Clock,
    TrendingUp,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    FileText,
    Brain,
    Award,
    Target,
    Zap,
    Loader2
} from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import BilingualContainer from '../components/BilingualContainer'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { usePDFReader } from '../hooks/usePDFReader'
import { useSharedData } from '../hooks/useSharedData'
import passages from '../data/reading-passages.json'

// Reading modes
const READING_MODES = {
    CONTINUOUS: 'continuous',
    SENTENCE: 'sentence',
    WORD: 'word'
}

// Repeat modes
const REPEAT_MODES = {
    NONE: 'none',
    PARAGRAPH: 'paragraph',
    SENTENCE: 'sentence',
    PASSAGE: 'passage'
}

export default function Reading() {
    // Core reading state
    const [selectedPassage, setSelectedPassage] = useState(null)
    const [showArabic, setShowArabic] = useState(false)
    const [showAnswers, setShowAnswers] = useState(false)
    const [readingWord, setReadingWord] = useState(-1)
    const [readingSentence, setReadingSentence] = useState(-1)
    const [readingParagraph, setReadingParagraph] = useState(-1)

    // Speech synthesis
    const {
        supported,
        voices,
        speaking,
        currentWordIndex,
        speak,
        speakWithHighlighting,
        speakBySentences,
        cancel,
        pause,
        resume,
        getGermanVoice,
        getArabicVoice,
        getEnglishVoice
    } = useSpeechSynthesis()
    const { trackProgress, getProgressStats } = useProgressTracking()
    const { sharedData, addSharedReading, getSharedReading, updateSyncStatus } = useSharedData()

    // Reading controls
    const [readingSpeed, setReadingSpeed] = useState(1.0)
    const [readingMode, setReadingMode] = useState(READING_MODES.CONTINUOUS)
    const [repeatMode, setRepeatMode] = useState(REPEAT_MODES.NONE)
    const [isPaused, setIsPaused] = useState(false)
    const [currentPosition, setCurrentPosition] = useState(0)

    // Vocabulary lookup
    const [selectedWord, setSelectedWord] = useState(null)
    const [lookupHistory, setLookupHistory] = useState([])
    const [showVocabularyModal, setShowVocabularyModal] = useState(false)

    // PDF integration
    const {
        pdfContent,
        isLoading: pdfLoading,
        error: pdfError,
        currentPage,
        totalPages,
        currentPageText,
        processPDFContent,
        nextPage,
        previousPage,
        goToPage,
        extractVocabulary,
        clearPDF
    } = usePDFReader()
    const [showPDFModal, setShowPDFModal] = useState(false)
    const [isReadingPDF, setIsReadingPDF] = useState(false)
    const [availablePDFContent, setAvailablePDFContent] = useState([])

    // Analytics
    const [readingStats, setReadingStats] = useState({
        startTime: null,
        totalWordsRead: 0,
        wordsPerMinute: 0,
        comprehensionScore: 0,
        timeSpent: 0
    })

    // Bookmarks
    const [bookmarks, setBookmarks] = useState([])
    const [showBookmarks, setShowBookmarks] = useState(false)

    // Navigation
    const [currentSection, setCurrentSection] = useState(0)
    const textRef = useRef(null)

    // German vocabulary database (simplified for demo)
    const germanVocabulary = useMemo(() => ({
        // Basic German words with translations
        'hallo': { english: 'hello', arabic: 'مرحباً', level: 'A1' },
        'danke': { english: 'thank you', arabic: 'شكراً', level: 'A1' },
        'bitte': { english: 'please', arabic: 'من فضلك', level: 'A1' },
        'ja': { english: 'yes', arabic: 'نعم', level: 'A1' },
        'nein': { english: 'no', arabic: 'لا', level: 'A1' },
        'gut': { english: 'good', arabic: 'جيد', level: 'A1' },
        'morgen': { english: 'morning', arabic: 'صباح', level: 'A1' },
        'abend': { english: 'evening', arabic: 'مساء', level: 'A1' },
        'tag': { english: 'day', arabic: 'يوم', level: 'A1' },
        'nacht': { english: 'night', arabic: 'ليل', level: 'A1' },
        // Add more words as needed
    }), [])

    // Parse text into sentences and paragraphs
    const parseText = useCallback((text) => {
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
        const words = text.split(/\s+/).filter(w => w.trim())

        return { paragraphs, sentences, words }
    }, [])

    // Load available PDF content from shared data
    useEffect(() => {
        const loadSharedReadingContent = async () => {
            try {
                const sharedReadingContent = getSharedReading('reading')
                const pdfReadingMaterials = []

                // Convert shared reading content to readable format
                sharedReadingContent.forEach((content, index) => {
                    pdfReadingMaterials.push({
                        id: `pdf-reading-${index}`,
                        title: content.title || 'PDF Reading Material',
                        titleArabic: content.titleArabic || 'مواد القراءة من PDF',
                        story: content.text || '',
                        storyArabic: content.translation || '',
                        difficulty: content.level || 'B1',
                        vocabulary: content.vocabulary || [],
                        questions: content.questions || [],
                        source: 'pdf',
                        sourceId: content.sourceId,
                        pageNumbers: content.pageNumbers
                    })
                })

                setAvailablePDFContent(pdfReadingMaterials)
                updateSyncStatus('reading', 'synced')
            } catch (error) {
                console.error('Error loading shared reading content:', error)
                updateSyncStatus('reading', 'error')
            }
        }

        loadSharedReadingContent()
    }, [getSharedReading, updateSyncStatus])

    // Get parsed content
    const parsedContent = useMemo(() => {
        if (!selectedPassage) return { paragraphs: [], sentences: [], words: [] }
        const text = selectedPassage.germanStory || selectedPassage.story
        return parseText(text)
    }, [selectedPassage, showArabic, parseText])

    // Handle word click for vocabulary lookup
    const handleWordClick = useCallback((word, index) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()]/g, '')

        // Check if it's a German word (basic check)
        if (/[äöüß]/i.test(cleanWord) || germanVocabulary[cleanWord]) {
            setSelectedWord({
                word: cleanWord,
                translation: germanVocabulary[cleanWord] || {
                    english: 'Translation not found',
                    arabic: 'الترجمة غير موجودة',
                    level: 'Unknown'
                },
                context: word,
                position: index
            })
            setShowVocabularyModal(true)

            // Track vocabulary lookup
            trackProgress('reading', 'vocabulary_lookup', {
                word: cleanWord,
                passage: selectedPassage?.id,
                timestamp: new Date().toISOString()
            })

            // Add to lookup history
            setLookupHistory(prev => [
                { word: cleanWord, timestamp: new Date() },
                ...prev.filter(h => h.word !== cleanWord)
            ].slice(0, 20))
        }
    }, [germanVocabulary, selectedPassage, trackProgress])

    // Enhanced reading function with different modes
    const handleReadPassage = useCallback(() => {
        if (speaking) {
            cancel()
            setReadingWord(-1)
            setReadingSentence(-1)
            setReadingParagraph(-1)
            setIsPaused(false)
            return
        }

        if (!selectedPassage) return

        const text = selectedPassage.germanStory || selectedPassage.story
        const { words, sentences, paragraphs } = parsedContent

        // Start reading analytics
        setReadingStats(prev => ({
            ...prev,
            startTime: Date.now(),
            totalWordsRead: 0
        }))

        // Choose voice based on language
        const voice = showArabic ? getArabicVoice() : getEnglishVoice()
        const lang = showArabic ? 'ar-SA' : 'en-US'

        if (readingMode === READING_MODES.WORD) {
            // Word-by-word reading with highlighting
            speakWithHighlighting(words, {
                voice,
                rate: readingSpeed,
                lang,
                baseDelay: 100,
                onWordChange: (index, word) => {
                    setReadingWord(index)
                    setReadingStats(prev => ({ ...prev, totalWordsRead: prev.totalWordsRead + 1 }))
                },
                onEnd: () => handleReadingComplete()
            })

        } else if (readingMode === READING_MODES.SENTENCE) {
            // Sentence-by-sentence reading with highlighting
            speakBySentences(sentences, {
                voice,
                rate: readingSpeed,
                lang,
                baseDelay: 200,
                onSentenceChange: (index, sentence) => {
                    setReadingSentence(index)
                    const sentenceWords = sentence.split(/\s+/).filter(w => w.trim())
                    setReadingStats(prev => ({ ...prev, totalWordsRead: prev.totalWordsRead + sentenceWords.length }))
                },
                onEnd: () => handleReadingComplete()
            })

        } else {
            // Continuous reading (default)
            speak(text, {
                voice,
                rate: readingSpeed,
                lang,
                onEnd: () => handleReadingComplete()
            })
        }

        // Track reading session
        trackProgress('reading', 'session_start', {
            passage: selectedPassage.id,
            mode: readingMode,
            speed: readingSpeed,
            timestamp: new Date().toISOString()
        })
    }, [speaking, selectedPassage, showArabic, readingMode, readingSpeed, isPaused, parsedContent, speak, speakWithHighlighting, speakBySentences, cancel, getArabicVoice, getEnglishVoice, trackProgress])

    // Handle reading completion
    const handleReadingComplete = useCallback(() => {
        setReadingWord(-1)
        setReadingSentence(-1)
        setReadingParagraph(-1)

        // Calculate reading stats
        const endTime = Date.now()
        const timeSpent = (endTime - readingStats.startTime) / 1000 / 60 // in minutes
        const wordsPerMinute = readingStats.totalWordsRead / timeSpent

        setReadingStats(prev => ({
            ...prev,
            timeSpent,
            wordsPerMinute: Math.round(wordsPerMinute)
        }))

        // Track completion
        trackProgress('reading', 'session_complete', {
            passage: selectedPassage?.id,
            wordsRead: readingStats.totalWordsRead,
            timeSpent,
            wpm: Math.round(wordsPerMinute),
            timestamp: new Date().toISOString()
        })

        // Handle repeat modes
        if (repeatMode !== REPEAT_MODES.NONE) {
            setTimeout(() => {
                if (repeatMode === REPEAT_MODES.PASSAGE) {
                    handleReadPassage()
                }
                // Add logic for paragraph/sentence repeat
            }, 1000)
        }
    }, [readingStats, selectedPassage, repeatMode, trackProgress, handleReadPassage])

    // Handle pause/resume
    const handlePauseResume = useCallback(() => {
        if (isPaused) {
            resume()
            setIsPaused(false)
        } else {
            pause()
            setIsPaused(true)
        }
    }, [isPaused, pause, resume])

    // Handle bookmark
    const handleBookmark = useCallback(() => {
        if (!selectedPassage) return

        const bookmark = {
            id: Date.now(),
            passageId: selectedPassage.id,
            passageTitle: selectedPassage.title,
            position: currentPosition,
            timestamp: new Date().toISOString()
        }

        setBookmarks(prev => [...prev, bookmark])

        trackProgress('reading', 'bookmark_added', {
            passage: selectedPassage.id,
            position: currentPosition,
            timestamp: bookmark.timestamp
        })
    }, [selectedPassage, currentPosition, trackProgress])

    // Navigate to bookmark
    const handleNavigateToBookmark = useCallback((bookmark) => {
        setCurrentPosition(bookmark.position)
        // Scroll to position
        if (textRef.current) {
            textRef.current.scrollTop = bookmark.position * 100 // Approximate scroll
        }
    }, [])

    // Get difficulty color
    const getDifficultyColor = (level) => {
        const colors = {
            'A1': 'hsl(120, 70%, 50%)',
            'A2': 'hsl(160, 70%, 50%)',
            'B1': 'hsl(199, 89%, 48%)',
            'B2': 'hsl(180, 77%, 47%)',
            'C1': 'hsl(45, 93%, 47%)',
            'C2': 'hsl(4, 90%, 58%)'
        }
        return colors[level] || 'hsl(250, 84%, 54%)'
    }

    // Render text with highlighting
    const renderTextWithHighlighting = useCallback(() => {
        const text = showArabic ? selectedPassage?.storyArabic : selectedPassage?.story
        if (!text) return null

        if (readingMode === READING_MODES.WORD) {
            // Word-by-word highlighting
            return text.split(/\s+/).map((word, idx) => (
                <span
                    key={idx}
                    style={{
                        background: readingWord === idx ? 'var(--color-primary)' : 'transparent',
                        color: readingWord === idx ? 'white' : 'inherit',
                        padding: '2px 4px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer'
                    }}
                    onClick={() => handleWordClick(word, idx)}
                >
                    {word}{' '}
                </span>
            ))
        } else if (readingMode === READING_MODES.SENTENCE) {
            // Sentence-by-sentence highlighting
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
            let wordIdx = 0

            return sentences.map((sentence, sIdx) => (
                <span
                    key={sIdx}
                    style={{
                        background: readingSentence === sIdx ? 'var(--color-primary)' : 'transparent',
                        color: readingSentence === sIdx ? 'white' : 'inherit',
                        padding: '2px 4px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'all 0.15s ease',
                        display: 'inline-block',
                        marginBottom: 'var(--space-sm)'
                    }}
                >
                    {sentence.split(/\s+/).map((word, wIdx) => {
                        const currentWordIdx = wordIdx++
                        return (
                            <span
                                key={currentWordIdx}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleWordClick(word, currentWordIdx)}
                            >
                                {word}{' '}
                            </span>
                        )
                    })}
                </span>
            ))
        } else {
            // Default word highlighting for continuous mode
            return text.split(/\s+/).map((word, idx) => (
                <span
                    key={idx}
                    style={{
                        background: readingWord === idx ? 'var(--color-primary)' : 'transparent',
                        color: readingWord === idx ? 'white' : 'inherit',
                        padding: '2px 4px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer'
                    }}
                    onClick={() => handleWordClick(word, idx)}
                >
                    {word}{' '}
                </span>
            ))
        }
    }, [showArabic, selectedPassage, readingMode, readingWord, readingSentence, handleWordClick])

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
            <header style={{ marginBottom: 'var(--space-2xl)' }}>
                <h1>Interactive Reading Module</h1>
                <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                    Enhanced German reading practice with speed control, vocabulary lookup, and progress tracking
                </p>
            </header>

            {/* Reading Analytics Dashboard */}
            {readingStats.startTime && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)', background: 'var(--gradient-primary)', color: 'white' }}>
                    <h3 style={{ color: 'white', marginBottom: 'var(--space-lg)' }}>Reading Analytics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Clock size={24} style={{ margin: '0 auto var(--space-sm)' }} />
                            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-bold)' }}>
                                {Math.round(readingStats.timeSpent)}m
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', opacity: 0.9 }}>Time Spent</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Target size={24} style={{ margin: '0 auto var(--space-sm)' }} />
                            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-bold)' }}>
                                {readingStats.totalWordsRead}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', opacity: 0.9 }}>Words Read</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Gauge size={24} style={{ margin: '0 auto var(--space-sm)' }} />
                            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-bold)' }}>
                                {readingStats.wordsPerMinute}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', opacity: 0.9 }}>WPM</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <TrendingUp size={24} style={{ margin: '0 auto var(--space-sm)' }} />
                            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-bold)' }}>
                                {readingSpeed}x
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', opacity: 0.9 }}>Speed</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Passage Selection */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <h3>Select Reading Material</h3>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowPDFModal(true)}
                    >
                        <FileText size={18} />
                        Load PDF Content
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                    {/* Regular Reading Passages */}
                    {passages.map(passage => (
                        <div
                            key={passage.id}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                background: selectedPassage?.id === passage.id ? 'var(--color-surface-hover)' : 'var(--color-bg-elevated)',
                                borderColor: selectedPassage?.id === passage.id ? 'var(--color-primary)' : 'var(--color-border)',
                            }}
                            onClick={() => {
                                setSelectedPassage(passage)
                                setShowArabic(false)
                                setShowAnswers(false)
                                cancel()
                                setReadingWord(-1)
                                setReadingSentence(-1)
                                setReadingParagraph(-1)
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xs)' }}>
                                <h4 style={{ margin: 0, fontSize: 'var(--font-base)', color: 'var(--color-text)' }}>
                                    {passage.title}
                                </h4>
                                <span className="badge" style={{
                                    background: 'hsla(200, 84%, 54%, 0.2)',
                                    color: 'var(--color-info)',
                                    fontSize: 'var(--font-xs)'
                                }}>
                                    Built-in
                                </span>
                            </div>
                            <p style={{ fontSize: 'var(--font-sm)', margin: 0, marginBottom: 'var(--space-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                {passage.titleArabic}
                            </p>
                            <span className="badge" style={{ background: `${getDifficultyColor(passage.difficulty)}33`, color: getDifficultyColor(passage.difficulty) }}>
                                {passage.difficulty}
                            </span>
                        </div>
                    ))}

                    {/* PDF-Extracted Reading Content */}
                    {availablePDFContent.map(passage => (
                        <div
                            key={passage.id}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                background: selectedPassage?.id === passage.id ? 'var(--color-surface-hover)' : 'var(--color-bg-elevated)',
                                borderColor: selectedPassage?.id === passage.id ? 'var(--color-primary)' : 'var(--color-border)',
                                border: '2px solid var(--color-accent)'
                            }}
                            onClick={() => {
                                setSelectedPassage(passage)
                                setShowArabic(false)
                                setShowAnswers(false)
                                cancel()
                                setReadingWord(-1)
                                setReadingSentence(-1)
                                setReadingParagraph(-1)
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xs)' }}>
                                <h4 style={{ margin: 0, fontSize: 'var(--font-base)', color: 'var(--color-accent)' }}>
                                    {passage.title}
                                </h4>
                                <span className="badge" style={{
                                    background: 'hsla(45, 93%, 47%, 0.2)',
                                    color: 'var(--color-warning)',
                                    fontSize: 'var(--font-xs)'
                                }}>
                                    PDF
                                </span>
                            </div>
                            <p style={{ fontSize: 'var(--font-sm)', margin: 0, marginBottom: 'var(--space-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                {passage.titleArabic}
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                                <span className="badge" style={{ background: `${getDifficultyColor(passage.difficulty)}33`, color: getDifficultyColor(passage.difficulty) }}>
                                    {passage.difficulty}
                                </span>
                                {passage.pageNumbers && (
                                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                                        Pages: {passage.pageNumbers.join(', ')}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reading Controls */}
            {selectedPassage && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Reading Controls</h3>

                    {/* Primary Controls */}
                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleReadPassage}
                            disabled={!supported}
                        >
                            {speaking ? <Pause size={18} /> : <Play size={18} />}
                            {speaking ? 'Stop Reading' : 'Start Reading'}
                        </button>

                        {speaking && (
                            <button
                                className="btn btn-secondary"
                                onClick={handlePauseResume}
                            >
                                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                        )}

                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowArabic(!showArabic)}
                        >
                            <Languages size={18} />
                            {showArabic ? 'Show English' : 'Show Arabic'}
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={handleBookmark}
                        >
                            <Bookmark size={18} />
                            Bookmark
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowBookmarks(!showBookmarks)}
                        >
                            <BookmarkCheck size={18} />
                            Bookmarks ({bookmarks.length})
                        </button>
                    </div>

                    {/* Speed Control */}
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 'var(--font-medium)' }}>
                            Reading Speed: {readingSpeed}x
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <span>0.5x</span>
                            <input
                                type="range"
                                min="0.5"
                                max="3.0"
                                step="0.1"
                                value={readingSpeed}
                                onChange={(e) => setReadingSpeed(parseFloat(e.target.value))}
                                style={{ flex: 1 }}
                            />
                            <span>3.0x</span>
                        </div>
                    </div>

                    {/* Reading Mode */}
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 'var(--font-medium)' }}>
                            Reading Mode
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            {Object.values(READING_MODES).map(mode => (
                                <button
                                    key={mode}
                                    className={`btn ${readingMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setReadingMode(mode)}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Repeat Mode */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 'var(--font-medium)' }}>
                            Repeat Mode
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            {Object.values(REPEAT_MODES).map(mode => (
                                <button
                                    key={mode}
                                    className={`btn ${repeatMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setRepeatMode(mode)}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {mode === 'none' ? 'No Repeat' : mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Reading Content */}
            {selectedPassage && (
                <div className="animate-fadeIn">
                    <BilingualContainer
                        title={selectedPassage.germanTitle || selectedPassage.title}
                        germanContent={
                            <div
                                ref={textRef}
                                style={{
                                    fontSize: 'var(--font-lg)',
                                    lineHeight: 1.9,
                                    fontFamily: 'inherit',
                                    maxHeight: '500px',
                                    overflowY: 'auto'
                                }}
                            >
                                {renderTextWithHighlighting()}
                            </div>
                        }
                        englishContent={
                            <div
                                style={{
                                    fontSize: 'var(--font-lg)',
                                    lineHeight: 1.9,
                                    fontFamily: 'inherit',
                                    maxHeight: '500px',
                                    overflowY: 'auto',
                                    color: 'var(--color-text)',
                                    whiteSpace: 'pre-wrap'
                                }}
                            >
                                {selectedPassage.story}
                            </div>
                        }
                    />

                    {/* Vocabulary Table */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <BookOpen size={24} />
                            Vocabulary ({selectedPassage.vocabulary.length} words)
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Essential vocabulary from this passage
                        </p>

                        <div style={{
                            marginTop: 'var(--space-lg)',
                            overflowX: 'auto'
                        }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: 'var(--font-sm)'
                            }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-surface)', borderBottom: '2px solid var(--color-border)' }}>
                                        <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Word</th>
                                        <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Level</th>
                                        <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>English Meaning</th>
                                        <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Arabic Meaning</th>
                                        <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Example</th>
                                        <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Audio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPassage.vocabulary.map((vocab, idx) => (
                                        <tr
                                            key={idx}
                                            style={{
                                                borderBottom: '1px solid var(--color-border)',
                                                transition: 'background var(--transition-fast)',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: 'var(--space-md)', fontWeight: 'var(--font-semibold)' }}>
                                                {vocab.word}
                                            </td>
                                            <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                                                <span className="badge" style={{
                                                    background: `${getDifficultyColor(vocab.level)}33`,
                                                    color: getDifficultyColor(vocab.level)
                                                }}>
                                                    {vocab.level}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--space-md)' }}>{vocab.meaningEn}</td>
                                            <td style={{ padding: 'var(--space-md)', fontStyle: 'italic' }}>{vocab.meaningAr}</td>
                                            <td style={{ padding: 'var(--space-md)', color: 'var(--color-text-secondary)' }}>
                                                {vocab.example}
                                            </td>
                                            <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        if (supported) {
                                                            speak(vocab.word, {
                                                                voice: voices.find(v => v.lang.includes('en')) || voices[0],
                                                                rate: 0.8
                                                            })
                                                        }
                                                    }}
                                                    style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--font-xs)' }}
                                                    disabled={!supported}
                                                >
                                                    <Volume2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Comprehension Questions */}
                    <div className="card">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <HelpCircle size={24} />
                            Comprehension Questions
                        </h3>

                        <div style={{ marginTop: 'var(--space-lg)' }}>
                            {selectedPassage.questions.map((q, idx) => (
                                <div key={idx} className="card" style={{ background: 'var(--color-bg-elevated)', marginBottom: 'var(--space-md)' }}>
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'start' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: 'var(--radius-full)',
                                            background: 'var(--color-primary)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'var(--font-bold)',
                                            flexShrink: 0
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-md)' }}>
                                                {q.question}
                                            </p>

                                            {showAnswers && (
                                                <div className="animate-fadeIn" style={{
                                                    padding: 'var(--space-md)',
                                                    background: 'var(--gradient-primary)',
                                                    color: 'white',
                                                    borderRadius: 'var(--radius-md)',
                                                    marginTop: 'var(--space-md)'
                                                }}>
                                                    <strong style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>Answer:</strong>
                                                    <p style={{ margin: 0, marginBottom: 'var(--space-md)', opacity: 0.95 }}>{q.answer}</p>

                                                    <strong style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>Explanation:</strong>
                                                    <p style={{ margin: 0, opacity: 0.9, fontSize: 'var(--font-sm)' }}>{q.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowAnswers(!showAnswers)}
                            style={{ marginTop: 'var(--space-lg)' }}
                        >
                            <HelpCircle size={18} />
                            {showAnswers ? 'Hide' : 'Show'} Answers
                        </button>
                    </div>
                </div>
            )}

            {/* Vocabulary Lookup Modal */}
            {showVocabularyModal && selectedWord && (
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
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3>Vocabulary Lookup</h3>
                            <button className="btn btn-secondary" onClick={() => setShowVocabularyModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                {selectedWord.word}
                            </h4>
                            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                <div>
                                    <strong>English:</strong> {selectedWord.translation.english}
                                </div>
                                <div>
                                    <strong>Arabic:</strong> {selectedWord.translation.arabic}
                                </div>
                                <div>
                                    <strong>Level:</strong>
                                    <span className="badge" style={{ marginLeft: 'var(--space-sm)' }}>
                                        {selectedWord.translation.level}
                                    </span>
                                </div>
                                <div>
                                    <strong>Context:</strong> "{selectedWord.context}"
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (supported) {
                                        speak(selectedWord.word, {
                                            voice: voices.find(v => v.lang.includes('de')) || voices[0],
                                            rate: 0.8
                                        })
                                    }
                                }}
                            >
                                <Volume2 size={20} />
                                Pronounce
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowVocabularyModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bookmarks Modal */}
            {showBookmarks && (
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
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '70vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3>Your Bookmarks</h3>
                            <button className="btn btn-secondary" onClick={() => setShowBookmarks(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {bookmarks.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                No bookmarks yet. Start reading and bookmark important passages!
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {bookmarks.map(bookmark => (
                                    <div key={bookmark.id} className="card" style={{ cursor: 'pointer' }}>
                                        <h4>{bookmark.passageTitle}</h4>
                                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                            Position: {bookmark.position} • {new Date(bookmark.timestamp).toLocaleDateString()}
                                        </p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                handleNavigateToBookmark(bookmark)
                                                setShowBookmarks(false)
                                            }}
                                        >
                                            Go to Bookmark
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PDF Content Modal */}
            {showPDFModal && (
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
                        maxWidth: '600px',
                        width: '90%'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3>Load PDF Content</h3>
                            <button className="btn btn-secondary" onClick={() => setShowPDFModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <p style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-text-secondary)' }}>
                            Select a German PDF to read content from:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {['Basic German', 'Deutsch aber Hallo A1', 'Deutsch aber Hallo A2', 'Deutsch aber Hallo B1', 'Deutsch aber Hallo B2', 'Sicher C1'].map(pdfName => (
                                <button
                                    key={pdfName}
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        // Mock PDF content loading
                                        setPdfContent({
                                            title: pdfName,
                                            content: `This is mock German content from ${pdfName}. In a real implementation, this would be extracted from the actual PDF file using a PDF processing library.`
                                        })
                                        setShowPDFModal(false)
                                    }}
                                    style={{ textAlign: 'left' }}
                                >
                                    <FileText size={18} style={{ marginRight: 'var(--space-sm)' }} />
                                    {pdfName}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Reading Interface */}
            {isReadingPDF && pdfContent && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h2>{pdfContent.title}</h2>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                            <span className="badge" style={{ background: `${getDifficultyColor(pdfContent.level)}33`, color: getDifficultyColor(pdfContent.level) }}>
                                {pdfContent.level}
                            </span>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    clearPDF()
                                    setIsReadingPDF(false)
                                }}
                            >
                                <X size={18} />
                                Close PDF
                            </button>
                        </div>
                    </div>

                    {/* PDF Navigation Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={previousPage}
                            disabled={currentPage === 0}
                        >
                            <ChevronLeft size={18} />
                            Previous
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>Page</div>
                            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-bold)' }}>
                                {currentPage + 1} / {totalPages}
                            </div>
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={nextPage}
                            disabled={currentPage === totalPages - 1}
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* PDF Content */}
                    <div
                        style={{
                            padding: 'var(--space-xl)',
                            background: 'var(--color-bg-elevated)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--font-lg)',
                            lineHeight: 1.9,
                            maxHeight: '400px',
                            overflowY: 'auto'
                        }}
                    >
                        {renderTextWithHighlighting()}
                    </div>

                    {/* PDF Vocabulary */}
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        <h3 style={{ marginBottom: 'var(--space-md)' }}>Extracted Vocabulary</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                            {extractVocabulary().map((vocab, idx) => (
                                <span
                                    key={idx}
                                    className="badge"
                                    style={{
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: 'var(--space-sm) var(--space-md)'
                                    }}
                                    onClick={() => handleWordClick(vocab.word, idx)}
                                >
                                    {vocab.word}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!selectedPassage && !isReadingPDF && (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <BookOpen size={64} style={{ margin: '0 auto', opacity: 0.3, marginBottom: 'var(--space-md)' }} />
                    <h3 style={{ color: 'var(--color-text-secondary)' }}>Select a passage above to begin reading practice</h3>
                </div>
            )}
        </div>
    )
}