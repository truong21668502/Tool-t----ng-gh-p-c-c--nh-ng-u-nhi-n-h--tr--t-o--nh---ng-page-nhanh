import { ref } from 'vue'
export function useImageLoader() {
  const images = ref([])
  const mainIndex = ref(0)
  let nextId = 0
  async function addFiles(files) {
    const newImages = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const url = URL.createObjectURL(file)
      const dims = await getImageDimensions(url)
      newImages.push({
        id: nextId++,
        file,
        url,
        name: file.name,
        width: dims.width,
        height: dims.height,
      })
    }
    images.value.push(...newImages)
  }
  function removeImage(id) {
    const idx = images.value.findIndex((img) => img.id === id)
    if (idx === -1) return
    URL.revokeObjectURL(images.value[idx].url)
    images.value.splice(idx, 1)
    if (mainIndex.value >= images.value.length) {
      mainIndex.value = Math.max(0, images.value.length - 1)
    }
  }
  function clearAll() {
    for (const img of images.value) URL.revokeObjectURL(img.url)
    images.value = []
    mainIndex.value = 0
  }
  function setMainImage(id) {
    const idx = images.value.findIndex((img) => img.id === id)
    if (idx !== -1) mainIndex.value = idx
  }
  function reorderImages(fromIdx, toIdx) {
    const arr = [...images.value]
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    images.value = arr
  }
  function getImageDimensions(url) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => resolve({ width: 1, height: 1 })
      img.src = url
    })
  }
  return {
    images,
    mainIndex,
    addFiles,
    removeImage,
    clearAll,
    setMainImage,
    reorderImages,
  }
}