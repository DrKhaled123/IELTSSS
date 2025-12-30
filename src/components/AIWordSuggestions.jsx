import { useState, useEffect } from 'react'
import { Brain, Zap, Target, Clock, TrendingUp, Lightbulb, Star, ChevronRight, Sparkles } from 'lucide-react'
import { useAIWordSuggestions } from '../hooks/useAIWordSuggestions'
import { useSemanticAnalysis } from '../utils/semanticAnalyzer'
import vocabularyDatabase from '../data/vocabulary-database.json'
import { useSpacedRepetition } from '../hooks/useSpacedRepetition'
import { useProgressTracking } from '../hooks/useProgressTracking'

export default function AIWordSuggestions({ 
    onWordSelect, 
    userLevel = 'A1', 
    timeAvailable = 15,
    showAdvanced = true 
}) {
    const [preferences, setPreferences] = useState({
        focusAreas: [],
        difficulty: null,
        categories: []
    })
    const [showCustomization, setShowCustomization] = useState(false)
    
    const { cards } = useSpacedRepetition()
    const { progress } = useProgressTracking()
    const semanticAnalyzer = useSemanticAnalysis(vocabularyDatabase.vocabulary)
    
    const {
        suggestions,
        recommendationContext,
        isGenerating,
        generateRecommendations,
        getSuggestionReason,
        getConfidenceScore,
        analyzeUserProfile
    } = useAIWordSuggestions(
        vocabularyDatabase.vocabulary, 
        cards, 
        progress
    )

    // Auto-generate recommendations on mount
    useEffect(() => {
        generateRecommendations({
            count: 6,
            userLevel,
            timeAvailable,
            ...preferences
        })
    }, [userLevel, timeAvailable, preferences])

    const handleGenerateNew = () => {
        generateRecommendations({
            count: 6,
            userLevel,
            timeAvailable,
            ...preferences
        })
    }

    const handleWordClick = (word) => {
        onWordSelect?.(word)
    }

    const getDifficultyColor = (level) => {
        const colors = {
            'A1': '#10B981', // green
            'A2': '#3B82F6', // blue
            'B1': '#F59E0B', // yellow
            'B2': '#EF4444', // red
            'C1': '#8B5CF6', // purple
            'C2': '#EC4899'  // pink
        }
        return colors[level] || '#6B7280'
    }

    const getAIScoreColor = (score) => {
        if (score >= 80) return '#10B981' // green
        if (score >= 60) return '#F59E0B' // yellow
        return '#EF4444' // red
    }

    const renderSuggestionCard = (word, index) => {
        const aiScore = getConfidenceScore(word)
        const reason = getSuggestionReason(word)
        const semanticInfo = semanticAnalyzer.analyzeWordDifficulty(word)
        
        return (
            <div
                key={`${word.german}-${index}`}
                className="ai-suggestion-card"
                onClick={() => handleWordClick(word)}
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-lg)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
            >
                {/* AI Score Badge */}
                <div style={{
                    position: 'absolute',
                    top: 'var(--space-sm)',
                    right: 'var(--space-sm)',
                    background: getAIScoreColor(aiScore),
                    color: 'white',
                    padding: 'var(--space-xs) var(--space-sm)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                }}>
                    <Brain size={12} />
                    {aiScore}%
                </div>

                {/* Word Header */}
                <div style={{ marginBottom: 'var(--space-md)', paddingRight: '60px' }}>
                    <div style={{
                        fontSize: 'var(--font-xl)',
                        fontWeight: 'bold',
                        color: 'var(--color-primary)',
                        marginBottom: 'var(--space-xs)'
                    }}>
                        {word.german}
                    </div>
                    <div style={{
                        fontSize: 'var(--font-md)',
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--space-xs)'
                    }}>
                        {word.english}
                    </div>
                    <div style={{
                        fontSize: 'var(--font-sm)',
                        color: 'var(--color-text-tertiary)',
                        textAlign: 'right'
                    }}>
                        {word.arabic}
                    </div>
                </div>

                {/* AI Recommendation Reason */}
                <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-sm)',
                    marginBottom: 'var(--space-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)'
                }}>
                    <Lightbulb size={16} style={{ color: '#3B82F6' }} />
                    <span style={{
                        fontSize: 'var(--font-sm)',
                        color: 'var(--color-text)',
                        fontStyle: 'italic'
                    }}>
                        {reason}
                    </span>
                </div>

                {/* Word Metadata */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-xs)',
                    marginBottom: 'var(--space-md)'
                }}>
                    <span style={{
                        background: getDifficultyColor(word.level),
                        color: 'white',
                        padding: 'var(--space-xs) var(--space-sm)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 'bold'
                    }}>
                        {word.level}
                    </span>
                    
                    <span style={{
                        background: 'var(--color-bg-elevated)',
                        color: 'var(--color-text-secondary)',
                        padding: 'var(--space-xs) var(--space-sm)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-xs)'
                    }}>
                        {word.category}
                    </span>

                    {word.frequency === 'high' && (
                        <span style={{
                            background: 'var(--color-success)',
                            color: 'white',
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-xs)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-xs)'
                        }}>
                            <TrendingUp size={10} />
                            High Freq
                        </span>
                    )}

                    {semanticInfo.recommendation === 'challenging' && (
                        <span style={{
                            background: 'var(--color-warning)',
                            color: 'white',
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-xs)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-xs)'
                        }}>
                            <Target size={10} />
                            Challenge
                        </span>
                    )}
                </div>

                {/* Learning Aids Preview */}
                {word.mnemonic && (
                    <div style={{
                        fontSize: 'var(--font-sm)',
                        color: 'var(--color-text-tertiary)',
                        fontStyle: 'italic',
                        marginBottom: 'var(--space-sm)'
                    }}>
                        💡 {word.mnemonic}
                    </div>
                )}

                {/* Action Arrow */}
                <div style={{
                    position: 'absolute',
                    bottom: 'var(--space-md)',
                    right: 'var(--space-md)',
                    color: 'var(--color-text-tertiary)',
                    transition: 'transform var(--transition-base)'
                }}>
                    <ChevronRight size={20} />
                </div>
            </div>
        )
    }

    const renderCustomizationPanel = () => (
        <div style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-lg)'
        }}>
            <h4 style={{ marginBottom: 'var(--space-md)' }}>Customize AI Recommendations</h4>
            
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                {/* Focus Areas */}
                <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 'bold' }}>
                        Focus Areas
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        {['ielts-core', 'verbs', 'nouns', 'academic', 'daily-activities'].map(area => (
                            <button
                                key={area}
                                onClick={() => {
                                    const newAreas = preferences.focusAreas.includes(area)
                                        ? preferences.focusAreas.filter(a => a !== area)
                                        : [...preferences.focusAreas, area]
                                    setPreferences(prev => ({ ...prev, focusAreas: newAreas }))
                                }}
                                style={{
                                    padding: 'var(--space-xs) var(--space-sm)',
                                    borderRadius: 'var(--radius-md)',
                                    border: preferences.focusAreas.includes(area) 
                                        ? '2px solid var(--color-primary)' 
                                        : '1px solid var(--color-border)',
                                    background: preferences.focusAreas.includes(area)
                                        ? 'var(--color-primary)'
                                        : 'var(--color-surface)',
                                    color: preferences.focusAreas.includes(area)
                                        ? 'white'
                                        : 'var(--color-text)',
                                    fontSize: 'var(--font-sm)',
                                    cursor: 'pointer'
                                }}
                            >
                                {area.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulty */}
                <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 'bold' }}>
                        Preferred Difficulty
                    </label>
                    <select
                        value={preferences.difficulty || ''}
                        onChange={(e) => setPreferences(prev => ({ 
                            ...prev, 
                            difficulty: e.target.value || null 
                        }))}
                        className="input"
                        style={{ maxWidth: '200px' }}
                    >
                        <option value="">Adaptive (Recommended)</option>
                        <option value="A1">A1 - Beginner</option>
                        <option value="A2">A2 - Elementary</option>
                        <option value="B1">B1 - Intermediate</option>
                        <option value="B2">B2 - Upper-Intermediate</option>
                        <option value="C1">C1 - Advanced</option>
                    </select>
                </div>
            </div>
        </div>
    )

    if (isGenerating) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-2xl)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid var(--color-border)',
                    borderTop: '4px solid var(--color-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: 'var(--space-lg)'
                }} />
                <h3 style={{ color: 'var(--color-text-secondary)' }}>
                    AI is analyzing your learning patterns...
                </h3>
                <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                    Generating personalized word recommendations based on your progress and learning style
                </p>
            </div>
        )
    }

    return (
        <div className="ai-suggestions-container">
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-lg)'
            }}>
                <div>
                    <h2 style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--space-sm)',
                        margin: 0 
                    }}>
                        <Sparkles size={24} style={{ color: 'var(--color-primary)' }} />
                        AI-Powered Suggestions
                    </h2>
                    <p style={{ 
                        color: 'var(--color-text-secondary)', 
                        margin: 'var(--space-xs) 0 0 0' 
                    }}>
                        Personalized recommendations based on your learning patterns
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button
                        onClick={() => setShowCustomization(!showCustomization)}
                        className="btn btn-secondary"
                    >
                        <Zap size={16} />
                        Customize
                    </button>
                    
                    <button
                        onClick={handleGenerateNew}
                        className="btn btn-primary"
                        disabled={isGenerating}
                    >
                        <Brain size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* User Profile Summary */}
            {recommendationContext && (
                <div style={{
                    background: 'var(--gradient-secondary)',
                    color: 'white',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--space-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)'
                }}>
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: 'var(--space-xs)' }}>
                            Learning Profile Analysis
                        </div>
                        <div style={{ fontSize: 'var(--font-sm)', opacity: 0.9 }}>
                            {recommendationContext.userProfile.learningStyle} learner • 
                            {recommendationContext.userProfile.masteryLevel} level • 
                            {Math.round(recommendationContext.userProfile.learningVelocity.averageAccuracy)}% accuracy
                        </div>
                    </div>
                </div>
            )}

            {/* Customization Panel */}
            {showCustomization && renderCustomizationPanel()}

            {/* Suggestions Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--space-lg)',
                marginBottom: 'var(--space-lg)'
            }}>
                {suggestions.map((word, index) => renderSuggestionCard(word, index))}
            </div>

            {/* No Suggestions State */}
            {suggestions.length === 0 && !isGenerating && (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--space-2xl)',
                    background: 'var(--color-bg-elevated)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <Brain size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-lg)' }} />
                    <h3>No suggestions available</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Start learning some words to get AI-powered recommendations!
                    </p>
                </div>
            )}

            {/* Performance Insights */}
            {recommendationContext && (
                <div style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-lg)',
                    marginTop: 'var(--space-lg)'
                }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <TrendingUp size={20} />
                        Learning Insights
                    </h4>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--space-md)',
                        marginTop: 'var(--space-md)'
                    }}>
                        <div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                Strengths
                            </div>
                            <div style={{ fontWeight: 'bold' }}>
                                {recommendationContext.userProfile.strengths.join(', ') || 'Building foundation'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                Focus Areas
                            </div>
                            <div style={{ fontWeight: 'bold' }}>
                                {recommendationContext.userProfile.weaknesses.join(', ') || 'General practice'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                Learning Velocity
                            </div>
                            <div style={{ fontWeight: 'bold' }}>
                                {Math.round(recommendationContext.userProfile.learningVelocity.wordsPerDay)} words/day
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}