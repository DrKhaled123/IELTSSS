import { useState, useEffect, useCallback, useRef } from 'react'

// Model path - using CDN for better reliability with local fallback
const MODEL_URL_CDN = 'https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-us-0.15.tar.gz'
const MODEL_URL_LOCAL = '/models/vosk-model-small-en-us-0.15.tar.gz'

export function useVoskRecognition() {
    const [isReady, setIsReady] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [partialTranscript, setPartialTranscript] = useState('')
    const [error, setError] = useState(null)
    const [status, setStatus] = useState('initializing') // initializing, ready, listening, processing, error
    const [reloadKey, setReloadKey] = useState(0)

    const modelRef = useRef(null)
    const recognizerRef = useRef(null)
    const audioContextRef = useRef(null)
    const sourceRef = useRef(null)
    const processorRef = useRef(null)

    // Initialize Vosk
    useEffect(() => {
        const initVosk = async () => {
            try {
                setStatus('initializing')
                setError(null)
                setIsReady(false)
                
                // Dynamically import vosk-browser only when needed
                const Vosk = await import('vosk-browser')
                
                let model
                try {
                    // Try CDN first
                    console.log('Loading Vosk model from CDN...')
                    model = await Vosk.createModel(MODEL_URL_CDN)
                } catch (cdnError) {
                    console.warn('CDN model load failed, falling back to local:', cdnError)
                    // Fallback to local
                    model = await Vosk.createModel(MODEL_URL_LOCAL)
                }
                
                modelRef.current = model
                
                const recognizer = new model.Recognizer()
                recognizerRef.current = recognizer
                
                recognizer.on('result', (message) => {
                    if (message.result && message.result.text) {
                        setTranscript(prev => {
                            const newText = prev + ' ' + message.result.text
                            return newText.trim()
                        })
                        setPartialTranscript('')
                    }
                })

                recognizer.on('partialresult', (message) => {
                    if (message.partial) {
                        setPartialTranscript(message.partial)
                    }
                })

                setIsReady(true)
                setStatus('ready')
            } catch (err) {
                console.error('Failed to load Vosk model:', err)
                setError('Speech recognition model failed to load. Check connection or refresh. Text-to-speech still works.')
                setStatus('error')
            }
        }

        initVosk()

        return () => {
            if (recognizerRef.current) {
                recognizerRef.current.free()
            }
            if (modelRef.current) {
                modelRef.current.free()
            }
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [reloadKey])

    const reloadModel = useCallback(() => {
        setReloadKey(prev => prev + 1)
    }, [])

    const startListening = useCallback(async () => {
        if (!isReady || !recognizerRef.current) return

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1,
                    sampleRate: 16000
                }
            })

            const AudioCtor = window.AudioContext || window.webkitAudioContext
            const audioContext = new AudioCtor({ sampleRate: 16000 })
            audioContextRef.current = audioContext

            const source = audioContext.createMediaStreamSource(stream)
            sourceRef.current = source

            // Create processor
            const processor = audioContext.createScriptProcessor(4096, 1, 1)
            processorRef.current = processor

            processor.onaudioprocess = (event) => {
                if (recognizerRef.current) {
                    try {
                        const inputBuffer = event.inputBuffer.getChannelData(0)
                        recognizerRef.current.acceptWaveform(inputBuffer)
                    } catch (err) {
                        console.error('Processing error:', err)
                    }
                }
            }

            source.connect(processor)
            processor.connect(audioContext.destination)

            setIsListening(true)
            setStatus('listening')
            setTranscript('')
            setPartialTranscript('')
            setError(null)

        } catch (err) {
            console.error('Microphone error:', err)
            setError('Could not access microphone. Please allow permissions.')
            setStatus('error')
        }
    }, [isReady])

    const stopListening = useCallback(() => {
        if (!isListening) return

        if (processorRef.current) {
            processorRef.current.disconnect()
            processorRef.current = null
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect()
            sourceRef.current = null
        }
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }

        setIsListening(false)
        setStatus('ready')
        
        // Finalize transcript
        // Note: Vosk usually sends a final result event, but we ensure state is clean
    }, [isListening])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setPartialTranscript('')
    }, [])

    return {
        isReady,
        isListening,
        transcript: (transcript + ' ' + partialTranscript).trim(),
        finalTranscript: transcript,
        startListening,
        stopListening,
        resetTranscript,
        reloadModel,
        status,
        error
    }
}
