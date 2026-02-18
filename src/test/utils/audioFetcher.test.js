import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchWordAudio } from '../../utils/audioFetcher'

describe('audioFetcher', () => {
    beforeEach(() => {
        global.fetch = vi.fn()
    })

    it('should return null if no word is provided', async () => {
        const result = await fetchWordAudio('')
        expect(result).toBeNull()
    })

    it('should return audio URL when API returns valid data', async () => {
        const mockData = [
            {
                word: 'hello',
                phonetics: [
                    { audio: '' },
                    { audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3' }
                ]
            }
        ]

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockData
        })

        const result = await fetchWordAudio('hello')
        expect(result).toBe('https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3')
    })

    it('should return null when API returns 404', async () => {
        global.fetch.mockResolvedValue({
            ok: false
        })

        const result = await fetchWordAudio('nonexistentword')
        expect(result).toBeNull()
    })

    it('should return null when API returns data with no audio', async () => {
        const mockData = [
            {
                word: 'test',
                phonetics: [
                    { text: '/test/' }
                ]
            }
        ]

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockData
        })

        const result = await fetchWordAudio('test')
        expect(result).toBeNull()
    })

    it('should handle fetch errors gracefully', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'))
        
        // Should not throw
        const result = await fetchWordAudio('error')
        expect(result).toBeNull()
    })
})
