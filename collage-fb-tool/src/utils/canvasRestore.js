/**
 * Safely load JSON onto a Fabric canvas and wait for ALL images to
 * finish loading before calling renderAll(). This fixes the "black image"
 * bug when switching variants because loadFromJSON resolves before
 * HTMLImageElements have decoded their source.
 */
export async function safeLoadFromJSON(canvas, jsonInput) {
  const json = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput
  await new Promise((resolve) => {
    canvas.loadFromJSON(json, () => resolve())
  })
  // Collect all image objects (frames + overlays)
  const imageObjs = canvas.getObjects().filter((o) => o.type === 'image' || o.type === 'Image')
  await Promise.all(
    imageObjs.map((img) => {
      const el = img._element || img._originalElement
      if (!el) return Promise.resolve()
      if (el.complete && el.naturalWidth > 0) return Promise.resolve()
      return new Promise((res) => {
        const done = () => res()
        el.addEventListener('load', done, { once: true })
        el.addEventListener('error', done, { once: true })
        // Safety timeout: never hang forever
        setTimeout(done, 5000)
      })
    })
  )
  // Force full re-render once images are decoded
  canvas.requestRenderAll()
  canvas.calcOffset?.()
}