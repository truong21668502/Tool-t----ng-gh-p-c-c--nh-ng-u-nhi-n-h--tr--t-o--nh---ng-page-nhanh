<template>
  <div class="variant-card" :class="{ posted: isFullyPosted }">
    <div class="vc-img">
      <img v-if="imgUrl" :src="imgUrl" alt="" />
      <div v-else class="vc-ph">...</div>
    </div>
    <div class="vc-body">
      <div class="vc-title">Variant {{ variantIndex + 1 }}</div>
      <div class="vc-caption">{{ caption || '(khong co caption)' }}</div>
      <div class="vc-assign-list">
        <div v-for="slot in slots" :key="slot.id" class="vc-assign">
          <span class="page-tag">P{{ String(slot.pageNumber).padStart(2, '0') }}</span>
          <span class="time-tag">{{ timeSlotLabel(slot.timeSlot) }}</span>
          <span v-if="slot.posted" class="posted-dot" title="Da dang"></span>
          <span v-else class="pending-dot" title="Chua dang"></span>
        </div>
        <div v-if="slots.length === 0" class="vc-no-assign">Chua phan phoi</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { timeSlotLabel } from '../../utils/schedule'
const props = defineProps({
  slot: { type: Object, default: null },
  slots: { type: Array, default: () => [] },
  variantIndex: { type: Number, required: true },
  content: { type: Object, required: true },
  loadImageBlob: { type: Function, required: true },
})
const imgUrl = ref('')
let currentUrl = ''
let canceled = false
const caption = computed(() => props.content?.captions?.[props.variantIndex] || '')
const isFullyPosted = computed(
  () => props.slots.length > 0 && props.slots.every((s) => s.posted)
)
async function load() {
  if (!props.content) return
  const path = props.content.variantPaths?.[props.variantIndex]
  if (!path) return
  try {
    canceled = false
    const file = await props.loadImageBlob(path)
    if (canceled) return
    if (currentUrl) URL.revokeObjectURL(currentUrl)
    currentUrl = URL.createObjectURL(file)
    imgUrl.value = currentUrl
  } catch (e) { /* ignore */ }
}
watch(
  () => [props.content?.id, props.variantIndex],
  load,
  { immediate: true }
)
onUnmounted(() => {
  canceled = true
  if (currentUrl) URL.revokeObjectURL(currentUrl)
})
</script>
<style scoped>
.variant-card {
  display: flex;
  flex-direction: column;
  background: #0f1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 6px;
  overflow: hidden;
}
.variant-card.posted { border-color: #2a6a3a; background: #0f1f18; }
.vc-img {
  width: 100%;
  aspect-ratio: 4 / 5;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.vc-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vc-ph { color: #555; font-size: 10px; }
.vc-body { padding: 8px; display: flex; flex-direction: column; gap: 5px; flex: 1; }
.vc-title {
  font-size: 11px;
  font-weight: 600;
  color: #cce4ff;
}
.vc-caption {
  font-size: 10px;
  color: #99a;
  max-height: 52px;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.3;
}
.vc-assign-list { margin-top: auto; display: flex; flex-direction: column; gap: 3px; }
.vc-assign {
  display: flex; gap: 4px; align-items: center;
  font-size: 10px;
}
.page-tag {
  background: #1a4a7a; color: #cce4ff;
  padding: 1px 6px; border-radius: 6px; font-weight: 600;
}
.time-tag {
  background: #6a1a3a; color: #ffccdd;
  padding: 1px 6px; border-radius: 6px; font-weight: 600;
}
.posted-dot, .pending-dot {
  width: 8px; height: 8px; border-radius: 50%; margin-left: auto;
}
.posted-dot { background: #2a8a4a; box-shadow: 0 0 4px #2a8a4a; }
.pending-dot { background: #665; }
.vc-no-assign { color: #555; font-size: 10px; text-align: center; padding: 3px 0; }
</style>