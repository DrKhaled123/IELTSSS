import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Volume2, Settings, Mic, MicOff, Sparkles, AlertCircle } from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import BilingualContainer from '../components/BilingualContainer'
import speakingTips from '../data/speaking-tips.json'

export default function Speaking() {
     const [text, setText] = useState('')
     const [selectedVoice, setSelectedVoice] = useState(null)
     const [rate, setRate] = useState(1)
     const [currentSentence, setCurrentSentence] = useState(-1)
     const [showSettings, setShowSettings] = useState(false)
     const [userTranscript, setUserTranscript] = useState('')
     const [comparisonResult, setComparisonResult] = useState(null)
     const [tips, setTips] = useState([])

     const { supported: ttsSupported, voices, speaking, speak, cancel } = useSpeechSynthesis()
     const { supported: sttSupported, isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition()

     // Select default English voice
     useEffect(() => {
          if (voices.length > 0 && !selectedVoice) {
               const englishVoice = voices.find(v => v.lang.startsWith('en-')) || voices[0]
               setSelectedVoice(englishVoice)
          }
     }, [voices, selectedVoice])

     // Update user transcript when speech recognition completes
     useEffect(() => {
          if (transcript && !isListening) {
               setUserTranscript(transcript)
               if (text) {
                    analyzePronunciation(text, transcript)
               }
          }
     }, [transcript, isListening, text])

     const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

     const handlePlay = () => {
          if (speaking) {
               cancel()
          } else {
               readText()
          }
     }

     const readText = (sentenceIndex = 0) => {
          if (sentenceIndex >= sentences.length) {
               setCurrentSentence(-1)
               return
          }

          const sentence = sentences[sentenceIndex].trim()
          setCurrentSentence(sentenceIndex)

          speak(sentence, {
               voice: selectedVoice,
               rate: rate,
               onEnd: () => {
                    setTimeout(() => {
                         readText(sentenceIndex + 1)
                    }, 300)
               },
          })
     }

     const handleRecord = () => {
          if (isListening) {
               stopListening()
          } else {
               resetTranscript()
               setUserTranscript('')
               setComparisonResult(null)
               startListening()
          }
     }

     const analyzePronunciation = (originalText, spokenText) => {
          const original = originalText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
          const spoken = spokenText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)

          const comparison = []
          const maxLength = Math.max(original.length, spoken.length)

          for (let i = 0; i < maxLength; i++) {
               if (i < original.length && i < spoken.length) {
                    if (original[i] === spoken[i]) {
                         comparison.push({ word: original[i], status: 'correct' })
                    } else {
                         comparison.push({ word: original[i], spoken: spoken[i], status: 'incorrect' })
                    }
               } else if (i < original.length) {
                    comparison.push({ word: original[i], status: 'missing' })
               } else {
                    comparison.push({ word: spoken[i], status: 'extra' })
               }
          }

          const accuracy = (comparison.filter(c => c.status === 'correct').length / original.length) * 100
          setComparisonResult({ comparison, accuracy })

          // Generate tips based on errors
          generateTips(comparison, accuracy)
     }

     const generateTips = (comparison, accuracy) => {
          const selectedTips = []
          const categories = ['pronunciation', 'intonation', 'fluency', 'vocabulary', 'grammar']

          // Select tips based on performance
          if (accuracy < 70) {
               // Focus on pronunciation
               const pronunciationTips = speakingTips.filter(t => t.category === 'pronunciation')
               selectedTips.push(...pronunciationTips.slice(0, 3))
               selectedTips.push(...speakingTips.filter(t => t.category === 'fluency').slice(0, 2))
          } else if (accuracy < 85) {
               // Mix pronunciation and intonation
               selectedTips.push(...speakingTips.filter(t => t.category === 'pronunciation').slice(0, 2))
               selectedTips.push(...speakingTips.filter(t => t.category === 'intonation').slice(0, 2))
               selectedTips.push(...speakingTips.filter(t => t.category === 'fluency').slice(0, 1))
          } else {
               // Advanced tips
               categories.forEach(cat => {
                    const catTips = speakingTips.filter(t => t.category === cat)
                    const randomTip = catTips[Math.floor(Math.random() * catTips.length)]
                    if (randomTip) selectedTips.push(randomTip)
               })
          }

          setTips(selectedTips.slice(0, 5))
     }

     const sampleText = `The IELTS speaking test evaluates your ability to communicate effectively in English. Practice regularly to improve your fluency, pronunciation, and confidence. Remember to speak clearly and at a natural pace.`

     return (
          <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
               <header style={{ marginBottom: 'var(--space-2xl)' }}>
                    <h1>Speaking Practice</h1>
                    <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                         Practice pronunciation with native voices and get instant feedback on your speaking
                    </p>
               </header>

               {!ttsSupported && (
                    <div className="card" style={{ background: 'hsla(4, 90%, 58%, 0.1)', borderColor: 'var(--color-error)', marginBottom: 'var(--space-xl)' }}>
                         <p style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              <AlertCircle size={20} />
                              Your browser doesn't support text-to-speech. Please use Chrome, Edge, or Safari.
                         </p>
                    </div>
               )}

               <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-xl)' }}>
                    {/* Text Input Section */}
                    <div className="card">
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                              <h3 style={{ margin: 0 }}>Practice Text</h3>
                              <button
                                   className="btn btn-secondary"
                                   onClick={() => setText(sampleText)}
                                   style={{ fontSize: 'var(--font-sm)' }}
                              >
                                   Load Sample
                              </button>
                         </div>

                         <textarea
                              className="input textarea"
                              placeholder="Paste or type any text here to practice pronunciation..."
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                              style={{ minHeight: '150px', fontFamily: 'inherit' }}
                         />

                         {/* Sentence Display with Highlighting */}
                         {text && sentences.length > 0 && (
                              <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-lg)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                   {sentences.map((sentence, idx) => (
                                        <span
                                             key={idx}
                                             style={{
                                                  padding: '0.25rem 0.5rem',
                                                  margin: '0.25rem',
                                                  display: 'inline-block',
                                                  borderRadius: 'var(--radius-sm)',
                                                  background: currentSentence === idx ? 'var(--color-primary)' : 'transparent',
                                                  color: currentSentence === idx ? 'white' : 'var(--color-text-secondary)',
                                                  transition: 'all var(--transition-base)',
                                             }}
                                        >
                                             {sentence.trim()}.
                                        </span>
                                   ))}
                              </div>
                         )}
                    </div>

                    {/* Playback Controls */}
                    <div className="card">
                         <h3>Text-to-Speech Controls</h3>

                         <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-lg)' }}>
                              <button
                                   className="btn btn-primary"
                                   onClick={handlePlay}
                                   disabled={!text || !ttsSupported}
                                   style={{ flex: '1', minWidth: '150px' }}
                              >
                                   {speaking ? <Pause size={20} /> : <Play size={20} />}
                                   {speaking ? 'Pause' : 'Play'}
                              </button>

                              <button
                                   className="btn btn-secondary"
                                   onClick={() => { cancel(); setCurrentSentence(-1); }}
                                   disabled={!speaking}
                                   style={{ flex: '1', minWidth: '150px' }}
                              >
                                   <RotateCcw size={20} />
                                   Reset
                              </button>

                              <button
                                   className="btn btn-secondary"
                                   onClick={() => setShowSettings(!showSettings)}
                                   style={{ flex: '1', minWidth: '150px' }}
                              >
                                   <Settings size={20} />
                                   Settings
                              </button>
                         </div>

                         {/* Settings Panel */}
                         {showSettings && (
                              <div className="animate-fadeIn" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-lg)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                   <div style={{ marginBottom: 'var(--space-md)' }}>
                                        <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 'var(--font-medium)' }}>
                                             <Volume2 size={16} style={{ display: 'inline', marginRight: 'var(--space-xs)' }} />
                                             Voice
                                        </label>
                                        <select
                                             className="input"
                                             value={selectedVoice?.name || ''}
                                             onChange={(e) => {
                                                  const voice = voices.find(v => v.name === e.target.value)
                                                  setSelectedVoice(voice)
                                             }}
                                        >
                                             {voices.filter(v => v.lang.startsWith('en-')).map(voice => (
                                                  <option key={voice.name} value={voice.name}>
                                                       {voice.name} ({voice.lang})
                                                  </option>
                                             ))}
                                        </select>
                                   </div>

                                   <div>
                                        <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 'var(--font-medium)' }}>
                                             Speed: {rate.toFixed(2)}x
                                        </label>
                                        <input
                                             type="range"
                                             min="0.5"
                                             max="2"
                                             step="0.25"
                                             value={rate}
                                             onChange={(e) => setRate(parseFloat(e.target.value))}
                                             style={{ width: '100%' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                             <span>Slow (0.5x)</span>
                                             <span>Normal (1x)</span>
                                             <span>Fast (2x)</span>
                                        </div>
                                   </div>
                              </div>
                         )}
                    </div>

                    {/* Pronunciation Checker */}
                    <div className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                         <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              <Mic size={24} />
                              Pronunciation Checker
                         </h3>

                         {!sttSupported && (
                              <div style={{ padding: 'var(--space-md)', background: 'hsla(45, 93%, 47%, 0.1)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-md)' }}>
                                   <p style={{ color: 'var(--color-warning)', margin: 0 }}>
                                        Speech recognition not supported in your browser. Try Chrome or Edge.
                                   </p>
                              </div>
                         )}

                         <p style={{ marginTop: 'var(--space-md)' }}>
                              Read the text above aloud, and we'll compare your pronunciation with the original.
                         </p>

                         <button
                              className={`btn ${isListening ? 'btn-accent' : 'btn-primary'}`}
                              onClick={handleRecord}
                              disabled={!text || !sttSupported}
                              style={{ marginTop: 'var(--space-lg)', width: '100%', padding: 'var(--space-md)' }}
                         >
                              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                              {isListening ? 'Stop Recording' : 'Start Recording'}
                         </button>

                         {userTranscript && (
                              <div className="animate-fadeIn" style={{ marginTop: 'var(--space-xl)' }}>
                                   <h4>Your Speech:</h4>
                                   <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-sm)' }}>
                                        <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>"{userTranscript}"</p>
                                   </div>
                              </div>
                         )}

                         {comparisonResult && (
                              <div className="animate-fadeIn" style={{ marginTop: 'var(--space-xl)' }}>
                                   <h4>Pronunciation Analysis:</h4>

                                   {/* Accuracy Score */}
                                   <div style={{
                                        padding: 'var(--space-lg)',
                                        background: comparisonResult.accuracy >= 85 ? 'hsla(142, 71%, 45%, 0.1)' : comparisonResult.accuracy >= 70 ? 'hsla(45, 93%, 47%, 0.1)' : 'hsla(4, 90%, 58%, 0.1)',
                                        borderRadius: 'var(--radius-lg)',
                                        marginTop: 'var(--space-md)',
                                        textAlign: 'center'
                                   }}>
                                        <div style={{
                                             fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-bold)',
                                             color: comparisonResult.accuracy >= 85 ? 'var(--color-success)' : comparisonResult.accuracy >= 70 ? 'var(--color-warning)' : 'var(--color-error)'
                                        }}>
                                             {comparisonResult.accuracy.toFixed(0)}%
                                        </div>
                                        <div style={{ color: 'var(--color-text-secondary)' }}>Accuracy</div>
                                   </div>

                                   {/* Word-by-Word Comparison */}
                                   <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                                        {comparisonResult.comparison.map((item, idx) => (
                                             <span
                                                  key={idx}
                                                  className="badge"
                                                  style={{
                                                       background: item.status === 'correct' ? 'hsla(142, 71%, 45%, 0.2)' : item.status === 'incorrect' ? 'hsla(4, 90%, 58%, 0.2)' : 'hsla(45, 93%, 47%, 0.2)',
                                                       color: item.status === 'correct' ? 'var(--color-success)' : item.status === 'incorrect' ? 'var(--color-error)' : 'var(--color-warning)',
                                                       padding: 'var(--space-xs) var(--space-sm)',
                                                  }}
                                                  title={item.spoken ? `You said: "${item.spoken}"` : undefined}
                                             >
                                                  {item.word}
                                             </span>
                                        ))}
                                   </div>
                              </div>
                         )}
                    </div>

                    {/* Speaking Tips */}
                    {tips.length > 0 && (
                         <BilingualContainer
                              title="Speaking Enhancement Tips"
                              germanContent={
                                   <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                        {tips.map((tip, idx) => (
                                             <div
                                                  key={`de-${tip.id}`}
                                                  className="animate-fadeIn"
                                                  style={{
                                                       padding: 'var(--space-md)',
                                                       background: 'rgba(255,255,255,0.5)',
                                                       borderRadius: 'var(--radius-md)',
                                                       border: '1px solid var(--color-border)',
                                                  }}
                                             >
                                                  <div style={{ fontSize: 'var(--font-xs)', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: 'var(--space-xs)' }}>
                                                       {tip.category}
                                                  </div>
                                                  <p style={{ margin: 0, marginBottom: 'var(--space-sm)', fontWeight: 'var(--font-medium)' }}>
                                                       {tip.germanTip || "Tipp nicht verfügbar."}
                                                  </p>
                                                  {tip.germanExample && (
                                                       <p style={{ margin: 0, padding: 'var(--space-sm)', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                                                            Beispiel: {tip.germanExample}
                                                       </p>
                                                  )}
                                             </div>
                                        ))}
                                   </div>
                              }
                              englishContent={
                                   <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                        {tips.map((tip, idx) => (
                                             <div
                                                  key={`en-${tip.id}`}
                                                  className="animate-fadeIn"
                                                  style={{
                                                       padding: 'var(--space-md)',
                                                       background: 'rgba(255,255,255,0.5)',
                                                       borderRadius: 'var(--radius-md)',
                                                       border: '1px solid var(--color-border)',
                                                  }}
                                             >
                                                  <div style={{ fontSize: 'var(--font-xs)', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 'bold', marginBottom: 'var(--space-xs)' }}>
                                                       {tip.category}
                                                  </div>
                                                  <p style={{ margin: 0, marginBottom: 'var(--space-sm)', fontWeight: 'var(--font-medium)' }}>
                                                       {tip.tip}
                                                  </p>
                                                  {tip.example && (
                                                       <p style={{ margin: 0, padding: 'var(--space-sm)', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                                                            Example: {tip.example}
                                                       </p>
                                                  )}
                                             </div>
                                        ))}
                                   </div>
                              }
                         />
                    )}
               </div>
          </div>
     )
}
