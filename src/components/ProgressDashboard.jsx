import { useState, useEffect } from 'react'
import { 
    BarChart3, 
    TrendingUp, 
    Award, 
    Clock, 
    Target, 
    BookOpen, 
    Mic, 
    Brain, 
    FileText, 
    Star,
    Zap,
    Calendar,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    X
} from 'lucide-react'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useSharedData } from '../hooks/useSharedData'

export default function ProgressDashboard({ isOpen, onClose }) {
    const { progress, calculateOverallProgress } = useProgressTracking()
    const { sharedData, syncStatus } = useSharedData()
    const [selectedTimeframe, setSelectedTimeframe] = useState('week')
    const [overallStats, setOverallStats] = useState(null)

    useEffect(() => {
        const stats = calculateOverallProgress()
        setOverallStats(stats)
    }, [progress, calculateOverallProgress])

    if (!isOpen) return null

    const getSyncStatusColor = (status) => {
        switch (status) {
            case 'synced': return 'var(--color-success)'
            case 'error': return 'var(--color-error)'
            case 'syncing': return 'var(--color-warning)'
            default: return 'var(--color-text-tertiary)'
        }
    }

    const getSyncStatusIcon = (status) => {
        switch (status) {
            case 'synced': return <CheckCircle size={16} />
            case 'error': return <AlertCircle size={16} />
            case 'syncing': return <Clock size={16} />
            default: return <Clock size={16} />
        }
    }

    const moduleProgress = [
        {
            id: 'reading',
            name: 'Reading',
            icon: BookOpen,
            color: 'var(--color-primary)',
            progress: Object.keys(progress.reading || {}).length,
            total: 20,
            percentage: (Object.keys(progress.reading || {}).length / 20) * 100,
            recentActivity: progress.reading ? Object.values(progress.reading).slice(-3) : []
        },
        {
            id: 'vocabulary',
            name: 'Vocabulary',
            icon: Brain,
            color: 'var(--color-secondary)',
            progress: Object.keys(progress.vocabulary || {}).length,
            total: 100,
            percentage: (Object.keys(progress.vocabulary || {}).length / 100) * 100,
            recentActivity: progress.vocabulary ? Object.values(progress.vocabulary).slice(-3) : []
        },
        {
            id: 'grammar',
            name: 'Grammar',
            icon: Target,
            color: 'var(--color-accent)',
            progress: Object.keys(progress.grammar || {}).length,
            total: 50,
            percentage: (Object.keys(progress.grammar || {}).length / 50) * 100,
            recentActivity: progress.grammar ? Object.values(progress.grammar).slice(-3) : []
        },
        {
            id: 'pronunciation',
            name: 'Pronunciation',
            icon: Mic,
            color: 'var(--color-warning)',
            progress: Object.keys(progress.pronunciation || {}).length,
            total: 30,
            percentage: (Object.keys(progress.pronunciation || {}).length / 30) * 100,
            recentActivity: progress.pronunciation ? Object.values(progress.pronunciation).slice(-3) : []
        },
        {
            id: 'pdf',
            name: 'PDF Master',
            icon: FileText,
            color: 'var(--color-info)',
            progress: Object.keys(progress.pdf || {}).length,
            total: 15,
            percentage: (Object.keys(progress.pdf || {}).length / 15) * 100,
            recentActivity: progress.pdf ? Object.values(progress.pdf).slice(-3) : []
        }
    ]

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--color-bg-overlay)',
            zIndex: 'var(--z-modal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-lg)'
        }}>
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-2xl)',
                maxWidth: '1000px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 'var(--space-2xl)' 
                }}>
                    <div>
                        <h2 style={{ margin: 0, marginBottom: 'var(--space-sm)' }}>
                            Learning Progress Dashboard
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                            Comprehensive overview of your German learning journey
                        </p>
                    </div>
                    <button 
                        className="btn btn-secondary" 
                        onClick={onClose}
                        style={{ padding: 'var(--space-sm)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Overall Statistics */}
                {overallStats && (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: 'var(--space-lg)', 
                        marginBottom: 'var(--space-2xl)' 
                    }}>
                        <div className="card" style={{ 
                            padding: 'var(--space-lg)', 
                            textAlign: 'center',
                            background: 'var(--gradient-primary)',
                            color: 'white'
                        }}>
                            <TrendingUp size={32} style={{ margin: '0 auto var(--space-sm)' }} />
                            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)' }}>
                                {Math.round(overallStats.overallProgress)}%
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', opacity: 0.9 }}>
                                Overall Progress
                            </div>
                        </div>
                        
                        <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                            <Target size={32} style={{ margin: '0 auto var(--space-sm)', color: 'var(--color-primary)' }} />
                            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                                {overallStats.totalActivities}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Total Activities
                            </div>
                        </div>
                        
                        <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                            <Award size={32} style={{ margin: '0 auto var(--space-sm)', color: 'var(--color-warning)' }} />
                            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-warning)' }}>
                                {overallStats.achievements?.length || 0}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Achievements
                            </div>
                        </div>
                        
                        <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                            <Zap size={32} style={{ margin: '0 auto var(--space-sm)', color: 'var(--color-accent)' }} />
                            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent)' }}>
                                {overallStats.streak}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Day Streak
                            </div>
                        </div>
                    </div>
                )}

                {/* Module Progress */}
                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Module Progress</h3>
                    <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                        {moduleProgress.map(module => (
                            <div key={module.id} className="card" style={{ padding: 'var(--space-lg)' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    marginBottom: 'var(--space-md)' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: 'var(--radius-md)',
                                            background: module.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            <module.icon size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>
                                                {module.name}
                                            </h4>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 'var(--space-sm)',
                                                fontSize: 'var(--font-sm)',
                                                color: 'var(--color-text-secondary)'
                                            }}>
                                                <span>{module.progress}/{module.total} activities</span>
                                                <span>•</span>
                                                <span>{Math.round(module.percentage)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <div style={{ 
                                            width: '100px',
                                            height: '8px',
                                            background: 'var(--color-bg-elevated)',
                                            borderRadius: 'var(--radius-full)',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${module.percentage}%`,
                                                height: '100%',
                                                background: module.color,
                                                transition: 'width var(--transition-base)'
                                            }} />
                                        </div>
                                        {syncStatus[module.id] && (
                                            <div style={{ 
                                                color: getSyncStatusColor(syncStatus[module.id].status),
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-xs)'
                                            }}>
                                                {getSyncStatusIcon(syncStatus[module.id].status)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Recent Activity */}
                                {module.recentActivity.length > 0 && (
                                    <div style={{ 
                                        padding: 'var(--space-sm)',
                                        background: 'var(--color-bg-elevated)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--font-sm)',
                                        color: 'var(--color-text-secondary)'
                                    }}>
                                        <strong>Recent:</strong> {module.recentActivity.length} recent activities
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shared Content Overview */}
                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>PDF Integration Status</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
                        <div className="card" style={{ padding: 'var(--space-md)' }}>
                            <h4 style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--color-text)' }}>
                                PDF Content
                            </h4>
                            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                                {Object.keys(sharedData.pdfContent || {}).length}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                PDFs Processed
                            </div>
                        </div>
                        
                        <div className="card" style={{ padding: 'var(--space-md)' }}>
                            <h4 style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--color-text)' }}>
                                Shared Vocabulary
                            </h4>
                            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-secondary)' }}>
                                {Object.keys(sharedData.sharedVocabulary || {}).length}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Vocabulary Sources
                            </div>
                        </div>
                        
                        <div className="card" style={{ padding: 'var(--space-md)' }}>
                            <h4 style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--color-text)' }}>
                                Grammar Rules
                            </h4>
                            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent)' }}>
                                {Object.keys(sharedData.sharedGrammar || {}).length}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Grammar Sources
                            </div>
                        </div>
                        
                        <div className="card" style={{ padding: 'var(--space-md)' }}>
                            <h4 style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--color-text)' }}>
                                Pronunciation Data
                            </h4>
                            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-warning)' }}>
                                {Object.keys(sharedData.sharedPronunciation || {}).length}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                                Pronunciation Sources
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close Dashboard
                    </button>
                    <button className="btn btn-primary">
                        <BarChart3 size={18} />
                        View Detailed Analytics
                    </button>
                </div>
            </div>
        </div>
    )
}