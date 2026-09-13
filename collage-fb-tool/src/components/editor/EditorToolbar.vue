<template>
  <div class="editor-toolbar">
    <div class="group">
      <button class="btn btn-text" @click="$emit('add-text', 'headline')" title="Them Headline (nen do)">+ Headline</button>
      <button class="btn btn-text" @click="$emit('add-text', 'subheadline')" title="Them Sub">+ Sub</button>
      <button class="btn btn-text" @click="$emit('add-text', 'caption')" title="Them Caption">+ Caption</button>
      <button class="btn btn-text" @click="$emit('add-text', 'plain')" title="Them Text">+ Text</button>
    </div>
    <div class="divider"></div>
    <div class="group">
      <button class="btn" @click="$emit('add-circle')" title="Ve vong tron do">+ Circle</button>
      <button class="btn" @click="$emit('add-arrow')" title="Ve mui ten do">+ Arrow</button>
      <button class="btn" @click="$emit('add-image')" title="Chen anh overlay">+ Image</button>
    </div>
    <div class="divider"></div>
    <div class="group">
      <button class="btn" :disabled="!canUndo" @click="$emit('undo')" title="Ctrl+Z">Undo</button>
      <button class="btn" :disabled="!canRedo" @click="$emit('redo')" title="Ctrl+Shift+Z">Redo</button>
    </div>
    <div class="divider"></div>
    <div class="group">
      <button class="btn" :disabled="!hasSelection" @click="$emit('duplicate')" title="Ctrl+D">Duplicate</button>
      <button class="btn" :disabled="!hasSelection" @click="$emit('bring-forward')">Fwd</button>
      <button class="btn" :disabled="!hasSelection" @click="$emit('send-backward')">Bwd</button>
      <button class="btn btn-danger" :disabled="!hasSelection" @click="$emit('delete')" title="Delete">Delete</button>
    </div>
  </div>
</template>
<script setup>
defineProps({
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
  hasSelection: { type: Boolean, default: false },
})
defineEmits([
  'add-text', 'add-circle', 'add-arrow', 'add-image',
  'undo', 'redo', 'delete', 'duplicate',
  'bring-forward', 'send-backward',
])
</script>
<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #16213e;
  border-bottom: 1px solid #2a2a3e;
  flex-wrap: wrap;
}
.group { display: flex; gap: 4px; }
.divider { width: 1px; height: 20px; background: #2a2a3e; margin: 0 4px; }
.btn {
  padding: 5px 10px;
  font-size: 11px;
  background: #0f3460;
  color: #eee;
  border: 1px solid #1a4a7a;
  border-radius: 3px;
  cursor: pointer;
}
.btn:hover:not(:disabled) { background: #1a4a7a; }
.btn:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-text { background: #7a1a3a; border-color: #a02848; }
.btn-text:hover:not(:disabled) { background: #a02848; }
.btn-danger { background: #6a1a1a; border-color: #a02828; }
.btn-danger:hover:not(:disabled) { background: #a02828; }
</style>