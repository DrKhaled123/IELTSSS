import { useState, useEffect, useCallback, useMemo } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// PDF processing configuration
const CHUNK_SIZE = 1024 * 1024 // 1MB chunks
const QUICK_SCAN_PAGES = 3 // First 3 pages for instant scan

export function usePDFProcessor() {
    const [processingState, setProcessingState] = useState({
        isLoading: false,
        progress: 0,
        error: null
    })

    // Initialize IndexedDB for PDF storage
    const db = useMemo(() => {
        const request = indexedDB.open('IELTSPDFDB', 1)
        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains('pdfContents')) {
                    db.createObjectStore('pdfContents', { keyPath: 'id' })
                }
                if (!db.objectStoreNames.contains('vocabulary')) {
                    db.createObjectStore('vocabulary', { keyPath: 'german' })
                }
                if (!db.objectStoreNames.contains('grammar')) {
                    db.createObjectStore('grammar', { keyPath: 'id' })
                }
                resolve(db)
            }
            request.onerror = () => reject(request.error)
        })
    }, [])

    // Extract text from PDF - optimized with chunking for large files
    const extractTextFromPDF = useCallback(async (pdfFile) => {
        try {
            const arrayBuffer = await pdfFile.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                disableFontFace: true, // Performance optimization
                disableAutoFetch: true, // Performance optimization
                disableStream: true // Performance optimization
            })
            const pdf = await loadingTask.promise

            let fullText = ''
            const pages = []

            // Process pages in chunks to prevent UI blocking
            const CHUNK_SIZE = 5 // Process 5 pages at a time

            for (let i = 1; i <= pdf.numPages; i += CHUNK_SIZE) {
                const pagePromises = []

                for (let j = 0; j < CHUNK_SIZE && (i + j) <= pdf.numPages; j++) {
                    const pageNum = i + j
                    pagePromises.push(
                        pdf.getPage(pageNum).then(page =>
                            page.getTextContent({
                                normalizeWhitespace: false, // Performance optimization
                                disableCombineTextItems: true // Performance optimization
                            })
                        )
                    )
                }

                const pageResults = await Promise.all(pagePromises)

                pageResults.forEach((textContent, index) => {
                    const pageNum = i + index
                    const pageText = textContent.items.map(item => item.str).join(' ')

                    fullText += pageText + '\n'
                    pages.push({
                        pageNumber: pageNum,
                        text: pageText,
                        wordCount: pageText.split(/\s+/).length
                    })
                })

                // Allow UI to breathe between chunks
                if (i + CHUNK_SIZE <= pdf.numPages) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                }
            }

            return {
                id: pdfFile.name || 'unknown',
                title: pdfFile.name?.replace('.pdf', '') || 'Unknown PDF',
                pages,
                fullText,
                wordCount: fullText.split(/\s+/).length,
                metadata: {
                    pageCount: pdf.numPages,
                    fileSize: pdfFile.size,
                    lastModified: pdfFile.lastModified
                }
            }
        } catch (error) {
            console.error('PDF extraction failed:', error)
            throw new Error('Failed to extract text from PDF')
        }
    }, [])

    // Quick scan for ultra-compact first reply
    const quickScan = useCallback(async (pdfId) => {
        setProcessingState({ isLoading: true, progress: 0, error: null })

        try {
            // Check if PDF is already processed and cached
            const cachedResult = await getCachedPDF(pdfId)
            if (cachedResult) {
                setProcessingState({ isLoading: false, progress: 100, error: null })
                return cachedResult.quickScan
            }

            // Load PDF from folder (simulate - in real app, this would be file input)
            const pdfFile = await loadPDFFile(pdfId)
            const pdfContent = await extractTextFromPDF(pdfFile)

            // Process first few pages for quick scan
            const firstPages = pdfContent.pages.slice(0, QUICK_SCAN_PAGES)
            const firstPagesText = firstPages.map(page => page.text).join(' ')

            // Generate summary
            const summary = generateSummary(firstPagesText)

            // Extract keywords
            const keywords = extractKeywords(firstPagesText)

            // Assess difficulty
            const difficulty = assessDifficulty(firstPagesText)

            // Estimate reading time
            const estimatedReadTime = estimateReadingTime(pdfContent.wordCount)

            // Recommend level
            const recommendedLevel = recommendLevel(difficulty)

            const quickScanResult = {
                summary,
                keywords: keywords.slice(0, 10), // Top 10 keywords
                difficulty,
                estimatedReadTime,
                recommendedLevel,
                pageCount: pdfContent.metadata.pageCount,
                wordCount: pdfContent.wordCount
            }

            // Cache the full PDF content
            await cachePDFContent(pdfId, pdfContent)

            // Cache quick scan result
            await cacheQuickScanResult(pdfId, quickScanResult)

            setProcessingState({ isLoading: false, progress: 100, error: null })
            return quickScanResult

        } catch (error) {
            setProcessingState({ isLoading: false, progress: 0, error: error.message })
            throw error
        }
    }, [db])

    // Search within PDF content
    const searchInPDF = useCallback(async (pdfId, query) => {
        if (!query || !query.trim()) {
            return []
        }

        setProcessingState({ isLoading: true, progress: 0, error: null })

        try {
            const pdfContent = await getCachedPDF(pdfId)
            if (!pdfContent) {
                throw new Error('PDF not found. Please scan first.')
            }

            const results = []
            const queryWords = query.toLowerCase().split(/\s+/)

            // Search through pages - optimized with batching
            const BATCH_SIZE = 10 // Process 10 pages at a time

            for (let i = 0; i < pdfContent.pages.length; i += BATCH_SIZE) {
                const batch = pdfContent.pages.slice(i, i + BATCH_SIZE)

                batch.forEach((page, batchIndex) => {
                    const pageIndex = i + batchIndex
                    const pageText = page.text.toLowerCase()

                    // Find matches
                    let matchCount = 0
                    let excerpt = ''

                    for (const word of queryWords) {
                        const regex = new RegExp(word, 'gi')
                        const matches = pageText.match(regex)
                        if (matches) {
                            matchCount += matches.length
                            if (!excerpt) {
                                // Get context around first match
                                const matchIndex = pageText.indexOf(matches[0])
                                const start = Math.max(0, matchIndex - 50)
                                const end = Math.min(pageText.length, matchIndex + word.length + 50)
                                excerpt = pageText.substring(start, end)
                            }
                        }
                    }

                    if (matchCount > 0) {
                        results.push({
                            id: `search_${pageIndex}_${matchCount}`,
                            title: `Match on Page ${pageIndex}`,
                            excerpt: excerpt || pageText.substring(0, 200) + '...',
                            page: pageIndex,
                            type: determineContentType(pageText),
                            relevance: calculateRelevance(matchCount, queryWords.length)
                        })
                    }
                })

                // Update progress
                setProcessingState(prev => ({
                    ...prev,
                    progress: Math.min(((i + BATCH_SIZE) / pdfContent.pages.length) * 100, 100)
                }))

                // Allow UI to breathe between batches
                if (i + BATCH_SIZE < pdfContent.pages.length) {
                    await new Promise(resolve => setTimeout(resolve, 5))
                }
            }

            setProcessingState({ isLoading: false, progress: 100, error: null })
            return results.sort((a, b) => b.relevance - a.relevance)

        } catch (error) {
            setProcessingState({ isLoading: false, progress: 0, error: error.message })
            throw error
        }
    }, [db])

    // Process PDF in chunks for large files
    const processPDFInChunks = useCallback(async (pdfFile, onProgress) => {
        const chunks = splitPDFIntoChunks(pdfFile)
        const results = []

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            const result = await processChunk(chunk)
            results.push(result)

            onProgress((i + 1) / chunks.length * 100)

            // Allow UI to breathe
            await new Promise(resolve => setTimeout(resolve, 50))
        }

        return mergeResults(results)
    }, [])

    // Helper functions
    const generateSummary = (text) => {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
        const firstSentence = sentences[0] || ''

        return firstSentence.length > 150
            ? firstSentence.substring(0, 147) + '...'
            : firstSentence
    }

    const extractKeywords = (text) => {
        // Simple keyword extraction - in real app, this would be more sophisticated
        const commonWords = new Set(['der', 'die', 'das', 'und', 'in', 'ist', 'mit', 'für', 'auf', 'von', 'zu', 'den', 'dem', 'des', 'im'])

        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.has(word))

        const wordFreq = {}
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1
        })

        return Object.entries(wordFreq)
            .sort(([, a], [, b]) => b - a)
            .map(([word]) => word)
    }

    const assessDifficulty = (text) => {
        // Simple difficulty assessment based on sentence complexity and vocabulary
        const sentences = text.split(/[.!?]+/)
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
        const complexWords = text.match(/\b\w{10,}\b/g) || []

        let difficulty = 1
        if (avgSentenceLength > 15) difficulty += 0.5
        if (complexWords.length > sentences.length * 0.3) difficulty += 0.5

        return Math.min(difficulty, 5)
    }

    const estimateReadingTime = (wordCount) => {
        const averageWPM = 200 // Words per minute for IELTS learners
        const minutes = wordCount / averageWPM
        return minutes < 1 ? '< 1 min' : `${Math.ceil(minutes)} min`
    }

    const recommendLevel = (difficulty) => {
        if (difficulty <= 2) return 'A1'
        if (difficulty <= 3) return 'A2'
        if (difficulty <= 4) return 'B1'
        return 'B2'
    }

    const determineContentType = (text) => {
        if (text.includes('verb') || text.includes(' conjugat')) return 'Grammar'
        if (text.includes('vocab') || text.includes('wort')) return 'Vocabulary'
        if (text.includes('dialog') || text.includes('conversation')) return 'Dialogue'
        return 'Content'
    }

    const calculateRelevance = (matchCount, queryLength) => {
        return Math.min(matchCount / queryLength * 10, 100)
    }

    const splitPDFIntoChunks = (pdfFile) => {
        const chunks = []
        const chunkSize = CHUNK_SIZE

        // For simulation, create chunks based on size
        for (let i = 0; i < pdfFile.size; i += chunkSize) {
            chunks.push({
                start: i,
                end: Math.min(i + chunkSize, pdfFile.size),
                index: i / chunkSize
            })
        }

        return chunks
    }

    const processChunk = async (chunk) => {
        // In real implementation, this would process the chunk
        return {
            chunkIndex: chunk.index,
            processed: true,
            size: chunk.end - chunk.start
        }
    }

    const mergeResults = (results) => {
        return {
            chunks: results,
            totalProcessed: results.reduce((sum, r) => sum + r.size, 0)
        }
    }

    // IndexedDB helpers - optimized with error handling and caching
    const cachePDFContent = async (id, content) => {
        if (!db) return Promise.reject(new Error('Database not initialized'))

        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(['pdfContents'], 'readwrite')
                const store = transaction.objectStore('pdfContents')
                const request = store.put({
                    id,
                    content,
                    cachedAt: Date.now(),
                    size: JSON.stringify(content).length // Track cache size
                })
                request.onsuccess = () => resolve()
                request.onerror = () => reject(request.error)
            } catch (error) {
                reject(error)
            }
        })
    }

    const getCachedPDF = async (id) => {
        if (!db) return Promise.resolve(null)

        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(['pdfContents'], 'readonly')
                const store = transaction.objectStore('pdfContents')
                const request = store.get(id)
                request.onsuccess = () => {
                    const result = request.result
                    // Check if cache is stale (older than 7 days)
                    if (result && result.cachedAt && (Date.now() - result.cachedAt) > 7 * 24 * 60 * 60 * 1000) {
                        resolve(null) // Return null for stale cache
                    } else {
                        resolve(result?.content)
                    }
                }
                request.onerror = () => reject(request.error)
            } catch (error) {
                reject(error)
            }
        })
    }

    const cacheQuickScanResult = async (id, result) => {
        if (!db) return Promise.reject(new Error('Database not initialized'))

        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(['pdfContents'], 'readwrite')
                const store = transaction.objectStore('pdfContents')
                const request = store.get(id)
                request.onsuccess = () => {
                    const existing = request.result
                    if (existing) {
                        existing.quickScan = result
                        existing.lastQuickScan = Date.now()
                        store.put(existing)
                    }
                    resolve()
                }
                request.onerror = () => reject(request.error)
            } catch (error) {
                reject(error)
            }
        })
    }

    const loadPDFFile = async (pdfId) => {
        // In real implementation, this would load from file system
        // For now, simulate with mock data
        const pdfMap = {
            'basic-german': { name: 'Basic German.pdf', size: 2400000 },
            'deutsch-aber-hallo-a1': { name: 'Deutsch aber Hallo A1.pdf', size: 16500000 },
            'deutsch-aber-hallo-a2': { name: 'Deutsch aber Hallo A2.pdf', size: 19100000 },
            'deutsch-aber-hallo-b1': { name: 'Deutsch aber Hallo B1.pdf', size: 23200000 },
            'deutsch-aber-hallo-b2': { name: 'Deutsch aber Hallo B2.pdf', size: 26800000 },
            'sicher-c1': { name: 'Sicher C1.pdf', size: 32400000 },
            'german-for-dummies': { name: 'German For Dummies.pdf', size: 9300000 },
            'kelime-listesi-b1-b2': { name: 'Kelime Listesi B1-B2.pdf', size: 1200000 }
        }

        const pdfInfo = pdfMap[pdfId]
        if (!pdfInfo) {
            throw new Error(`PDF with id ${pdfId} not found`)
        }

        const FileCtor = typeof window !== 'undefined' && window.File ? window.File : null
        if (!FileCtor) throw new Error('File API not supported')
        return new FileCtor(['Mock PDF content'], pdfInfo.name, {
            type: 'application/pdf',
            lastModified: Date.now()
        })
    }

    return {
        processingState,
        quickScan,
        searchInPDF,
        processPDFInChunks
    }
}
