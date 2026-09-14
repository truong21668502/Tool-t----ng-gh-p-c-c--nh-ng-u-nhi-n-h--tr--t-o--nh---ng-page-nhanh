const DB_NAME = 'collage-fb-posts'
const DB_VERSION = 1
let dbPromise = null
function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('contents')) {
        const s = db.createObjectStore('contents', { keyPath: 'id' })
        s.createIndex('folderDate', 'folderDate', { unique: false })
      }
      if (!db.objectStoreNames.contains('assignments')) {
        const s = db.createObjectStore('assignments', { keyPath: 'id' })
        s.createIndex('folderDate', 'folderDate', { unique: false })
        s.createIndex('contentId', 'contentId', { unique: false })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}
async function runTx(storeName, mode, fn) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode)
    const store = t.objectStore(storeName)
    let req
    try {
      req = fn(store)
    } catch (e) {
      reject(e)
      return
    }
    t.oncomplete = () => resolve(req?.result)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}
export function useIndexedDB() {
  async function put(storeName, value) {
    return runTx(storeName, 'readwrite', (s) => s.put(value))
  }
  async function get(storeName, key) {
    return runTx(storeName, 'readonly', (s) => s.get(key))
  }
  async function del(storeName, key) {
    return runTx(storeName, 'readwrite', (s) => s.delete(key))
  }
  async function getAll(storeName) {
    return runTx(storeName, 'readonly', (s) => s.getAll())
  }
  return { put, get, del, getAll }
}