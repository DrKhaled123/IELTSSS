import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, BookOpen, Users, TrendingUp, Award, Clock, Target, Heart, Check } from 'lucide-react'
import { useProgressTracking } from '../hooks/useProgressTracking'

export default function ContentLife() {
    const [selectedContent, setSelectedContent] = useState(null)
    const [dailyStreak, setDailyStreak] = useState(0)
    const [lifeScenarios, setLifeScenarios] = useState([])

    const { trackProgress, getProgressStats, calculateOverallProgress } = useProgressTracking()

    // Enhanced Daily content with specific tasks and tips
    const dailyContent = useMemo(() => {
        const today = new Date()
        const dayOfWeek = today.getDay()

        const contentMap = {
            0: { // Sunday
                title: 'Weekend Review',
                type: 'review',
                description: 'Reflect on your weekly progress.',
                tip: 'Reviewing material within 24 hours of learning it increases retention.',
                tasks: [
                    { id: 'vocab_review', label: 'Review 20 saved words' },
                    { id: 'grammar_quiz', label: 'Take a quick grammar quiz' },
                    { id: 'week_plan', label: 'Plan study time for next week' }
                ]
            },
            1: { // Monday
                title: 'Fresh Start',
                type: 'learning',
                description: 'Kickstart the week with core vocabulary.',
                tip: 'Start with the most difficult task while your brain is fresh.',
                tasks: [
                    { id: 'new_vocab', label: 'Learn 5 new academic words' },
                    { id: 'grammar_concept', label: 'Study one advanced grammar rule' },
                    { id: 'listening_intro', label: 'Listen to an IELTS podcast intro' }
                ]
            },
            2: { // Tuesday
                title: 'Culture Tuesday',
                type: 'cultural',
                description: 'Explore English idioms and culture.',
                tip: 'Understanding idioms is key for partial scores.',
                tasks: [
                    { id: 'idiom_learn', label: 'Learn 1 new English idiom' },
                    { id: 'culture_read', label: 'Read a short news article' },
                    { id: 'speech_practice', label: 'Practice speaking about your hometown' }
                ]
            },
            3: { // Wednesday
                title: 'Professional Wednesday',
                type: 'practical',
                description: 'Focus on professional communication.',
                tip: 'Formal language is essential in business and academic contexts.',
                tasks: [
                    { id: 'email_phrase', label: 'Learn a formal email closing' },
                    { id: 'job_vocab', label: 'Translate 5 business words' },
                    { id: 'mock_intro', label: 'Practice a self-introduction' }
                ]
            },
            4: { // Thursday
                title: 'Travel Thursday',
                type: 'situational',
                description: 'Prepare for travel and navigation.',
                tip: 'Learn directional prepositions.',
                tasks: [
                    { id: 'directions', label: 'Practice giving directions' },
                    { id: 'ticket_buy', label: 'Roleplay buying a train ticket' },
                    { id: 'hotel_vocab', label: 'Learn 5 travel-related words' }
                ]
            },
            5: { // Friday
                title: 'Fun Friday',
                type: 'interactive',
                description: 'Relax with English media.',
                tip: 'Watching movies with subtitles helps with natural phrasing.',
                tasks: [
                    { id: 'song_listen', label: 'Listen to an English song' },
                    { id: 'video_watch', label: 'Watch a 5-minute English video' },
                    { id: 'game_play', label: 'Play a vocabulary game' }
                ]
            },
            6: { // Saturday
                title: 'Skill Saturday',
                type: 'practice',
                description: 'Deep dive into specific skills.',
                tip: 'Practice speaking out loud, even if you are alone.',
                tasks: [
                    { id: 'speaking_drill', label: 'Record yourself speaking for 1 min' },
                    { id: 'writing_task', label: 'Write 3 sentences about your day' },
                    { id: 'error_review', label: 'Review recent mistakes' }
                ]
            }
        }

        return contentMap[dayOfWeek] || contentMap[0]
    }, [])

    const [completedTasks, setCompletedTasks] = useState(() => {
        const saved = localStorage.getItem('daily_tasks_completed')
        return saved ? JSON.parse(saved) : []
    })

    useEffect(() => {
        localStorage.setItem('daily_tasks_completed', JSON.stringify(completedTasks))
    }, [completedTasks])

    const toggleTask = (taskId) => {
        setCompletedTasks(prev => {
            const isCompleted = prev.includes(taskId)
            const newCompleted = isCompleted
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]

            if (!isCompleted) {
                completeDailyActivity(taskId)
            }
            return newCompleted
        })
    }

    const progressPercentage = Math.round((completedTasks.length / (dailyContent.tasks?.length || 1)) * 100)

    // ... (keep helper functions like completeDailyActivity if needed, or rely on toggleTask)

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
            <header style={{ marginBottom: 'var(--space-2xl)' }}>
                <h1>Content & Life Learning</h1>
                <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                    Daily German content, life scenarios, and cultural integration for comprehensive learning
                </p>
            </header>

            {/* Interactive Daily Content Box */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)', border: '1px solid var(--color-primary)', overflow: 'hidden' }}>
                <div style={{
                    background: 'var(--gradient-primary)',
                    padding: 'var(--space-lg)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'white', marginBottom: 'var(--space-xs)' }}>
                            <Calendar size={24} />
                            Today's Focus: {dailyContent.title}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--font-sm)' }}>{dailyContent.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{progressPercentage}%</div>
                        <div style={{ fontSize: 'var(--font-xs)', opacity: 0.8 }}>Daily Goal</div>
                    </div>
                </div>

                <div style={{ padding: 'var(--space-lg)' }}>
                    {/* Daily Tip Note */}
                    <div style={{
                        background: 'var(--color-bg-elevated)',
                        borderLeft: '4px solid var(--color-accent)',
                        padding: 'var(--space-md)',
                        marginBottom: 'var(--space-lg)',
                        borderRadius: '0 var(--radius-md) var(--radius-md) 0'
                    }}>
                        <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                            💡 Daily Tip
                        </strong>
                        <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                            "{dailyContent.tip}"
                        </span>
                    </div>

                    {/* Task Checklist */}
                    <h4 style={{ marginBottom: 'var(--space-md)' }}>Your Tasks</h4>
                    <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                        {dailyContent.tasks?.map((task, idx) => {
                            const isChecked = completedTasks.includes(task.id)
                            return (
                                <div
                                    key={task.id}
                                    onClick={() => toggleTask(task.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        padding: 'var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        border: isChecked ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
                                        background: isChecked ? 'rgba(var(--color-success-rgb), 0.05)' : 'var(--color-surface)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: isChecked ? 'none' : '2px solid var(--color-text-tertiary)',
                                        background: isChecked ? 'var(--color-success)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        flexShrink: 0
                                    }}>
                                        {isChecked && <Check size={14} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            textDecoration: isChecked ? 'line-through' : 'none',
                                            color: isChecked ? 'var(--color-text-tertiary)' : 'var(--color-text)',
                                            fontWeight: 'var(--font-medium)'
                                        }}>
                                            {task.label}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '4px', background: 'var(--color-border)', width: '100%' }}>
                    <div style={{
                        height: '100%',
                        width: `${progressPercentage}%`,
                        background: 'var(--color-success)',
                        transition: 'width 0.5s ease-out'
                    }} />
                </div>
            </div>

            {/* Life Scenarios */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Users size={24} />
                    Life Scenarios
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--space-lg)',
                    marginTop: 'var(--space-lg)'
                }}>
                    {scenarios.map(scenario => (
                        <div
                            key={scenario.id}
                            className="card"
                            onClick={() => handleScenarioSelect(scenario)}
                            style={{
                                cursor: 'pointer',
                                transition: 'all var(--transition-base)',
                                border: selectedContent?.id === scenario.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: selectedContent?.id === scenario.id ? 'var(--color-surface)' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedContent?.id !== scenario.id) {
                                    e.currentTarget.style.background = 'var(--color-surface-hover)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedContent?.id !== scenario.id) {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }
                            }}
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
                                    <span style={{ fontSize: '24px', color: 'white' }}>
                                        {scenario.icon}
                                    </span>
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                        {scenario.title}
                                    </h4>
                                    <p style={{
                                        fontSize: 'var(--font-sm)',
                                        color: 'var(--color-text-secondary)',
                                        lineHeight: 1.5,
                                        marginBottom: 'var(--space-md)'
                                    }}>
                                        {scenario.description}
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        fontSize: 'var(--font-sm)',
                                        color: 'var(--color-text-tertiary)'
                                    }}>
                                        <span style={{
                                            padding: 'var(--space-xs) var(--space-sm)',
                                            background: 'hsla(45, 93%, 47%, 0.2)',
                                            color: 'var(--color-warning)',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: 'var(--font-xs)'
                                        }}>
                                            {scenario.difficulty}
                                        </span>
                                        <span>•</span>
                                        <span>{scenario.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Content Detail */}
            {selectedContent && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        {selectedContent.type === 'scenario' ? <Users size={24} /> : <BookOpen size={24} />}
                        {selectedContent.title}
                    </h3>

                    <div style={{
                        padding: 'var(--space-lg)',
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--space-lg)'
                    }}>
                        {selectedContent.type === 'scenario' ? (
                            <div>
                                <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>
                                    Practical Phrases
                                </h4>
                                <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                                    {selectedContent.phrases?.map((phrase, idx) => (
                                        <div key={idx} style={{
                                            padding: 'var(--space-sm)',
                                            background: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--space-sm)'
                                        }}>
                                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>
                                                <strong>{phrase.german}</strong>
                                            </div>
                                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)' }}>
                                                {phrase.english}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                                {phrase.context}
                                            </div>
                                            {(phrase.mnemonic || phrase.visual_cue) && (
                                                <div style={{
                                                    marginTop: 'var(--space-sm)',
                                                    padding: 'var(--space-sm)',
                                                    borderTop: '1px dashed var(--color-border)',
                                                    background: 'var(--color-bg-primary)',
                                                    borderRadius: 'var(--radius-sm)'
                                                }}>
                                                    {phrase.mnemonic && (
                                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-secondary)' }}>
                                                            <strong>Tip:</strong> {phrase.mnemonic}
                                                        </div>
                                                    )}
                                                    {phrase.visual_cue && (
                                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                                            Imagine: {phrase.visual_cue}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                                    {selectedContent.description}
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                            <button className="btn btn-primary" onClick={() => setSelectedContent(null)}>
                                Back to Overview
                            </button>
                            <button className="btn btn-secondary" onClick={() => completeDailyActivity('content_practice')}>
                                Mark as Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Overview */}
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Award size={24} />
                    Your Learning Journey
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                    <div>
                        <h4>Daily Streak</h4>
                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-success)' }}>
                            {dailyStreak} days
                        </div>
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                            Keep up the great work!
                        </p>
                    </div>

                    <div>
                        <h4>Overall Progress</h4>
                        <div style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                            {overallProgress.overallProgress}% Complete
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--space-sm)',
                            marginTop: 'var(--space-md)'
                        }}>
                            <div>
                                <span>Total Activities:</span>
                                <span style={{ fontWeight: 'var(--font-bold)' }}>{progressStats.totalActivities}</span>
                            </div>
                            <div>
                                <span>Completed:</span>
                                <span style={{ fontWeight: 'var(--font-bold)', }}>{progressStats.completedActivities}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}