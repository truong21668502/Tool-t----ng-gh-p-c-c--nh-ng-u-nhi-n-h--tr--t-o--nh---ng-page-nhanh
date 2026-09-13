<template>
  <div class="properties-panel">
    <h3>Properties</h3>
    <div v-if="!selected" class="empty">Chon 1 object tren canvas</div>
    <div v-else class="fields">
      <div class="row-type">Type: <b>{{ typeLabel }}</b></div>
      <!-- TEXT controls -->
      <template v-if="isText">
        <label>Font size
          <input type="number" :value="read('fontSize')" @input="writeNum('fontSize', $event)" min="8" max="300" />
        </label>
        <label>Font weight
          <select :value="read('fontWeight')" @change="write('fontWeight', $event.target.value)">
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="600">Semi-bold</option>
          </select>
        </label>
        <label>Font family
          <select :value="read('fontFamily')" @change="write('fontFamily', $event.target.value)">
            <option value="Arial">Arial</option>
            <option value="Impact">Impact</option>
            <option value="Georgia">Georgia</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Verdana">Verdana</option>
          </select>
        </label>
        <label>Text color
          <input type="color" :value="hex(read('fill'))" @input="write('fill', $event.target.value)" />
        </label>
        <label>Background
          <input type="color" :value="hex(read('backgroundColor') || '#000000')" @input="write('backgroundColor', $event.target.value)" />
        </label>
        <label>Alignment
          <select :value="read('textAlign')" @change="write('textAlign', $event.target.value)">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label>Line height
          <input type="number" step="0.1" :value="read('lineHeight')" @input="writeNum('lineHeight', $event)" min="0.8" max="3" />
        </label>
        <label>Padding
          <input type="number" :value="read('padding')" @input="writeNum('padding', $event)" min="0" max="80" />
        </label>
      </template>
      <!-- CIRCLE controls -->
      <template v-if="isCircle">
        <label>Stroke color
          <input type="color" :value="hex(read('stroke'))" @input="write('stroke', $event.target.value)" />
        </label>
        <label>Stroke width
          <input type="number" :value="read('strokeWidth')" @input="writeNum('strokeWidth', $event)" min="1" max="40" />
        </label>
      </template>
      <!-- ARROW controls -->
      <template v-if="isArrow">
        <label>Arrow color
          <input type="color" :value="arrowColor" @input="changeArrowColor($event.target.value)" />
        </label>
        <label>Stroke width
          <input type="number" :value="arrowStrokeWidth" @input="changeArrowStrokeWidth($event)" min="2" max="40" />
        </label>
      </template>
      <!-- IMAGE controls -->
      <template v-if="isImage">
        <label>Opacity
          <input type="range" min="0.1" max="1" step="0.05" :value="read('opacity')" @input="writeNum('opacity', $event)" />
        </label>
        <label>Zoom (scale)
          <input type="range" min="0.2" max="5" step="0.05" :value="Number(read('scaleX')) || 1" @input="writeScale($event)" />
        </label>
        <label>Crop X
          <input type="range" min="0" :max="maxCropX" step="1" :value="Number(read('cropX')) || 0" @input="writeNum('cropX', $event)" />
        </label>
        <label>Crop Y
          <input type="range" min="0" :max="maxCropY" step="1" :value="Number(read('cropY')) || 0" @input="writeNum('cropY', $event)" />
        </label>
        <button class="reset-btn" @click="resetCrop">Reset crop</button>
      </template>
      <div class="divider"></div>
      <label>Rotation
        <input type="number" :value="Math.round(read('angle') || 0)" @input="writeNum('angle', $event)" />
      </label>
      <label>Pos X
        <input type="number" :value="Math.round(read('left') || 0)" @input="writeNum('left', $event)" />
      </label>
      <label>Pos Y
        <input type="number" :value="Math.round(read('top') || 0)" @input="writeNum('top', $event)" />
      </label>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({
  selected: { type: Object, default: null },
  version: { type: Number, default: 0 },
  canvas: { type: Object, default: null },
})
const emit = defineEmits(['change'])
// eslint-disable-next-line no-unused-vars
const _v = computed(() => props.version) // force re-read on version bump
const isText = computed(() => props.selected?.type === 'textbox' || props.selected?.type === 'i-text' || props.selected?.type === 'text')
const isCircle = computed(() => props.selected?.type === 'circle')
const isArrow = computed(() => !!props.selected?._isArrow)
const isImage = computed(() => props.selected?.type === 'image')
const typeLabel = computed(() => {
  const t = props.selected?.type
  if (isArrow.value) return 'Arrow'
  if (isText.value) return 'Text'
  if (isCircle.value) return 'Circle'
  if (isImage.value) return 'Image'
  return t || '?'
})
const arrowColor = computed(() => props.selected?._arrowColor || '#d32f2f')
const arrowStrokeWidth = computed(() => props.selected?._arrowStrokeWidth || 10)
const maxCropX = computed(() => Math.max(0, Math.floor((props.selected?._naturalW || 0) - (props.selected?.width || 0))))
const maxCropY = computed(() => Math.max(0, Math.floor((props.selected?._naturalH || 0) - (props.selected?.height || 0))))
function read(key) {
  return props.selected ? props.selected[key] : undefined
}
function refresh() {
  props.canvas?.requestRenderAll()
  emit('change')
}
function write(key, value) {
  if (!props.selected) return
  props.selected.set(key, value)
  props.selected.setCoords?.()
  refresh()
}
function writeNum(key, ev) {
  const n = Number(ev.target.value)
  if (Number.isNaN(n)) return
  write(key, n)
}
function writeScale(ev) {
  const n = Number(ev.target.value)
  if (!props.selected || Number.isNaN(n)) return
  props.selected.set({ scaleX: n, scaleY: n })
  props.selected.setCoords?.()
  refresh()
}
function changeArrowColor(color) {
  const s = props.selected
  if (!s || !s._isArrow) return
  s._arrowColor = color
  s.getObjects().forEach((o) => {
    if (o.type === 'line') o.set('stroke', color)
    if (o.type === 'triangle') o.set('fill', color)
  })
  refresh()
}
function changeArrowStrokeWidth(ev) {
  const s = props.selected
  if (!s || !s._isArrow) return
  const w = Number(ev.target.value)
  if (Number.isNaN(w)) return
  s._arrowStrokeWidth = w
  const objs = s.getObjects()
  for (const o of objs) {
    if (o.type === 'line') o.set('strokeWidth', w)
    if (o.type === 'triangle') {
      const size = Math.max(24, w * 3)
      o.set({ width: size, height: size * 1.4 })
    }
  }
  refresh()
}
function resetCrop() {
  const s = props.selected
  if (!s || !s._isFrame) return
  const natW = s._naturalW
  const natH = s._naturalH
  const scale = Math.max(s._frameW / natW, s._frameH / natH)
  const visW = s._frameW / scale
  const visH = s._frameH / scale
  s.set({
    cropX: (natW - visW) / 2,
    cropY: (natH - visH) / 2,
    width: visW,
    height: visH,
    scaleX: scale,
    scaleY: scale,
    left: s._frameLeft ?? s.left,
    top: s._frameTop ?? s.top,
  })
  refresh()
}
function hex(v) {
  if (!v || typeof v !== 'string') return '#000000'
  if (v.startsWith('#')) return v.slice(0, 7)
  if (v.startsWith('rgb')) {
    const m = v.match(/\d+/g)
    if (m && m.length >= 3) {
      return '#' + m.slice(0, 3).map((x) => Number(x).toString(16).padStart(2, '0')).join('')
    }
  }
  return '#000000'
}
</script>
<style scoped>
.properties-panel { padding: 4px 2px; }
h3 { font-size: 12px; margin-bottom: 8px; color: #aab; letter-spacing: 0.4px; }
.empty { color: #555; font-size: 11px; padding: 8px 0; }
.fields { display: flex; flex-direction: column; gap: 8px; }
label {
  display: flex; flex-direction: column;
  font-size: 10px; color: #999; gap: 3px;
}
label input[type='number'], label select, label input[type='text'] {
  padding: 4px 6px;
  background: #0f0f1a;
  border: 1px solid #2a2a3e;
  color: #eee;
  border-radius: 3px;
  font-size: 11px;
}
label input[type='color'] {
  width: 100%; height: 26px; padding: 0;
  border: 1px solid #2a2a3e; border-radius: 3px;
  background: #0f0f1a; cursor: pointer;
}
label input[type='range'] { width: 100%; }
.row-type { font-size: 10px; color: #888; }
.divider { height: 1px; background: #2a2a3e; margin: 4px 0; }
.reset-btn {
  padding: 5px; font-size: 11px; cursor: pointer;
  background: #0f3460; color: #eee;
  border: 1px solid #1a4a7a; border-radius: 3px;
}
.reset-btn:hover { background: #1a4a7a; }
</style>