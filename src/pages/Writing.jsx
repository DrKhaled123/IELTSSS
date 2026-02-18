import { useState } from 'react'
import { PenTool, FileText, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react'
import { IELTSTimerDisplay } from '../hooks/useIELTSTimer'
import writingTasks from '../data/writing-tasks.json'
import BilingualContainer from '../components/BilingualContainer'

export default function Writing() {
     const [selectedTask, setSelectedTask] = useState(null)
     const [activeTab, setActiveTab] = useState('task1')
     const [userEssay, setUserEssay] = useState('')
     const [showSample, setShowSample] = useState(false)
     const [analysis, setAnalysis] = useState(null)

     const safeTasks = Array.isArray(writingTasks) ? writingTasks : []
     const task1Items = safeTasks.filter(t => t.type === 'task1')
     const task2Items = safeTasks.filter(t => t.type === 'task2')

     const analyzeEssay = () => {
          const wordCount = userEssay.trim().split(/\s+/).filter(w => w.length > 0).length
          const paragraphs = userEssay.split('\n\n').filter(p => p.trim().length > 0).length
          const avgWordsPerSentence = userEssay.split(/[.!?]+/).filter(s => s.trim().length > 0)
               .reduce((acc, s) => acc + s.trim().split(/\s+/).length, 0) /
               Math.max(userEssay.split(/[.!?]+/).filter(s => s.trim().length > 0).length, 1)

          const hasIntroduction = userEssay.toLowerCase().includes('overall') ||
               userEssay.toLowerCase().includes('in conclusion') ||
               paragraphs >= 3

          setAnalysis({
               wordCount,
               paragraphs,
               avgWordsPerSentence: Math.round(avgWordsPerSentence),
               meetsWordCount: activeTab === 'task1' ? wordCount >= 150 : wordCount >= 250,
               hasGoodStructure: paragraphs >= 3,
               feedback: []
          })
     }

     return (
          <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
               <header style={{ marginBottom: 'var(--space-2xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                         <div>
                              <h1>Writing Practice</h1>
                              <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                                   Practice IELTS writing tasks with sample answers and structure guidance
                              </p>
                         </div>
                         <IELTSTimerDisplay section="writing" size="medium" showControls={true} />
                    </div>
               </header>

               {/* Task Type Tabs */}
               <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                    <button
                         className={`btn ${activeTab === 'task1' ? 'btn-primary' : 'btn-secondary'}`}
                         onClick={() => { setActiveTab('task1'); setSelectedTask(null); setUserEssay(''); setShowSample(false); setAnalysis(null); }}
                         style={{ flex: 1 }}
                    >
                         Task 1 - Academic
                    </button>
                    <button
                         className={`btn ${activeTab === 'task2' ? 'btn-primary' : 'btn-secondary'}`}
                         onClick={() => { setActiveTab('task2'); setSelectedTask(null); setUserEssay(''); setShowSample(false); setAnalysis(null); }}
                         style={{ flex: 1 }}
                    >
                         Task 2 - Essay
                    </button>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-xl)' }}>
                    {/* Task Selection */}
                    <div>
                         <div className="card">
                              <h3>
                                   {activeTab === 'task1' ? 'Task 1 Questions' : 'Task 2 Questions'}
                              </h3>
                              <p style={{ fontSize: 'var(--font-sm)' }}>
                                   {activeTab === 'task1'
                                        ? 'Describe visual information in at least 150 words'
                                        : 'Write an essay of at least 250 words discussing the topic'}
                              </p>

                              <div style={{ display: 'grid', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                                   {(activeTab === 'task1' ? task1Items : task2Items).map(task => (
                                        <div
                                             key={task.id}
                                             className="card"
                                             style={{
                                                  cursor: 'pointer',
                                                  background: selectedTask?.id === task.id ? 'var(--color-surface-hover)' : 'var(--color-bg-elevated)',
                                                  borderColor: selectedTask?.id === task.id ? 'var(--color-primary)' : 'var(--color-border)',
                                             }}
                                             onClick={() => setSelectedTask(task)}
                                        >
                                             <h4 style={{ margin: 0, marginBottom: 'var(--space-xs)', fontSize: 'var(--font-base)' }}>
                                                  {task.title || `Question ${task.id}`}
                                             </h4>
                                             <p style={{ fontSize: 'var(--font-sm)', margin: 0, color: 'var(--color-text-secondary)' }}>
                                                  {task.description || task.question}
                                             </p>
                                             {task.bandScore && (
                                                  <span className="badge badge-success" style={{ marginTop: 'var(--space-sm)' }}>
                                                       Band {task.bandScore}
                                                  </span>
                                             )}
                                        </div>
                                   ))}
                              </div>
                         </div>

                         {/* Writing Tips */}
                         {selectedTask && (
                              <div className="card animate-fadeIn" style={{ marginTop: 'var(--space-lg)', background: 'var(--gradient-secondary)' }}>
                                   <h4 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'white', margin: 0, marginBottom: 'var(--space-md)' }}>
                                        <Lightbulb size={20} />
                                        Quick Tips
                                   </h4>
                                   <ul style={{ margin: 0, paddingLeft: 'var(--space-lg)', color: 'white' }}>
                                        {activeTab === 'task1' ? (
                                             <>
                                                  <li>Write an overview summarizing main trends</li>
                                                  <li>Include specific data and comparisons</li>
                                                  <li>Use appropriate time expressions</li>
                                                  <li>Aim for 150-180 words</li>
                                                  <li>Spend 20 minutes on this task</li>
                                             </>
                                        ) : (
                                             <>
                                                  <li>Clearly state your position</li>
                                                  <li>Use formal academic language</li>
                                                  <li>Support ideas with examples</li>
                                                  <li>Write 250-300 words minimum</li>
                                                  <li>Allocate 40 minutes for this task</li>
                                             </>
                                        )}
                                   </ul>
                              </div>
                         )}
                    </div>

                    {/* Writing Area */}
                    {selectedTask && (
                         <div style={{ gridColumn: 'span 1' }}>
                              <div className="card">
                                   <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <PenTool size={24} />
                                        Your Answer
                                   </h3>

                                   {/* Question Display */}
                                   <BilingualContainer
                                        title="Task Prompt"
                                        germanContent={
                                             <div>
                                                  <h4 style={{ color: 'var(--color-primary)', marginTop: 0 }}>{selectedTask.germanTitle || selectedTask.title}</h4>
                                                  <p style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text)', margin: 0 }}>
                                                       {selectedTask.germanDescription || selectedTask.germanQuestion || selectedTask.description || selectedTask.question}
                                                  </p>
                                             </div>
                                        }
                                        englishContent={
                                             <div>
                                                  <h4 style={{ color: 'var(--color-secondary)', marginTop: 0 }}>{selectedTask.title}</h4>
                                                  <p style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text)', margin: 0 }}>
                                                       {selectedTask.description || selectedTask.question}
                                                  </p>
                                             </div>
                                        }
                                   />

                                   <textarea
                                        className="input textarea"
                                        placeholder="Start writing your answer here..."
                                        value={userEssay}
                                        onChange={(e) => setUserEssay(e.target.value)}
                                        style={{ minHeight: '300px', fontFamily: 'inherit', fontSize: 'var(--font-base)' }}
                                   />

                                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)' }}>
                                        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                             Word count: {userEssay.trim().split(/\s+/).filter(w => w.length > 0).length}
                                        </span>
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                             <button
                                                  className="btn btn-secondary"
                                                  onClick={() => setShowSample(!showSample)}
                                             >
                                                  <FileText size={18} />
                                                  {showSample ? 'Hide' : 'Show'} Sample
                                             </button>
                                             <button
                                                  className="btn btn-primary"
                                                  onClick={analyzeEssay}
                                                  disabled={userEssay.trim().length < 50}
                                             >
                                                  <CheckCircle size={18} />
                                                  Analyze
                                             </button>
                                        </div>
                                   </div>

                                   {/* Analysis Results */}
                                   {analysis && (
                                        <div className="animate-fadeIn" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-lg)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                             <h4 style={{ margin: 0, marginBottom: 'var(--space-md)' }}>Analysis Results</h4>

                                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)' }}>
                                                  <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                                                       <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: analysis.meetsWordCount ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                                            {analysis.wordCount}
                                                       </div>
                                                       <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>Words</div>
                                                  </div>
                                                  <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                                                       <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-info)' }}>
                                                            {analysis.paragraphs}
                                                       </div>
                                                       <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>Paragraphs</div>
                                                  </div>
                                                  <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                                                       <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-secondary)' }}>
                                                            {analysis.avgWordsPerSentence}
                                                       </div>
                                                       <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>Avg Words/Sentence</div>
                                                  </div>
                                             </div>

                                             <div style={{ marginTop: 'var(--space-lg)' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                                       {analysis.meetsWordCount ? <CheckCircle size={18} color="var(--color-success)" /> : <AlertCircle size={18} color="var(--color-warning)" />}
                                                       <span style={{ color: analysis.meetsWordCount ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                                            {analysis.meetsWordCount ? 'Meets word count requirement' : `Need ${(activeTab === 'task1' ? 150 : 250) - analysis.wordCount} more words`}
                                                       </span>
                                                  </div>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                       {analysis.hasGoodStructure ? <CheckCircle size={18} color="var(--color-success)" /> : <AlertCircle size={18} color="var(--color-warning)" />}
                                                       <span style={{ color: analysis.hasGoodStructure ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                                            {analysis.hasGoodStructure ? 'Good paragraph structure' : 'Consider adding more paragraphs'}
                                                       </span>
                                                  </div>
                                             </div>
                                        </div>
                                   )}

                                   {/* Sample Answer */}
                                   {showSample && selectedTask.sampleAnswer && (
                                        <div className="animate-fadeIn" style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-lg)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)' }}>
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                                                  <h4 style={{ margin: 0 }}>Sample Answer</h4>
                                                  {selectedTask.bandScore && (
                                                       <span className="badge badge-success">Band {selectedTask.bandScore}</span>
                                                  )}
                                             </div>
                                             <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', lineHeight: 1.8 }}>
                                                  {selectedTask.sampleAnswer.split('\n\n').map((para, idx) => (
                                                       <p key={idx} style={{ marginBottom: 'var(--space-md)' }}>{para}</p>
                                                  ))}
                                             </div>

                                             {selectedTask.keyFeatures && (
                                                  <div style={{ marginTop: 'var(--space-md)' }}>
                                                       <strong>Key Features:</strong>
                                                       <ul style={{ marginTop: 'var(--space-sm)', paddingLeft: 'var(--space-lg)' }}>
                                                            {selectedTask.keyFeatures.map((feature, idx) => (
                                                                 <li key={idx} style={{ marginBottom: 'var(--space-xs)' }}>{feature}</li>
                                                            ))}
                                                       </ul>
                                                  </div>
                                             )}
                                        </div>
                                   )}
                              </div>
                         </div>
                    )}
               </div>
          </div>
     )
}
