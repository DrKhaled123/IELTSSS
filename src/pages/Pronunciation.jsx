import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Mic, Volume2, Play, Pause, RotateCcw, BookOpen, Brain, Star, ChevronRight, X, Loader2, CheckCircle, AlertCircle, Award, TrendingUp, Users, Headphones, FileText, Settings, BarChart3, Activity, Zap, Target, Eye, Ear, Speech } from 'lucide-react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAdvancedSpeechRecognition } from '../hooks/useAdvancedSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useSharedData } from '../hooks/useSharedData'

// Import English pronunciation database
import pronunciationDatabase from '../data/pronunciation-database.json'

const Pronunciation = memo(function Pronunciation() {
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
        lang: 'en-US',
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
    const alphabet = useMemo(() => pronunciationDatabase.alphabet, [])
    const pronunciationTips = useMemo(() => pronunciationDatabase.pronunciationTips, [])
    const minimalPairs = useMemo(() => pronunciationDatabase.minimalPairs, [])
    const tongueTwisters = useMemo(() => pronunciationDatabase.tongueTwisters, [])
    const phoneticAlphabet = useMemo(() => pronunciationDatabase.phoneticAlphabet, [])

    // Enhanced practice words with difficulty levels - memoized for performance
    const practiceWords = useMemo(() => [
        { word: 'Good morning', translation: 'صباح الخير', difficulty: 'A1', category: 'greetings' },
        { word: 'How are you?', translation: 'كيف حالك؟', difficulty: 'A1', category: 'greetings' },
        { word: 'Excuse me', translation: 'عفواً', difficulty: 'A1', category: 'politeness' },
        { word: 'Thank you very much', translation: 'شكراً جزيلاً', difficulty: 'A1', category: 'politeness' },
        { word: 'I don\'t understand', translation: 'لا أفهم', difficulty: 'A2', category: 'communication' },
        { word: 'Could you help me?', translation: 'هل يمكنك مساعدتي؟', difficulty: 'A2', category: 'requests' },
        { word: 'I would like to', translation: 'أود أن', difficulty: 'B1', category: 'requests' },
        { word: 'Sorry for the interruption', translation: 'آسف للمقاطعة', difficulty: 'B2', category: 'politeness' },
        { word: 'That is complicated', translation: 'هذا معقد', difficulty: 'B2', category: 'opinions' },
        { word: 'I have understood', translation: 'لقد فهمت', difficulty: 'C1', category: 'communication' }
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
            lang: 'en-US'
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
            targetText = selectedLetter.word
            targetCategory = 'alphabet'
        } else if (currentSection === 'practice') {
            targetText = typeof selectedLetter === 'object' ? selectedLetter.word : selectedLetter
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
    const calculatePronunciationScore = (userTranscript, targetText) => {
        const userWords = userTranscript.toLowerCase().split(/\s+/)
        const targetWords = targetText.toLowerCase().split(/\s+/)

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
        const targetPhonemes = extractPhonemes(targetText)
        const phoneticMatches = userPhonemes.filter(phoneme => targetPhonemes.includes(phoneme)).length
        phoneticAccuracy = targetPhonemes.length > 0 ? (phoneticMatches / targetPhonemes.length) * 100 : 0

        // Fluency score based on recording duration
        const expectedDuration = targetText.length * 0.2 // rough estimate
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
        return text.toLowerCase().match(/[a-zäöüß]/g) || []
    }

    // Enhanced feedback generation
    const generateFeedback = (score) => {
        if (score >= 95) return 'Excellent! Native-like!'
        if (score >= 85) return 'Very good!'
        if (score >= 75) return 'Good!'
        if (score >= 60) return 'Fair.'
        return 'Needs improvement.'
    }

    // Generate detailed feedback
    const generateDetailedFeedback = (wordAccuracy, phoneticAccuracy, fluencyScore) => {
        const feedback = []
        if (wordAccuracy < 80) feedback.push('Focus on word accuracy')
        if (phoneticAccuracy < 80) feedback.push('Work on individual sounds')
        if (fluencyScore < 80) feedback.push('Practice speaking more fluently')
        return feedback
    }

    // Check for achievements
    const checkAchievements = (score, category) => {
        const newAchievements = []
        if (score >= 95 && !achievements.find(a => a.id === 'first_perfect')) {
            newAchievements.push({
                id: 'first_perfect',
                title: 'Perfect Pronunciation',
                description: 'Achieved 95%+ accuracy',
                icon: '🏆',
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
            const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0]
            speak(text, {
                rate: playbackSpeed,
                voice: englishVoice,
                ...options
            })
        }
    }, [speak, voices, playbackSpeed])

    // Speak letter
    const speakLetter = useCallback((letter) => {
        if (letter && voices.length > 0) {
            const englishVoice = voices.find(v => v.lang.startsWith('en'))
            speak(letter.word, {
                rate: 0.7,
                voice: englishVoice
            })
        }
    }, [speak, voices])

    // Filter tips by category and difficulty
    const filteredTips = useMemo(() => {
        let filtered = pronunciationTips
        if (filterCategory !== 'all') filtered = filtered.filter(tip => tip.category === filterCategory)
        if (filterDifficulty !== 'all') filtered = filtered.filter(tip => tip.difficulty === filterDifficulty)
        return filtered
    }, [pronunciationTips, filterCategory, filterDifficulty])

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
            <header>
                <h1>Pronunciation Hub</h1>
            </header>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
                {['alphabet', 'tips', 'practice', 'minimalPairs', 'tongueTwisters', 'phoneticAlphabet'].map(section => (
                    <button
                        key={section}
                        className={`btn ${currentSection === section ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentSection(section)}
                    >
                        {section.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Content would go here... simplified for brevity but maintaining structure */}
            <div className="card">
                <h3>{currentSection.toUpperCase()} Section</h3>
                <p>Interactive practice content for {currentSection}.</p>
                {currentSection === 'alphabet' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 'var(--space-md)' }}>
                        {alphabet.map((letter, idx) => (
                            <button key={idx} className="btn btn-outline" onClick={() => handleLetterSelect(letter)}>
                                {letter.letter}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {pronunciationScore && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Score: {pronunciationScore.score}%</h3>
                        <p>{pronunciationScore.feedback}</p>
                        <button className="btn btn-primary" onClick={() => setPronunciationScore(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    )
})

export default Pronunciation
