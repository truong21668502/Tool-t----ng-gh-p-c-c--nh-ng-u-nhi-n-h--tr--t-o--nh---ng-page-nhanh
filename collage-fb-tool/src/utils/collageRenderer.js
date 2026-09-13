import { layouts } from './layouts'
import { createCoverImage } from './imageCrop'
const GUTTER = 10
const INSET = GUTTER / 2
/**
 * Render a collage onto the canvas.
 *
 * @param {fabric.Canvas} canvas
 * @param {string} layoutId
 * @param {Array<{url,width,height}>} sourceImages - the FULL source list
 * @param {number[]} imageIndices - source indices used by this variant (length = layout.imageCount)
 * @param {number} mainSourceIndex - source index of the main image (must be in imageIndices)
 */
export async function renderCollage(canvas, layoutId, sourceImages, imageIndices, mainSourceIndex) {
  canvas.clear()
  canvas.backgroundColor = '#ffffff'
  const layout = layouts[layoutId]
  if (!layout) {
    canvas.renderAll()
    return
  }
  const zoom = canvas.getZoom() || 1
  const W = canvas.getWidth() / zoom
  const H = canvas.getHeight() / zoom
  // Build the subset for this variant in the order specified by imageIndices
  const subset = (imageIndices || []).map((i) => sourceImages[i]).filter(Boolean)
  if (!subset.length) {
    canvas.renderAll()
    return
  }
  // Position of main within subset
  const mainSubsetPos = Math.max(0, (imageIndices || []).indexOf(mainSourceIndex))
  // Positions within subset that are NOT main
  const nonMainPositions = subset
    .map((_, i) => i)
    .filter((i) => i !== mainSubsetPos)
  const objects = []
  for (const region of layout.regions) {
    let subsetPos = 0
    if (region.role === 'any') {
      subsetPos = 0
    } else if (region.role === 'main') {
      subsetPos = mainSubsetPos
    } else {
      if (!nonMainPositions.length) {
        subsetPos = 0
      } else {
        subsetPos = nonMainPositions[(region.index || 0) % nonMainPositions.length]
      }
    }
    const imgData = subset[subsetPos]
    if (!imgData) continue
    const x0 = region.x * W
    const y0 = region.y * H
    const w0 = region.w * W
    const h0 = region.h * H
    // Inset only on sides that touch another region (not canvas border)
    const eps = 0.005
    const insetL = region.x > eps ? INSET : 0
    const insetT = region.y > eps ? INSET : 0
    const insetR = region.x + region.w < 1 - eps ? INSET : 0
    const insetB = region.y + region.h < 1 - eps ? INSET : 0
    const fx = x0 + insetL
    const fy = y0 + insetT
    const fw = w0 - insetL - insetR
    const fh = h0 - insetT - insetB
    const fabricImg = await createCoverImage(imgData.url, fx, fy, fw, fh)
    fabricImg._regionRole = region.role
    fabricImg._regionIndex = region.index
    objects.push(fabricImg)
  }
  for (const obj of objects) canvas.add(obj)
  canvas.renderAll()
}