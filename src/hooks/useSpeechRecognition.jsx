import { useState, useEffect, useCallback, useRef } from 'react'

export function useSpeechRecognition() {
     const [isListening, setIsListening] = useState(false)
     const [transcript, setTranscript] = useState('')
     const [supported, setSupported] = useState(false)
     const [recognition, setRecognition] = useState(null)
     const finalTranscriptRef = useRef('')

     useEffect(() => {
          if (typeof window !== 'undefined') {
               const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

               if (SpeechRecognition) {
                    setSupported(true)
                    const recognitionInstance = new SpeechRecognition()

                    // Enable continuous recording for longer duration (up to 60 seconds or more)
                    recognitionInstance.continuous = true
                    recognitionInstance.interimResults = true
                    recognitionInstance.lang = 'de-DE'
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

                    recognitionInstance.onend = () => {
                         setIsListening(false)
                    }

                    recognitionInstance.onerror = (event) => {
                         console.error('Speech recognition error:', event.error)
                         setIsListening(false)
                    }

                    setRecognition(recognitionInstance)
               }
          }
     }, [])

     const startListening = useCallback(() => {
          if (recognition && !isListening) {
               finalTranscriptRef.current = ''
               setTranscript('')
               recognition.start()
               setIsListening(true)
          }
     }, [recognition, isListening])

     const stopListening = useCallback(() => {
          if (recognition && isListening) {
               recognition.stop()
               setIsListening(false)
          }
     }, [recognition, isListening])

     const resetTranscript = useCallback(() => {
          finalTranscriptRef.current = ''
          setTranscript('')
     }, [])

     return {
          supported,
          isListening,
          transcript,
          startListening,
          stopListening,
          resetTranscript,
     }
}
