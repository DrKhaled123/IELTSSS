import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import {
    BookOpen,
    Volume2,
    Play,
    Pause,
    Languages,
    Clock,
    Target,
    Gauge,
    Trash2,
    Copy,
    Check,
    Type,
    ArrowRight,
    Award,
    Settings,
    Maximize2,
    Minimize2,
    AlertCircle
} from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { IELTSTimerDisplay } from '../hooks/useIELTSTimer'
import { BandScoreCard } from '../components/BandScoreDisplay'
import { calculateListeningReadingBand } from '../utils/bandCalculator'
import passagesData from '../data/reading-passages.json'

// Typography presets for different reading preferences
const TYPOGRAPHY_PRESETS = {
    comfortable: {
        fontSize: '18px',
        lineHeight: '1.8',
        letterSpacing: '0.01em',
        fontWeight: '400'
    },
    academic: {
        fontSize: '16px',
        lineHeight: '1.6',
        letterSpacing: '0',
        fontWeight: '400'
    },
    large: {
        fontSize: '22px',
        lineHeight: '1.9',
        letterSpacing: '0.02em',
        fontWeight: '400'
    },
    dyslexic: {
        fontSize: '20px',
        lineHeight: '2.0',
        letterSpacing: '0.05em',
        fontWeight: '500',
        fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif'
    }
}

// Extract sentences from text while preserving punctuation
const extractSentences = (text) => {
    if (!text) return []
    // Match sentences ending with . ! ? followed by space or end of string
    const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g
    const matches = text.match(sentenceRegex) || []
    return matches.map(s => s.trim()).filter(s => s.length > 0)
}

// Extract words from a sentence
const extractWords = (sentence) => {
    return sentence.split(/\s+/).filter(w => w.length > 0)
}

const Reading = memo(function Reading() {
    const safePassages = Array.isArray(passagesData) ? passagesData : []
    const [inputText, setInputText] = useState('')
    const [selectedPassage, setSelectedPassage] = useState(null)
    const [translatedText, setTranslatedText] = useState('')
    const [isTranslating, setIsTranslating] = useState(false)
    const [readingSpeed, setReadingSpeed] = useState(1.2)
    const [repeatMode, setRepeatMode] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [typography, setTypography] = useState('comfortable')
    const [showSettings, setShowSettings] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [speechError, setSpeechError] = useState(null)
    const [isVoiceLoading, setIsVoiceLoading] = useState(false)

    // Quiz/Scoring state
    const [quizMode, setQuizMode] = useState(false)
    const [userAnswers, setUserAnswers] = useState({})
    const [showResults, setShowResults] = useState(false)
    const [correctCount, setCorrectCount] = useState(0)

    const { speak, speaking, cancel, voices, supported, getEnglishVoice } = useSpeechSynthesis()
    const { trackProgress } = useProgressTracking()
    const textRef = useRef(null)
    const sentencesRef = useRef([])
    const currentSentenceRef = useRef(0)
    const currentWordRef = useRef(0)

    // Force voices to load on first user interaction
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            // Trigger voice loading
            window.speechSynthesis.getVoices()
            
            // Sometimes voices need a kick to load
            const timeout = setTimeout(() => {
                if (window.speechSynthesis.getVoices().length === 0) {
                    // Try forcing voices to load
                    window.speechSynthesis.cancel()
                }
            }, 1000)
            
            return () => clearTimeout(timeout)
        }
    }, [])

    // Get English voice with fallbacks - robust version
    const getBestEnglishVoice = useCallback(() => {
        if (!voices || voices.length === 0) return null
        
        // Try to find the best English voice
        const voice = (
            voices.find(v => v.lang === 'en-GB') ||
            voices.find(v => v.lang === 'en-GB' && v.localService) ||
            voices.find(v => v.lang === 'en_US' || v.lang === 'en-US') ||
            voices.find(v => v.lang.startsWith('en-GB')) ||
            voices.find(v => v.lang.startsWith('en-') && !/en-?IN/i.test(v.lang) && !/en-?AU/i.test(v.lang)) ||
            voices.find(v => v.lang.startsWith('en')) ||
            voices[0]
        )
        
        return voice || null
    }, [voices])

    // Memoized sentences for the current text
    const sentences = useMemo(() => extractSentences(inputText), [inputText])
    const words = useMemo(() => extractWords(sentences[currentSentenceRef.current] || ''), [sentences])

    // Handle selecting a built-in passage
    const handleSelectPassage = useCallback((passage) => {
        setSelectedPassage(passage)
        setInputText(passage.story)
        setTranslatedText('')
        currentSentenceRef.current = 0
        currentWordRef.current = 0
        cancel()
    }, [cancel])

    // Basic Arabic translation for UI feedback
    const handleTranslate = useCallback(() => {
        if (!inputText.trim()) return
        setIsTranslating(true)

        setTimeout(() => {
            setTranslatedText("تمت ترجمة النص بنجاح. هذا مثال للترجمة العربية المدمجة في التطبيق لمساعدتك على فهم محتوى القراءة بشكل أفضل.")
            setIsTranslating(false)
            trackProgress('reading', 'translated_text', { length: inputText.length })
        }, 800)
    }, [inputText, trackProgress])

    // Fluent sentence-based reading with natural pauses
    const handleReadAloud = useCallback(() => {
        if (speaking) {
            cancel()
            currentSentenceRef.current = 0
            currentWordRef.current = 0
            setSpeechError(null)
            return
        }

        if (!inputText.trim() || sentences.length === 0) {
            setSpeechError('Please enter some text to read')
            return
        }

        // Clear any previous error
        setSpeechError(null)
        setIsVoiceLoading(true)

        // Get the best English voice
        const englishVoice = getBestEnglishVoice()
        
        setIsVoiceLoading(false)

        if (!englishVoice && (!voices || voices.length === 0)) {
            // Voices not loaded yet, wait and retry
            setIsVoiceLoading(true)
            
            const checkVoices = setInterval(() => {
                const voice = getBestEnglishVoice()
                if (voice) {
                    clearInterval(checkVoices)
                    setIsVoiceLoading(false)
                    startSpeaking(voice)
                }
            }, 200)
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkVoices)
                if (getBestEnglishVoice()) {
                    startSpeaking(getBestEnglishVoice())
                } else {
                    setIsVoiceLoading(false)
                    setSpeechError('Speech voices not available. Please try using Chrome or Edge browser.')
                }
            }, 5000)
            
            return
        }
        
        if (!englishVoice) {
            setSpeechError('No English voice available. Please check your browser settings.')
            return
        }
        
        startSpeaking(englishVoice)
        trackProgress('reading', 'read_aloud_started', { speed: readingSpeed, mode: 'sentence' })
    }, [inputText, speaking, cancel, voices, getBestEnglishVoice, readingSpeed, repeatMode, sentences, trackProgress])

    // Start speaking with the given voice
    const startSpeaking = useCallback((englishVoice) => {
        const speakNextSentence = () => {
            if (currentSentenceRef.current < sentences.length) {
                const currentSentence = sentences[currentSentenceRef.current]

                speak(currentSentence, {
                    voice: englishVoice,
                    rate: readingSpeed,
                    pitch: 1.0,
                    onEnd: () => {
                        const pauseDuration = repeatMode ? 120 : 250
                        setTimeout(() => {
                            currentSentenceRef.current++
                            currentWordRef.current = 0

                            if (currentSentenceRef.current < sentences.length) {
                                speakNextSentence()
                            } else {
                                // Finished reading all sentences
                                if (repeatMode) {
                                    currentSentenceRef.current = 0
                                    setTimeout(speakNextSentence, 1000)
                                }
                            }
                        }, pauseDuration)
                    },
                    onError: (error) => {
                        console.error('Speech error:', error)
                        setSpeechError('Speech error occurred. Please try again.')
                    }
                })
            }
        }

        speakNextSentence()
    }, [sentences, speaking, readingSpeed, repeatMode, speak])

    // Copy text to clipboard
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(inputText)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }, [inputText])

    // Clear all content
    const handleClear = useCallback(() => {
        setInputText('')
        setTranslatedText('')
        setSelectedPassage(null)
        currentSentenceRef.current = 0
        currentWordRef.current = 0
        cancel()
    }, [cancel])

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            textRef.current?.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }, [])

    // Get current typography style
    const typographyStyle = TYPOGRAPHY_PRESETS[typography] || TYPOGRAPHY_PRESETS.comfortable

    // Render text with sentence and word highlighting
    const renderHighlightedText = () => {
        const currentSentence = sentences[currentSentenceRef.current] || ''
        const currentWords = currentSentence.split(/\s+/)
        const currentWordIndex = currentSentenceRef.current === currentSentenceRef.current ?
            currentWordRef.current : -1

        return sentences.map((sentence, sentenceIdx) => {
            const isCurrentSentence = sentenceIdx === currentSentenceRef.current
            const sentenceWords = sentence.split(/\s+/)

            return (
                <span
                    key={sentenceIdx}
                    style={{
                        opacity: speaking ? (isCurrentSentence ? 1 : 0.4) : 1,
                        transition: 'opacity 0.3s ease',
                        marginRight: '0.25em'
                    }}
                >
                    {sentenceWords.map((word, wordIdx) => {
                        const absoluteWordIdx = sentenceWords.slice(0, wordIdx).reduce((acc, w) => acc + w.length + 1, 0)
                        const isCurrentWord = isCurrentSentence && wordIdx === currentWordRef.current

                        return (
                            <span
                                key={wordIdx}
                                style={{
                                    background: isCurrentWord ? '#2563eb' : 'transparent',
                                    color: isCurrentWord ? '#ffffff' : isCurrentSentence ? '#1f2937' : '#9ca3af',
                                    padding: isCurrentWord ? '2px 4px' : '0',
                                    borderRadius: '4px',
                                    transition: 'all 0.15s ease',
                                    transform: isCurrentWord ? 'scale(1.05)' : 'scale(1)',
                                    display: 'inline-block'
                                }}
                            >
                                {word}
                            </span>
                        )
                    })}
                    {/* Add space after sentence if not at end */}
                    {sentenceIdx < sentences.length - 1 ? ' ' : ''}
                </span>
            )
        })
    }

    return (
        <div className="container animate-fadeIn" style={{
            paddingTop: '32px',
            paddingBottom: '48px',
            background: '#0f172a',
            minHeight: '100vh'
        }}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .reading-text::-webkit-scrollbar {
                    width: 8px;
                }
                .reading-text::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .reading-text::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .reading-text::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>

            <header style={{ marginBottom: '24px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    background: '#1f2937',
                    padding: '20px 24px',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#1e293b',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <BookOpen size={32} color="#2563eb" />
                            Academic Reading Studio
                        </h1>
                        <p style={{
                            fontSize: '14px',
                            color: '#64748b',
                            margin: '8px 0 0 0'
                        }}>
                            Interactive Reading Module • Practice IELTS Academic Reading
                        </p>
                    </div>
                    <IELTSTimerDisplay section="reading" size="medium" showControls={true} />
                </div>

                {showResults && selectedPassage && (
                    <div style={{ marginTop: '16px' }}>
                        <BandScoreCard
                            section="reading"
                            band={calculateListeningReadingBand(correctCount, selectedPassage?.questions?.length || 40, 'reading-academic')}
                            rawScore={correctCount}
                            totalQuestions={selectedPassage?.questions?.length || 40}
                            size="medium"
                        />
                    </div>
                )}
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 320px',
                gap: '24px',
                alignItems: 'start'
            }}>
                {/* Main Reading Area */}
                <div>
                    {/* Text Input / Display Card */}
                    <div className="card" style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        {/* Toolbar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#f8fafc',
                            borderBottom: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleReadAloud}
                                    disabled={!inputText.trim() || isVoiceLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {isVoiceLoading ? (
                                        <span style={{
                                            width: '18px',
                                            height: '18px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: 'white',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                    ) : speaking ? (
                                        <Pause size={18} />
                                    ) : (
                                        <Volume2 size={18} />
                                    )}
                                    {speaking ? 'Stop Reading' : isVoiceLoading ? 'Loading...' : 'Read Aloud'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleTranslate}
                                    disabled={isTranslating || !inputText.trim()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {isTranslating ? 'Translating...' : 'Translate'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setShowSettings(!showSettings)}
                                    title="Typography Settings"
                                >
                                    <Type size={18} />
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={handleCopy}
                                    title="Copy Text"
                                >
                                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={toggleFullscreen}
                                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                >
                                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={handleClear}
                                    title="Clear Text"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Typography Settings Panel */}
                        {showSettings && (
                            <div style={{
                                padding: '16px',
                                background: '#f1f5f9',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '12px'
                            }}>
                                {Object.entries(TYPOGRAPHY_PRESETS).map(([key, style]) => (
                                    <button
                                        key={key}
                                        onClick={() => setTypography(key)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: typography === key ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                            background: typography === key ? '#eff6ff' : 'white',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', textTransform: 'capitalize' }}>
                                            {key}
                                        </div>
                                        <div style={{ fontSize: style.fontSize, color: '#64748b', marginTop: '4px' }}>
                                            Aa
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Reading Speed Control */}
                        <div style={{
                            padding: '12px 16px',
                            background: '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                                <Gauge size={16} />
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>Speed: {readingSpeed.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="1.5"
                                step="0.1"
                                value={readingSpeed}
                                onChange={(e) => setReadingSpeed(parseFloat(e.target.value))}
                                style={{ flex: 1, cursor: 'pointer' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={repeatMode}
                                    onChange={(e) => setRepeatMode(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px' }}>Repeat</span>
                            </label>
                        </div>

                        {/* Speech Error Display */}
                        {speechError && (
                            <div style={{
                                padding: '12px 16px',
                                background: '#fef2f2',
                                borderBottom: '1px solid #fecaca',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#dc2626'
                            }}>
                                <AlertCircle size={16} />
                                <span style={{ fontSize: '14px' }}>{speechError}</span>
                            </div>
                        )}

                        {/* Text Display Area */}
                        <div
                            ref={textRef}
                            style={{
                                position: 'relative'
                            }}
                        >
                            {speaking ? (
                                <div
                                    className="reading-text"
                                    style={{
                                        padding: '32px',
                                        fontSize: typographyStyle.fontSize,
                                        lineHeight: typographyStyle.lineHeight,
                                        letterSpacing: typographyStyle.letterSpacing,
                                        fontWeight: typographyStyle.fontWeight,
                                        fontFamily: typographyStyle.fontFamily || 'inherit',
                                        minHeight: '300px',
                                        maxHeight: '500px',
                                        overflowY: 'auto',
                                        background: '#ffffff'
                                    }}
                                >
                                    {renderHighlightedText()}
                                </div>
                            ) : (
                                <textarea
                                    id="reading-passage"
                                    name="readingPassage"
                                    aria-label="Reading passage"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Paste your English passage here to practice reading with fluent text-to-speech..."
                                    style={{
                                        width: '100%',
                                        minHeight: '300px',
                                        padding: '32px',
                                        fontSize: typographyStyle.fontSize,
                                        lineHeight: typographyStyle.lineHeight,
                                        letterSpacing: typographyStyle.letterSpacing,
                                        fontWeight: typographyStyle.fontWeight,
                                        fontFamily: typographyStyle.fontFamily || 'inherit',
                                        border: 'none',
                                        resize: 'vertical',
                                        outline: 'none',
                                        background: '#ffffff'
                                    }}
                                />
                            )}
                        </div>

                        {/* Translated Text */}
                        {translatedText && (
                            <div style={{
                                padding: '24px 32px',
                                background: '#fefce8',
                                borderTop: '1px solid #fef08a',
                                marginTop: '8px'
                            }}>
                                <h4 style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    margin: '0 0 12px 0',
                                    color: '#854d0e',
                                    fontSize: '14px'
                                }}>
                                    <Languages size={16} />
                                    Arabic Translation
                                </h4>
                                <p style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    lineHeight: '1.8',
                                    color: '#713f12',
                                    textAlign: 'right',
                                    direction: 'rtl'
                                }}>
                                    {translatedText}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Reading Progress Indicator */}
                    {speaking && sentences.length > 0 && (
                        <div style={{
                            marginTop: '16px',
                            padding: '16px 24px',
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                flex: 1,
                                height: '8px',
                                background: '#e2e8f0',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${((currentSentenceRef.current + 1) / sentences.length) * 100}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                                    borderRadius: '4px',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <span style={{
                                fontSize: '14px',
                                color: '#64748b',
                                minWidth: '80px',
                                textAlign: 'right'
                            }}>
                                Sentence {currentSentenceRef.current + 1} of {sentences.length}
                            </span>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Quick Library */}
                    <div className="card" style={{ padding: '20px' }}>
                        <h3 style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 0 16px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1e293b'
                        }}>
                            <BookOpen size={20} />
                            Quick Library
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {safePassages.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelectPassage(p)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        background: selectedPassage?.id === p.id ? '#eff6ff' : '#f8fafc',
                                        border: selectedPassage?.id === p.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#1e293b'
                                    }}>
                                        {p.title}
                                    </span>
                                    <ArrowRight size={16} color="#94a3b8" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reading Tips */}
                    <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)' }}>
                        <h3 style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 0 16px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1e40af'
                        }}>
                            <Award size={20} />
                            IELTS Reading Tips
                        </h3>
                        <ul style={{
                            margin: 0,
                            paddingLeft: '20px',
                            fontSize: '14px',
                            color: '#1e40af',
                            lineHeight: '1.8'
                        }}>
                            <li>Skim the passage quickly first</li>
                            <li>Read questions before answers</li>
                            <li>Look for keywords and synonyms</li>
                            <li>Manage your time (20 min per passage)</li>
                            <li>Don't leave questions unanswered</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
})

export default Reading
