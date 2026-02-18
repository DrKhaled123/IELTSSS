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
            case 'synced': return '#10b981'
            case 'error': return '#ef4444'
            case 'syncing': return '#f59e0b'
            default: return '#9ca3af'
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
            color: '#2563eb',
            progress: Object.keys(progress.reading || {}).length,
            total: 20,
            percentage: (Object.keys(progress.reading || {}).length / 20) * 100,
            recentActivity: progress.reading ? Object.values(progress.reading).slice(-3) : []
        },
        {
            id: 'vocabulary',
            name: 'Vocabulary',
            icon: Brain,
            color: '#dc2626',
            progress: Object.keys(progress.vocabulary || {}).length,
            total: 100,
            percentage: (Object.keys(progress.vocabulary || {}).length / 100) * 100,
            recentActivity: progress.vocabulary ? Object.values(progress.vocabulary).slice(-3) : []
        },
        {
            id: 'grammar',
            name: 'Grammar',
            icon: Target,
            color: '#7c3aed',
            progress: Object.keys(progress.grammar || {}).length,
            total: 50,
            percentage: (Object.keys(progress.grammar || {}).length / 50) * 100,
            recentActivity: progress.grammar ? Object.values(progress.grammar).slice(-3) : []
        },
        {
            id: 'speaking',
            name: 'Speaking',
            icon: Mic,
            color: '#f59e0b',
            progress: Object.keys(progress.speaking || {}).length,
            total: 30,
            percentage: (Object.keys(progress.speaking || {}).length / 30) * 100,
            recentActivity: progress.speaking ? Object.values(progress.speaking).slice(-3) : []
        }
    ]

    return (
        <div data-testid="progress-dashboard" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div style={{
                background: '#1f2937',
                color: '#f9fafb',
                borderRadius: '16px',
                padding: '48px',
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
                    marginBottom: '48px'
                }}>
                    <div>
                        <h2 style={{ margin: 0, marginBottom: '8px' }}>
                            Learning Progress Dashboard
                        </h2>
                        <p style={{ color: '#6b7280', margin: 0 }}>
                            Comprehensive overview of your IELTS learning journey
                        </p>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        style={{ padding: '8px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Overall Statistics */}
                {overallStats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '24px',
                        marginBottom: '48px'
                    }}>
                        <div className="card" style={{
                            padding: '24px',
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                        }}>
                            <TrendingUp size={32} style={{ margin: '0 auto 8px' }} />
                            <div style={{ fontSize: '32px', fontWeight: '700' }}>
                                {Math.round(overallStats.overallProgress)}%
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                Overall Progress
                            </div>
                        </div>

                        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                            <Target size={32} style={{ margin: '0 auto 8px', color: '#2563eb' }} />
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
                                {overallStats.totalActivities}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                Total Activities
                            </div>
                        </div>

                        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                            <Award size={32} style={{ margin: '0 auto 8px', color: '#f59e0b' }} />
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
                                {overallStats.achievements?.length || 0}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                Achievements
                            </div>
                        </div>

                        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                            <Zap size={32} style={{ margin: '0 auto 8px', color: '#7c3aed' }} />
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#7c3aed' }}>
                                {overallStats.streak}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                Current Streak
                            </div>
                        </div>
                    </div>
                )}

                {/* Module Progress */}
                <div style={{ marginBottom: '48px' }}>
                    <h3 style={{ marginBottom: '24px' }}>Module Progress</h3>
                    <div style={{ display: 'grid', gap: '24px' }}>
                        {moduleProgress.map(module => (
                            <div key={module.id} className="card" style={{ padding: '24px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '8px',
                                            background: module.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            <module.icon size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, marginBottom: '4px' }}>
                                                {module.name}
                                            </h4>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '12px',
                                                color: '#6b7280'
                                            }}>
                                                <span>{module.progress}/{module.total} activities</span>
                                                <span>•</span>
                                                <span>{Math.round(module.percentage)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '100px',
                                            height: '8px',
                                            background: '#f9fafb',
                                            borderRadius: '9999px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${module.percentage}%`,
                                                height: '100%',
                                                background: module.color,
                                                transition: 'width 0.3s ease-in-out'
                                            }} />
                                        </div>
                                        {syncStatus[module.id] && (
                                            <div style={{
                                                color: getSyncStatusColor(syncStatus[module.id].status),
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {getSyncStatusIcon(syncStatus[module.id].status)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                {module.recentActivity.length > 0 && (
                                    <div style={{
                                        padding: '8px',
                                        background: '#f9fafb',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#6b7280'
                                    }}>
                                        <strong>Recent:</strong> {module.recentActivity.length} recent activities
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
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
