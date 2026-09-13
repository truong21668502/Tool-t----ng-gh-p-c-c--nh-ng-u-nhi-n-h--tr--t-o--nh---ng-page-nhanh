<template>
  <div class="layers-panel">
    <h3>Layers</h3>
    <div v-if="layers.length === 0" class="empty">Chua co object nao</div>
    <ul v-else>
      <li
        v-for="layer in layers"
        :key="layer.id"
        :class="{ active: layer.isActive }"
        @click="selectLayer(layer.obj)"
      >
        <span class="icon">{{ layer.icon }}</span>
        <span class="name">{{ layer.name }}</span>
      </li>
    </ul>
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({
  canvas: { type: Object, default: null },
  version: { type: Number, default: 0 },
  selected: { type: Object, default: null },
})
const emit = defineEmits(['select'])
const layers = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const _v = props.version
  if (!props.canvas) return []
  const objs = props.canvas.getObjects()
  // top-most is last in array; show reversed so top of list = top layer
  return objs
    .map((o, i) => ({
      id: i,
      obj: o,
      name: nameOf(o),
      icon: iconOf(o),
      isActive: o === props.selected,
    }))
    .reverse()
})
function nameOf(o) {
  if (o._isArrow) return 'Arrow'
  if (o._isCircle) return 'Circle'
  if (o.type === 'image') return o._isFrame ? 'Image Frame' : 'Overlay Image'
  if (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text') {
    const t = (o.text || '').slice(0, 14) || 'Text'
    return `Text: ${t}`
  }
  return o.type || 'Object'
}
function iconOf(o) {
  if (o._isArrow) return '->'
  if (o._isCircle) return 'O'
  if (o.type === 'image') return '#'
  if (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text') return 'T'
  return '?'
}
function selectLayer(obj) {
  if (!props.canvas) return
  props.canvas.setActiveObject(obj)
  props.canvas.requestRenderAll()
  emit('select', obj)
}
</script>
<style scoped>
.layers-panel { margin-top: 14px; padding-top: 10px; border-top: 1px solid #2a2a3e; }
h3 { font-size: 12px; margin-bottom: 8px; color: #aab; letter-spacing: 0.4px; }
.empty { color: #555; font-size: 11px; padding: 4px 0; }
ul { list-style: none; padding: 0; margin: 0; }
li {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 6px; border-radius: 3px; cursor: pointer;
  font-size: 11px; color: #ccd;
}
li:hover { background: #1a2a4e; }
li.active { background: #1a4a7a; color: #fff; }
.icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; font-size: 10px;
  background: #0f3460; border-radius: 3px;
}
.name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>