<template>
  <div class="app-shell">
    <header class="toolbar">
      <h1>Collage FB Tool</h1>
      <div class="toolbar-actions">
        <input v-model="articleName" class="article-input" placeholder="article-01" />
        <button @click="generateVariants" :disabled="images.length < 1 || !canvasReady">
          Generate 4 Variants
        </button>
        <button @click="exportCurrent" :disabled="!canvasReady || variants.length === 0">
          Download Current
        </button>
        <button class="btn-accent" @click="exportAll" :disabled="!canvasReady || variants.length === 0 || exporting">
          {{ exporting ? 'Exporting...' : 'Download All (ZIP)' }}
        </button>
      </div>
    </header>
    <div class="main-area">
      <aside class="sidebar-left">
        <div class="sidebar-header">
          <span>Images ({{ images.length }})</span>
          <button v-if="images.length > 0" class="btn-clear" @click="clearAllImages" title="Xoa het anh de lam dot tiep theo">
            Clear All
          </button>
        </div>
        <ImageUploader :count="images.length" @images-added="onImagesAdded" />
        <ImageList
          :images="images"
          :main-index="mainIndex"
          @remove="removeImage"
          @set-main="setMainImage"
          @reorder="reorderImages"
        />
      </aside>
      <main class="center-column">
        <EditorToolbar
          :can-undo="canUndo"
          :can-redo="canRedo"
          :has-selection="!!selectedObject"
          @add-text="addText"
          @add-circle="addCircle"
          @add-arrow="addArrow"
          @add-image="triggerAddOverlayImage"
          @undo="undo"
          @redo="redo"
          @delete="deleteSelected"
          @duplicate="duplicateSelected"
          @bring-forward="bringForward"
          @send-backward="sendBackward"
        />
        <div v-if="cropModeActive" class="crop-hint">
          CROP MODE &middot; Keo chuot de dich anh &middot; Lan chuot de zoom &middot; ESC de thoat
        </div>
        <div class="canvas-area" ref="canvasAreaEl">
          <EditorCanvas
            ref="canvasComp"
            :width="1080"
            :height="1350"
            @ready="onCanvasReady"
          />
        </div>
      </main>
      <aside class="sidebar-right">
        <VariantConfigPanel
          v-if="activeVariant"
          :variant="activeVariant"
          :active-index="activeVariantIndex"
          :images="images"
          @change="onVariantConfigChange"
          @regenerate="regenerateCurrentVariant"
        />
        <PropertiesPanel
          :selected="selectedObject"
          :version="objectVersion"
          :canvas="fabricCanvasRef"
          @change="onPropertiesChanged"
        />
        <LayersPanel
          :canvas="fabricCanvasRef"
          :version="layersVersion"
          :selected="selectedObject"
          @select="onLayerSelected"
        />
      </aside>
    </div>
    <footer class="variant-bar">
      <VariantSelector
        :variants="variants"
        :active-index="activeVariantIndex"
        @select="switchVariant"
      />
    </footer>
    <input ref="overlayInputEl" type="file" accept="image/*" hidden @change="onOverlayFileSelected" />
  </div>
</template>
<script setup>
import { ref, shallowRef, computed } from 'vue'
import * as fabric from 'fabric'
import JSZip from 'jszip'
import ImageUploader from './components/images/ImageUploader.vue'
import ImageList from './components/images/ImageList.vue'
import EditorCanvas from './components/editor/EditorCanvas.vue'
import EditorToolbar from './components/editor/EditorToolbar.vue'
import PropertiesPanel from './components/editor/PropertiesPanel.vue'
import LayersPanel from './components/editor/LayersPanel.vue'
import VariantSelector from './components/variants/VariantSelector.vue'
import VariantConfigPanel from './components/variants/VariantConfigPanel.vue'
import { useImageLoader } from './composables/useImageLoader'
import { useVariants } from './composables/useVariants'
import { useCanvasHistory } from './composables/useCanvasHistory'
import { useCropMode } from './composables/useCropMode'
import { renderCollage } from './utils/collageRenderer'
import { safeLoadFromJSON } from './utils/canvasRestore'
import { textPresets } from './utils/textPresets'
import { createCircle } from './utils/circle'
import { createArrow } from './utils/arrow'
import { layouts } from './utils/layouts'
const canvasComp = ref(null)
const canvasAreaEl = ref(null)
const overlayInputEl = ref(null)
const canvasReady = ref(false)
const fabricCanvasRef = shallowRef(null)
const exporting = ref(false)
const articleName = ref('article-01')
const selectedObject = shallowRef(null)
const objectVersion = ref(0)
const layersVersion = ref(0)
const {
  images, mainIndex, addFiles, removeImage, clearAll: clearAllImagesData,
  setMainImage, reorderImages,
} = useImageLoader()
const {
  variants, activeVariantIndex,
  generateAll, regenerateOne,
  updatePreferences, resolveOne, switchVariant: switchVariantState,
} = useVariants()
const activeVariant = computed(() => variants.value[activeVariantIndex.value] || null)
const history = useCanvasHistory(() => fabricCanvasRef.value)
const { canUndo, canRedo } = history
const crop = useCropMode(() => fabricCanvasRef.value, () => {
  history.push()
})
const cropModeActive = crop.cropModeActive
const EXTRA_PROPS = [
  '_isFrame', '_frameW', '_frameH', '_naturalW', '_naturalH',
  '_regionRole', '_regionIndex', '_isArrow', '_isCircle',
  '_arrowLength', '_arrowColor', '_arrowStrokeWidth', '_isOverlay',
]
function onImagesAdded(files) { addFiles(files) }
function onCanvasReady(canvas) {
  fabricCanvasRef.value = canvas
  canvasReady.value = true
  canvas.on('selection:created', (e) => {
    selectedObject.value = e.selected?.[0] || null
  })
  canvas.on('selection:updated', (e) => {
    selectedObject.value = e.selected?.[0] || null
  })
  canvas.on('selection:cleared', () => {
    selectedObject.value = null
  })
  canvas.on('object:modified', () => {
    objectVersion.value++
    layersVersion.value++
    if (!history.isLocked()) history.push()
  })
  canvas.on('object:added', () => { layersVersion.value++ })
  canvas.on('object:removed', () => {
    layersVersion.value++
    if (selectedObject.value && !canvas.getObjects().includes(selectedObject.value)) {
      selectedObject.value = null
    }
  })
  canvas.on('mouse:dblclick', (opt) => {
    const target = opt.target
    if (target && target._isFrame) {
      crop.enter(target)
    } else if (crop.isActive()) {
      crop.exit()
    }
  })
}
function snapshotCanvas() {
  const c = fabricCanvasRef.value
  if (!c) return null
  return JSON.stringify(c.toObject(EXTRA_PROPS))
}
/* ===== GENERATE / RENDER ===== */
async function renderVariantFromConfig(index) {
  const canvas = fabricCanvasRef.value
  if (!canvas) return
  const v = variants.value[index]
  if (!v || !v.layoutId || !v.imageIndices) return
  await renderCollage(canvas, v.layoutId, images.value, v.imageIndices, v.mainIndex)
  v.canvasJSON = snapshotCanvas()
}
async function generateVariants() {
  generateAll(images.value.length)
  await renderVariantFromConfig(0)
  selectedObject.value = null
  history.reset(snapshotCanvas())
}
async function regenerateCurrentVariant() {
  const idx = activeVariantIndex.value
  const changed = regenerateOne(idx, images.value.length)
  if (!changed) return
  if (crop.isActive()) crop.exit()
  await renderVariantFromConfig(idx)
  selectedObject.value = null
  history.reset(snapshotCanvas())
}
async function onVariantConfigChange(patch) {
  const idx = activeVariantIndex.value
  const v = variants.value[idx]
  if (!v) return
  // ===== Case 1: User doi Layout -> re-roll layout + images =====
  if ('layoutPreference' in patch) {
    const newLayoutId = patch.layoutPreference
    if (newLayoutId !== 'auto' && layouts[newLayoutId]) {
      const needed = layouts[newLayoutId].imageCount
      if (Array.isArray(v.imagesPreference) && v.imagesPreference.length !== needed) {
        updatePreferences(idx, { imagesPreference: 'auto' })
      }
    } else if (Array.isArray(v.imagesPreference)) {
      updatePreferences(idx, { imagesPreference: 'auto' })
    }
    updatePreferences(idx, patch)
    const resolved = resolveOne(idx, images.value.length)
    if (!resolved) return
    if (crop.isActive()) crop.exit()
    await renderVariantFromConfig(idx)
    selectedObject.value = null
    history.reset(snapshotCanvas())
    return
  }
  // ===== Case 2: Chi doi Images hoac Main -> KHONG BAO GIO doi layout =====
  // Neu user doi images, kiem tra count co khop layout hien tai khong
  if ('imagesPreference' in patch) {
    const newImgs = patch.imagesPreference
    const curLayoutCount = layouts[v.layoutId] ? layouts[v.layoutId].imageCount : 0
    if (Array.isArray(newImgs) && newImgs.length !== curLayoutCount) {
      // Count tam lech layout -> chi luu preference, KHONG render, KHONG doi layout.
      // Khi user tick du so anh -> se render lai voi layout hien tai.
      updatePreferences(idx, patch)
      return
    }
  }
  // Neu main khong con trong images -> reset main ve auto
  if ('imagesPreference' in patch && Array.isArray(patch.imagesPreference)) {
    if (v.mainPreference !== 'auto' && !patch.imagesPreference.includes(v.mainPreference)) {
      updatePreferences(idx, { mainPreference: 'auto' })
    }
  }
  updatePreferences(idx, patch)
  // Pin layout hien tai
  const pinnedLayoutId = v.layoutId
  // Neu patch KHONG doi images -> pin ca images hien tai (tranh auto roll lai khi doi main)
  let pinImages
  if (!('imagesPreference' in patch)) {
    pinImages = Array.isArray(v.imageIndices) ? [...v.imageIndices] : undefined
  }
  const resolved = resolveOne(idx, images.value.length, { pinnedLayoutId, pinImages })
  if (!resolved) return
  if (crop.isActive()) crop.exit()
  await renderVariantFromConfig(idx)
  selectedObject.value = null
  history.reset(snapshotCanvas())
}
async function switchVariant(index) {
  if (index === activeVariantIndex.value) return
  if (crop.isActive()) crop.exit()
  const canvas = fabricCanvasRef.value
  if (!canvas) return
  const current = variants.value[activeVariantIndex.value]
  if (current) current.canvasJSON = snapshotCanvas()
  switchVariantState(index)
  const target = variants.value[index]
  if (target && target.canvasJSON) {
    await safeLoadFromJSON(canvas, target.canvasJSON)
  } else if (target) {
    await renderVariantFromConfig(index)
  }
  selectedObject.value = null
  history.reset(snapshotCanvas())
}
/* ===== TOOLBAR ACTIONS ===== */
function addText(presetKey) {
  const canvas = fabricCanvasRef.value
  if (!canvas) return
  const p = textPresets[presetKey] || textPresets.plain
  const t = new fabric.Textbox(p.text, {
    left: 540,
    top: 675,
    width: p.width,
    fontSize: p.fontSize,
    fontWeight: p.fontWeight,
    fontFamily: p.fontFamily,
    fill: p.fill,
    backgroundColor: p.backgroundColor || '',
    padding: p.padding,
    textAlign: p.textAlign,
    charSpacing: p.charSpacing || 0,
    lineHeight: p.lineHeight || 1.16,
    originX: 'center',
    originY: 'center',
  })
  canvas.add(t)
  canvas.setActiveObject(t)
  canvas.requestRenderAll()
  selectedObject.value = t
  history.push()
}
function addCircle() {
  const canvas = fabricCanvasRef.value
  if (!canvas) return
  const c = createCircle({ left: 440, top: 575, radius: 100 })
  canvas.add(c)
  canvas.setActiveObject(c)
  canvas.requestRenderAll()
  selectedObject.value = c
  history.push()
}
function addArrow() {
  const canvas = fabricCanvasRef.value
  if (!canvas) return
  const a = createArrow({ left: 420, top: 675, length: 240 })
  canvas.add(a)
  canvas.setActiveObject(a)
  canvas.requestRenderAll()
  selectedObject.value = a
  history.push()
}
function triggerAddOverlayImage() {
  overlayInputEl.value?.click()
}
async function onOverlayFileSelected(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file || !file.type.startsWith('image/')) return
  const url = URL.createObjectURL(file)
  const canvas = fabricCanvasRef.value
  if (!canvas) return
  const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
  const maxSize = 380
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
  const displayR = (Math.min(img.width, img.height) * scale) / 2
  const clipR = Math.min(img.width, img.height) / 2
  img.set({
    originX: 'center', originY: 'center', left: 0, top: 0,
    scaleX: scale, scaleY: scale,
    clipPath: new fabric.Circle({ radius: clipR, originX: 'center', originY: 'center', left: 0, top: 0 }),
  })
  const border = new fabric.Circle({
    radius: displayR, originX: 'center', originY: 'center', left: 0, top: 0,
    fill: 'transparent', stroke: '#d32f2f', strokeWidth: 8,
  })
  const group = new fabric.Group([img, border], {
    left: 540, top: 675, originX: 'center', originY: 'center',
  })
  group._isOverlay = true
  canvas.add(group)
  canvas.setActiveObject(group)
  canvas.requestRenderAll()
  selectedObject.value = group
  history.push()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
function deleteSelected() {
  const canvas = fabricCanvasRef.value
  if (!canvas) return
  const active = canvas.getActiveObjects()
  if (!active.length) return
  active.forEach((o) => canvas.remove(o))
  canvas.discardActiveObject()
  canvas.requestRenderAll()
  selectedObject.value = null
  history.push()
}
async function duplicateSelected() {
  const canvas = fabricCanvasRef.value
  if (!canvas) return
  const active = canvas.getActiveObject()
  if (!active) return
  const cloned = await active.clone()
  cloned.set({ left: (active.left || 0) + 30, top: (active.top || 0) + 30 })
  cloned._isArrow = active._isArrow
  cloned._arrowColor = active._arrowColor
  cloned._arrowStrokeWidth = active._arrowStrokeWidth
  cloned._isCircle = active._isCircle
  cloned._isFrame = active._isFrame
  cloned._frameW = active._frameW
  cloned._frameH = active._frameH
  cloned._naturalW = active._naturalW
  cloned._naturalH = active._naturalH
  cloned._isOverlay = active._isOverlay
  canvas.add(cloned)
  canvas.setActiveObject(cloned)
  canvas.requestRenderAll()
  selectedObject.value = cloned
  history.push()
}
function bringForward() {
  const canvas = fabricCanvasRef.value
  const obj = canvas?.getActiveObject()
  if (!obj) return
  canvas.bringObjectForward(obj)
  canvas.requestRenderAll()
  layersVersion.value++
  history.push()
}
function sendBackward() {
  const canvas = fabricCanvasRef.value
  const obj = canvas?.getActiveObject()
  if (!obj) return
  canvas.sendObjectBackwards(obj)
  canvas.requestRenderAll()
  layersVersion.value++
  history.push()
}
async function undo() {
  if (crop.isActive()) crop.exit()
  await history.undo()
  layersVersion.value++
  objectVersion.value++
}
async function redo() {
  if (crop.isActive()) crop.exit()
  await history.redo()
  layersVersion.value++
  objectVersion.value++
}
function onPropertiesChanged() {
  objectVersion.value++
  history.push()
}
function onLayerSelected(obj) {
  selectedObject.value = obj
  objectVersion.value++
}
/* ===== CLEAR ALL ===== */
function clearAllImages() {
  if (images.value.length === 0) return
  if (!confirm('Xoa toan bo anh de bat dau dot moi?')) return
  if (crop.isActive()) crop.exit()
  clearAllImagesData()
  variants.value = []
  activeVariantIndex.value = 0
  selectedObject.value = null
  const canvas = fabricCanvasRef.value
  if (canvas) {
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    canvas.requestRenderAll()
  }
  history.reset()
}
/* ===== EXPORT ===== */
function slug() {
  return (articleName.value || 'article-01').trim().replace(/\s+/g, '-')
}
function exportCurrent() {
  if (crop.isActive()) crop.exit()
  const canvas = fabricCanvasRef.value
  const v = variants.value[activeVariantIndex.value]
  if (!canvas || !v) return
  const zoom = canvas.getZoom() || 1
  const dataURL = canvas.toDataURL({
    format: 'jpeg',
    quality: 0.93,
    multiplier: 1 / zoom,
  })
  downloadDataURL(dataURL, `${slug()}-v${activeVariantIndex.value + 1}.jpg`)
}
async function exportAll() {
  if (crop.isActive()) crop.exit()
  const canvas = fabricCanvasRef.value
  if (!canvas || variants.value.length === 0) return
  exporting.value = true
  try {
    const originalIndex = activeVariantIndex.value
    variants.value[originalIndex].canvasJSON = snapshotCanvas()
    const zip = new JSZip()
    // Render each variant on a FRESH offscreen canvas so nothing leaks
    // between variants (this was causing duplicated exports).
    for (let i = 0; i < variants.value.length; i++) {
      const v = variants.value[i]
      const off = new fabric.StaticCanvas(null, {
        width: 1080,
        height: 1350,
        backgroundColor: '#ffffff',
        enableRetinaScaling: false,
        renderOnAddRemove: false,
      })
      try {
        if (v.canvasJSON) {
          await safeLoadFromJSON(off, v.canvasJSON)
        } else if (v.layoutId && v.imageIndices) {
          await renderCollage(off, v.layoutId, images.value, v.imageIndices, v.mainIndex)
        } else {
          continue
        }
        // Ensure no zoom on offscreen canvas
        off.setZoom(1)
        off.renderAll()
        // Wait a frame so the pixel buffer is populated
        await new Promise((res) => {
          if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => res())
          else setTimeout(res, 20)
        })
        const dataURL = off.toDataURL({
          format: 'jpeg',
          quality: 0.93,
        })
        const base64 = dataURL.split(',')[1]
        zip.file(`${slug()}-v${i + 1}.jpg`, base64, { base64: true })
      } finally {
        off.dispose()
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug()}-variants.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  } catch (err) {
    console.error('Export all failed', err)
    alert('Export that bai: ' + err.message)
  } finally {
    exporting.value = false
  }
}
function downloadDataURL(dataURL, filename) {
  const a = document.createElement('a')
  a.href = dataURL
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
/* ===== KEYBOARD ===== */
function onKeyDown(e) {
  if (crop.isActive()) return
  const tag = (e.target.tagName || '').toLowerCase()
  const isEditingText = tag === 'input' || tag === 'textarea' || tag === 'select'
  const canvas = fabricCanvasRef.value
  const active = canvas?.getActiveObject()
  const isEditingCanvasText = active && (active.type === 'textbox' || active.type === 'i-text' || active.type === 'text') && active.isEditing
  if (isEditingText || isEditingCanvasText) return
  const ctrl = e.ctrlKey || e.metaKey
  if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
  if (ctrl && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }
  if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); return }
  if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText) { e.preventDefault(); deleteSelected(); return }
}
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKeyDown)
}
</script>
<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100vh; }
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: #16213e; border-bottom: 1px solid #2a2a3e;
}
.toolbar h1 { font-size: 15px; font-weight: 600; letter-spacing: 0.3px; }
.toolbar-actions { display: flex; gap: 8px; align-items: center; }
.article-input {
  padding: 6px 10px; border-radius: 4px; border: 1px solid #2a2a3e;
  background: #0f0f1a; color: #eee; font-size: 12px; width: 130px;
}
.toolbar-actions button {
  padding: 6px 14px; border: none; border-radius: 4px;
  cursor: pointer; background: #0f3460; color: #eee; font-size: 12px;
}
.toolbar-actions button:hover:not(:disabled) { background: #1a4a7a; }
.toolbar-actions button:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-accent { background: #1a6a3a !important; }
.btn-accent:hover:not(:disabled) { background: #2a8a4a !important; }
.main-area { display: flex; flex: 1; overflow: hidden; min-height: 0; }
.sidebar-left {
  width: 200px; background: #16213e; padding: 10px;
  overflow-y: auto; border-right: 1px solid #2a2a3e; flex-shrink: 0;
}
.sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11px; color: #aab; margin-bottom: 8px;
}
.btn-clear {
  padding: 3px 8px; font-size: 10px;
  background: #6a1a1a; color: #eee; border: 1px solid #a02828;
  border-radius: 3px; cursor: pointer;
}
.btn-clear:hover { background: #a02828; }
.center-column { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.canvas-area {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: #0a0a12; padding: 12px; overflow: hidden;
  min-height: 0; min-width: 0;
}
.crop-hint {
  padding: 6px 14px;
  background: #1a4a7a;
  color: #cce4ff;
  font-size: 11px;
  text-align: center;
  letter-spacing: 0.4px;
  border-top: 1px solid #2a5a8a;
  border-bottom: 1px solid #2a5a8a;
}
.sidebar-right {
  width: 260px; background: #16213e; padding: 10px;
  overflow-y: auto; border-left: 1px solid #2a2a3e; flex-shrink: 0;
}
.variant-bar {
  display: flex; gap: 8px; padding: 8px 16px;
  background: #16213e; border-top: 1px solid #2a2a3e;
  justify-content: center;
}
</style>