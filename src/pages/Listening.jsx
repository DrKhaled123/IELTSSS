import { useState } from 'react'
import { Headphones, Play, Pause, Volume2, BookOpen, ExternalLink, ChevronRight } from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import listeningScripts from '../data/listening-scripts.json'
import podcasts from '../data/podcasts.json'

export default function Listening() {
     const [selectedScript, setSelectedScript] = useState(null)
     const [currentWordIndex, setCurrentWordIndex] = useState(-1)
     const [hoveredVocab, setHoveredVocab] = useState(null)
     const { supported, voices, speaking, speak, cancel } = useSpeechSynthesis()

     const handlePlayScript = (script) => {
          if (speaking) {
               cancel()
               setCurrentWordIndex(-1)
          } else {
               const words = script.script.split(' ')
               let wordIdx = 0

               const speakWord = () => {
                    if (wordIdx < words.length) {
                         setCurrentWordIndex(wordIdx)
                         speak(words[wordIdx], {
                              voice: voices.find(v => v.lang.startsWith('en-')) || voices[0],
                              rate: 0.9,
                              onEnd: () => {
                                   wordIdx++
                                   setTimeout(speakWord, 100)
                              }
                         })
                    } else {
                         setCurrentWordIndex(-1)
                    }
               }
               speakWord()
          }
     }

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
                    <h1>Listening Practice</h1>
                    <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                         Improve your listening skills with interactive transcripts and vocabulary highlights
                    </p>
               </header>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
                    {/* Interactive Scripts */}
                    <div style={{ gridColumn: selectedScript ? '1 / -1' : 'auto' }}>
                         <div className="card">
                              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                   <BookOpen size={28} />
                                   Interactive Scripts
                              </h2>
                              <p>Click on a script to practice listening with synchronized text</p>

                              <div style={{ display: 'grid', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                                   {listeningScripts.map(script => (
                                        <div key={script.id}>
                                             <div
                                                  className="card"
                                                  style={{
                                                       cursor: 'pointer',
                                                       background: selectedScript?.id === script.id ? 'var(--color-surface-hover)' : 'var(--color-bg-elevated)',
                                                       borderColor: selectedScript?.id === script.id ? 'var(--color-primary)' : 'var(--color-border)',
                                                  }}
                                                  onClick={() => setSelectedScript(script)}
                                             >
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                       <div style={{ flex: 1 }}>
                                                            <h4 style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>{script.title}</h4>
                                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                                                 <span className="badge" style={{ background: `${getDifficultyColor(script.difficulty)}33`, color: getDifficultyColor(script.difficulty) }}>
                                                                      {script.difficulty}
                                                                 </span>
                                                                 <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                                                      {script.duration}
                                                                 </span>
                                                            </div>
                                                       </div>
                                                       <ChevronRight size={20} style={{ opacity: 0.5, transform: selectedScript?.id === script.id ? 'rotate(90deg)' : 'none', transition: 'transform var(--transition-fast)' }} />
                                                  </div>
                                             </div>

                                             {selectedScript?.id === script.id && (
                                                  <div className="animate-fadeIn" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-lg)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
                                                       <button
                                                            className="btn btn-primary"
                                                            onClick={() => handlePlayScript(script)}
                                                            style={{ marginBottom: 'var(--space-lg)' }}
                                                       >
                                                            {speaking ? <Pause size={20} /> : <Play size={20} />}
                                                            {speaking ? 'Pause' : 'Play Audio'}
                                                       </button>

                                                       {/* Transcript with highlighting */}
                                                       <div style={{ padding: 'var(--space-lg)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', lineHeight: 1.8, fontSize: 'var(--font-lg)' }}>
                                                            {script.script.split(' ').map((word, idx) => {
                                                                 const vocabItem = script.vocabularyHighlights.find(v => word.toLowerCase().includes(v.word.toLowerCase()))
                                                                 return (
                                                                      <span
                                                                           key={idx}
                                                                           onMouseEnter={() => vocabItem && setHoveredVocab(vocabItem)}
                                                                           onMouseLeave={() => setHoveredVocab(null)}
                                                                           style={{
                                                                                background: currentWordIndex === idx ? 'var(--color-primary)' : vocabItem ? `${getDifficultyColor(vocabItem.level)}33` : 'transparent',
                                                                                color: currentWordIndex === idx ? 'white' : 'inherit',
                                                                                padding: '2px 4px',
                                                                                borderRadius: 'var(--radius-sm)',
                                                                                cursor: vocabItem ? 'help' : 'default',
                                                                                transition: 'all var(--transition-fast)',
                                                                                position: 'relative',
                                                                                borderBottom: vocabItem ? `2px dotted ${getDifficultyColor(vocabItem.level)}` : 'none',
                                                                           }}
                                                                      >
                                                                           {word}{' '}
                                                                      </span>
                                                                 )
                                                            })}
                                                       </div>

                                                       {/* Vocabulary Tooltip */}
                                                       {hoveredVocab && (
                                                            <div className="animate-fadeIn" style={{
                                                                 marginTop: 'var(--space-md)',
                                                                 padding: 'var(--space-md)',
                                                                 background: 'var(--gradient-primary)',
                                                                 color: 'white',
                                                                 borderRadius: 'var(--radius-md)',
                                                            }}>
                                                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                                                                      <strong style={{ fontSize: 'var(--font-lg)' }}>{hoveredVocab.word}</strong>
                                                                      <span className="badge" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>{hoveredVocab.level}</span>
                                                                 </div>
                                                                 <p style={{ margin: 0, marginBottom: 'var(--space-xs)', opacity: 0.95 }}>{hoveredVocab.meaning}</p>
                                                                 <p style={{ margin: 0, fontStyle: 'italic', opacity: 0.9, fontSize: 'var(--font-sm)' }}>{hoveredVocab.arabic}</p>
                                                            </div>
                                                       )}

                                                       {/* Vocabulary List */}
                                                       <div style={{ marginTop: 'var(--space-xl)' }}>
                                                            <h4>Key Vocabulary ({script.vocabularyHighlights.length} words)</h4>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                                                 {script.vocabularyHighlights.map(vocab => (
                                                                      <div key={vocab.word} className="card" style={{ padding: 'var(--space-md)', background: 'var(--color-bg-elevated)' }}>
                                                                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                                                                                <strong>{vocab.word}</strong>
                                                                                <span className="badge" style={{ background: `${getDifficultyColor(vocab.level)}33`, color: getDifficultyColor(vocab.level) }}>
                                                                                     {vocab.level}
                                                                                </span>
                                                                           </div>
                                                                           <p style={{ fontSize: 'var(--font-sm)', margin: 0, marginBottom: 'var(--space-xs)' }}>{vocab.meaning}</p>
                                                                           <p style={{ fontSize: 'var(--font-sm)', margin: 0, fontStyle: 'italic', color: 'var(--color-text-tertiary)' }}>{vocab.arabic}</p>
                                                                      </div>
                                                                 ))}
                                                            </div>
                                                       </div>
                                                  </div>
                                             )}
                                        </div>
                                   ))}
                              </div>
                         </div>
                    </div>

                    {/* Podcast Library */}
                    <div style={{ gridColumn: selectedScript ? 'auto' : 'auto' }}>
                         <div className="card" style={{ position: 'sticky', top: '90px' }}>
                              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                   <Headphones size={28} />
                                   Recommended Podcasts
                              </h2>
                              <p>External resources for extended listening practice</p>

                              <div style={{ display: 'grid', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                                   {podcasts.map(podcast => (
                                        <div key={podcast.id} className="card" style={{ background: 'var(--color-bg-elevated)' }}>
                                             <h4 style={{ margin: 0, marginBottom: 'var(--space-xs)', fontSize: 'var(--font-base)' }}>{podcast.title}</h4>
                                             <p style={{ fontSize: 'var(--font-sm)', margin: 0, marginBottom: 'var(--space-sm)' }}>{podcast.description}</p>
                                             <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
                                                  <span className="badge badge-primary">{podcast.difficulty}</span>
                                                  <span className="badge" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                                                       {podcast.duration}
                                                  </span>
                                             </div>
                                             <a
                                                  href={podcast.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="btn btn-secondary"
                                                  style={{ width: '100%', fontSize: 'var(--font-sm)' }}
                                             >
                                                  <ExternalLink size={16} />
                                                  Listen Now
                                             </a>
                                        </div>
                                   ))}
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     )
}
