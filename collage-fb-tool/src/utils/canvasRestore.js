/**
 * Safely load JSON onto a Fabric canvas and wait for ALL images to
 * finish loading AND the canvas to actually re-render, before returning.
 *
 * The "black image" and "wrong variant export" bugs both come from
 * loadFromJSON resolving before enlivenObjects/images/rendering finish.
 */
export async function safeLoadFromJSON(canvas, jsonInput) {
  const json = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput
  // 1. Load objects (Fabric resolves once objects are added to canvas)
  await new Promise((resolve) => {
    canvas.loadFromJSON(json, () => resolve())
  })
  // 2. Wait for every image HTMLImageElement to be decoded
  const imageObjs = canvas
    .getObjects()
    .filter((o) => o.type === 'image' || o.type === 'Image')
  await Promise.all(
    imageObjs.map((img) => {
      const el = img._element || img._originalElement
      if (!el) return Promise.resolve()
      if (el.complete && el.naturalWidth > 0) return Promise.resolve()
      return new Promise((res) => {
        const done = () => res()
        el.addEventListener('load', done, { once: true })
        el.addEventListener('error', done, { once: true })
        setTimeout(done, 5000)
      })
    })
  )
  // 3. Refresh coords + render synchronously
  canvas.getObjects().forEach((o) => o.setCoords?.())
  canvas.renderAll()
  // 4. Wait one animation frame so the pixel buffer is actually written
  await new Promise((res) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => res())
    } else {
      setTimeout(res, 20)
    }
  })
  canvas.requestRenderAll()
  canvas.calcOffset?.()
}