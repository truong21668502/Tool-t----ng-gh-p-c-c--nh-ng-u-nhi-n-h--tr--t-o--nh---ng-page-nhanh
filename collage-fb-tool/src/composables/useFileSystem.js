import { ref } from 'vue'
export function useFileSystem() {
  const dirHandle = ref(null)
  async function pickBaseDir() {
    if (!window.showDirectoryPicker) {
      throw new Error('Trinh duyet khong ho tro File System Access API. Dung Chrome/Edge.')
    }
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
    dirHandle.value = handle
    return handle
  }
  function setDirHandle(handle) {
    dirHandle.value = handle
  }
  async function ensurePermission() {
    if (!dirHandle.value) return false
    const opts = { mode: 'readwrite' }
    try {
      if (await dirHandle.value.queryPermission(opts) === 'granted') return true
      return (await dirHandle.value.requestPermission(opts)) === 'granted'
    } catch (e) {
      return false
    }
  }
  async function ensureDir(parent, name) {
    return parent.getDirectoryHandle(name, { create: true })
  }
  async function writeFile(dir, name, blob) {
    const fh = await dir.getFileHandle(name, { create: true })
    const w = await fh.createWritable()
    await w.write(blob)
    await w.close()
  }
  async function readFile(pathSegments) {
    if (!dirHandle.value) throw new Error('Chua chon thu muc luu.')
    let dir = dirHandle.value
    for (let i = 0; i < pathSegments.length - 1; i++) {
      dir = await dir.getDirectoryHandle(pathSegments[i])
    }
    const fh = await dir.getFileHandle(pathSegments[pathSegments.length - 1])
    return fh.getFile()
  }
  return { dirHandle, pickBaseDir, setDirHandle, ensurePermission, ensureDir, writeFile, readFile }
}