import { useState, useEffect, useCallback, useRef } from 'react'

export function useSpeechSynthesis() {
     const [voices, setVoices] = useState([])
     const [speaking, setSpeaking] = useState(false)
     const [supported, setSupported] = useState(false)
     const [currentWordIndex, setCurrentWordIndex] = useState(-1)
     const utteranceRef = useRef(null)
     const timeoutRef = useRef(null)

     useEffect(() => {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined') {
               setSupported(true)

               const loadVoices = () => {
                    const availableVoices = window.speechSynthesis.getVoices()
                    setVoices(availableVoices)
               }

               loadVoices()

               if (window.speechSynthesis.onvoiceschanged !== undefined) {
                    window.speechSynthesis.onvoiceschanged = loadVoices
               }
          }
     }, [])

     const speak = useCallback((text, options = {}) => {
          if (!supported || typeof window === 'undefined' || typeof window.SpeechSynthesisUtterance === 'undefined') return

          // Clear any existing timeouts
          if (timeoutRef.current) {
               clearTimeout(timeoutRef.current)
          }

          window.speechSynthesis.cancel()

          const utterance = new window.SpeechSynthesisUtterance(text)
          utteranceRef.current = utterance

          if (options.voice) {
               utterance.voice = options.voice
          } else if (options.lang) {
               let voice = null
               if (options.lang.startsWith('en')) {
                    voice =
                         voices.find(v => v.lang === 'en-GB') ||
                         voices.find(v => v.lang === 'en_US' || v.lang === 'en-US') ||
                         voices.find(v => v.lang.startsWith('en') && !/en-?IN/i.test(v.lang)) ||
                         voices.find(v => v.lang.startsWith('en')) ||
                         voices[0]
               } else {
                    voice = voices.find(v => v.lang.startsWith(options.lang)) || voices[0]
               }
               utterance.voice = voice
          }

          utterance.rate = options.rate || 1.15
          utterance.pitch = options.pitch || 1
          utterance.volume = options.volume || 1
          utterance.lang = options.lang || 'en-GB'

          utterance.onstart = () => {
               setSpeaking(true)
               if (options.onStart) options.onStart()
          }

          utterance.onend = () => {
               setSpeaking(false)
               setCurrentWordIndex(-1)
               if (options.onEnd) options.onEnd()
          }

          utterance.onerror = (event) => {
               setSpeaking(false)
               setCurrentWordIndex(-1)
               if (options.onError) options.onError(event)
          }

          // Add word boundary event for better synchronization
          utterance.onboundary = (event) => {
               if (options.onWordBoundary && event.name === 'word') {
                    options.onWordBoundary(event)
               }
          }

          window.speechSynthesis.speak(utterance)
     }, [supported, voices])

     // Enhanced speak with word-by-word highlighting
     const speakWithHighlighting = useCallback((words, options = {}) => {
          if (!supported || !words.length) return

          // Clear any existing timeouts
          if (timeoutRef.current) {
               clearTimeout(timeoutRef.current)
          }

          window.speechSynthesis.cancel()
          setSpeaking(true)

          let wordIndex = 0
          const baseDelay = options.baseDelay || 50
          const rate = options.rate || 1

          const speakNextWord = () => {
               if (wordIndex < words.length && !window.speechSynthesis.paused) {
                    setCurrentWordIndex(wordIndex)

                    // Update current word position callback
                    if (options.onWordChange) {
                         options.onWordChange(wordIndex, words[wordIndex])
                    }

                    const wordDelay = Math.max(baseDelay, words[wordIndex].length * 35) / rate

                    speak(words[wordIndex], {
                         voice: options.voice,
                         rate: rate,
                         lang: options.lang || 'en-GB',
                         onEnd: () => {
                              wordIndex++
                              timeoutRef.current = setTimeout(speakNextWord, wordDelay)
                         }
                    })
               } else {
                    // Finished speaking
                    setSpeaking(false)
                    setCurrentWordIndex(-1)
                    if (options.onEnd) options.onEnd()
               }
          }

          speakNextWord()
     }, [supported, speak])

     // Speak sentence by sentence
     const speakBySentences = useCallback((sentences, options = {}) => {
          if (!supported || !sentences.length) return

          // Clear any existing timeouts
          if (timeoutRef.current) {
               clearTimeout(timeoutRef.current)
          }

          window.speechSynthesis.cancel()
          setSpeaking(true)

          let sentenceIndex = 0
          const baseDelay = options.baseDelay || 120
          const rate = options.rate || 1

          const speakNextSentence = () => {
               if (sentenceIndex < sentences.length && !window.speechSynthesis.paused) {
                    // Update current sentence position callback
                    if (options.onSentenceChange) {
                         options.onSentenceChange(sentenceIndex, sentences[sentenceIndex])
                    }

                    speak(sentences[sentenceIndex], {
                         voice: options.voice,
                         rate: rate,
                         lang: options.lang || 'en-GB',
                         onEnd: () => {
                              sentenceIndex++
                              timeoutRef.current = setTimeout(speakNextSentence, baseDelay / rate)
                         }
                    })
               } else {
                    // Finished speaking
                    setSpeaking(false)
                    if (options.onEnd) options.onEnd()
               }
          }

          speakNextSentence()
     }, [supported, speak])

     const cancel = useCallback(() => {
          if (supported) {
               if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
               }
               window.speechSynthesis.cancel()
               setSpeaking(false)
               setCurrentWordIndex(-1)
          }
     }, [supported])

     const pause = useCallback(() => {
          if (supported) {
               window.speechSynthesis.pause()
          }
     }, [supported])

     const resume = useCallback(() => {
          if (supported) {
               window.speechSynthesis.resume()
          }
     }, [supported])



     // Get Arabic voice
     const getArabicVoice = useCallback(() => {
          return voices.find(v => v.lang.startsWith('ar')) || voices[0]
     }, [voices])

     // Get English voice
     const getEnglishVoice = useCallback(() => {
          return (
               voices.find(v => v.lang === 'en-GB') ||
               voices.find(v => v.lang === 'en_US' || v.lang === 'en-US') ||
               voices.find(v => v.lang.startsWith('en') && !/en-?IN/i.test(v.lang)) ||
               voices.find(v => v.lang.startsWith('en')) ||
               voices[0]
          )
     }, [voices])

     return {
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

          getArabicVoice,
          getEnglishVoice,
     }
}
