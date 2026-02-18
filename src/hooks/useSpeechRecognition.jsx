import { useState, useEffect, useCallback, useRef } from 'react'

const SPEECH_ERRORS = {
  'no-speech': 'No speech was detected. Please speak clearly into your microphone.',
  'audio-capture': 'No microphone was found or microphone is not working.',
  'not-allowed': 'Microphone permission was denied. Please allow microphone access.',
  'network': 'Network error occurred. Please check your connection and try again.',
  'aborted': 'Speech recognition was cancelled.',
  'language-not-supported': 'The selected language is not supported by your browser.',
  'service-not-allowed': 'Speech recognition service is not available.',
  'bad-grammar': 'Grammar error in speech recognition.',
  'language-not-supported-by-engine': 'Language not supported by speech engine.'
}

export function useSpeechRecognition(options = {}) {
  const { 
    onError = () => {},
    onStart = () => {},
    onEnd = () => {}
  } = options

  // Use refs for callbacks to avoid stale closures
  const onStartRef = useRef(onStart)
  const onEndRef = useRef(onEnd)
  const onErrorRef = useRef(onError)

  // Keep refs updated
  useEffect(() => {
    onStartRef.current = onStart
    onEndRef.current = onEnd
    onErrorRef.current = onError
  }, [onStart, onEnd, onError])

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)
  const finalTranscriptRef = useRef('')
  const restartAttempts = useRef(0)
  const maxRestarts = 3
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        setSupported(true)
        const recognitionInstance = new SpeechRecognition()

        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = 'en-GB'
        recognitionInstance.maxAlternatives = 1

        recognitionInstance.onresult = (event) => {
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscriptRef.current += transcriptPiece + ' '
            } else {
              interimTranscript += transcriptPiece
            }
          }

          setTranscript(finalTranscriptRef.current + interimTranscript)
        }

        recognitionInstance.onstart = () => {
          setIsListening(true)
          setError(null)
          setErrorCode(null)
          restartAttempts.current = 0
          onStartRef.current()
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
          onEndRef.current()

          // Auto-restart if error was temporary
          if (errorCode === 'no-speech' && restartAttempts.current < maxRestarts) {
            restartAttempts.current++
            setTimeout(() => {
              try {
                recognitionInstance.start()
              } catch (e) {
                // Silent fail on auto-restart
              }
            }, 500)
          }
        }

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          const code = event.error
          setErrorCode(code)

          const errorMessage = SPEECH_ERRORS[code] || `Speech recognition error: ${code}`
          setError(errorMessage)

          setIsListening(false)
          onErrorRef.current(code, errorMessage)

          // Don't treat 'no-speech' as critical error
          if (code !== 'no-speech' && code !== 'aborted') {
            restartAttempts.current = maxRestarts // Prevent auto-restart
          }
        }

        setRecognition(recognitionInstance)
      } else {
        setSupported(false)
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      finalTranscriptRef.current = ''
      setTranscript('')
      setError(null)
      setErrorCode(null)
      restartAttempts.current = 0
      
      try {
        recognition.start()
      } catch (err) {
        setError('Failed to start speech recognition. Please try again.')
        console.error('Start error:', err)
      }
    }
  }, [recognition, isListening])

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try {
        recognition.stop()
      } catch (err) {
        console.error('Stop error:', err)
      }
      setIsListening(false)
    }
  }, [recognition, isListening])

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = ''
    setTranscript('')
    setError(null)
    setErrorCode(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setErrorCode(null)
  }, [])

  return {
    supported,
    isListening,
    transcript,
    error,
    errorCode,
    startListening,
    stopListening,
    resetTranscript,
    clearError,
    isError: error !== null
  }
}
