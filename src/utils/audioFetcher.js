
export async function fetchWordAudio(word) {
    if (!word) return null;
    
    try {
        const response = await globalThis.fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        
        // Find the first available audio URL
        for (const entry of data) {
            for (const phonetic of entry.phonetics || []) {
                if (phonetic.audio) {
                    return phonetic.audio;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.warn(`Failed to fetch audio for word "${word}":`, error);
        return null;
    }
}
