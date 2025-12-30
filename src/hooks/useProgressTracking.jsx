import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSpeechSynthesis } from './useSpeechSynthesis';

export function useProgressTracking() {
    const [progress, setProgress] = useState({
        vocabulary: [],
        grammar: [],
        pronunciation: [],
        reading: [],
        speaking: [],
        achievements: [],
        stats: {
            totalStudyTime: 0,
            streakDays: 0,
            lastStudyDate: null,
            wordsMastered: 0,
            lessonsCompleted: 0
        }
    });

    const { speak } = useSpeechSynthesis();

    // Load progress from localStorage
    useEffect(() => {
        const savedProgress = localStorage.getItem('languageLearningProgress');
        if (savedProgress) {
            try {
                setProgress(JSON.parse(savedProgress));
            } catch (error) {
                console.error('Failed to parse progress:', error);
            }
        }
    }, []);

    // Save progress to localStorage
    useEffect(() => {
        localStorage.setItem('languageLearningProgress', JSON.stringify(progress));
    }, [progress]);

    const trackProgress = useCallback((module, action, data) => {
        setProgress(prev => {
            const newModuleData = [...(prev[module] || [])];
            newModuleData.push({
                action,
                data,
                timestamp: new Date().toISOString()
            });

            // Update stats based on action
            const newStats = { ...prev.stats };
            if (action === 'lesson_completed') {
                newStats.lessonsCompleted += 1;
            } else if (action === 'word_mastered') {
                newStats.wordsMastered += 1;
            }

            return {
                ...prev,
                [module]: newModuleData,
                stats: newStats
            };
        });
    }, []);

    const getModuleStats = useCallback((module) => {
        const moduleData = progress[module] || [];
        return {
            totalActions: moduleData.length,
            recentActivity: moduleData.slice(-5),
            lastAction: moduleData[moduleData.length - 1]
        };
    }, [progress]);

    const calculateAchievements = useCallback(() => {
        const achievements = [];
        const { stats } = progress;

        if (stats.lessonsCompleted >= 1) {
            achievements.push({
                id: 'first_lesson',
                title: 'First Step',
                description: 'Completed your first lesson',
                icon: '🎯'
            });
        }

        if (stats.wordsMastered >= 10) {
            achievements.push({
                id: 'vocab_starter',
                title: 'Word Smith',
                description: 'Mastered 10 words',
                icon: '📚'
            });
        }

        if (stats.totalStudyTime >= 60) {
            achievements.push({
                id: 'hour_study',
                title: 'Dedicated Learner',
                description: 'Studied for over an hour',
                icon: '⏱️'
            });
        }

        return achievements;
    }, [progress]);

    const getProgressStats = useCallback((module) => {
        // Mock stats for Reading.jsx
        return {
            wordsRead: progress.stats.wordsMastered * 50,
            timeSpent: progress.stats.totalStudyTime,
            accuracy: 85
        };
    }, [progress]);

    const calculateOverallProgress = useCallback(() => {
        // Calculate real stats
        const totalActivities = (progress.vocabulary?.length || 0) +
            (progress.grammar?.length || 0) +
            (progress.reading?.length || 0) +
            (progress.speaking?.length || 0) +
            (progress.pronunciation?.length || 0);

        return {
            overallProgress: 45, // Target progress
            totalActivities: totalActivities,
            achievements: calculateAchievements(),
            streak: progress.stats.streakDays || 0
        };
    }, [progress, calculateAchievements]);

    const value = useMemo(() => ({
        progress,
        trackProgress,
        getModuleStats,
        calculateAchievements,
        getProgressStats,
        calculateOverallProgress
    }), [progress, trackProgress, getModuleStats, calculateAchievements, getProgressStats, calculateOverallProgress]);

    return value;
}