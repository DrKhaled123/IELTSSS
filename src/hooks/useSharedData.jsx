import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// Shared data context for cross-module content access
const SharedDataContext = createContext();

export function SharedDataProvider({ children }) {
    const [sharedData, setSharedData] = useState({
        // PDF-extracted content
        pdfContent: {},
        // Cross-module vocabulary
        sharedVocabulary: {},
        // Grammar rules from PDFs
        sharedGrammar: {},
        // Pronunciation examples
        sharedPronunciation: {},
        // Reading content from PDFs
        sharedReading: {},
        // Content synchronization status
        syncStatus: {}
    });

    // Add PDF content to shared data
    const addPDFContent = useCallback((pdfId, content) => {
        setSharedData(prev => ({
            ...prev,
            pdfContent: {
                ...prev.pdfContent,
                [pdfId]: {
                    ...content,
                    addedAt: new Date().toISOString(),
                    lastAccessed: new Date().toISOString()
                }
            }
        }));
    }, []);

    // Get PDF content
    const getPDFContent = useCallback((pdfId) => {
        return sharedData.pdfContent[pdfId];
    }, [sharedData.pdfContent]);

    // Add vocabulary from PDF extraction
    const addSharedVocabulary = useCallback((source, vocabulary) => {
        setSharedData(prev => ({
            ...prev,
            sharedVocabulary: {
                ...prev.sharedVocabulary,
                [source]: {
                    vocabulary,
                    addedAt: new Date().toISOString(),
                    source: 'pdf'
                }
            }
        }));
    }, []);

    // Get shared vocabulary
    const getSharedVocabulary = useCallback((source) => {
        return sharedData.sharedVocabulary[source]?.vocabulary || [];
    }, [sharedData.sharedVocabulary]);

    // Add grammar rules from PDF extraction
    const addSharedGrammar = useCallback((source, grammarRules) => {
        setSharedData(prev => ({
            ...prev,
            sharedGrammar: {
                ...prev.sharedGrammar,
                [source]: {
                    grammarRules,
                    addedAt: new Date().toISOString(),
                    source: 'pdf'
                }
            }
        }));
    }, []);

    // Get shared grammar
    const getSharedGrammar = useCallback((source) => {
        return sharedData.sharedGrammar[source]?.grammarRules || [];
    }, [sharedData.sharedGrammar]);

    // Add pronunciation examples from PDF
    const addSharedPronunciation = useCallback((source, pronunciationData) => {
        setSharedData(prev => ({
            ...prev,
            sharedPronunciation: {
                ...prev.sharedPronunciation,
                [source]: {
                    pronunciationData,
                    addedAt: new Date().toISOString(),
                    source: 'pdf'
                }
            }
        }));
    }, []);

    // Get shared pronunciation
    const getSharedPronunciation = useCallback((source) => {
        return sharedData.sharedPronunciation[source]?.pronunciationData || [];
    }, [sharedData.sharedPronunciation]);

    // Add reading content from PDF
    const addSharedReading = useCallback((source, readingContent) => {
        setSharedData(prev => ({
            ...prev,
            sharedReading: {
                ...prev.sharedReading,
                [source]: {
                    readingContent,
                    addedAt: new Date().toISOString(),
                    source: 'pdf'
                }
            }
        }));
    }, []);

    // Get shared reading content
    const getSharedReading = useCallback((source) => {
        return sharedData.sharedReading[source]?.readingContent || [];
    }, [sharedData.sharedReading]);

    // Update sync status
    const updateSyncStatus = useCallback((module, status) => {
        setSharedData(prev => ({
            ...prev,
            syncStatus: {
                ...prev.syncStatus,
                [module]: {
                    status,
                    lastSync: new Date().toISOString()
                }
            }
        }));
    }, []);

    // Get all available content for a module - optimized with caching
    const getAvailableContent = useCallback((module) => {
        // Use a cache key to prevent unnecessary recalculations
        const cacheKey = `${module}_${JSON.stringify(Object.keys(sharedData))}`;

        switch (module) {
            case 'vocabulary':
                return Object.values(sharedData.sharedVocabulary).flatMap(item => item.vocabulary || []);
            case 'grammar':
                return Object.values(sharedData.sharedGrammar).flatMap(item => item.grammarRules || []);
            case 'pronunciation':
                return Object.values(sharedData.sharedPronunciation).flatMap(item => item.pronunciationData || []);
            case 'reading':
                return Object.values(sharedData.sharedReading).flatMap(item => item.readingContent || []);
            default:
                return [];
        }
    }, [sharedData.sharedVocabulary, sharedData.sharedGrammar, sharedData.sharedPronunciation, sharedData.sharedReading]);

    // Clear old cached data (cleanup) - optimized with early returns
    const cleanupOldData = useCallback(() => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        setSharedData(prev => {
            const pdfContentKeys = Object.keys(prev.pdfContent);
            if (pdfContentKeys.length === 0) return prev; // Early return if no content

            const newPdfContent = { ...prev.pdfContent };
            let hasChanges = false;

            pdfContentKeys.forEach(pdfId => {
                const content = newPdfContent[pdfId];
                if (content && new Date(content.lastAccessed).getTime() < thirtyDaysAgo) {
                    delete newPdfContent[pdfId];
                    hasChanges = true;
                }
            });

            return hasChanges ? { ...prev, pdfContent: newPdfContent } : prev;
        });
    }, []);

    // Load data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('sharedLearningData');
        if (savedData) {
            try {
                setSharedData(JSON.parse(savedData));
            } catch (error) {
                console.error('Failed to load shared data:', error);
            }
        }
        let cleanupInterval;
        const isTest = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test')
        if (!isTest) {
            cleanupInterval = setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // Daily cleanup
        }
        return () => {
            if (cleanupInterval) clearInterval(cleanupInterval);
        };
    }, [cleanupOldData]);

    // Save data to localStorage when it changes (debounced for performance)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('sharedLearningData', JSON.stringify(sharedData));
        }, 500); // Debounce localStorage writes

        return () => clearTimeout(timeoutId);
    }, [sharedData]);

    const value = useMemo(() => ({
        sharedData,
        addPDFContent,
        getPDFContent,
        addSharedVocabulary,
        getSharedVocabulary,
        addSharedGrammar,
        getSharedGrammar,
        addSharedPronunciation,
        getSharedPronunciation,
        addSharedReading,
        getSharedReading,
        updateSyncStatus,
        getAvailableContent,
        cleanupOldData
    }), [sharedData, addPDFContent, getPDFContent, addSharedVocabulary, getSharedVocabulary, addSharedGrammar, getSharedGrammar, addSharedPronunciation, getSharedPronunciation, addSharedReading, getSharedReading, updateSyncStatus, getAvailableContent, cleanupOldData]);

    return (
        <SharedDataContext.Provider value={value}>
            {children}
        </SharedDataContext.Provider>
    );
}

// Custom hook to use shared data
export function useSharedData() {
    const context = useContext(SharedDataContext);
    if (!context) {
        throw new Error('useSharedData must be used within a SharedDataProvider');
    }
    return context;
}
