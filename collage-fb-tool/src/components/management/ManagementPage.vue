<template>
  <div class="management-page">
    <!-- Folder list view -->
    <div v-if="!selectedDate" class="folder-view">
      <div class="head-row">
        <h2>Quan ly bai dang</h2>
        <div class="config-row">
          <label>
            <span>So luong Page</span>
            <input
              type="number" min="1" max="100"
              :value="pageCount"
              @change="onPageCountChange"
            />
          </label>
          <button class="btn-secondary" @click="onChangeFolder">
            {{ dirHandle ? 'Doi thu muc luu' : 'Chon thu muc luu' }}
          </button>
        </div>
      </div>
      <div v-if="!dirHandle" class="notice">
        Chua chon thu muc luu. Nhan "Chon thu muc luu" de chon noi luu anh.
      </div>
      <div v-if="folderDates.length === 0" class="empty">
        Chua co content nao. Vao tab <b>Editor</b> de tao va luu.
      </div>
      <div v-else class="folder-grid">
        <button
          v-for="date in folderDates"
          :key="date"
          class="folder-card"
          @click="selectDate(date)"
        >
          <div class="folder-date">{{ date }}</div>
          <div class="folder-info">
            <span>{{ contentsForDate(date).length }} content</span>
            <span>{{ assignmentsForDate(date).length }} bai</span>
          </div>
        </button>
      </div>
    </div>
    <!-- Date view -->
    <div v-else class="date-view">
      <div class="date-header">
        <button class="back" @click="goBack">Danh sach ngay</button>
        <h2>{{ selectedDate }}</h2>
        <div class="date-actions">
          <button class="btn-secondary" @click="runDistribute">Phan phoi lai</button>
        </div>
      </div>
      <div class="tabs">
        <button :class="{ active: viewMode === 'page' }" @click="viewMode = 'page'">
          Theo Page ({{ pageCount }})
        </button>
        <button :class="{ active: viewMode === 'content' }" @click="viewMode = 'content'">
          Theo nhom noi dung ({{ contentsForDate(selectedDate).length }})
        </button>
      </div>
      <!-- Page view: accordion, chi 1 page mo -->
      <div v-if="viewMode === 'page'" class="page-list">
        <div v-for="p in pageCount" :key="p" class="page-row">
          <button
            class="page-header"
            :class="{ full: isPageFull(p) }"
            @click="togglePage(p)"
          >
            <span class="page-name">Page {{ String(p).padStart(2, '0') }}</span>
            <span class="badge" :class="{ full: isPageFull(p) }">
              {{ pagePostedCount(p) }}/{{ pageSlotCount(p) }}
            </span>
          </button>
          <div v-if="openPageId === p" class="slots-grid">
            <div v-if="slotsForPage(p).length === 0" class="empty-slot">
              Khong co bai nao
            </div>
            <SlotCard
              v-for="slot in slotsForPage(p)"
              :key="slot.id"
              :slot="slot"
              :content="getContent(slot.contentId)"
              :load-image-blob="loadImageBlob"
              @copy-image="onCopyImage(slot)"
              @copy-caption="onCopyCaption(slot)"
              @toggle-posted="onTogglePosted(slot, $event)"
            />
          </div>
        </div>
      </div>
      <!-- Content view: accordion, chi 1 content mo, grid 4 cot -->
      <div v-else class="content-list">
        <div v-for="c in contentsForDate(selectedDate)" :key="c.id" class="content-row">
          <button
            class="content-header"
            :class="{ full: isContentFull(c.id) }"
            @click="toggleContent(c.id)"
          >
            <span class="content-name">{{ c.displayId || c.id }}</span>
            <span class="badge" :class="{ full: isContentFull(c.id) }">
              {{ contentPostedCount(c.id) }}/{{ contentSlotCount(c.id) }}
            </span>
          </button>
          <div v-if="openContentId === c.id" class="content-body">
            <div class="variants-grid">
              <VariantCard
                v-for="v in 4"
                :key="v"
                :variant-index="v - 1"
                :content="c"
                :slots="slotsForContentVariant(c.id, v - 1)"
                :load-image-blob="loadImageBlob"
              />
            </div>
            <div class="content-actions">
              <button class="btn-delete" @click="confirmDelete(c)">Xoa noi dung</button>
            </div>
          </div>
        </div>
        <div v-if="contentsForDate(selectedDate).length === 0" class="empty-slot">
          Khong co content nao.
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SlotCard from './SlotCard.vue'
import VariantCard from './VariantCard.vue'
const props = defineProps({
  posts: { type: Object, required: true },
})
const {
  pageCount, dirHandle, pickBaseDir, saveDirHandle, setPageCount,
  contentsForDate, assignmentsForDate, folderDates,
  distribute, updateAssignment, loadImageBlob, deleteContent,
} = props.posts
const selectedDate = ref(null)
const viewMode = ref('page')
const openPageId = ref(null)       // single-open cho page
const openContentId = ref(null)    // single-open cho content
onMounted(() => {
  syncFromUrl()
  window.addEventListener('popstate', syncFromUrl)
})
onUnmounted(() => {
  window.removeEventListener('popstate', syncFromUrl)
})
function syncFromUrl() {
  const m = window.location.pathname.match(/\/quan-ly-bai-dang\/(\d{2}-\d{2}-\d{4})/)
  if (m) {
    const date = m[1]
    selectedDate.value = date
    openPageId.value = null
    openContentId.value = null
    if (assignmentsForDate(date).length === 0 && contentsForDate(date).length > 0) {
      distribute(date).catch((e) => console.warn('auto distribute failed', e))
    }
  } else {
    selectedDate.value = null
  }
}
function selectDate(date) {
  window.history.pushState({}, '', `/quan-ly-bai-dang/${date}`)
  syncFromUrl()
}
function goBack() {
  window.history.pushState({}, '', '/quan-ly-bai-dang')
  syncFromUrl()
}
async function onChangeFolder() {
  try {
    const handle = await pickBaseDir()
    await saveDirHandle(handle)
  } catch (e) {
    alert('Khong chon duoc thu muc: ' + e.message)
  }
}
async function onPageCountChange(e) {
  const n = parseInt(e.target.value, 10)
  if (Number.isFinite(n) && n > 0) {
    await setPageCount(n)
    if (selectedDate.value) {
      // Cho phep auto redistribute de phu hop pageCount moi, nhung preserve state
      await distribute(selectedDate.value)
    }
  }
}
async function runDistribute() {
  if (!selectedDate.value) return
  if (!confirm('Phan phoi lai toan bo bai cho ngay nay? Trang thai copy/posted se BI XOA.')) return
  await distribute(selectedDate.value, { resetState: true })
}
function togglePage(p) {
  openPageId.value = openPageId.value === p ? null : p
  openContentId.value = null
}
function toggleContent(id) {
  openContentId.value = openContentId.value === id ? null : id
  openPageId.value = null
}
function slotsForPage(pageNumber) {
  return assignmentsForDate(selectedDate.value)
    .filter((a) => a.pageNumber === pageNumber)
    .sort((a, b) => a.timeSlot - b.timeSlot)
}
function pageSlotCount(p) {
  return slotsForPage(p).length
}
function pagePostedCount(p) {
  return slotsForPage(p).filter((s) => s.posted).length
}
function isPageFull(p) {
  const total = pageSlotCount(p)
  return total > 0 && pagePostedCount(p) === total
}
function slotsForContent(contentId) {
  return assignmentsForDate(selectedDate.value)
    .filter((a) => a.contentId === contentId)
    .sort((a, b) => a.variantIndex - b.variantIndex)
}
function slotsForContentVariant(contentId, variantIndex) {
  return slotsForContent(contentId).filter((a) => a.variantIndex === variantIndex)
}
function contentSlotCount(contentId) {
  return slotsForContent(contentId).length
}
function contentPostedCount(contentId) {
  return slotsForContent(contentId).filter((s) => s.posted).length
}
function isContentFull(contentId) {
  const total = contentSlotCount(contentId)
  return total > 0 && contentPostedCount(contentId) === total
}
function getContent(contentId) {
  return props.posts.contents.value.find((c) => c.id === contentId) || null
}
async function confirmDelete(c) {
  const name = c.displayId || c.id
  if (!confirm(`Xoa noi dung ${name}? Tat ca bai lien quan cung bi xoa.`)) return
  await deleteContent(c.id)
}
async function onCopyImage(slot) {
  try {
    const content = getContent(slot.contentId)
    if (!content) return
    const path = content.variantPaths?.[slot.variantIndex]
    if (!path) return
    const file = await loadImageBlob(path)
    const blob = file.type === 'image/png' ? file : new Blob([await file.arrayBuffer()], { type: 'image/png' })
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    await updateAssignment(slot.id, { imageCopied: true })
    await maybeAutoPost(slot.id)
  } catch (e) {
    alert('Copy anh that bai: ' + e.message)
  }
}
async function onCopyCaption(slot) {
  try {
    const content = getContent(slot.contentId)
    if (!content) return
    const caption = content.captions?.[slot.variantIndex] || ''
    await navigator.clipboard.writeText(caption)
    await updateAssignment(slot.id, { captionCopied: true })
    await maybeAutoPost(slot.id)
  } catch (e) {
    alert('Copy caption that bai: ' + e.message)
  }
}
async function maybeAutoPost(slotId) {
  const slot = props.posts.assignments.value.find((a) => a.id === slotId)
  if (!slot) return
  if (slot.imageCopied && slot.captionCopied && !slot.posted) {
    await updateAssignment(slotId, { posted: true })
  }
}
async function onTogglePosted(slot, checked) {
  await updateAssignment(slot.id, { posted: !!checked })
}
</script>
<style scoped>
.management-page { padding: 16px 20px; height: 100%; overflow-y: auto; }
.head-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
}
h2 { font-size: 16px; color: #eee; }
.config-row { display: flex; gap: 12px; align-items: center; }
.config-row label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: #aab;
}
.config-row input[type='number'] {
  width: 70px; padding: 5px 8px;
  background: #0f0f1a; border: 1px solid #2a2a3e;
  color: #eee; border-radius: 4px; font-size: 12px;
}
.btn-secondary {
  padding: 6px 12px; font-size: 11px;
  background: #0f3460; color: #eee;
  border: 1px solid #1a4a7a; border-radius: 4px; cursor: pointer;
}
.btn-secondary:hover { background: #1a4a7a; }
.notice {
  background: rgba(255, 180, 60, 0.1);
  color: #ffcc88;
  padding: 10px 14px; border-radius: 4px;
  font-size: 12px; margin-bottom: 16px;
}
.empty {
  color: #667; text-align: center;
  padding: 40px 20px; font-size: 13px;
}
.empty b { color: #aac; }
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.folder-card {
  background: #16213e; border: 1px solid #2a2a3e;
  border-radius: 6px; padding: 14px;
  cursor: pointer; text-align: left; color: #eee;
  transition: all 0.15s;
}
.folder-card:hover { border-color: #4a9eff; background: #1a2a4e; }
.folder-date {
  font-size: 16px; font-weight: 600;
  margin-bottom: 6px; letter-spacing: 0.5px;
}
.folder-info { display: flex; gap: 10px; font-size: 11px; color: #99a; }
.date-header {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 12px;
}
.back {
  padding: 6px 12px; font-size: 11px;
  background: #0f3460; color: #eee;
  border: 1px solid #1a4a7a; border-radius: 4px; cursor: pointer;
}
.back:hover { background: #1a4a7a; }
.date-header h2 { flex: 1; }
.tabs {
  display: flex; gap: 4px;
  border-bottom: 1px solid #2a2a3e;
  margin-bottom: 16px;
}
.tabs button {
  padding: 8px 16px; background: transparent; color: #aab;
  border: none; border-bottom: 2px solid transparent;
  cursor: pointer; font-size: 12px;
}
.tabs button.active { color: #eee; border-bottom-color: #4a9eff; }
.page-list, .content-list { display: flex; flex-direction: column; gap: 6px; }
.page-row, .content-row {
  background: #16213e; border: 1px solid #2a2a3e;
  border-radius: 6px; overflow: hidden;
}
.page-header, .content-header {
  width: 100%; display: flex; justify-content: space-between;
  align-items: center; padding: 10px 14px;
  background: transparent; border: none; color: #eee;
  cursor: pointer; font-size: 13px; text-align: left;
}
.page-header:hover, .content-header:hover { background: #1a2a4e; }
.page-header.full, .content-header.full { background: #0f1f18; }
.page-header.full:hover, .content-header.full:hover { background: #142a20; }
.page-name, .content-name { font-weight: 500; }
.badge {
  font-size: 10px; background: #0f3460;
  color: #aac; padding: 2px 10px; border-radius: 10px;
  font-weight: 600;
}
.badge.full { background: #1a6a3a; color: #ccffdd; }
/* Grid 4 cot cho slots/phan phoi */
.slots-grid, .variants-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid #2a2a3e;
}
.slots-grid .slot-card { margin-bottom: 0; }
.empty-slot {
  grid-column: 1 / -1;
  color: #555; font-size: 11px;
  padding: 12px 0; text-align: center;
}
.content-body { border-top: 1px solid #2a2a3e; }
.content-actions {
  display: flex; justify-content: flex-end;
  padding: 0 14px 14px;
}
.btn-delete {
  padding: 6px 14px; font-size: 11px;
  background: #6a1a1a; color: #eee;
  border: 1px solid #a02828; border-radius: 4px;
  cursor: pointer;
}
.btn-delete:hover { background: #a02828; }
</style>