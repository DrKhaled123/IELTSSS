// IndexedDB utility for user profile and custom vocabulary
const DB_NAME = 'IELTSProfileDB'
const DB_VERSION = 1

// Wrapper class for easier database operations
class IndexedDBWrapper {
     constructor(db) {
          this.db = db
     }

     async get(storeName, key) {
          return new Promise((resolve, reject) => {
               const transaction = this.db.transaction(storeName, 'readonly')
               const store = transaction.objectStore(storeName)
               const request = store.get(key)

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }

     async getAll(storeName) {
          return new Promise((resolve, reject) => {
               const transaction = this.db.transaction(storeName, 'readonly')
               const store = transaction.objectStore(storeName)
               const request = store.getAll()

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }

     async put(storeName, data, key) {
          return new Promise((resolve, reject) => {
               const transaction = this.db.transaction(storeName, 'readwrite')
               const store = transaction.objectStore(storeName)
               const request = key ? store.put(data, key) : store.put(data)

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }

     async add(storeName, data) {
          return new Promise((resolve, reject) => {
               const transaction = this.db.transaction(storeName, 'readwrite')
               const store = transaction.objectStore(storeName)
               const request = store.add(data)

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }

     async delete(storeName, key) {
          return new Promise((resolve, reject) => {
               const transaction = this.db.transaction(storeName, 'readwrite')
               const store = transaction.objectStore(storeName)
               const request = store.delete(key)

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }

     async clear(storeName) {
          return new Promise((resolve, reject) => {
               const transaction = this.db.transaction(storeName, 'readwrite')
               const store = transaction.objectStore(storeName)
               const request = store.clear()

               request.onsuccess = () => resolve(request.result)
               request.onerror = () => reject(request.error)
          })
     }
}

// Export an enhanced openDB that returns a wrapper
export const openDB = async () => {
     return new Promise((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, DB_VERSION)

          request.onerror = () => reject(request.error)
          request.onsuccess = () => {
               const db = request.result
               resolve(new IndexedDBWrapper(db))
          }

          request.onupgradeneeded = (event) => {
               const db = event.target.result

               // Create object stores if they don't exist
               if (!db.objectStoreNames.contains('userProfile')) {
                    db.createObjectStore('userProfile')
               }

               if (!db.objectStoreNames.contains('customWords')) {
                    const wordsStore = db.createObjectStore('customWords', { keyPath: 'id' })
                    wordsStore.createIndex('username', 'username', { unique: false })
                    wordsStore.createIndex('createdAt', 'createdAt', { unique: false })
               }
          }
     })
}

export default { openDB }
