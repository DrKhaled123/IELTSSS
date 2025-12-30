import { useState, useCallback, useMemo } from 'react'

export function usePDFReader() {
    const [pdfContent, setPdfContent] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    // Mock PDF processing - in real implementation, this would use PDF.js or similar
    const processPDFContent = useCallback(async (pdfFile) => {
        setIsLoading(true)
        setError(null)
        
        try {
            // Simulate PDF processing delay
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            // Mock processed content based on PDF file
            const mockContent = {
                'basic-german': {
                    title: 'Basic German',
                    content: `Willkommen im Deutschkurs!

Lektion 1: Begrüßungen
Hallo! Wie heißen Sie? Ich heißen Müller. Und wer ist das? Das ist Herr Weber. Das ist Frau Bauer.

Lektion 2: Zahlen
Eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn. Wie viel kostet das? Das kostet fünf Euro.

Lektion 3: Familie
Das ist meine Familie. Das ist mein Vater. Das ist meine Mutter. Ich habe einen Bruder und eine Schwester.

Lektion 4: Essen und Trinken
Ich trinke Kaffee. Ich esse Brot. Was möchten Sie? Ich möchte einen Apfel, bitte.

Lektion 5: Zeit
Wann kommen Sie? Ich komme um acht Uhr. Wann gehen Sie? Ich gehe um sechs Uhr.`,
                    level: 'A1',
                    pages: 5,
                    words: 120
                },
                'deutsch-aber-hallo-a1': {
                    title: 'Deutsch aber Hallo A1',
                    content: `Kapitel 1: Kennenlernen
Guten Tag! Mein Name ist Anna. Ich komme aus Polen. Ich lerne Deutsch. Woher kommen Sie? Ich komme aus der Türkei.

Kapitel 2: Im Café
Was möchtest du trinken? Ich möchte einen Kaffee, bitte. Und du? Ich möchte einen Tee. Was kostet das? Der Kaffee kostet drei Euro.

Kapitel 3: Wohnen
Ich wohne in Berlin. Ich habe eine kleine Wohnung. Die Wohnung hat zwei Zimmer, eine Küche und ein Bad. Ich wohne allein.

Kapitel 4: Hobbys
Was machst du gerne? Ich spiele gerne Fußball. Ich höre gerne Musik. Ich lese gerne Bücher. Und du? Was machst du gerne?`,
                    level: 'A1',
                    pages: 8,
                    words: 200
                },
                'deutsch-aber-hallo-a2': {
                    title: 'Deutsch aber Hallo A2',
                    content: `Kapitel 1: Reiseerlebnisse
Letzten Sommer bin ich nach Deutschland gefahren. Ich habe Berlin besucht. Das Brandenburger Tor war sehr beeindruckend. Ich habe viele Fotos gemacht.

Kapitel 2: Arbeit und Beruf
Ich arbeite als Softwareentwickler. Meine Arbeit ist interessant, aber manchmal stressig. Ich arbeite von Montag bis Freitag. Am Wochenende habe ich frei.

Kapitel 3: Gesundheit
Morgen gehe ich zum Arzt. Ich habe Kopfschmerzen. Der Arzt hat mir Medikamente verschrieben. Ich muss dreimal am Tag eine Tablette nehmen.

Kapitel 4: Umwelt
Wir sollten mehr für die Umwelt tun. Ich fahre mit dem Fahrrad zur Arbeit. Ich trenne meinen Müll. Ich kaufe oft Bio-Produkte.`,
                    level: 'A2',
                    pages: 12,
                    words: 350
                }
            }
            
            const content = mockContent[pdfFile] || {
                title: 'Unknown PDF',
                content: 'PDF content could not be processed.',
                level: 'Unknown',
                pages: 1,
                words: 0
            }
            
            setPdfContent(content)
            setTotalPages(content.pages)
            setCurrentPage(0)
            
            return content
        } catch (err) {
            setError(err.message || 'Failed to process PDF')
            return null
        } finally {
            setIsLoading(false)
        }
    }, [])
    
    // Extract text from specific page
    const getPageText = useCallback((pageNumber) => {
        if (!pdfContent) return ''
        
        const sentences = pdfContent.content.split('. ').filter(s => s.trim())
        const sentencesPerPage = Math.ceil(sentences.length / pdfContent.pages)
        const startIndex = pageNumber * sentencesPerPage
        const endIndex = Math.min(startIndex + sentencesPerPage, sentences.length)
        
        return sentences.slice(startIndex, endIndex).join('. ') + '.'
    }, [pdfContent])
    
    // Get current page text
    const currentPageText = useMemo(() => {
        return getPageText(currentPage)
    }, [currentPage, getPageText])
    
    // Navigate to next page
    const nextPage = useCallback(() => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1)
        }
    }, [currentPage, totalPages])
    
    // Navigate to previous page
    const previousPage = useCallback(() => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1)
        }
    }, [currentPage])
    
    // Jump to specific page
    const goToPage = useCallback((pageNumber) => {
        if (pageNumber >= 0 && pageNumber < totalPages) {
            setCurrentPage(pageNumber)
        }
    }, [totalPages])
    
    // Extract vocabulary from PDF content
    const extractVocabulary = useCallback(() => {
        if (!pdfContent) return []
        
        // Simple vocabulary extraction - in real implementation, this would be more sophisticated
        const germanWords = pdfContent.content.match(/\b[A-ZÄÖÜ][a-zäöüß]+\b/g) || []
        const uniqueWords = [...new Set(germanWords)]
        
        return uniqueWords.slice(0, 20).map(word => ({
            word,
            context: pdfContent.content.substring(
                pdfContent.content.indexOf(word) - 20,
                pdfContent.content.indexOf(word) + word.length + 20
            ).trim()
        }))
    }, [pdfContent])
    
    // Clear PDF content
    const clearPDF = useCallback(() => {
        setPdfContent(null)
        setCurrentPage(0)
        setTotalPages(0)
        setError(null)
    }, [])
    
    return {
        pdfContent,
        isLoading,
        error,
        currentPage,
        totalPages,
        currentPageText,
        processPDFContent,
        getPageText,
        nextPage,
        previousPage,
        goToPage,
        extractVocabulary,
        clearPDF
    }
}