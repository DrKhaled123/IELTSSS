import { useCallback, useEffect, useRef, useState } from 'react'

const LANGS = [
  { key: 'hindi', tl: 'hi' },
  { key: 'chinese', tl: 'zh-CN' },
  { key: 'urdu', tl: 'ur' }
]

const CACHE_KEY = 'vocab-translation-cache'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCache(obj) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
  } catch (e) { void 0 }
}

async function translateWord(text, tl) {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&dt=t&tl=' +
    encodeURIComponent(tl) +
    '&q=' +
    encodeURIComponent(text)
  const res = await globalThis.fetch(url)
  if (!res.ok) throw new Error(`translate failed ${res.status}`)
  const json = await res.json()
  const parts = Array.isArray(json?.[0]) ? json[0].map((p) => p?.[0]).filter(Boolean) : []
  return parts.join('')
}

export function useOnDemandTranslation() {
  const [cache, setCache] = useState(readCache())
  const queueRef = useRef([])
  const runningRef = useRef(false)

  useEffect(() => {
    setCache(readCache())
  }, [])

  const enqueueTranslations = useCallback((words) => {
    const unique = Array.from(
      new Set((words || []).map((w) => (typeof w === 'string' ? w : w?.word)).filter(Boolean))
    )
    const pending = []
    unique.forEach((w) => {
      const key = String(w).toLowerCase()
      const existing = cache[key] || {}
      LANGS.forEach(({ key: k }) => {
        if (!existing[k]) pending.push({ word: w, langKey: k })
      })
    })
    queueRef.current.push(...pending)
    if (!runningRef.current) {
      runningRef.current = true
      void run()
    }
  }, [cache])

  const run = useCallback(async () => {
    while (queueRef.current.length) {
      const item = queueRef.current.shift()
      const lower = String(item.word).toLowerCase()
      const current = { ...(cache[lower] || {}) }
      if (current[item.langKey]) continue
      const tl = LANGS.find((l) => l.key === item.langKey)?.tl
      try {
        const translated = await translateWord(item.word, tl)
        current[item.langKey] = translated
        const nextCache = { ...cache, [lower]: current }
        setCache(nextCache)
        writeCache(nextCache)
      } catch {
        // swallow error; try later
      }
      await new Promise((r) => setTimeout(r, 150))
    }
    runningRef.current = false
  }, [cache])

  const getTranslations = useCallback((wordObjOrString) => {
    const w = typeof wordObjOrString === 'string' ? wordObjOrString : wordObjOrString?.word
    if (!w) return {}
    const lower = String(w).toLowerCase()
    return cache[lower] || {}
  }, [cache])

  return { enqueueTranslations, getTranslations, cache }
}
