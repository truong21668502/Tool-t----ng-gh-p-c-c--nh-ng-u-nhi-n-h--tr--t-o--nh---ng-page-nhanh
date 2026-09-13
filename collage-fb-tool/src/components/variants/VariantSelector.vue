<template>
  <div class="variant-selector">
    <button
      v-for="(v, i) in variants"
      :key="v.id"
      class="variant-btn"
      :class="{ active: i === activeIndex }"
      @click="$emit('select', i)"
    >
      <span class="v-line1">Variant {{ i + 1 }}</span>
      <span v-if="v.layoutId" class="v-line2">
        {{ v.imageIndices?.length || 0 }} anh &middot; {{ layoutName(v.layoutId) }}
      </span>
    </button>
    <span v-if="variants.length === 0" class="empty">
      No variants yet - click Generate
    </span>
  </div>
</template>
<script setup>
import { layouts } from '../../utils/layouts'
defineProps({
  variants: { type: Array, default: () => [] },
  activeIndex: { type: Number, default: 0 },
})
defineEmits(['select'])
function layoutName(id) {
  return layouts[id]?.name || id
}
</script>
<style scoped>
.variant-selector {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.variant-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 14px;
  border-radius: 4px;
  background: #0f3460;
  color: #eee;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.2;
}
.variant-btn:hover { background: #1a4a7a; }
.variant-btn.active {
  border-color: #4a9eff;
  background: #1a4a7a;
}
.v-line1 { font-weight: 500; }
.v-line2 { font-size: 9px; color: #aac; margin-top: 2px; }
.variant-btn.active .v-line2 { color: #cce4ff; }
.empty { color: #555; font-size: 12px; align-self: center; }
</style>