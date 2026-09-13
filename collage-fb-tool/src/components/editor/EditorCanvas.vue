<template>
  <div class="editor-canvas-wrapper" ref="wrapperEl">
    <canvas ref="canvasEl"></canvas>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as fabric from 'fabric'
const props = defineProps({
  width: { type: Number, default: 1080 },
  height: { type: Number, default: 1350 },
})
const emit = defineEmits(['ready'])
const canvasEl = ref(null)
const wrapperEl = ref(null)
let canvas = null
let ro = null
onMounted(() => {
  canvas = new fabric.Canvas(canvasEl.value, {
    width: props.width,
    height: props.height,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
    selection: true,
  })
  requestAnimationFrame(() => {
    fitCanvas()
    ro = new ResizeObserver(() => fitCanvas())
    ro.observe(wrapperEl.value.parentElement)
  })
  emit('ready', canvas)
})
function fitCanvas() {
  if (!canvas || !wrapperEl.value) return
  const parent = wrapperEl.value.parentElement
  if (!parent) return
  const maxW = Math.max(200, parent.clientWidth - 24)
  const maxH = Math.max(200, parent.clientHeight - 24)
  const scale = Math.min(maxW / props.width, maxH / props.height, 1)
  const w = Math.round(props.width * scale)
  const h = Math.round(props.height * scale)
  wrapperEl.value.style.width = w + 'px'
  wrapperEl.value.style.height = h + 'px'
  canvas.setDimensions({ width: w, height: h })
  canvas.setZoom(scale)
  canvas.renderAll()
}
onBeforeUnmount(() => {
  if (ro) { ro.disconnect(); ro = null }
  if (canvas) { canvas.dispose(); canvas = null }
})
defineExpose({ getCanvas: () => canvas, refit: fitCanvas })
</script>
<style scoped>
.editor-canvas-wrapper {
  position: relative;
  background: #1a1a2a;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}
</style>