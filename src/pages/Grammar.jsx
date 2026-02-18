import { useState, useMemo, memo } from 'react'
import {
  BookOpen,
  ChevronRight,
  Volume2
} from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'

// Import grammar database
import grammarDatabase from '../data/grammar-database.json'

const Grammar = memo(function Grammar() {
  // State management
  const [selectedRule, setSelectedRule] = useState(null)
  const [currentView, setCurrentView] = useState('lessons')
  const [currentLevel, setCurrentLevel] = useState('A1')

  const {
    speak,
    getEnglishVoice,
    supported: speechSupported
  } = useSpeechSynthesis()

  // Filter and organize grammar rules
  const filteredRules = useMemo(() => {
    return grammarDatabase.grammarRules.filter(rule => rule.level === currentLevel)
  }, [currentLevel])

  const rulesByCategory = useMemo(() => {
    const categorized = {}
    filteredRules.forEach(rule => {
      if (!categorized[rule.category]) {
        categorized[rule.category] = []
      }
      categorized[rule.category].push(rule)
    })
    return categorized
  }, [filteredRules])

  // Handle rule selection
  const handleRuleSelect = (rule) => {
    setSelectedRule(rule)
    setCurrentView('lesson_detail')
  }

  // Speak text
  const handlePronunciation = (text) => {
    if (!speechSupported) return

    const voice = getEnglishVoice()
    speak(text, {
      voice,
      rate: 1.15,
      lang: 'en-GB'
    })
  }

  // Render lessons view
  const renderLessonsView = () => (
    <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <BookOpen size={24} />
        English Grammar Lessons - {currentLevel}
      </h3>

      {/* Level Selection */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          {['A1', 'A2', 'B1', 'B2', 'C1'].map(level => (
            <button
              key={level}
              className={`btn ${currentLevel === level ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentLevel(level)}
              style={{ minWidth: '80px' }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Grammar Rules by Category */}
      {Object.entries(rulesByCategory).map(([category, rules]) => (
        <div key={category} style={{ marginBottom: 'var(--space-xl)' }}>
          <h4 style={{
            textTransform: 'capitalize',
            marginBottom: 'var(--space-md)',
            color: 'var(--color-primary)'
          }}>
            {category}
          </h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {rules.map(rule => (
              <div
                key={rule.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  border: selectedRule?.id === rule.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: selectedRule?.id === rule.id ? 'var(--color-surface)' : 'transparent'
                }}
                onClick={() => handleRuleSelect(rule)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <BookOpen size={24} color="white" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-text)' }}>
                      {rule.title}
                    </h5>
                    <p style={{
                      margin: '0',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--color-text-tertiary)',
                      lineHeight: 1.4
                    }}>
                      {rule.explanation.substring(0, 100)}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const renderLessonDetailView = () => {
    if (!selectedRule) return null

    return (
      <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3>{selectedRule.title}</h3>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentView('lessons')}
          >
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
            Back to Lessons
          </button>
        </div>

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-lg)'
          }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>Explanation</h4>
            <p style={{ fontSize: 'var(--font-lg)', lineHeight: 1.6 }}>
              {selectedRule.explanation}
            </p>
          </div>

          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h4 style={{ color: 'var(--color-secondary)', marginBottom: 'var(--space-md)' }}>Examples</h4>
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {selectedRule.examples.map((example, index) => (
                <div key={index} className="card" style={{ padding: 'var(--space-md)', borderLeft: '4px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                    <strong style={{ fontSize: 'var(--font-md)' }}>{example.english}</strong>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: 'var(--space-xs) var(--space-sm)' }}
                      onClick={() => handlePronunciation(example.english)}
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>
                    {example.translation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedRule.tables && selectedRule.tables.length > 0 && (
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              {selectedRule.tables.map((table, idx) => (
                <div key={idx} style={{ marginBottom: 'var(--space-md)' }}>
                  <h4 style={{ marginBottom: 'var(--space-sm)' }}>{table.title}</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {table.headers.map((header, hIdx) => (
                            <th key={hIdx} style={{
                              padding: 'var(--space-md)',
                              background: 'var(--color-primary)',
                              color: 'white',
                              textAlign: 'left',
                              borderBottom: '2px solid var(--color-border)'
                            }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} style={{
                                padding: 'var(--space-md)',
                                borderBottom: '1px solid var(--color-border)'
                              }}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1>English Grammar Mastery</h1>
        <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
          Master English grammar with comprehensive lessons
        </p>
      </header>

      {currentView === 'lessons' && renderLessonsView()}
      {currentView === 'lesson_detail' && renderLessonDetailView()}
    </div>
  )
})

export default Grammar
