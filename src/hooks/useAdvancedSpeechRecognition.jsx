import { useState, useEffect, useCallback, useRef } from 'react'

export function useAdvancedSpeechRecognition(options = {}) {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [confidence, setConfidence] = useState(0)
    const [isSupported, setIsSupported] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0)
    const [pitch, setPitch] = useState(0)
    const [speakingRate, setSpeakingRate] = useState(0)
    const [wordTimings, setWordTimings] = useState([])
    
    const recognitionRef = useRef(null)
    const audioContextRef = useRef(null)
    const analyserRef = useRef(null)
    const microphoneRef = useRef(null)
    const animationFrameRef = useRef(null)
    const streamRef = useRef(null) // Track the media stream for cleanup

    // Initialize speech recognition with enhanced features
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const AudioContext = window.AudioContext || window.webkitAudioContext
            
            if (SpeechRecognition && AudioContext) {
                setIsSupported(true)
                
                const recognition = new SpeechRecognition()
                recognitionRef.current = recognition
                
                // Configure recognition for IELTS English
                recognition.continuous = options.continuous || false
                recognition.interimResults = options.interimResults !== false
                recognition.maxAlternatives = options.maxAlternatives || 3
                recognition.lang = options.lang || 'en-GB'
                
                // Set up audio context for analysis
                audioContextRef.current = new AudioContext()
                analyserRef.current = audioContextRef.current.createAnalyser()
                analyserRef.current.fftSize = 2048
                
                recognition.onstart = () => {
                    setIsListening(true)
                    setTranscript('')
                    setConfidence(0)
                    setWordTimings([])
                    
                    if (options.onStart) {
                        options.onStart()
                    }
                }
                
                recognition.onresult = (event) => {
                    let finalTranscript = ''
                    let maxConfidence = 0
                    let currentWordTiming = null
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i]
                        
                        if (result.isFinal) {
                            finalTranscript += result[0].transcript + ' '
                            maxConfidence = Math.max(maxConfidence, result[0].confidence)
                            
                            // Track word timing
                            if (options.trackWordTiming) {
                                currentWordTiming = {
                                    word: result[0].transcript,
                                    confidence: result[0].confidence,
                                    timestamp: Date.now()
                                }
                            }
                        }
                    }
                    
                    setTranscript(finalTranscript.trim())
                    setConfidence(Math.round(maxConfidence * 100))
                    
                    if (currentWordTiming && options.trackWordTiming) {
                        setWordTimings(prev => [...prev, currentWordTiming])
                    }
                    
                    if (options.onResult) {
                        options.onResult({
                            transcript: finalTranscript.trim(),
                            confidence: maxConfidence,
                            results: event.results
                        })
                    }
                }
                
                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error)
                    
                    if (options.onError) {
                        options.onError(event.error)
                    }
                }
                
                recognition.onend = () => {
                    setIsListening(false)
                    
                    if (options.onEnd) {
                        options.onEnd()
                    }
                }
                
                // Set up audio level monitoring
                if (options.monitorAudioLevel) {
                    navigator.mediaDevices.getUserMedia({ audio: true })
                        .then(stream => {
                            streamRef.current = stream // Store stream for cleanup
                            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
                            microphoneRef.current.connect(analyserRef.current)
                            
                            const updateAudioLevel = () => {
                                if (analyserRef.current && isListening) {
                                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
                                    analyserRef.current.getByteFrequencyData(dataArray)
                                    
                                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
                                    setAudioLevel(average / 255)
                                    
                                    // Calculate pitch (simplified)
                                    const pitchValue = calculatePitch(dataArray)
                                    setPitch(pitchValue)
                                    
                                    // Calculate speaking rate
                                    const rateValue = calculateSpeakingRate(wordTimings)
                                    setSpeakingRate(rateValue)
                                }
                                
                                if (isListening) {
                                    animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
                                }
                            }
                            
                            updateAudioLevel()
                        })
                        .catch(error => {
                            console.error('Error accessing microphone:', error)
                        })
                }
            }
        }
    }, []) // Empty deps - options are accessed via ref in callbacks

    // Calculate pitch from audio data (simplified)
    const calculatePitch = (dataArray) => {
        // This is a simplified pitch calculation
        // In a real implementation, you'd use more sophisticated algorithms
        let sum = 0
        for (let i = 0; i < dataArray.length / 2; i++) {
            sum += Math.abs(dataArray[i] - 128)
        }
        return sum / (dataArray.length / 2)
    }

    // Calculate speaking rate
    const calculateSpeakingRate = (timings) => {
        if (timings.length < 2) return 0
        
        const recentTimings = timings.slice(-5)
        if (recentTimings.length < 2) return 0
        
        const timeDiffs = []
        for (let i = 1; i < recentTimings.length; i++) {
            const diff = recentTimings[i].timestamp - recentTimings[i-1].timestamp
            timeDiffs.push(diff)
        }
        
        const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
        const wordsPerMinute = avgTimeDiff > 0 ? (60000 / avgTimeDiff) : 0
        
        return Math.round(wordsPerMinute * 10) / 10 // Convert to words per 10 seconds
    }

    // Start listening
    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (error) {
                console.error('Error starting speech recognition:', error)
            }
        }
    }, [isListening])

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop()
                setIsListening(false)
                
                // Cancel animation frame
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current)
                }
            } catch (error) {
                console.error('Error stopping speech recognition:', error)
            }
        }
    }, [isListening])

    // Reset recognition
    const resetTranscript = useCallback(() => {
        setTranscript('')
        setConfidence(0)
        setWordTimings([])
        setAudioLevel(0)
        setPitch(0)
        setSpeakingRate(0)
    }, [])

    // Get pronunciation accuracy score
    const calculateAccuracy = useCallback((targetText, userText) => {
        if (!targetText || !userText) return 0
        
        const targetWords = targetText.toLowerCase().split(/\s+/).filter(word => word.length > 0)
        const userWords = userText.toLowerCase().split(/\s+/).filter(word => word.length > 0)
        
        if (targetWords.length === 0) return 0
        
        let correctWords = 0
        for (const targetWord of targetWords) {
            if (userWords.includes(targetWord)) {
                correctWords++
            }
        }
        
        const accuracy = (correctWords / targetWords.length) * 100
        
        // Bonus points for confidence
        const confidenceBonus = confidence > 80 ? 10 : 0
        
        return Math.min(100, accuracy + confidenceBonus)
    }, [confidence])

    // Get pronunciation feedback
    const getPronunciationFeedback = useCallback((accuracy) => {
        if (accuracy >= 95) {
            return {
                level: 'excellent',
                message: 'Excellent! Native-like pronunciation.',
                color: '#10b981',
                tips: ['Your pronunciation is nearly perfect', 'Keep up the great work!']
            }
        } else if (accuracy >= 85) {
            return {
                level: 'very-good',
                message: 'Very good! Clear and accurate.',
                color: '#22c55e',
                tips: ['Your pronunciation is clear and understandable', 'Focus on fine-tuning difficult sounds']
            }
        } else if (accuracy >= 75) {
            return {
                level: 'good',
                message: 'Good! Keep practicing.',
                color: '#f59e0b',
                tips: ['Your pronunciation is good', 'Practice more to improve clarity']
            }
        } else if (accuracy >= 60) {
            return {
                level: 'fair',
                message: 'Fair. Focus on problem sounds.',
                color: '#f97316',
                tips: ['Your pronunciation needs improvement', 'Listen carefully and try again']
            }
        } else {
            return {
                level: 'poor',
                message: 'Needs improvement. Listen carefully and try again.',
                color: '#ef4444',
                tips: ['Your pronunciation needs significant improvement', 'Consider working with a language partner']
            }
        }
    }, [])

    // Cleanup
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
            
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
            
            if (microphoneRef.current) {
                microphoneRef.current.disconnect()
            }
            
            // Stop all tracks in the media stream to release microphone
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
            
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [])

    return {
        isListening,
        transcript,
        confidence,
        isSupported,
        audioLevel,
        pitch,
        speakingRate,
        wordTimings,
        startListening,
        stopListening,
        resetTranscript,
        calculateAccuracy,
        getPronunciationFeedback
    }
}