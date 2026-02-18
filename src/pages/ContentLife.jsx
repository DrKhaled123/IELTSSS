import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import {
    User, Calendar, Trophy, TrendingUp, Target, Zap, BookOpen,
    Clock, Award, CheckCircle, Star, Flame, Brain, BarChart3,
    Activity, Edit, Settings, Download
} from 'lucide-react'
import { useLearningProfile } from '../hooks/useLearningProfile'

const ContentLife = memo(function ContentLife() {
    const {
        profile,
        dailyTasks,
        achievements,
        progressStats,
        loading,
        toggleTask,
        addTask,
        updateProfile
    } = useLearningProfile()

    const [activeView, setActiveView] = useState('dashboard') // dashboard, tasks, achievements, analytics
    const [showProfileEdit, setShowProfileEdit] = useState(false)

    // Generate today's smart tasks based on AI recommendations
    useEffect(() => {
        if (!loading && dailyTasks.length === 0) {
            generateDailyTasks()
        }
    }, [loading, dailyTasks.length])

    const generateDailyTasks = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0]
        const dayOfWeek = new Date().getDay()

        const taskTemplates = {
            0: [ // Sunday
                { category: 'review', label: 'Review 20 vocabulary words', points: 10 },
                { category: 'grammar', label: 'Complete grammar quiz', points: 15 },
                { category: 'planning', label: 'Plan next week study schedule', points: 5 }
            ],
            1: [ // Monday
                { category: 'vocabulary', label: 'Learn 10 new academic words', points: 15 },
                { category: 'grammar', label: 'Study advanced grammar rule', points: 10 },
                { category: 'listening', label: 'Listen to IELTS podcast (10 min)', points: 10 }
            ],
            2: [ // Tuesday
                { category: 'speaking', label: 'Practice speaking for 5 minutes', points: 15 },
                { category: 'reading', label: 'Read IELTS passage', points: 10 },
                { category: 'pronunciation', label: 'Practice 10 difficult words', points: 10 }
            ],
            3: [ // Wednesday
                { category: 'writing', label: 'Write 3 complex sentences', points: 15 },
                { category: 'vocabulary', label: 'Review yesterday\'s words', points: 10 },
                { category: 'listening', label: 'Complete listening exercise', points: 10 }
            ],
            4: [ // Thursday
                { category: 'speaking', label: 'Record yourself speaking', points: 15 },
                { category: 'reading', label: 'Practice speed reading', points: 10 },
                { category: 'grammar', label: 'Review grammar mistakes', points: 10 }
            ],
            5: [ // Friday
                { category: 'vocabulary', label: 'Play vocabulary game', points: 10 },
                { category: 'listening', label: 'Watch English video (5 min)', points: 10 },
                { category: 'review', label: 'Weekly progress review', points: 15 }
            ],
            6: [ // Saturday
                { category: 'speaking', label: 'Practice IELTS speaking topics', points: 20 },
                { category: 'writing', label: 'Write a paragraph', points: 15 },
                { category: 'pronunciation', label: 'Record pronunciation practice', points: 10 }
            ]
        }

        const todaysTasks = taskTemplates[dayOfWeek] || taskTemplates[1]

        for (const template of todaysTasks) {
            try {
                await addTask({
                    ...template,
                    date: today,
                    completed: false
                })
            } catch (error) {
                console.error('Error adding task:', error)
            }
        }
    }, [addTask])

    // Calculate completion percentage
    const completionPercentage = useMemo(() => {
        if (dailyTasks.length === 0) return 0
        const completed = dailyTasks.filter(t => t.completed).length
        return Math.round((completed / dailyTasks.length) * 100)
    }, [dailyTasks])

    // Total points earned today
    const pointsEarned = useMemo(() => {
        return dailyTasks
            .filter(t => t.completed)
            .reduce((sum, t) => sum + (t.points || 0), 0)
    }, [dailyTasks])

    // Render loading state
    if (loading) {
        return (
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                flexDirection: 'column',
                gap: 'var(--space-lg)'
            }}>
                <div className="animate-spin" style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid var(--color-border)',
                    borderTop: '3px solid var(--color-primary)',
                    borderRadius: '50%'
                }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>Loading your learning profile...</p>
            </div>
        )
    }

    return (
        <div className="container animate-fadeIn" style={{
            paddingTop: 'var(--space-2xl)',
            paddingBottom: 'var(--space-3xl)'
        }}>
            {/* Header with Profile Summary */}
            <header style={{
                marginBottom: 'var(--space-2xl)',
                padding: 'var(--space-xl)',
                background: 'linear-gradient(135deg, #0b1839 0%, #0b3b8c 50%, #0a2e6e 100%)',
                borderRadius: 'var(--radius-2xl)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <User size={32} />
                                </div>
                                <div>
                                    <h1 style={{ color: 'white', marginBottom: 'var(--space-xs)' }}>
                                        {profile?.name || 'IELTS Learner'}
                                    </h1>
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 'var(--font-sm)' }}>
                                        <span>Level: {profile?.currentLevel || 'B1'}</span>
                                        <span>•</span>
                                        <span>Target Band: {profile?.targetBand || 7.0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowProfileEdit(!showProfileEdit)}
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
                        >
                            <Settings size={20} />
                            Settings
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 'var(--space-md)',
                        marginTop: 'var(--space-xl)'
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.25)',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-lg)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                <Flame size={18} />
                                <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600' }}>Streak</span>
                            </div>
                            <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-bold)' }}>
                                {progressStats.currentStreak}
                            </div>
                            <div style={{ fontSize: 'var(--font-xs)', opacity: 0.9, fontWeight: '500' }}>days</div>
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.25)',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-lg)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                <CheckCircle size={18} />
                                <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600' }}>Tasks</span>
                            </div>
                            <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-bold)' }}>
                                {progressStats.tasksCompleted}
                            </div>
                            <div style={{ fontSize: 'var(--font-xs)', opacity: 0.9, fontWeight: '500' }}>completed</div>
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.25)',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-lg)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                <Clock size={18} />
                                <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600' }}>Study Time</span>
                            </div>
                            <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-bold)' }}>
                                {Math.round(progressStats.totalStudyTime / 60)}
                            </div>
                            <div style={{ fontSize: 'var(--font-xs)', opacity: 0.9, fontWeight: '500' }}>hours</div>
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.25)',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-lg)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                <Brain size={18} />
                                <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600' }}>Vocabulary</span>
                            </div>
                            <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-bold)' }}>
                                {progressStats.vocabularyMastered}
                            </div>
                            <div style={{ fontSize: 'var(--font-xs)', opacity: 0.9, fontWeight: '500' }}>mastered</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                marginBottom: 'var(--space-xl)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 'var(--space-sm)'
            }}>
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: Activity },
                    { id: 'tasks', label: 'Daily Tasks', icon: CheckCircle },
                    { id: 'achievements', label: 'Achievements', icon: Trophy },
                    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`btn ${activeView === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveView(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Dashboard View */}
            {activeView === 'dashboard' && (
                <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
                    {/* Today's Progress Card */}
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, hsl(270, 80%, 55%) 0%, hsl(285, 75%, 52%) 50%, hsl(300, 70%, 50%) 100%)',
                        color: 'white',
                        border: 'none'
                    }}>
                        <h3 style={{ color: 'white', marginBottom: 'var(--space-md)' }}>
                            <Calendar size={24} style={{ display: 'inline', marginRight: 'var(--space-sm)' }} />
                            Today's Progress
                        </h3>

                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                <span>{dailyTasks.filter(t => t.completed).length} / {dailyTasks.length} tasks completed</span>
                                <span style={{ fontWeight: 'var(--font-bold)' }}>{completionPercentage}%</span>
                            </div>
                            <div style={{
                                height: '12px',
                                background: 'rgba(255,255,255,0.3)',
                                borderRadius: 'var(--radius-full)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${completionPercentage}%`,
                                    background: 'linear-gradient(90deg, hsl(85, 90%, 55%) 0%, hsl(120, 70%, 45%) 100%)',
                                    transition: 'width 0.5s ease',
                                    borderRadius: 'var(--radius-full)'
                                }} />
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.2)',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-lg)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 'var(--font-sm)', opacity: 0.9 }}>Points Earned Today</div>
                                    <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-bold)' }}>
                                        {pointsEarned}
                                    </div>
                                </div>
                                <Star size={48} style={{ opacity: 0.3 }} />
                            </div>
                        </div>
                    </div>

                    {/* Skills Progress */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>
                            <Target size={24} style={{ display: 'inline', marginRight: 'var(--space-sm)' }} />
                            Skills Progress
                        </h3>

                        <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                            {[
                                { name: 'Reading', key: 'reading', color: 'hsl(250, 95%, 60%)' },
                                { name: 'Writing', key: 'writing', color: 'hsl(180, 85%, 52%)' },
                                { name: 'Listening', key: 'listening', color: 'hsl(330, 95%, 62%)' },
                                { name: 'Speaking', key: 'speaking', color: 'hsl(45, 100%, 52%)' },
                                { name: 'Vocabulary', key: 'vocabulary', color: 'hsl(142, 80%, 48%)' },
                                { name: 'Grammar', key: 'grammar', color: 'hsl(199, 95%, 52%)' },
                                { name: 'Pronunciation', key: 'pronunciation', color: 'hsl(4, 95%, 62%)' }
                            ].map(skill => {
                                const value = progressStats.skillsProgress[skill.key] || 0
                                return (
                                    <div key={skill.key}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: 'var(--space-xs)'
                                        }}>
                                            <span style={{ fontWeight: 'var(--font-medium)' }}>{skill.name}</span>
                                            <span style={{ color: skill.color, fontWeight: 'var(--font-bold)' }}>
                                                {value}%
                                            </span>
                                        </div>
                                        <div style={{
                                            height: '8px',
                                            background: 'var(--color-bg-elevated)',
                                            borderRadius: 'var(--radius-full)',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${value}%`,
                                                background: skill.color,
                                                transition: 'width 0.5s ease',
                                                borderRadius: 'var(--radius-full)'
                                            }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Recent Achievements */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>
                            <Trophy size={24} style={{ display: 'inline', marginRight: 'var(--space-sm)' }} />
                            Recent Achievements
                        </h3>

                        {achievements.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: 'var(--space-md)'
                            }}>
                                {achievements.slice(-4).map(achievement => (
                                    <div
                                        key={achievement.id}
                                        style={{
                                            padding: 'var(--space-md)',
                                            background: 'linear-gradient(135deg, hsl(270, 80%, 55%) 0%, hsl(290, 75%, 50%) 100%)',
                                            border: '1px solid hsl(90, 80%, 55%)',
                                            borderRadius: 'var(--radius-lg)',
                                            color: 'white',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{ fontSize: 'var(--font-3xl)', marginBottom: 'var(--space-sm)' }}>
                                            {achievement.title.split(' ')[0]}
                                        </div>
                                        <div style={{ fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-xs)' }}>
                                            {achievement.title.substring(achievement.title.indexOf(' ') + 1)}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-xs)', opacity: 0.8 }}>
                                            {achievement.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-xl)' }}>
                                Complete tasks to unlock achievements! 🏆
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Tasks View */}
            {activeView === 'tasks' && (
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Today's Tasks</h3>

                    {dailyTasks.length > 0 ? (
                        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                            {dailyTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => toggleTask(task.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        padding: 'var(--space-lg)',
                                        background: task.completed
                                            ? 'rgba(var(--color-success-rgb), 0.1)'
                                            : 'var(--color-surface)',
                                        border: task.completed
                                            ? '2px solid var(--color-success)'
                                            : '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: task.completed ? 'var(--color-success)' : 'transparent',
                                        border: task.completed ? 'none' : '2px solid var(--color-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        flexShrink: 0
                                    }}>
                                        {task.completed && <CheckCircle size={20} />}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: 'var(--font-medium)',
                                            color: task.completed ? 'var(--color-text-tertiary)' : 'var(--color-text)',
                                            textDecoration: task.completed ? 'line-through' : 'none',
                                            marginBottom: 'var(--space-xs)'
                                        }}>
                                            {task.label}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                            {task.category}
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: 'var(--gradient-accent)',
                                        color: 'white',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: 'var(--font-sm)',
                                        fontWeight: 'var(--font-bold)'
                                    }}>
                                        +{task.points || 0} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-2xl)' }}>
                            No tasks for today. Check back tomorrow!
                        </p>
                    )}
                </div>
            )}

            {/* Achievements View */}
            {activeView === 'achievements' && (
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>All Achievements</h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: 'var(--space-lg)'
                    }}>
                        {achievements.map(achievement => (
                            <div
                                key={achievement.id}
                                className="card"
                                style={{
                                    background: 'var(--gradient-primary)',
                                    color: 'white',
                                    border: 'none',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    fontSize: 'var(--font-5xl)',
                                    marginBottom: 'var(--space-md)'
                                }}>
                                    {achievement.title.split(' ')[0]}
                                </div>
                                <h4 style={{ color: 'white', marginBottom: 'var(--space-sm)' }}>
                                    {achievement.title.substring(achievement.title.indexOf(' ') + 1)}
                                </h4>
                                <p style={{ fontSize: 'var(--font-sm)', opacity: 0.9 }}>
                                    {achievement.description}
                                </p>
                                <div style={{
                                    marginTop: 'var(--space-md)',
                                    fontSize: 'var(--font-xs)',
                                    opacity: 0.7
                                }}>
                                    Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}
                                </div>
                            </div>
                        ))}

                        {achievements.length === 0 && (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: 'var(--space-3xl)',
                                color: 'var(--color-text-secondary)'
                            }}>
                                <Trophy size={64} style={{ opacity: 0.3, marginBottom: 'var(--space-lg)' }} />
                                <h3>No Achievements Yet</h3>
                                <p>Complete tasks and reach milestones to unlock achievements!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Analytics View */}
            {activeView === 'analytics' && (
                <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>Performance Analytics</h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 'var(--space-lg)'
                        }}>
                            <div style={{
                                padding: 'var(--space-lg)',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-lg)',
                                textAlign: 'center'
                            }}>
                                <Flame size={32} color="var(--color-error)" style={{ marginBottom: 'var(--space-sm)' }} />
                                <div style={{ fontSize: 'var(--font-4xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                                    {progressStats.currentStreak}
                                </div>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                    Current Streak
                                </div>
                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-xs)' }}>
                                    Longest: {progressStats.longestStreak} days
                                </div>
                            </div>

                            <div style={{
                                padding: 'var(--space-lg)',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-lg)',
                                textAlign: 'center'
                            }}>
                                <Clock size={32} color="var(--color-secondary)" style={{ marginBottom: 'var(--space-sm)' }} />
                                <div style={{ fontSize: 'var(--font-4xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                                    {Math.round(progressStats.totalStudyTime / 60)}
                                </div>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                    Total Hours
                                </div>
                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-xs)' }}>
                                    Study Time
                                </div>
                            </div>

                            <div style={{
                                padding: 'var(--space-lg)',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-lg)',
                                textAlign: 'center'
                            }}>
                                <CheckCircle size={32} color="var(--color-success)" style={{ marginBottom: 'var(--space-sm)' }} />
                                <div style={{ fontSize: 'var(--font-4xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                                    {progressStats.tasksCompleted}
                                </div>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                    Tasks Completed
                                </div>
                            </div>

                            <div style={{
                                padding: 'var(--space-lg)',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-lg)',
                                textAlign: 'center'
                            }}>
                                <Brain size={32} color="var(--color-accent)" style={{ marginBottom: 'var(--space-sm)' }} />
                                <div style={{ fontSize: 'var(--font-4xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                                    {progressStats.vocabularyMastered}
                                </div>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                    Words Mastered
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>Export Your Data</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            Download your learning progress and analytics data for your records.
                        </p>
                        <button className="btn btn-primary">
                            <Download size={20} />
                            Export as JSON
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
})

export default ContentLife
