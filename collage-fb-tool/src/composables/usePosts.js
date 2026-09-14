import { ref, computed } from 'vue'
import { useIndexedDB } from './useIndexedDB'
import { useFileSystem } from './useFileSystem'
import { distributeVariants } from '../utils/distribution'
import { formatScheduledAt } from '../utils/schedule'
const db = useIndexedDB()
const fs = useFileSystem()
export function usePosts() {
  const contents = ref([])
  const assignments = ref([])
  const pageCount = ref(16)
  const initialized = ref(false)
  async function init() {
    if (initialized.value) return
    try {
      const savedDir = await db.get('settings', 'dirHandle')
      if (savedDir?.value) fs.setDirHandle(savedDir.value)
    } catch (e) { /* not serializable on some browsers */ }
    const savedPageCount = await db.get('settings', 'pageCount')
    if (savedPageCount?.value) pageCount.value = savedPageCount.value
    contents.value = (await db.getAll('contents')) || []
    assignments.value = (await db.getAll('assignments')) || []
    initialized.value = true
  }
  async function setPageCount(n) {
    const num = Math.max(1, Math.floor(n))
    pageCount.value = num
    await db.put('settings', { key: 'pageCount', value: num })
  }
  async function saveDirHandle(handle) {
    fs.setDirHandle(handle)
    try {
      await db.put('settings', { key: 'dirHandle', value: handle })
    } catch (e) { /* ignore */ }
  }
  function nextDisplayNumber(folderDate) {
    const sameDate = contents.value.filter((c) => c.folderDate === folderDate)
    let maxN = 0
    for (const c of sameDate) {
      if (typeof c.displayNumber === 'number') {
        maxN = Math.max(maxN, c.displayNumber)
      }
    }
    return maxN + 1
  }
  async function saveContent({ folderDate, captions, variantBlobs }) {
    if (!Array.isArray(captions) || captions.length !== 4) {
      throw new Error('Can dung 4 caption.')
    }
    if (!Array.isArray(variantBlobs) || variantBlobs.length !== 4) {
      throw new Error('Can dung 4 variant anh.')
    }
    if (!fs.dirHandle.value) throw new Error('Chua chon thu muc luu.')
    const ok = await fs.ensurePermission()
    if (!ok) throw new Error('Khong co quyen ghi vao thu muc.')
    const displayNumber = nextDisplayNumber(folderDate)
    const displayId = `content-${String(displayNumber).padStart(3, '0')}`
    // ID DUY NHAT TOAN DB
    const id = `${folderDate}::${displayId}`
    const dateDir = await fs.ensureDir(fs.dirHandle.value, folderDate)
    const contentDir = await fs.ensureDir(dateDir, displayId)
    const variantPaths = []
    for (let i = 0; i < 4; i++) {
      const filename = `variant-${i + 1}.png`
      await fs.writeFile(contentDir, filename, variantBlobs[i])
      variantPaths.push(`${folderDate}/${displayId}/${filename}`)
    }
    const record = {
      id,
      displayId,
      displayNumber,
      folderDate,
      createdAt: Date.now(),
      captions: [...captions],
      variantPaths,
    }
    await db.put('contents', record)
    contents.value.push(record)
    return record
  }
  /**
   * Phan phoi lai cac content cua 1 ngay.
   * @param {string} folderDate
   * @param {{resetState?: boolean}} opts - resetState=true => xoa trang thai copy/posted
   */
  async function distribute(folderDate, opts = {}) {
    const resetState = !!opts.resetState
    const forDate = contents.value.filter((c) => c.folderDate === folderDate)
    // Build old state map (tru khi resetState)
    const oldStateMap = new Map()
    if (!resetState) {
      const oldAssignments = assignments.value.filter((a) => a.folderDate === folderDate)
      for (const a of oldAssignments) {
        const key = `${a.contentId}::v${a.variantIndex}::p${a.pageNumber}`
        oldStateMap.set(key, {
          imageCopied: !!a.imageCopied,
          captionCopied: !!a.captionCopied,
          posted: !!a.posted,
        })
      }
    }
    // Xoa assignments cu
    const old = assignments.value.filter((a) => a.folderDate === folderDate)
    for (const a of old) await db.del('assignments', a.id)
    assignments.value = assignments.value.filter((a) => a.folderDate !== folderDate)
    if (!forDate.length) return []
    const result = distributeVariants(
      forDate.map((c) => ({ id: c.id, variantCount: 4 })),
      pageCount.value
    )
    const newRecords = result.map((r) => {
      const key = `${r.contentId}::v${r.variantIndex}::p${r.pageNumber}`
      const prev = oldStateMap.get(key)
      return {
        id: `${r.contentId}::v${r.variantIndex}`, // unique vi contentId da unique
        folderDate,
        contentId: r.contentId,
        variantIndex: r.variantIndex,
        pageNumber: r.pageNumber,
        timeSlot: r.timeSlot,
        scheduledAt: formatScheduledAt(folderDate, r.timeSlot),
        imageCopied: prev?.imageCopied || false,
        captionCopied: prev?.captionCopied || false,
        posted: prev?.posted || false,
      }
    })
    for (const rec of newRecords) await db.put('assignments', rec)
    assignments.value.push(...newRecords)
    return newRecords
  }
  async function updateAssignment(id, patch) {
    const idx = assignments.value.findIndex((a) => a.id === id)
    if (idx === -1) return
    const updated = { ...assignments.value[idx], ...patch }
    await db.put('assignments', updated)
    assignments.value[idx] = updated
  }
  async function loadImageBlob(path) {
    const segments = path.split('/')
    return fs.readFile(segments)
  }
  async function deleteContent(contentId) {
    const idx = contents.value.findIndex((c) => c.id === contentId)
    if (idx === -1) return
    await db.del('contents', contentId)
    contents.value.splice(idx, 1)
    const toRemove = assignments.value.filter((a) => a.contentId === contentId)
    for (const a of toRemove) await db.del('assignments', a.id)
    assignments.value = assignments.value.filter((a) => a.contentId !== contentId)
  }
  const folderDates = computed(() => {
    const set = new Set(contents.value.map((c) => c.folderDate))
    return Array.from(set).sort((a, b) => {
      const [da, ma, ya] = a.split('-').map(Number)
      const [db2, mb, yb] = b.split('-').map(Number)
      return new Date(yb, mb - 1, db2) - new Date(ya, ma - 1, da)
    })
  })
  function contentsForDate(date) {
    return contents.value
      .filter((c) => c.folderDate === date)
      .sort((a, b) => (a.displayNumber || 0) - (b.displayNumber || 0))
  }
  function assignmentsForDate(date) {
    return assignments.value.filter((a) => a.folderDate === date)
  }
  return {
    contents,
    assignments,
    pageCount,
    initialized,
    dirHandle: fs.dirHandle,
    pickBaseDir: fs.pickBaseDir,
    saveDirHandle,
    init,
    setPageCount,
    saveContent,
    distribute,
    updateAssignment,
    loadImageBlob,
    deleteContent,
    folderDates,
    contentsForDate,
    assignmentsForDate,
  }
}