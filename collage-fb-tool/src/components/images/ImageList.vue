<template>
  <div class="image-list">
    <div
      v-for="(img, index) in images"
      :key="img.id"
      class="image-item"
      :class="{ 'is-main': index === mainIndex }"
      draggable="true"
      @dragstart="onDragStart(index)"
      @dragover.prevent
      @drop="onDrop(index)"
      @click="$emit('set-main', img.id)"
      :title="img.name"
    >
      <img :src="img.url" :alt="img.name" draggable="false" />
      <div class="item-actions">
        <button
          class="btn-main"
          @click.stop="$emit('set-main', img.id)"
          title="Set as main"
        >{{ index === mainIndex ? '*' : 'o' }}</button>
        <button
          class="btn-remove"
          @click.stop="$emit('remove', img.id)"
          title="Remove"
        >x</button>
      </div>
      <span class="main-badge" v-if="index === mainIndex">MAIN</span>
    </div>
  </div>
</template>
<script setup>
defineProps({
  images: { type: Array, required: true },
  mainIndex: { type: Number, default: 0 },
})
const emit = defineEmits(['remove', 'set-main', 'reorder'])
let dragIndex = null
function onDragStart(index) {
  dragIndex = index
}
function onDrop(index) {
  if (dragIndex !== null && dragIndex !== index) {
    emit('reorder', dragIndex, index)
  }
  dragIndex = null
}
</script>
<style scoped>
.image-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}
.image-item {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  aspect-ratio: 1;
  background: #0a0a12;
  transition: border-color 0.15s;
}
.image-item.is-main { border-color: #ffd700; }
.image-item:hover { border-color: #4a9eff; }
.image-item.is-main:hover { border-color: #ffd700; }
.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}
.item-actions {
  position: absolute;
  top: 3px;
  right: 3px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}
.image-item:hover .item-actions { opacity: 1; }
.item-actions button {
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  color: #eee;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
.item-actions button:hover { background: rgba(0, 0, 0, 0.95); }
.main-badge {
  position: absolute;
  bottom: 3px;
  left: 3px;
  font-size: 8px;
  background: #ffd700;
  color: #000;
  padding: 1px 5px;
  border-radius: 2px;
  font-weight: bold;
  letter-spacing: 0.5px;
}
</style>