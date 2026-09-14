<template>
  <div class="modal-overlay" @click.self="!saving && $emit('close')">
    <div class="modal">
      <h2>Luu nhom noi dung</h2>
      <label class="field">
        <span>Thu muc ngay (DD-MM-YYYY)</span>
        <div class="date-row">
          <input type="date" :value="dateInput" @input="onDateInput" :disabled="saving" />
          <button type="button" class="btn-sm" @click="setToday" :disabled="saving">Hom nay</button>
          <button type="button" class="btn-sm" @click="shiftDay(1)" :disabled="saving">+1</button>
          <button type="button" class="btn-sm" @click="shiftDay(-1)" :disabled="saving">-1</button>
        </div>
        <small class="hint">Se luu vao: {{ folderDate }}</small>
      </label>
      <label class="field">
        <span>4 caption (phan cach bang ----)</span>
        <textarea
          v-model="captionsRaw"
          rows="10"
          spellcheck="false"
          :disabled="saving"
          placeholder="Caption 1&#10;----&#10;Caption 2&#10;----&#10;Caption 3&#10;----&#10;Caption 4&#10;&#10;Co the viet: caption1----caption2----caption3----caption4"
        ></textarea>
      </label>
      <div class="caption-preview">
        <div v-for="(c, i) in parsedCaptions" :key="i" class="caption-item" :class="{ empty: !c }">
          <strong>V{{ i + 1 }}:</strong>
          <span class="caption-text">{{ c || '(trong)' }}</span>
        </div>
      </div>
      <div v-if="saving && progress" class="progress">
        <div class="spinner"></div>
        <span>{{ progress }}</span>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="actions">
        <button type="button" @click="$emit('close')" :disabled="saving">Huy</button>
        <button type="button" class="primary" @click="submit" :disabled="!valid || saving">
          {{ saving ? 'Dang luu...' : 'Luu 4 anh + caption' }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
const props = defineProps({
  saving: { type: Boolean, default: false },
  progress: { type: String, default: '' },
})
const emit = defineEmits(['close', 'save'])
const captionsRaw = ref('')
const error = ref('')
const dateInput = ref(new Date().toISOString().slice(0, 10))
const folderDate = computed(() => {
  const [y, m, d] = dateInput.value.split('-')
  return `${d}-${m}-${y}`
})
/**
 * Split theo 4+ dau gach ngang bat ky vi tri nao.
 * "a----b" -> ["a", "b"]
 * "a\n----\nb" -> ["a", "b"]
 */
function rawParts() {
  return captionsRaw.value
    .split(/-{4,}/)
    .map((s) => s.trim())
}
const parsedCaptions = computed(() => {
  const parts = rawParts()
  const out = []
  for (let i = 0; i < 4; i++) out.push(parts[i] || '')
  return out
})
const valid = computed(() => rawParts().filter(Boolean).length === 4)
function setToday() {
  dateInput.value = new Date().toISOString().slice(0, 10)
}
function shiftDay(delta) {
  const d = new Date(dateInput.value)
  d.setDate(d.getDate() + delta)
  dateInput.value = d.toISOString().slice(0, 10)
}
function onDateInput(e) {
  dateInput.value = e.target.value
}
function submit() {
  error.value = ''
  if (!valid.value) {
    error.value = 'Can dung 4 caption, moi caption cach nhau bang 4 dau gach (----)'
    return
  }
  emit('save', {
    folderDate: folderDate.value,
    captions: parsedCaptions.value,
  })
}
</script>
<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #16213e;
  border-radius: 8px;
  padding: 20px;
  width: 520px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  border: 1px solid #2a2a3e;
}
h2 { font-size: 15px; margin-bottom: 14px; color: #eee; }
.field {
  display: flex; flex-direction: column; gap: 6px;
  font-size: 11px; color: #aab; margin-bottom: 14px;
}
.field input[type='date'], .field textarea {
  padding: 8px 10px;
  background: #0f0f1a;
  border: 1px solid #2a2a3e;
  color: #eee;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  resize: vertical;
}
.field input:disabled, .field textarea:disabled { opacity: 0.6; cursor: not-allowed; }
.date-row { display: flex; gap: 6px; align-items: center; }
.date-row input[type='date'] { flex: 1; }
.btn-sm {
  padding: 6px 10px; font-size: 11px;
  background: #0f3460; color: #eee;
  border: 1px solid #1a4a7a; border-radius: 3px; cursor: pointer;
}
.btn-sm:hover:not(:disabled) { background: #1a4a7a; }
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
.hint { font-size: 10px; color: #667; margin-top: 2px; }
.caption-preview {
  background: #0f0f1a;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 12px;
  max-height: 150px;
  overflow-y: auto;
}
.caption-item {
  display: flex; gap: 6px;
  padding: 4px 0;
  font-size: 11px;
  border-bottom: 1px solid #1a1a2a;
}
.caption-item:last-child { border-bottom: none; }
.caption-item.empty { color: #666; }
.caption-text { flex: 1; white-space: pre-wrap; word-break: break-word; }
.progress {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  background: rgba(74, 158, 255, 0.1);
  color: #cce4ff;
  border-radius: 3px;
  font-size: 11px;
  margin-bottom: 12px;
}
.spinner {
  width: 12px; height: 12px;
  border: 2px solid #4a9eff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error {
  background: rgba(200, 60, 60, 0.15);
  color: #ff9988;
  padding: 8px 10px;
  border-radius: 3px;
  font-size: 11px;
  margin-bottom: 12px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.actions button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background: #0f3460;
  color: #eee;
  border: none;
}
.actions button:hover:not(:disabled) { background: #1a4a7a; }
.actions button.primary { background: #1a6a3a; }
.actions button.primary:hover:not(:disabled) { background: #2a8a4a; }
.actions button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>