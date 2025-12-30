import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Mic, Volume2, Play, Pause, RotateCcw, BookOpen, Brain, Star, ChevronRight, X, Loader2, CheckCircle, AlertCircle, Award, TrendingUp, Users, Headphones, FileText, Settings, BarChart3, Activity, Zap, Target, Eye, Ear, Speech } from 'lucide-react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAdvancedSpeechRecognition } from '../hooks/useAdvancedSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useSharedData } from '../hooks/useSharedData'

// Import pronunciation database
import pronunciationDatabase from '../data/pronunciation-database.json'

export default function Pronunciation() {
    const [selectedLetter, setSelectedLetter] = useState(null)
    const [selectedTip, setSelectedTip] = useState(null)
    const [selectedMinimalPair, setSelectedMinimalPair] = useState(null)
    const [selectedTongueTwister, setSelectedTongueTwister] = useState(null)
    const [selectedPhoneticSymbol, setSelectedPhoneticSymbol] = useState(null)
    const [isRecording, setIsRecording] = useState(false)
    const [userTranscript, setUserTranscript] = useState('')
    const [pronunciationScore, setPronunciationScore] = useState(null)
    const [currentSection, setCurrentSection] = useState('alphabet') // 'alphabet' | 'tips' | 'practice' | 'minimalPairs' | 'tongueTwisters' | 'phoneticAlphabet' | 'analytics'
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterDifficulty, setFilterDifficulty] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [showMouthGuide, setShowMouthGuide] = useState(false)
    const [showWaveform, setShowWaveform] = useState(false)
    const [practiceMode, setPracticeMode] = useState('listen') // 'listen' | 'record' | 'compare'
    const [audioLevel, setAudioLevel] = useState(0)
    const [pronunciationHistory, setPronunciationHistory] = useState([])
    const [achievements, setAchievements] = useState([])
    const [showSettings, setShowSettings] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0)

    const { startListening, stopListening, transcript, supported: sttSupported } = useAdvancedSpeechRecognition({
        continous: false,
        interimResults: false,
        lang: 'de-DE',
        monitorAudioLevel: true,
        trackWordTiming: true,
        onStart: () => {
            console.log('Speech recognition started')
        },
        onResult: (result) => {
            console.log('Speech recognition result:', result)
        },
        onError: (error) => {
            console.error('Speech recognition error:', error)
        }
    })
    const { speak, voices, speaking } = useSpeechSynthesis()
    const { trackProgress } = useProgressTracking()
    const {
        getSharedPronunciation,
        addSharedPronunciation,
        updateSyncStatus
    } = useSharedData()
    const [sharedPronunciationData, setSharedPronunciationData] = useState([])

    // Refs for audio processing
    const audioContextRef = useRef(null)
    const analyserRef = useRef(null)
    const microphoneRef = useRef(null)
    const canvasRef = useRef(null)
    const recordingTimerRef = useRef(null)

    // Extract data from pronunciation database with memoization for performance
    const germanAlphabet = useMemo(() => pronunciationDatabase.alphabet, [])
    const pronunciationTips = useMemo(() => pronunciationDatabase.pronunciationTips, [])
    const minimalPairs = useMemo(() => pronunciationDatabase.minimalPairs, [])
    const tongueTwisters = useMemo(() => pronunciationDatabase.tongueTwisters, [])
    const phoneticAlphabet = useMemo(() => pronunciationDatabase.phoneticAlphabet, [])

    // Enhanced practice words with difficulty levels - memoized for performance
    const practiceWords = useMemo(() => [
        { german: 'Guten Morgen', english: 'Good morning', difficulty: 'A1', category: 'greetings' },
        { german: 'Wie geht es?', english: 'How are you?', difficulty: 'A1', category: 'greetings' },
        { german: 'Entschuldigung', english: 'Excuse me', difficulty: 'A1', category: 'politeness' },
        { german: 'Danke schön', english: 'Thank you very much', difficulty: 'A1', category: 'politeness' },
        { german: 'Ich verstehe nicht', english: 'I don\'t understand', difficulty: 'A2', category: 'communication' },
        { german: 'Könnten Sie mir helfen?', english: 'Could you help me?', difficulty: 'A2', category: 'requests' },
        { german: 'Ich würde gern', english: 'I would like to', difficulty: 'B1', category: 'requests' },
        { german: 'Entschuldigen Sie die Störung', english: 'Sorry for the interruption', difficulty: 'B2', category: 'politeness' },
        { german: 'Das ist kompliziert', english: 'That is complicated', difficulty: 'B2', category: 'opinions' },
        { german: 'Ich bin einverstanden', english: 'I have understood', difficulty: 'C1', category: 'communication' }
    ], [])


    // Initialize audio context for waveform visualization
    useEffect(() => {
        if (typeof window !== 'undefined' && window.AudioContext) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
            analyserRef.current = audioContextRef.current.createAnalyser()
            analyserRef.current.fftSize = 2048
        }

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [])

    // Load saved pronunciation history and achievements
    useEffect(() => {
        const savedHistory = localStorage.getItem('pronunciationHistory')
        const savedAchievements = localStorage.getItem('pronunciationAchievements')

        if (savedHistory) {
            setPronunciationHistory(JSON.parse(savedHistory))
        }

        if (savedAchievements) {
            setAchievements(JSON.parse(savedAchievements))
        }
    }, [])

    // Save pronunciation history to localStorage
    useEffect(() => {
        if (pronunciationHistory.length > 0) {
            localStorage.setItem('pronunciationHistory', JSON.stringify(pronunciationHistory))
        }
    }, [pronunciationHistory])

    // Load shared pronunciation data from PDF extraction
    useEffect(() => {
        const loadSharedPronunciationData = async () => {
            try {
                const sharedPronData = getSharedPronunciation('pdf')
                if (sharedPronData && sharedPronData.length > 0) {
                    setSharedPronunciationData(sharedPronData)
                    updateSyncStatus('pronunciation', 'synced')
                }
            } catch (error) {
                console.error('Error loading shared pronunciation data:', error)
                updateSyncStatus('pronunciation', 'error')
            }
        }

        loadSharedPronunciationData()
    }, [getSharedPronunciation, updateSyncStatus])

    // Handle letter selection
    const handleLetterSelect = useCallback((letter) => {
        setSelectedLetter(letter)
        setCurrentSection('alphabet')
        setShowMouthGuide(true)

        trackProgress('pronunciation_practice', 'alphabet', {
            letter: letter.letter,
            timestamp: new Date().toISOString()
        })
    }, [trackProgress])

    // Handle tip selection
    const handleTipSelect = useCallback((tip) => {
        setSelectedTip(tip)
        setCurrentSection('tips')

        trackProgress('pronunciation_tips', 'viewed', {
            tipId: tip.id,
            category: tip.category,
            timestamp: new Date().toISOString()
        })
    }, [trackProgress])

    // Handle minimal pair selection
    const handleMinimalPairSelect = useCallback((pair) => {
        setSelectedMinimalPair(pair)
        setCurrentSection('minimalPairs')

        trackProgress('pronunciation_practice', 'minimal_pairs', {
            pair: pair.pair,
            timestamp: new Date().toISOString()
        })
    }, [trackProgress])

    // Handle tongue twister selection
    const handleTongueTwisterSelect = useCallback((twister) => {
        setSelectedTongueTwister(twister)
        setCurrentSection('tongueTwisters')

        trackProgress('pronunciation_practice', 'tongue_twisters', {
            text: twister.text,
            timestamp: new Date().toISOString()
        })
    }, [trackProgress])

    // Handle phonetic symbol selection
    const handlePhoneticSymbolSelect = useCallback((symbol) => {
        setSelectedPhoneticSymbol(symbol)
        setCurrentSection('phoneticAlphabet')

        trackProgress('pronunciation_practice', 'phonetic_alphabet', {
            symbol: symbol.symbol,
            timestamp: new Date().toISOString()
        })
    }, [trackProgress])

    // Initialize microphone for waveform visualization
    const initializeMicrophone = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
            microphoneRef.current.connect(analyserRef.current)

            // Start audio level monitoring
            const updateAudioLevel = () => {
                if (analyserRef.current && isRecording) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
                    analyserRef.current.getByteFrequencyData(dataArray)

                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
                    setAudioLevel(average / 255)

                    if (isRecording) {
                        requestAnimationFrame(updateAudioLevel)
                    }
                }
            }

            updateAudioLevel()
        } catch (error) {
            console.error('Error accessing microphone:', error)
        }
    }, [isRecording])

    // Start pronunciation practice with enhanced features
    const startPronunciationPractice = useCallback(async (target) => {
        if (!sttSupported) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
            return
        }

        setUserTranscript('')
        setPronunciationScore(null)
        setIsRecording(true)
        setRecordingDuration(0)

        // Start recording timer
        recordingTimerRef.current = setInterval(() => {
            setRecordingDuration(prev => prev + 0.1)
        }, 100)

        // Initialize microphone for waveform
        if (showWaveform) {
            await initializeMicrophone()
        }

        startListening({
            continuous: false,
            interimResults: false,
            lang: 'de-DE'
        })
    }, [sttSupported, startListening, showWaveform, initializeMicrophone])

    // Stop recording with enhanced analysis
    const stopPronunciationPractice = useCallback(() => {
        stopListening()
        setIsRecording(false)
        setShowWaveform(false)

        // Clear recording timer
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
        }

        // Calculate pronunciation score
        let targetText = ''
        let targetCategory = ''

        if (currentSection === 'alphabet' && selectedLetter) {
            targetText = selectedLetter.german
            targetCategory = 'alphabet'
        } else if (currentSection === 'practice') {
            targetText = typeof selectedLetter === 'object' ? selectedLetter.german : selectedLetter
            targetCategory = 'practice'
        } else if (currentSection === 'minimalPairs' && selectedMinimalPair) {
            targetText = selectedMinimalPair.pair.join(' ')
            targetCategory = 'minimal_pairs'
        } else if (currentSection === 'tongueTwisters' && selectedTongueTwister) {
            targetText = selectedTongueTwister.text
            targetCategory = 'tongue_twisters'
        }

        if (transcript && targetText) {
            const score = calculatePronunciationScore(transcript, targetText)
            setPronunciationScore(score)

            // Add to pronunciation history
            const historyEntry = {
                id: Date.now(),
                target: targetText,
                user: transcript,
                score: score.score,
                category: targetCategory,
                timestamp: new Date().toISOString(),
                duration: recordingDuration
            }

            setPronunciationHistory(prev => [...prev, historyEntry])

            trackProgress('pronunciation_attempt', 'completed', {
                targetText,
                userTranscript: transcript,
                score: score.score,
                category: targetCategory,
                duration: recordingDuration,
                timestamp: new Date().toISOString()
            })

            // Check for achievements
            checkAchievements(score.score, targetCategory)
        }

        setRecordingDuration(0)
    }, [stopListening, transcript, selectedLetter, currentSection, selectedMinimalPair, selectedTongueTwister, recordingDuration, trackProgress])

    // Enhanced pronunciation score calculation
    const calculatePronunciationScore = (userTranscript, targetGerman) => {
        const userWords = userTranscript.toLowerCase().split(/\s+/)
        const targetWords = targetGerman.toLowerCase().split(/\s+/)

        let correctCount = 0
        let totalWords = targetWords.length
        let phoneticAccuracy = 0
        let fluencyScore = 0

        // Word accuracy
        for (const targetWord of targetWords) {
            if (userWords.includes(targetWord)) {
                correctCount++
            }
        }

        // Phonetic accuracy (simplified)
        const userPhonemes = extractPhonemes(userTranscript)
        const targetPhonemes = extractPhonemes(targetGerman)
        const phoneticMatches = userPhonemes.filter(phoneme => targetPhonemes.includes(phoneme)).length
        phoneticAccuracy = targetPhonemes.length > 0 ? (phoneticMatches / targetPhonemes.length) * 100 : 0

        // Fluency score based on recording duration
        const expectedDuration = targetGerman.length * 0.2 // rough estimate
        fluencyScore = recordingDuration > 0 ? Math.max(0, 100 - Math.abs(recordingDuration - expectedDuration) * 10) : 0

        const wordAccuracy = (correctCount / totalWords) * 100
        const overallScore = Math.round((wordAccuracy * 0.4 + phoneticAccuracy * 0.4 + fluencyScore * 0.2))

        return {
            score: overallScore,
            wordAccuracy: Math.round(wordAccuracy),
            phoneticAccuracy: Math.round(phoneticAccuracy),
            fluencyScore: Math.round(fluencyScore),
            correctCount,
            totalWords,
            feedback: generateFeedback(overallScore),
            detailedFeedback: generateDetailedFeedback(wordAccuracy, phoneticAccuracy, fluencyScore)
        }
    }

    // Extract phonemes (simplified version)
    const extractPhonemes = (text) => {
        // This is a simplified phoneme extraction
        // In a real implementation, you'd use a proper phonetic library
        return text.toLowerCase().match(/[a-zäöüß]/g) || []
    }

    // Enhanced feedback generation
    const generateFeedback = (score) => {
        if (score >= 95) {
            return 'Excellent! Native-like pronunciation!'
        } else if (score >= 85) {
            return 'Very good! Clear and accurate.'
        } else if (score >= 75) {
            return 'Good! Keep practicing.'
        } else if (score >= 60) {
            return 'Fair. Focus on problem sounds.'
        } else {
            return 'Needs improvement. Listen carefully and try again.'
        }
    }

    // Generate detailed feedback
    const generateDetailedFeedback = (wordAccuracy, phoneticAccuracy, fluencyScore) => {
        const feedback = []

        if (wordAccuracy < 80) {
            feedback.push('Focus on word accuracy')
        }
        if (phoneticAccuracy < 80) {
            feedback.push('Work on individual sounds')
        }
        if (fluencyScore < 80) {
            feedback.push('Practice speaking more fluently')
        }

        return feedback
    }

    // Check for achievements
    const checkAchievements = (score, category) => {
        const newAchievements = []

        // First perfect score
        if (score >= 95 && !achievements.find(a => a.id === 'first_perfect')) {
            newAchievements.push({
                id: 'first_perfect',
                title: 'Perfect Pronunciation',
                description: 'Achieved 95%+ accuracy',
                icon: '🏆',
                date: new Date().toISOString()
            })
        }

        // Consistency achievement
        const recentScores = pronunciationHistory.slice(-10).map(h => h.score)
        if (recentScores.length >= 5 && recentScores.every(s => s >= 80) && !achievements.find(a => a.id === 'consistent')) {
            newAchievements.push({
                id: 'consistent',
                title: 'Consistent Speaker',
                description: '5+ consecutive scores above 80%',
                icon: '🎯',
                date: new Date().toISOString()
            })
        }

        // Category mastery
        const categoryScores = pronunciationHistory.filter(h => h.category === category).map(h => h.score)
        if (categoryScores.length >= 10 && categoryScores.every(s => s >= 85) && !achievements.find(a => a.id === `${category}_master`)) {
            newAchievements.push({
                id: `${category}_master`,
                title: `${category.charAt(0).toUpperCase() + category.slice(1)} Master`,
                description: `Mastered ${category} pronunciation`,
                icon: '🌟',
                date: new Date().toISOString()
            })
        }

        if (newAchievements.length > 0) {
            setAchievements(prev => [...prev, ...newAchievements])
            localStorage.setItem('pronunciationAchievements', JSON.stringify([...achievements, ...newAchievements]))
        }
    }

    // Enhanced speak function
    const speakText = useCallback((text, options = {}) => {
        if (text && voices.length > 0) {
            const germanVoice = voices.find(v => v.lang.startsWith('de')) || voices[0]
            speak(text, {
                rate: playbackSpeed,
                voice: germanVoice,
                ...options
            })
        }
    }, [speak, voices, playbackSpeed])

    // Speak letter
    const speakLetter = useCallback((letter) => {
        if (letter && voices.length > 0) {
            const germanVoice = voices.find(v => v.lang.startsWith('de'))
            speak(letter.german, {
                rate: 0.7,
                voice: germanVoice
            })
        }
    }, [speak, voices])

    // Filter tips by category and difficulty
    const filteredTips = useMemo(() => {
        let filtered = pronunciationTips

        if (filterCategory !== 'all') {
            filtered = filtered.filter(tip => tip.category === filterCategory)
        }

        if (filterDifficulty !== 'all') {
            filtered = filtered.filter(tip => tip.difficulty === filterDifficulty)
        }

        if (searchTerm) {
            filtered = filtered.filter(tip =>
                tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tip.tip.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tip.example.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        return filtered
    }, [pronunciationTips, filterCategory, filterDifficulty, searchTerm])

    // Calculate analytics
    const analytics = useMemo(() => {
        if (pronunciationHistory.length === 0) {
            return {
                totalAttempts: 0,
                averageScore: 0,
                bestScore: 0,
                categoryBreakdown: {},
                progressTrend: [],
                weakAreas: []
            }
        }

        const totalAttempts = pronunciationHistory.length
        const averageScore = Math.round(pronunciationHistory.reduce((sum, h) => sum + h.score, 0) / totalAttempts)
        const bestScore = Math.max(...pronunciationHistory.map(h => h.score))

        const categoryBreakdown = pronunciationHistory.reduce((acc, h) => {
            acc[h.category] = acc[h.category] || []
            acc[h.category].push(h.score)
            return acc
        }, {})

        const progressTrend = pronunciationHistory.slice(-10).map(h => h.score)

        const weakAreas = Object.entries(categoryBreakdown)
            .map(([category, scores]) => ({
                category,
                average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            }))
            .sort((a, b) => a.average - b.average)
            .slice(0, 3)

        return {
            totalAttempts,
            averageScore,
            bestScore,
            categoryBreakdown,
            progressTrend,
            weakAreas
        }
    }, [pronunciationHistory])

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
            <header style={{ marginBottom: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Pronunciation Hub</h1>
                        <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                            Comprehensive German pronunciation training with 111+ tips & interactive practice
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button
                            className={`btn ${showSettings ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowSettings(!showSettings)}
                            style={{ padding: 'var(--space-sm)' }}
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            className={`btn ${currentSection === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setCurrentSection('analytics')}
                            style={{ padding: 'var(--space-sm)' }}
                        >
                            <BarChart3 size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Settings Panel */}
            {showSettings && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Settings size={20} />
                        Settings
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>
                                Playback Speed
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={playbackSpeed}
                                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                style={{ width: '100%' }}
                            />
                            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                {playbackSpeed.toFixed(1)}x
                            </span>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>
                                Practice Mode
                            </label>
                            <select
                                value={practiceMode}
                                onChange={(e) => setPracticeMode(e.target.value)}
                                style={{ width: '100%', padding: 'var(--space-sm)' }}
                            >
                                <option value="listen">Listen First</option>
                                <option value="record">Record Directly</option>
                                <option value="compare">Compare & Practice</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={showWaveform}
                                    onChange={(e) => setShowWaveform(e.target.checked)}
                                />
                                <span style={{ color: 'var(--color-text-secondary)' }}>Show Waveform</span>
                            </label>
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={showMouthGuide}
                                    onChange={(e) => setShowMouthGuide(e.target.checked)}
                                />
                                <span style={{ color: 'var(--color-text-secondary)' }}>Show Mouth Guide</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Section Navigation */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${currentSection === 'alphabet' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentSection('alphabet')}
                    >
                        <BookOpen size={20} />
                        German Alphabet
                    </button>
                    <button
                        className={`btn ${currentSection === 'tips' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentSection('tips')}
                    >
                        <Star size={20} />
                        Pronunciation Tips
                    </button>
                    <button
                        className={`btn ${currentSection === 'practice' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentSection('practice')}
                    >
                        <Mic size={20} />
                        Audio Practice
                    </button>
                    <button
                        className={`btn ${currentSection === 'minimalPairs' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentSection('minimalPairs')}
                    >
                        <Target size={20} />
                        Minimal Pairs
                    </button>
                    <button
                        className={`btn ${currentSection === 'tongueTwisters' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentSection('tongueTwisters')}
                    >
                        <Zap size={20} />
                        Tongue Twisters
                    </button>
                    <button
                        className={`btn ${currentSection === 'phoneticAlphabet' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentSection('phoneticAlphabet')}
                    >
                        <Ear size={20} />
                        Phonetic Alphabet
                    </button>
                </div>
            </div>

            {/* German Alphabet Section */}
            {currentSection === 'alphabet' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <BookOpen size={24} />
                        German Alphabet & Pronunciation
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: 'var(--space-md)',
                        marginTop: 'var(--space-lg)'
                    }}>
                        {germanAlphabet.map((letter, idx) => (
                            <div
                                key={idx}
                                className="card"
                                onClick={() => handleLetterSelect(letter)}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-base)',
                                    border: selectedLetter?.letter === letter.letter ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    background: selectedLetter?.letter === letter.letter ? 'var(--color-surface)' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedLetter?.letter !== letter.letter) {
                                        e.currentTarget.style.background = 'var(--color-surface-hover)'
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedLetter?.letter !== letter.letter) {
                                        e.currentTarget.style.background = 'transparent'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                    }
                                }}
                            >
                                <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
                                    <div style={{
                                        fontSize: 'var(--font-3xl)',
                                        fontWeight: 'var(--font-bold)',
                                        color: 'var(--color-primary)',
                                        marginBottom: 'var(--space-sm)'
                                    }}>
                                        {letter.letter}
                                    </div>
                                    <div style={{
                                        fontSize: 'var(--font-sm)',
                                        color: 'var(--color-text-secondary)',
                                        marginBottom: 'var(--space-xs)'
                                    }}>
                                        [{letter.pronunciation}]
                                    </div>
                                </div>

                                {selectedLetter?.letter === letter.letter && (
                                    <div style={{
                                        marginTop: 'var(--space-sm)',
                                        padding: 'var(--space-sm)',
                                        background: 'var(--color-bg-elevated)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-xs)' }}>
                                            Pronunciation Tip
                                        </h4>
                                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                            {letter.tip}
                                        </p>
                                        <div style={{ marginTop: 'var(--space-sm)' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => speakLetter(letter)}
                                                style={{ fontSize: 'var(--font-sm)' }}
                                            >
                                                <Volume2 size={16} />
                                                Hear Sound
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pronunciation Tips Section */}
            {currentSection === 'tips' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Star size={24} />
                        111+ German Pronunciation Tips
                    </h3>

                    {/* Category Filter */}
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            {['vowels', 'consonants', 'word_stress', 'intonation', 'connected_speech', 'rhythm'].map(category => (
                                <button
                                    key={category}
                                    className={`btn ${selectedTip?.category === category ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleTipSelect({ id: 0, category })}
                                    style={{ fontSize: 'var(--font-sm)' }}
                                >
                                    {category.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase(0) + char.slice(1))}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tips Display */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: 'var(--space-lg)',
                        marginTop: 'var(--space-lg)'
                    }}>
                        {filteredTips.map((tip, idx) => (
                            <div key={idx} className="card" style={{ cursor: 'pointer' }}>
                                <h4 style={{
                                    color: 'var(--color-primary)',
                                    marginBottom: 'var(--space-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)'
                                }}>
                                    <ChevronRight size={16} />
                                    {tip.title}
                                </h4>
                                <p style={{
                                    fontSize: 'var(--font-sm)',
                                    color: 'var(--color-text-secondary)',
                                    lineHeight: 1.5,
                                    marginBottom: 'var(--space-md)'
                                }}>
                                    {tip.tip}
                                </p>
                                {tip.example && (
                                    <div style={{
                                        padding: 'var(--space-sm)',
                                        background: 'var(--color-bg-elevated)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--font-sm)'
                                    }}>
                                        <strong>Example:</strong> {tip.example}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Audio Practice Section */}
            {currentSection === 'practice' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Mic size={24} />
                        Audio Pronunciation Practice
                    </h3>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                            Select a word or phrase below and practice your pronunciation with speech recognition feedback.
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: 'var(--space-md)'
                        }}>
                            {practiceWords.map((word, idx) => (
                                <div key={idx} className="card" style={{ textAlign: 'center' }}>
                                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                        {word.german}
                                    </h4>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                                        {word.english}
                                    </p>
                                    <span className="badge" style={{ background: 'hsla(45, 93%, 47%, 0.2)' }}>
                                        {word.difficulty}
                                    </span>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => startPronunciationPractice(word)}
                                        disabled={isRecording}
                                        style={{ marginTop: 'var(--space-md)' }}
                                    >
                                        {isRecording ? <Pause size={20} /> : <Mic size={20} />}
                                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Minimal Pairs Section */}
            {currentSection === 'minimalPairs' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Target size={24} />
                        Minimal Pairs Practice
                    </h3>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                            Practice distinguishing between similar German sounds. Select a pair below and practice both words.
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: 'var(--space-md)'
                        }}>
                            {minimalPairs.map((pair, idx) => (
                                <div key={idx} className="card" style={{ textAlign: 'center' }}>
                                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                        {pair.pair.join(' vs ')}
                                    </h4>
                                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                                        {pair.ipa.map((ipa, i) => (
                                            <div key={i} style={{ marginBottom: 'var(--space-xs)' }}>
                                                <strong>{pair.pair[i]}:</strong> {ipa}
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-md)' }}>
                                        {pair.tip}
                                    </p>
                                    <span className="badge" style={{ background: 'hsla(45, 93%, 47%, 0.2)' }}>
                                        {pair.category} - {pair.difficulty}
                                    </span>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => speakText(pair.pair[0])}
                                            style={{ fontSize: 'var(--font-sm)' }}
                                        >
                                            <Volume2 size={16} />
                                            Hear {pair.pair[0]}
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => speakText(pair.pair[1])}
                                            style={{ fontSize: 'var(--font-sm)' }}
                                        >
                                            <Volume2 size={16} />
                                            Hear {pair.pair[1]}
                                        </button>
                                    </div>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleMinimalPairSelect(pair)}
                                        disabled={isRecording}
                                        style={{ marginTop: 'var(--space-md)', width: '100%' }}
                                    >
                                        {isRecording ? <Pause size={20} /> : <Mic size={20} />}
                                        {isRecording ? 'Stop Recording' : 'Practice Both'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Tongue Twisters Section */}
            {currentSection === 'tongueTwisters' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Zap size={24} />
                        German Tongue Twisters
                    </h3>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                            Challenge your pronunciation with these classic German tongue twisters. Start slowly and increase speed.
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: 'var(--space-lg)'
                        }}>
                            {tongueTwisters.map((twister, idx) => (
                                <div key={idx} className="card" style={{ textAlign: 'center' }}>
                                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                        {twister.text}
                                    </h4>
                                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-sm)', fontFamily: 'monospace' }}>
                                        {twister.ipa}
                                    </div>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                                        <strong>Focus:</strong> {twister.focus}
                                    </p>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                                        {twister.translation}
                                    </p>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => speakText(twister.text)}
                                            style={{ fontSize: 'var(--font-sm)' }}
                                        >
                                            <Volume2 size={16} />
                                            Listen
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleTongueTwisterSelect(twister)}
                                            disabled={isRecording}
                                            style={{ fontSize: 'var(--font-sm)' }}
                                        >
                                            {isRecording ? <Pause size={20} /> : <Mic size={20} />}
                                            {isRecording ? 'Stop Recording' : 'Practice'}
                                        </button>
                                    </div>
                                    <span className="badge" style={{ background: 'hsla(45, 93%, 47%, 0.2)' }}>
                                        {twister.difficulty}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Phonetic Alphabet Section */}
            {currentSection === 'phoneticAlphabet' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Ear size={24} />
                        German Phonetic Alphabet (IPA)
                    </h3>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                            Learn International Phonetic Alphabet symbols used in German pronunciation.
                        </p>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                            {['vowel', 'consonant', 'diphthong'].map(category => (
                                <button
                                    key={category}
                                    className={`btn ${filterCategory === category ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilterCategory(category)}
                                    style={{ fontSize: 'var(--font-sm)' }}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 'var(--space-md)'
                        }}>
                            {phoneticAlphabet
                                .filter(symbol => filterCategory === 'all' || symbol.category === filterCategory)
                                .map((symbol, idx) => (
                                    <div key={idx} className="card" style={{ cursor: 'pointer' }}>
                                        <h4 style={{
                                            color: 'var(--color-primary)',
                                            marginBottom: 'var(--space-sm)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-sm)'
                                        }}>
                                            <span style={{ fontSize: 'var(--font-lg)', fontFamily: 'monospace' }}>
                                                {symbol.symbol}
                                            </span>
                                            <ChevronRight size={16} />
                                            {symbol.name}
                                        </h4>
                                        <p style={{
                                            fontSize: 'var(--font-sm)',
                                            color: 'var(--color-text-secondary)',
                                            lineHeight: 1.5,
                                            marginBottom: 'var(--space-md)'
                                        }}>
                                            {symbol.description}
                                        </p>
                                        <div style={{
                                            padding: 'var(--space-sm)',
                                            background: 'var(--color-bg-elevated)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--font-sm)'
                                        }}>
                                            <strong>Example:</strong> {symbol.example}
                                        </div>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handlePhoneticSymbolSelect(symbol)}
                                            style={{ marginTop: 'var(--space-sm)', width: '100%' }}
                                        >
                                            <Headphones size={16} />
                                            Practice Sound
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Dashboard */}
            {currentSection === 'analytics' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <BarChart3 size={24} />
                        Pronunciation Analytics
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                {analytics.totalAttempts}
                            </h4>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Total Attempts
                            </p>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                {analytics.averageScore}%
                            </h4>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Average Score
                            </p>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                {analytics.bestScore}%
                            </h4>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Best Score
                            </p>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                {achievements.length}
                            </h4>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Achievements
                            </p>
                        </div>
                    </div>

                    {/* Progress Trend */}
                    <div style={{ marginBottom: 'var(--space-xl)' }}>
                        <h4 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
                            Progress Trend
                        </h4>
                        <div className="card" style={{ padding: 'var(--space-lg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <Activity size={20} />
                                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                    Recent Performance: {analytics.progressTrend.length > 0 ?
                                        `${analytics.progressTrend.slice(-3).join('%, ')}%` :
                                        'No data yet'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Weak Areas */}
                    <div style={{ marginBottom: 'var(--space-xl)' }}>
                        <h4 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
                            Areas for Improvement
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
                            {analytics.weakAreas.map((area, idx) => (
                                <div key={idx} className="card" style={{ textAlign: 'center' }}>
                                    <h5 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                        {area.category}
                                    </h5>
                                    <div style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                        {area.average}%
                                    </div>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                        Average Score
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Achievements */}
                    {achievements.length > 0 && (
                        <div>
                            <h4 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
                                Recent Achievements
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                                {achievements.slice(-6).map((achievement, idx) => (
                                    <div key={idx} className="card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 'var(--font-2xl)', marginBottom: 'var(--space-sm)' }}>
                                            {achievement.icon}
                                        </div>
                                        <h5 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-xs)' }}>
                                            {achievement.title}
                                        </h5>
                                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                            {achievement.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Mouth Position Guide */}
            {showMouthGuide && selectedLetter && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    right: '20px',
                    transform: 'translateY(-50%)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 'var(--z-modal)',
                    maxWidth: '300px',
                    width: '90%'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h4 style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <Speech size={20} />
                            Mouth Position Guide
                        </h4>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowMouthGuide(false)}
                            style={{ padding: 'var(--space-xs)' }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                        <div style={{
                            fontSize: 'var(--font-4xl)',
                            color: 'var(--color-primary)',
                            marginBottom: 'var(--space-sm)'
                        }}>
                            {selectedLetter.letter}
                        </div>
                        <div style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                            {selectedLetter.mouthPosition}
                        </div>
                    </div>

                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                        <strong>Tips:</strong> {selectedLetter.tip}
                    </div>

                    <div style={{ marginTop: 'var(--space-md)' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => speakLetter(selectedLetter)}
                            style={{ width: '100%' }}
                        >
                            <Volume2 size={16} />
                            Hear Sound Again
                        </button>
                    </div>
                </div>
            )}

            {/* Waveform Visualization */}
            {showWaveform && isRecording && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 'var(--z-modal)',
                    width: '300px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
                        <h4 style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                            <Activity size={20} />
                            Recording... {recordingDuration.toFixed(1)}s
                        </h4>
                    </div>

                    <div style={{
                        height: '100px',
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${audioLevel * 100}%`,
                            background: `hsl(${120 - audioLevel * 120}, 70%, 50%)`,
                            transition: 'height 0.1s ease'
                        }} />
                    </div>

                    <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                        Audio Level: {Math.round(audioLevel * 100)}%
                    </div>
                </div>
            )}

            {/* Enhanced Pronunciation Score Modal */}
            {pronunciationScore && (
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
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: 'var(--radius-full)',
                                background: pronunciationScore.score >= 75 ? 'hsla(142, 71%, 45%, 0.2)' : 'hsla(45, 93%, 47%, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--space-lg)',
                                color: 'white'
                            }}>
                                {pronunciationScore.score >= 75 ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
                            </div>
                            <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-sm)' }}>
                                {pronunciationScore.score >= 75 ? 'Great Job!' : 'Keep Practicing!'}
                            </h3>
                            <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                                Score: <strong>{pronunciationScore.score}%</strong>
                            </p>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                                {pronunciationScore.feedback}
                            </p>

                            {/* Detailed Feedback */}
                            {pronunciationScore.detailedFeedback && pronunciationScore.detailedFeedback.length > 0 && (
                                <div style={{
                                    padding: 'var(--space-md)',
                                    background: 'var(--color-bg-elevated)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--space-lg)'
                                }}>
                                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                        Detailed Feedback
                                    </h4>
                                    {pronunciationScore.detailedFeedback.map((feedback, idx) => (
                                        <div key={idx} style={{ marginBottom: 'var(--space-xs)' }}>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>•</span> {feedback}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                <p><strong>Target:</strong> {pronunciationScore.correctCount}/{pronunciationScore.totalWords} words correct</p>
                                <p><strong>You said:</strong> "{userTranscript}"</p>
                                <p><strong>Word Accuracy:</strong> {pronunciationScore.wordAccuracy}%</p>
                                <p><strong>Phonetic Accuracy:</strong> {pronunciationScore.phoneticAccuracy}%</p>
                                <p><strong>Fluency Score:</strong> {pronunciationScore.fluencyScore}%</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                            <button className="btn btn-primary" onClick={() => setPronunciationScore(null)}>
                                Try Again
                            </button>
                            <button className="btn btn-secondary" onClick={() => setPronunciationScore(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}