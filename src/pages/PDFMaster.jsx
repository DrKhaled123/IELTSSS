import { useState, useEffect, useCallback, useMemo } from 'react'
import { FileText, Search, ZoomIn, ZoomOut, Download, Clock, BookOpen, Brain, Globe, ChevronRight, X, Loader2, AlertCircle } from 'lucide-react'
import { usePDFProcessor } from '../hooks/usePDFProcessor'
import { useProgressTracking } from '../hooks/useProgressTracking'

export default function PDFMaster() {
    const [selectedPDF, setSelectedPDF] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [quickScanResults, setQuickScanResults] = useState(null)
    const [drillDownContent, setDrillDownContent] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState('scan') // 'scan' | 'search' | 'detail'

    const { processPDF, quickScan, searchInPDF } = usePDFProcessor()
    const { trackProgress } = useProgressTracking()

    // Load available PDFs
    const availablePDFs = useMemo(() => [
        {
            id: 'basic-german',
            title: 'Basic German',
            level: 'A1',
            category: 'vocabulary',
            description: 'Essential German vocabulary and phrases',
            size: '2.3 MB'
        },
        {
            id: 'deutsch-aber-hallo-a1',
            title: 'Deutsch aber Hallo A1',
            level: 'A1',
            category: 'comprehensive',
            description: 'Complete German course for beginners',
            size: '15.7 MB'
        },
        {
            id: 'deutsch-aber-hallo-a2',
            title: 'Deutsch aber Hallo A2',
            level: 'A2',
            category: 'comprehensive',
            description: 'Intermediate German course',
            size: '18.2 MB'
        },
        {
            id: 'deutsch-aber-hallo-b1',
            title: 'Deutsch aber Hallo B1',
            level: 'B1',
            category: 'comprehensive',
            description: 'Upper-intermediate German course',
            size: '22.1 MB'
        },
        {
            id: 'deutsch-aber-hallo-b2',
            title: 'Deutsch aber Hallo B2',
            level: 'B2',
            category: 'comprehensive',
            description: 'Advanced German course',
            size: '25.8 MB'
        },
        {
            id: 'sicher-c1',
            title: 'Sicher C1',
            level: 'C1',
            category: 'advanced',
            description: 'Proficiency-level German course',
            size: '31.4 MB'
        },
        {
            id: 'german-for-dummies',
            title: 'German For Dummies',
            level: 'A1-B1',
            category: 'reference',
            description: 'Comprehensive German reference guide',
            size: '8.9 MB'
        },
        {
            id: 'kelime-listesi-b1-b2',
            title: 'Kelime Listesi B1-B2',
            level: 'B1-B2',
            category: 'vocabulary',
            description: 'German vocabulary list for intermediate learners',
            size: '1.2 MB'
        }
    ], [])

    // Handle quick scan
    const handleQuickScan = useCallback(async (pdfId) => {
        setIsLoading(true)
        try {
            const pdf = availablePDFs.find(p => p.id === pdfId)
            if (!pdf) return

            setSelectedPDF(pdf)
            const results = await quickScan(pdfId)
            setQuickScanResults(results)
            setViewMode('scan')

            // Track progress
            trackProgress('pdf_scan', pdfId, {
                title: pdf.title,
                level: pdf.level,
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            console.error('Quick scan failed:', error)
        } finally {
            setIsLoading(false)
        }
    }, [quickScan, trackProgress])

    // Handle search
    const handleSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setQuickScanResults(null)
            return
        }

        setIsLoading(true)
        try {
            const results = await searchInPDF(selectedPDF?.id, query)
            setDrillDownContent(results)
            setViewMode('search')

            trackProgress('pdf_search', selectedPDF?.id, {
                query,
                resultsCount: results.length,
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setIsLoading(false)
        }
    }, [selectedPDF, searchInPDF, trackProgress])

    // Handle drill down
    const handleDrillDown = useCallback((content) => {
        setDrillDownContent(content)
        setViewMode('detail')

        trackProgress('drill_down', selectedPDF?.id, {
            contentType: content.type,
            title: content.title,
            timestamp: new Date().toISOString()
        })
    }, [selectedPDF, trackProgress])

    // Clear all states
    const clearAll = useCallback(() => {
        setSelectedPDF(null)
        setSearchQuery('')
        setQuickScanResults(null)
        setDrillDownContent(null)
        setViewMode('scan')
    }, [])

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
            <header style={{ marginBottom: 'var(--space-2xl)' }}>
                <h1>PDF Master - Fetch & Analyze</h1>
                <p style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-secondary)' }}>
                    Instant scan, ultra-compact first reply, interactive drill-down for German learning materials
                </p>
            </header>

            {/* PDF Selection */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <FileText size={24} />
                    Select German PDF
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--space-lg)',
                    marginTop: 'var(--space-lg)'
                }}>
                    {availablePDFs.map(pdf => (
                        <div
                            key={pdf.id}
                            className="card"
                            onClick={() => handleQuickScan(pdf.id)}
                            style={{
                                cursor: 'pointer',
                                transition: 'all var(--transition-base)',
                                border: selectedPDF?.id === pdf.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: selectedPDF?.id === pdf.id ? 'var(--color-surface)' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedPDF?.id !== pdf.id) {
                                    e.currentTarget.style.background = 'var(--color-surface-hover)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedPDF?.id !== pdf.id) {
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
                                    <FileText size={24} color="white" />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-text)' }}>
                                        {pdf.title}
                                    </h4>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        fontSize: 'var(--font-sm)',
                                        color: 'var(--color-text-secondary)'
                                    }}>
                                        <span style={{
                                            padding: 'var(--space-xs) var(--space-sm)',
                                            background: 'var(--color-primary)',
                                            color: 'white',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: 'var(--font-xs)'
                                        }}>
                                            {pdf.level}
                                        </span>
                                        <span>•</span>
                                        <span>{pdf.category}</span>
                                        <span>•</span>
                                        <span>{pdf.size}</span>
                                    </div>
                                    <p style={{
                                        margin: 'var(--space-xs) 0 0',
                                        fontSize: 'var(--font-sm)',
                                        color: 'var(--color-text-tertiary)',
                                        lineHeight: 1.4
                                    }}>
                                        {pdf.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Scan Results */}
            {quickScanResults && viewMode === 'scan' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <ZoomIn size={24} />
                        Quick Scan Results
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: 'var(--space-lg)',
                        marginTop: 'var(--space-lg)'
                    }}>
                        {/* Summary */}
                        <div className="card" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                            <h4 style={{ color: 'white', marginBottom: 'var(--space-md)' }}>Summary</h4>
                            <p style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
                                {quickScanResults.summary}
                            </p>
                        </div>

                        {/* Keywords */}
                        <div className="card">
                            <h4>Key Topics</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                                {quickScanResults.keywords.map((keyword, idx) => (
                                    <span
                                        key={idx}
                                        className="badge"
                                        style={{
                                            background: 'hsla(45, 93%, 47%, 0.2)',
                                            color: 'var(--color-warning)',
                                            padding: 'var(--space-sm) var(--space-md)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleSearch(keyword)}
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty & Level */}
                        <div className="card">
                            <h4>Assessment</h4>
                            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <Globe size={20} />
                                    <span>Level: <strong>{quickScanResults.recommendedLevel}</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <Clock size={20} />
                                    <span>Est. Reading Time: <strong>{quickScanResults.estimatedReadTime}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => setViewMode('detail')}
                            style={{ flex: 1 }}
                        >
                            <BookOpen size={20} />
                            View Full Content
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleSearch(quickScanResults.keywords[0])}
                            style={{ flex: 1 }}
                        >
                            <Search size={20} />
                            Deep Dive
                        </button>
                    </div>
                </div>
            )}

            {/* Search Interface */}
            {selectedPDF && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Search size={24} />
                        Search in {selectedPDF.title}
                    </h3>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Search for German words, grammar rules, or topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch(searchQuery)
                                }
                            }}
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => handleSearch(searchQuery)}
                            disabled={!searchQuery.trim()}
                        >
                            <Search size={20} />
                            Search
                        </button>
                    </div>
                </div>
            )}

            {/* Search Results / Drill Down Content */}
            {drillDownContent && viewMode === 'search' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <ChevronRight size={24} />
                        Search Results for "{searchQuery}"
                    </h3>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Found <strong>{drillDownContent.length}</strong> results in {selectedPDF?.title}
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: 'var(--space-lg)'
                    }}>
                        {drillDownContent.map((result, idx) => (
                            <div
                                key={idx}
                                className="card"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleDrillDown(result)}
                            >
                                <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                    {result.title}
                                </h4>
                                <p style={{
                                    fontSize: 'var(--font-sm)',
                                    color: 'var(--color-text-secondary)',
                                    lineHeight: 1.5,
                                    marginBottom: 'var(--space-md)'
                                }}>
                                    {result.excerpt}
                                </p>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: 'var(--font-sm)',
                                    color: 'var(--color-text-tertiary)'
                                }}>
                                    <span>Page {result.page}</span>
                                    <span className="badge" style={{ background: 'hsla(250, 84%, 54%, 0.2)' }}>
                                        {result.type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Content View */}
            {drillDownContent && viewMode === 'detail' && (
                <div className="card animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <BookOpen size={24} />
                        {drillDownContent.title || selectedPDF?.title}
                    </h3>

                    <div style={{
                        maxHeight: '500px',
                        overflowY: 'auto',
                        padding: 'var(--space-lg)',
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        lineHeight: 1.6
                    }}>
                        {drillDownContent.content || drillDownContent}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                        <button className="btn btn-secondary" onClick={() => window.print()}>
                            <Download size={20} />
                            Download/Print
                        </button>
                        <button className="btn btn-primary" onClick={clearAll}>
                            <X size={20} />
                            Clear View
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 'var(--z-modal)',
                    background: 'var(--color-bg-overlay)',
                    padding: 'var(--space-2xl)',
                    borderRadius: 'var(--radius-xl)',
                    textAlign: 'center'
                }}>
                    <Loader2 size={48} className="animate-spin" />
                    <p style={{ marginTop: 'var(--space-lg)', color: 'var(--color-text)' }}>
                        Processing PDF content...
                    </p>
                </div>
            )}

            {/* Error State */}
            {!isLoading && !selectedPDF && viewMode !== 'scan' && (
                <div className="card" style={{
                    background: 'hsla(4, 90%, 58%, 0.1)',
                    borderColor: 'var(--color-error)',
                    textAlign: 'center',
                    padding: 'var(--space-2xl)'
                }}>
                    <AlertCircle size={48} style={{ color: 'var(--color-error)', marginBottom: 'var(--space-lg)' }} />
                    <h3 style={{ color: 'var(--color-error)' }}>No PDF Selected</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Please select a German PDF from the list above to get started.
                    </p>
                </div>
            )}
        </div>
    )
}