import { ref } from 'vue'
/**
 * Crop mode cho image frame.
 *
 * Cach hoat dong:
 * - Double-click vao frame de vao crop mode
 * - Keo chuot de dich anh trong frame (khong lo khoang trang)
 * - Lan chuot de zoom (khong zoom out qua muc)
 * - ESC de thoat
 *
 * FIX JITTER:
 * Fabric v6/v7 lang nghe 'mousedown'/'mousemove'/'mouseup' tren upperCanvasEl
 * o bubble phase. Ta dang ky cung loai event nhung o CAPTURE phase tren chinh
 * upperCanvasEl do, va goi stopImmediatePropagation() de Fabric khong bao gio
 * nhan duoc event trong crop mode.
 *
 * Truoc day dung 'pointerdown'/'pointermove' -> KHONG chan duoc 'mousedown'
 * cua Fabric (2 event khac nhau) -> Fabric van chay song song -> jitter.
 */
export function useCropMode(getCanvas, onCommit) {
  const cropModeActive = ref(false)
  let state = null
  let canvas = null
  let handlers = {}
  function enter(obj) {
    if (!obj || !obj._isFrame) return
    canvas = getCanvas()
    if (!canvas) return
    if (state) exit()
    state = {
      obj,
      dragging: false,
      mouseStart: null,
      startCropX: 0,
      startCropY: 0,
    }
    obj.lockMovementX = true
    obj.lockMovementY = true
    obj.hasControls = false
    obj.borderColor = '#4a9eff'
    obj.borderScaleFactor = 3
    obj.evented = false
    obj.selectable = false
    obj.objectCaching = false
    canvas.selection = false
    canvas.skipTargetFind = true
    canvas.setActiveObject(obj)
    canvas.setCursor('grab')
    canvas.requestRenderAll()
    cropModeActive.value = true
    bindEvents()
  }
  function exit() {
    if (!state) return
    const { obj } = state
    obj.lockMovementX = false
    obj.lockMovementY = false
    obj.hasControls = true
    obj.evented = true
    obj.selectable = true
    obj.objectCaching = true
    obj.borderColor = 'rgba(102,153,255,0.75)'
    obj.borderScaleFactor = 1
    obj.setCoords()
    if (canvas) {
      canvas.selection = true
      canvas.skipTargetFind = false
      canvas.setCursor('default')
      canvas.requestRenderAll()
    }
    state = null
    cropModeActive.value = false
    unbindEvents()
    if (onCommit) onCommit()
  }
  function clamp(v, lo, hi) {
    if (hi < lo) return lo
    return Math.max(lo, Math.min(hi, v))
  }
  function bindEvents() {
    const el = canvas.upperCanvasEl
    handlers.down = (e) => {
      if (!state) return
      if (e.button !== 0) return
      if (!isInside(e)) {
        // Click ngoai frame -> exit crop mode, de Fabric xu ly binh thuong
        exit()
        return
      }
      // Chan Fabric nhan mousedown nay
      e.stopImmediatePropagation()
      e.preventDefault()
      state.dragging = true
      state.mouseStart = { x: e.clientX, y: e.clientY }
      state.startCropX = state.obj.cropX || 0
      state.startCropY = state.obj.cropY || 0
      canvas.setCursor('grabbing')
    }
    handlers.move = (e) => {
      if (!state || !state.dragging) return
      // Chi chan khi event se di den canvas (tranh pha vo UI khac tren trang)
      if (el === e.target || el.contains(e.target)) {
        e.stopImmediatePropagation()
      }
      e.preventDefault()
      applyDrag(e)
    }
    handlers.up = (e) => {
      if (!state || !state.dragging) return
      if (el === e.target || el.contains(e.target)) {
        e.stopImmediatePropagation()
      }
      e.preventDefault()
      state.dragging = false
      state.mouseStart = null
      canvas.setCursor('grab')
    }
    handlers.wheel = (e) => {
      if (!state) return
      if (!isInside(e)) return
      e.stopImmediatePropagation()
      e.preventDefault()
      applyZoom(e)
    }
    handlers.key = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        exit()
      }
    }
    // === CAPTURE phase tren upperCanvasEl de chay TRUOC Fabric (bubble) ===
    el.addEventListener('mousedown', handlers.down, true)
    el.addEventListener('wheel', handlers.wheel, { passive: false, capture: true })
    // Mousemove/up o window de van update khi chuot ra ngoai canvas,
    // nhung chi chan khi target thuc su la canvas.
    window.addEventListener('mousemove', handlers.move, true)
    window.addEventListener('mouseup', handlers.up, true)
    window.addEventListener('keydown', handlers.key)
  }
  function unbindEvents() {
    if (!canvas) { handlers = {}; return }
    const el = canvas.upperCanvasEl
    el.removeEventListener('mousedown', handlers.down, true)
    el.removeEventListener('wheel', handlers.wheel, true)
    window.removeEventListener('mousemove', handlers.move, true)
    window.removeEventListener('mouseup', handlers.up, true)
    window.removeEventListener('keydown', handlers.key)
    handlers = {}
  }
  function applyDrag(e) {
    const { obj } = state
    const zoom = canvas.getZoom() || 1
    const dx = (e.clientX - state.mouseStart.x) / zoom
    const dy = (e.clientY - state.mouseStart.y) / zoom
    const scaleX = obj.scaleX || 1
    const scaleY = obj.scaleY || 1
    let newCropX = state.startCropX - dx / scaleX
    let newCropY = state.startCropY - dy / scaleY
    const maxX = Math.max(0, obj._naturalW - obj.width)
    const maxY = Math.max(0, obj._naturalH - obj.height)
    newCropX = clamp(newCropX, 0, maxX)
    newCropY = clamp(newCropY, 0, maxY)
    obj.set({ cropX: newCropX, cropY: newCropY })
    obj.setCoords()
    canvas.requestRenderAll()
  }
  function applyZoom(e) {
    const { obj } = state
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
    const oldW = obj.width
    const oldH = obj.height
    const newW = oldW / factor
    const newH = oldH / factor
    if (newW > obj._naturalW || newH > obj._naturalH) return
    const cx = obj.cropX + oldW / 2
    const cy = obj.cropY + oldH / 2
    let newCropX = cx - newW / 2
    let newCropY = cy - newH / 2
    newCropX = clamp(newCropX, 0, obj._naturalW - newW)
    newCropY = clamp(newCropY, 0, obj._naturalH - newH)
    obj.set({
      width: newW,
      height: newH,
      scaleX: obj.scaleX * factor,
      scaleY: obj.scaleY * factor,
      cropX: newCropX,
      cropY: newCropY,
    })
    obj.setCoords()
    canvas.requestRenderAll()
  }
  function isInside(e) {
    if (!state || !canvas) return false
    const obj = state.obj
    const rect = canvas.upperCanvasEl.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const zoom = canvas.getZoom() || 1
    const objLeft = obj.left * zoom
    const objTop = obj.top * zoom
    const objW = obj.width * obj.scaleX * zoom
    const objH = obj.height * obj.scaleY * zoom
    return x >= objLeft && x <= objLeft + objW && y >= objTop && y <= objTop + objH
  }
  function isActive() { return cropModeActive.value }
  return { cropModeActive, enter, exit, isActive }
}