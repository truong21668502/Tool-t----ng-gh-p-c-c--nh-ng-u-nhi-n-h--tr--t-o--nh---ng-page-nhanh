import * as fabric from 'fabric'
/**
 * Create a FabricImage that fills a target rect using object-fit: cover.
 * Center crop by default. Aspect ratio preserved.
 *
 * KHONG ap dung uniform scaling cho frame - de user keo canh tu do.
 * App.vue se snap ve cover-fit sau khi keo xong (object:modified).
 */
export async function createCoverImage(url, targetX, targetY, targetW, targetH) {
  const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
  const naturalW = img.width
  const naturalH = img.height
  const scale = Math.max(targetW / naturalW, targetH / naturalH)
  const visibleW = targetW / scale
  const visibleH = targetH / scale
  const cropW = Math.min(visibleW, naturalW)
  const cropH = Math.min(visibleH, naturalH)
  const cropX = (naturalW - cropW) / 2
  const cropY = (naturalH - cropH) / 2
  img.set({
    left: targetX,
    top: targetY,
    cropX,
    cropY,
    width: cropW,
    height: cropH,
    scaleX: scale,
    scaleY: scale,
    originX: 'left',
    originY: 'top',
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockRotation: false,
    // Cho phep keo canh tu do
    lockUniScaling: false,
  })
  img._isFrame = true
  img._frameW = targetW
  img._frameH = targetH
  img._naturalW = naturalW
  img._naturalH = naturalH
  return img
}
export function computeCoverScale(sourceW, sourceH, targetW, targetH) {
  return Math.max(targetW / sourceW, targetH / sourceH)
}