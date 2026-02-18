import { useState, useEffect, useCallback, useRef } from 'react'

// IndexedDB Configuration for IELTS Learning Profile
const DB_NAME = 'IELTSLearningHub'
const DB_VERSION = 1

// Object Stores
const STORES = {
     PROFILE: 'userProfile',
     TASKS: 'dailyTasks',
     PROGRESS: 'progressHistory',
     ACHIEVEMENTS: 'achievements',
     SESSIONS: 'studySessions',
     VOCABULARY: 'vocabularyMastery',
     SKILLS: 'skillsProgress'
}

/**
 * Initialize IndexedDB with all required object stores
 */
const initDB = () => {
     return new Promise((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, DB_VERSION)

          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve(request.result)

          request.onupgradeneeded = (event) => {
               const db = event.target.result

               // User Profile Store
               if (!db.objectStoreNames.contains(STORES.PROFILE)) {
                    const profileStore = db.createObjectStore(STORES.PROFILE, { keyPath: 'id' })
                    profileStore.createIndex('lastUpdated', 'lastUpdated', { unique: false })
               }

               // Daily Tasks Store
               if (!db.objectStoreNames.contains(STORES.TASKS)) {
                    const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id', autoIncrement: true })
                    tasksStore.createIndex('date', 'date', { unique: false })
                    tasksStore.createIndex('completed', 'completed', { unique: false })
                    tasksStore.createIndex('category', 'category', { unique: false })
               }

               // Progress History Store
               if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
                    const progressStore = db.createObjectStore(STORES.PROGRESS, { keyPath: 'id', autoIncrement: true })
                    progressStore.createIndex('date', 'date', { unique: false })
                    progressStore.createIndex('module', 'module', { unique: false })
                    progressStore.createIndex('score', 'score', { unique: false })
               }

               // Achievements Store
               if (!db.objectStoreNames.contains(STORES.ACHIEVEMENTS)) {
                    const achievementsStore = db.createObjectStore(STORES.ACHIEVEMENTS, { keyPath: 'id' })
                    achievementsStore.createIndex('unlockedDate', 'unlockedDate', { unique: false })
                    achievementsStore.createIndex('category', 'category', { unique: false })
               }

               // Study Sessions Store
               if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
                    const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id', autoIncrement: true })
                    sessionsStore.createIndex('startTime', 'startTime', { unique: false })
                    sessionsStore.createIndex('module', 'module', { unique: false })
                    sessionsStore.createIndex('duration', 'duration', { unique: false })
               }

               // Vocabulary Mastery Store
               if (!db.objectStoreNames.contains(STORES.VOCABULARY)) {
                    const vocabStore = db.createObjectStore(STORES.VOCABULARY, { keyPath: 'word' })
                    vocabStore.createIndex('masteryLevel', 'masteryLevel', { unique: false })
                    vocabStore.createIndex('lastReviewed', 'lastReviewed', { unique: false })
                    vocabStore.createIndex('category', 'category', { unique: false })
               }

               // Skills Progress Store (Reading, Writing, Listening, Speaking)
               if (!db.objectStoreNames.contains(STORES.SKILLS)) {
                    const skillsStore = db.createObjectStore(STORES.SKILLS, { keyPath: 'id', autoIncrement: true })
                    skillsStore.createIndex('skill', 'skill', { unique: false })
                    skillsStore.createIndex('date', 'date', { unique: false })
                    skillsStore.createIndex('score', 'score', { unique: false })
               }
          }
     })
}

/**
 * Custom Hook for IndexedDB Operations
 */
export const useIndexedDB = () => {
     const [db, setDb] = useState(null)
     const [isReady, setIsReady] = useState(false)
     const [error, setError] = useState(null)
     const dbRef = useRef(null)

     // Initialize database
     useEffect(() => {
          initDB()
               .then(database => {
                    setDb(database)
                    setIsReady(true)
               })
               .catch(err => {
                    console.error('Failed to initialize IndexedDB:', err)
                    setError(err)
               })

          return () => {
               if (dbRef.current) {
                    dbRef.current.close()
               }
          }
     }, [])

      // Generic add/update operation

     // Generic add/update operation
     const addOrUpdate = useCallback(async (storeName, data) => {
          if (!db) throw new Error('Database not initialized')

          return new Promise((resolve, reject) => {
               const transaction = db.transaction([storeName], 'readwrite')
               const store = transaction.objectStore(storeName)
               const request = store.put(data)

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }, [db])

     // Generic get operation
     const get = useCallback(async (storeName, key) => {
          if (!db) throw new Error('Database not initialized')

          return new Promise((resolve, reject) => {
               const transaction = db.transaction([storeName], 'readonly')
               const store = transaction.objectStore(storeName)
               const request = store.get(key)

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }, [db])

     // Get all records from a store
     const getAll = useCallback(async (storeName) => {
          if (!db) throw new Error('Database not initialized')

          return new Promise((resolve, reject) => {
               const transaction = db.transaction([storeName], 'readonly')
               const store = transaction.objectStore(storeName)
               const request = store.getAll()

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }, [db])

     // Query by index
     const getByIndex = useCallback(async (storeName, indexName, value) => {
          if (!db) throw new Error('Database not initialized')

          return new Promise((resolve, reject) => {
               const transaction = db.transaction([storeName], 'readonly')
               const store = transaction.objectStore(storeName)
               const index = store.index(indexName)
               const request = index.getAll(value)

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }, [db])

     // Delete operation
     const deleteRecord = useCallback(async (storeName, key) => {
          if (!db) throw new Error('Database not initialized')

          return new Promise((resolve, reject) => {
               const transaction = db.transaction([storeName], 'readwrite')
               const store = transaction.objectStore(storeName)
               const request = store.delete(key)

               request.onsuccess = () => resolve()
               request.onerror = () => reject(request.error)
          })
     }, [db])

     // Clear all data from a store
     const clearStore = useCallback(async (storeName) => {
          if (!db) throw new Error('Database not initialized')

          return new Promise((resolve, reject) => {
               const transaction = db.transaction([storeName], 'readwrite')
               const store = transaction.objectStore(storeName)
               const request = store.clear()

               request.onsuccess = () => resolve()
               request.onerror = () => reject(request.error)
          })
     }, [db])

     // Count records in a store
     const count = useCallback(async (storeName) => {
          if (!db) throw new Error('Database not initialized')

          return new Promise((resolve, reject) => {
               const transaction = db.transaction([storeName], 'readonly')
               const store = transaction.objectStore(storeName)
               const request = store.count()

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }, [db])

     return {
          isReady,
          error,
          stores: STORES,
          addOrUpdate,
          get,
          getAll,
          getByIndex,
          deleteRecord,
          clearStore,
          count
     }
}

export default useIndexedDB
