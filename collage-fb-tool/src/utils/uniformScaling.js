/**
 * Uniform scaling helper.
 *
 * - Circle / Arrow / Overlay group: bat buoc uniform (khong cho meo)
 *   -> an 4 control canh, chi con control goc.
 *
 * - Image frame (_isFrame): CHO PHEP keo canh tu do, KHONG ap dung
 *   lockUniScaling. Thay vao do, App.vue hook object:modified de snap
 *   ve dung ty le nguon (object-fit: cover) sau khi keo xong.
 */
export function needsUniformScaling(obj) {
  if (!obj) return false
  // Frame: khong uniform - cho phep keo tu do
  if (obj._isFrame) return false
  return !!(
    obj._isOverlay ||
    obj._isArrow ||
    obj._isCircle ||
    obj.type === 'image' ||
    obj.type === 'Image'
  )
}
export function applyUniformScaling(obj) {
  if (!obj) return obj
  obj.set({ lockUniScaling: true })
  try {
    obj.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false })
  } catch (e) { /* group trong 1 so version khong ho tro */ }
  return obj
}
/**
 * Snap frame ve object-fit: cover sau khi user keo cạnh.
 * - Giu nguyen kich thuoc hien thi (displayed W x H)
 * - Ep scaleX = scaleY = S (uniform)
 * - Dieu chinh crop dims (width/height) va cropX/cropY tuong ung
 * - Giu tam crop
 */
export function snapFrameCoverFit(obj) {
  if (!obj || !obj._isFrame) return
  const sx = obj.scaleX || 1
  const sy = obj.scaleY || 1
  if (Math.abs(sx - sy) < 0.0001) return
  const nW = obj._naturalW
  const nH = obj._naturalH
  if (!nW || !nH) return
  // Kich thuoc hien tai cua frame (sau khi user keo)
  const frameW = obj.width * sx
  const frameH = obj.height * sy
  // Uniform scale de cover frame
  const S = Math.max(frameW / nW, frameH / nH)
  let cropW = frameW / S
  let cropH = frameH / S
  // Clamp (chi co the nho hon hoac bang natural)
  cropW = Math.min(cropW, nW)
  cropH = Math.min(cropH, nH)
  // Giu tam crop cu
  const cx = (obj.cropX || 0) + obj.width / 2
  const cy = (obj.cropY || 0) + obj.height / 2
  let cropX = cx - cropW / 2
  let cropY = cy - cropH / 2
  cropX = Math.max(0, Math.min(nW - cropW, cropX))
  cropY = Math.max(0, Math.min(nH - cropH, cropY))
  obj.set({
    width: cropW,
    height: cropH,
    cropX,
    cropY,
    scaleX: S,
    scaleY: S,
  })
  obj.setCoords()
}