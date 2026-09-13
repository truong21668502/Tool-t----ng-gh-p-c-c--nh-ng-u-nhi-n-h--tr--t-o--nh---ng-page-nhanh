<template>
  <div
    class="uploader"
    :class="{ dragging: isDragging }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="fileInput.click()"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      hidden
      @change="onFileSelect"
    />
    <p class="main-text">Drop images here<br />or click to select</p>
    <p class="hint">{{ count }} images</p>
  </div>
</template>
<script setup>
import { ref } from 'vue'
defineProps({
  count: { type: Number, default: 0 },
})
const emit = defineEmits(['images-added'])
const fileInput = ref(null)
const isDragging = ref(false)
function onDrop(e) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files).filter((f) =>
    f.type.startsWith('image/')
  )
  if (files.length) emit('images-added', files)
}
function onFileSelect(e) {
  const files = Array.from(e.target.files)
  if (files.length) emit('images-added', files)
  e.target.value = ''
}
</script>
<style scoped>
.uploader {
  border: 2px dashed #2a2a3e;
  border-radius: 8px;
  padding: 18px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  color: #999;
}
.uploader.dragging {
  border-color: #4a9eff;
  background: rgba(74, 158, 255, 0.08);
  color: #cce;
}
.uploader:hover { border-color: #444; }
.main-text { font-size: 12px; line-height: 1.5; }
.hint { margin-top: 6px; font-size: 10px; color: #666; }
</style>