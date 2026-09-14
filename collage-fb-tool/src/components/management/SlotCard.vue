<template>
  <div class="slot-card" :class="{ posted: slot.posted }">
    <div class="slot-img">
      <img v-if="imgUrl" :src="imgUrl" alt="" />
      <div v-else class="img-placeholder">...</div>
    </div>
    <div class="slot-body">
      <div class="slot-meta">
        <span class="slot-time">{{ timeLabel }}</span>
        <span class="slot-when">{{ slot.scheduledAt }}</span>
      </div>
      <div class="slot-content">
        <strong>{{ slot.contentId }}</strong> &middot; Variant {{ slot.variantIndex + 1 }}
      </div>
      <div class="slot-caption">{{ caption || '(khong co caption)' }}</div>
      <div class="slot-actions">
        <button :class="{ done: slot.imageCopied }" @click="$emit('copy-image')">
          {{ slot.imageCopied ? 'Da copy anh' : 'Copy anh' }}
        </button>
        <button :class="{ done: slot.captionCopied }" @click="$emit('copy-caption')">
          {{ slot.captionCopied ? 'Da copy caption' : 'Copy caption' }}
        </button>
        <label class="posted-check">
          <input type="checkbox" :checked="slot.posted" @change="$emit('toggle-posted', $event.target.checked)" />
          <span>Da dang</span>
        </label>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { timeSlotLabel } from '../../utils/schedule'
const props = defineProps({
  slot: { type: Object, required: true },
  content: { type: Object, default: null },
  loadImageBlob: { type: Function, required: true },
})
defineEmits(['copy-image', 'copy-caption', 'toggle-posted'])
const imgUrl = ref('')
let currentUrl = ''
let canceled = false
const timeLabel = timeSlotLabel(props.slot.timeSlot)
const caption = props.content?.captions?.[props.slot.variantIndex] || ''
async function load() {
  if (!props.content) return
  const path = props.content.variantPaths?.[props.slot.variantIndex]
  if (!path) return
  try {
    canceled = false
    const file = await props.loadImageBlob(path)
    if (canceled) return
    if (currentUrl) URL.revokeObjectURL(currentUrl)
    currentUrl = URL.createObjectURL(file)
    imgUrl.value = currentUrl
  } catch (e) {
    // ignore
  }
}
watch(() => [props.slot?.id, props.content?.id], load, { immediate: true })
onUnmounted(() => {
  canceled = true
  if (currentUrl) URL.revokeObjectURL(currentUrl)
})
</script>
<style scoped>
.slot-card {
  display: flex;
  gap: 10px;
  background: #0f1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
}
.slot-card.posted { border-color: #2a6a3a; background: #0f1f18; }
.slot-img {
  width: 90px;
  height: 113px;
  flex-shrink: 0;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.slot-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-placeholder { color: #555; font-size: 10px; }
.slot-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.slot-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 11px;
}
.slot-time {
  background: #1a4a7a;
  color: #cce4ff;
  padding: 1px 8px;
  border-radius: 8px;
  font-weight: 600;
}
.slot-when { color: #88a; font-size: 10px; }
.slot-content { font-size: 11px; color: #ccd; }
.slot-caption {
  font-size: 11px;
  color: #99a;
  max-height: 36px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-wrap;
  line-height: 1.3;
}
.slot-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: auto;
  flex-wrap: wrap;
}
.slot-actions button {
  padding: 4px 10px;
  font-size: 10px;
  background: #0f3460;
  color: #eee;
  border: 1px solid #1a4a7a;
  border-radius: 3px;
  cursor: pointer;
}
.slot-actions button:hover { background: #1a4a7a; }
.slot-actions button.done { background: #1a6a3a; border-color: #2a8a4a; }
.posted-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #aab;
  cursor: pointer;
}
.posted-check input { cursor: pointer; }
</style>