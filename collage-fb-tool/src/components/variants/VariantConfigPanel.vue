<template>
  <div class="variant-config">
    <div class="head">
      <h3>Variant {{ activeIndex + 1 }}</h3>
      <span v-if="variant.layoutId" class="badge">
        {{ imageCount }} anh
      </span>
    </div>
    <!-- Layout -->
    <label class="field">
      <span>Layout</span>
      <select :value="variant.layoutPreference" @change="onLayoutChange">
        <option value="auto">Auto</option>
        <template v-for="(list, count) in availableGroups" :key="count">
          <optgroup :label="`${count} anh`">
            <option v-for="l in list" :key="l.id" :value="l.id">
              {{ l.name }} ({{ l.id }})
            </option>
          </optgroup>
        </template>
      </select>
    </label>
    <!-- Images -->
    <div class="field">
      <span>
        Images ({{ selectedCount }} / {{ requiredCount }})
      </span>
      <div class="img-checks">
        <label
          v-for="(img, idx) in images"
          :key="img.id"
          class="img-check"
          :class="{ on: isChecked(idx), main: isMain(idx) }"
        >
          <input type="checkbox" :checked="isChecked(idx)" @change="toggleImage(idx)" />
          <img :src="img.url" :alt="img.name" />
          <span class="num">#{{ idx + 1 }}</span>
          <span v-if="isMain(idx)" class="main-tag">MAIN</span>
        </label>
      </div>
      <p v-if="!imagesValid" class="warn">
        Can chon dung {{ requiredCount }} anh (dang chon {{ selectedCount }}).
        Se dung Auto cho den khi du.
      </p>
    </div>
    <!-- Main image -->
    <label class="field">
      <span>Main image</span>
      <select :value="variant.mainPreference" @change="onMainChange">
        <option value="auto">Auto</option>
        <option v-for="idx in currentImageIndices" :key="idx" :value="idx">
          Anh #{{ idx + 1 }}
        </option>
      </select>
    </label>
    <button class="btn-regen" @click="$emit('regenerate')">
      Regenerate Variant
    </button>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { layouts, getLayoutsByCount } from '../../utils/layouts'
const props = defineProps({
  variant: { type: Object, required: true },
  activeIndex: { type: Number, default: 0 },
  images: { type: Array, required: true },
})
const emit = defineEmits(['change', 'regenerate'])
const allGroups = getLayoutsByCount()
const availableGroups = computed(() => {
  const out = {}
  for (const [count, list] of Object.entries(allGroups)) {
    if (Number(count) <= props.images.length) out[count] = list
  }
  return out
})
const requiredCount = computed(() => {
  const lid = props.variant.layoutId
  return lid && layouts[lid] ? layouts[lid].imageCount : 0
})
const currentImageIndices = computed(() => {
  const pref = props.variant.imagesPreference
  if (Array.isArray(pref)) return pref
  return props.variant.imageIndices || []
})
const selectedCount = computed(() => currentImageIndices.value.length)
const imagesValid = computed(() => selectedCount.value === requiredCount.value)
function isChecked(idx) {
  return currentImageIndices.value.includes(idx)
}
function isMain(idx) {
  const mp = props.variant.mainPreference
  if (mp !== undefined && mp !== null && mp !== 'auto') return mp === idx
  return props.variant.mainIndex === idx
}
function onLayoutChange(e) {
  emit('change', { layoutPreference: e.target.value })
}
function toggleImage(idx) {
  const current = [...currentImageIndices.value]
  const pos = current.indexOf(idx)
  if (pos >= 0) current.splice(pos, 1)
  else current.push(idx)
  current.sort((a, b) => a - b)
  emit('change', { imagesPreference: current })
}
function onMainChange(e) {
  const v = e.target.value
  emit('change', { mainPreference: v === 'auto' ? 'auto' : Number(v) })
}
</script>
<style scoped>
.variant-config {
  padding: 4px 2px 10px;
  border-bottom: 1px solid #2a2a3e;
  margin-bottom: 10px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
h3 { font-size: 12px; color: #aab; letter-spacing: 0.4px; }
.badge {
  font-size: 10px;
  background: #1a4a7a;
  color: #cce4ff;
  padding: 1px 6px;
  border-radius: 8px;
}
.field {
  display: flex;
  flex-direction: column;
  font-size: 10px;
  color: #999;
  gap: 4px;
  margin-bottom: 8px;
}
.field select {
  padding: 4px 6px;
  background: #0f0f1a;
  border: 1px solid #2a2a3e;
  color: #eee;
  border-radius: 3px;
  font-size: 11px;
}
.img-checks {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.img-check {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2px;
  border: 1px solid #2a2a3e;
  border-radius: 3px;
  cursor: pointer;
  background: #0f0f1a;
  transition: border-color 0.15s;
}
.img-check.on { border-color: #4a9eff; background: #142a4a; }
.img-check.main { border-color: #ffd700; }
.img-check input { position: absolute; opacity: 0; pointer-events: none; }
.img-check img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 2px;
}
.num { font-size: 9px; color: #889; margin-top: 1px; }
.main-tag {
  position: absolute;
  bottom: 10px;
  left: 2px;
  font-size: 7px;
  background: #ffd700;
  color: #000;
  padding: 0 3px;
  border-radius: 2px;
  font-weight: bold;
}
.warn {
  margin-top: 4px;
  font-size: 10px;
  color: #ff9966;
  background: rgba(255,153,102,0.08);
  padding: 4px 6px;
  border-radius: 3px;
}
.btn-regen {
  width: 100%;
  padding: 6px;
  font-size: 11px;
  background: #0f3460;
  color: #eee;
  border: 1px solid #1a4a7a;
  border-radius: 3px;
  cursor: pointer;
  margin-top: 4px;
}
.btn-regen:hover { background: #1a4a7a; }
</style>