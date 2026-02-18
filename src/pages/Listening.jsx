import { useState, useCallback, useEffect, memo } from 'react'
import {
     Headphones,
     Play,
     Pause,
     Volume2,
     BookOpen,
     ExternalLink,
     Settings2,
     RotateCcw,
     Gauge,
     FastForward,
     Rewind,
     Repeat
} from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { IELTSTimerDisplay } from '../hooks/useIELTSTimer'
import listeningScripts from '../data/listening-scripts.json'
import podcasts from '../data/podcasts.json'

const Listening = memo(function Listening() {
     const safeScripts = Array.isArray(listeningScripts) ? listeningScripts : []
     const [selectedScript, setSelectedScript] = useState(null)
     const [currentWordIndex, setCurrentWordIndex] = useState(-1)
     const [hoveredVocab, setHoveredVocab] = useState(null)
     const [playbackSpeed, setPlaybackSpeed] = useState(1.1)
     const [isRepeating, setIsRepeating] = useState(false)

     const { supported, voices, speaking, speak, cancel, getEnglishVoice } = useSpeechSynthesis()

     const handlePlayScript = useCallback((script) => {
          if (speaking) {
               cancel()
               setCurrentWordIndex(-1)
          } else {
               const words = (script?.script || '').split(/\s+/).filter(Boolean)
               let wordIdx = 0

               const englishVoice = getEnglishVoice() || voices.find(v => v.lang.startsWith('en-GB')) || voices[0]

               const speakWord = () => {
                    if (wordIdx < words.length) {
                         setCurrentWordIndex(wordIdx)
                         speak(words[wordIdx], {
                              voice: englishVoice,
                              rate: playbackSpeed,
                              pitch: 1.0,
                              onEnd: () => {
                                   wordIdx++
                                   const delay = isRepeating ? 120 : 30 / playbackSpeed
                                   setTimeout(speakWord, delay)
                              }
                         })
                    } else {
                         if (isRepeating) {
                              wordIdx = 0
                              setTimeout(speakWord, 1000)
                         } else {
                              setCurrentWordIndex(-1)
                         }
                    }
               }
               speakWord()
          }
     }, [speaking, cancel, getEnglishVoice, voices, playbackSpeed, isRepeating, speak])

     const getDifficultyColor = (difficulty) => {
          const colors = {
               'B1': 'var(--color-info)',
               'B2': 'var(--color-secondary)',
               'C1': 'var(--color-warning)',
               'C2': 'var(--color-error)'
          }
          return colors[difficulty] || 'var(--color-primary)'
     }

     return (
          <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
               <header style={{ marginBottom: 'var(--space-2xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                         <div>
                              <h1>Academic Listening Lab</h1>
                              <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                                   Master IELTS listening with interactive transcripts and high-quality expert pronunciation
                              </p>
                         </div>
                         <IELTSTimerDisplay section="listening" size="medium" showControls={true} />
                    </div>
               </header>

               <div className="card" style={{ marginBottom: 'var(--space-xl)', borderColor: 'var(--color-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              <Settings2 size={24} style={{ color: 'var(--color-primary)' }} />
                              <h3 style={{ margin: 0 }}>Audio Control Panel</h3>
                         </div>

                         <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                   <Gauge size={20} />
                                   <input
                                        type="range"
                                        min="0.5"
                                        max="1.5"
                                        step="0.1"
                                        value={playbackSpeed}
                                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                   />
                                   <span style={{ fontWeight: 'bold' }}>{playbackSpeed}x</span>
                              </div>

                              <button
                                   className={`btn ${isRepeating ? 'btn-primary' : 'btn-outline'}`}
                                   onClick={() => setIsRepeating(!isRepeating)}
                              >
                                   <Repeat size={18} />
                                   {isRepeating ? 'Repeating ON' : 'Repeat'}
                              </button>

                              <button className="btn btn-outline" onClick={() => { cancel(); setCurrentWordIndex(-1); }}>
                                   <RotateCcw size={18} />
                                   Reset
                              </button>
                         </div>
                    </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-xl)' }}>
                    <div>
                         {selectedScript ? (
                              <div className="card animate-fadeIn" style={{ border: '2px solid var(--color-primary)' }}>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                        <div>
                                             <h2 style={{ margin: 0 }}>{selectedScript.title}</h2>
                                             <span className="badge" style={{ background: `${getDifficultyColor(selectedScript.difficulty)}33`, color: getDifficultyColor(selectedScript.difficulty) }}>
                                                  {selectedScript.difficulty}
                                             </span>
                                        </div>
                                        <button className="btn btn-primary" onClick={() => handlePlayScript(selectedScript)}>
                                             {speaking ? <Pause size={24} /> : <Play size={24} />}
                                             {speaking ? 'Stop' : 'Play Interactive Audio'}
                                        </button>
                                   </div>

                                   <div style={{
                                        padding: 'var(--space-xl)',
                                        background: 'var(--color-bg-primary)',
                                        borderRadius: 'var(--radius-lg)',
                                        lineHeight: 2.0,
                                        fontSize: 'var(--font-xl)',
                                        border: '1px solid var(--color-border)'
                                   }}>
                                        {(selectedScript.script || '').split(/\s+/).map((word, idx) => {
                                             const highlights = selectedScript.vocabularyHighlights || []
                                             const vocabItem = highlights.find(v => word.toLowerCase().includes(v.word.toLowerCase()))
                                             return (
                                                  <span
                                                       key={idx}
                                                       onMouseEnter={() => vocabItem && setHoveredVocab(vocabItem)}
                                                       onMouseLeave={() => setHoveredVocab(null)}
                                                       style={{
                                                            background: currentWordIndex === idx ? 'var(--color-primary)' : 'transparent',
                                                            color: currentWordIndex === idx ? 'white' : 'inherit',
                                                            padding: '2px 4px',
                                                            borderRadius: 'var(--radius-sm)',
                                                            borderBottom: vocabItem ? `2px solid ${getDifficultyColor(vocabItem.level)}` : 'none',
                                                            marginRight: '4px',
                                                            display: 'inline-block'
                                                       }}
                                                  >
                                                       {word}
                                                  </span>
                                             )
                                        })}
                                   </div>

                                   {hoveredVocab && (
                                        <div className="card" style={{ marginTop: 'var(--space-lg)', background: 'var(--gradient-primary)', color: 'white' }}>
                                             <h4>{hoveredVocab.word} ({hoveredVocab.arabic})</h4>
                                             <p>{hoveredVocab.meaning}</p>
                                        </div>
                                   )}
                              </div>
                         ) : (
                              <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                   <Headphones size={64} style={{ opacity: 0.2 }} />
                                   <h2>Select a Script to Begin</h2>
                              </div>
                         )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                         <h3>Script Library</h3>
                         {safeScripts.map(script => (
                              <div
                                   key={script.id}
                                   className="card"
                                   style={{ padding: 'var(--space-md)', cursor: 'pointer' }}
                                   onClick={() => { setSelectedScript(script); cancel(); setCurrentWordIndex(-1); }}
                              >
                                   <h4 style={{ margin: 0 }}>{script.title}</h4>
                              </div>
                         ))}
                    </div>
               </div>
          </div>
     )
})

export default Listening
