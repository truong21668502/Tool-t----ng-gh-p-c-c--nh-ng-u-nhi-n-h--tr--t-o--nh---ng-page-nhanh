export const TIME_SLOTS = [
  { index: 0, hour: 17, label: '17:00', dayOffset: 0 },
  { index: 1, hour: 21, label: '21:00', dayOffset: 0 },
  { index: 2, hour: 2,  label: '02:00', dayOffset: 1 },
  { index: 3, hour: 7,  label: '07:00', dayOffset: 1 },
]
export function parseFolderDate(str) {
  const [d, m, y] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function formatFolderDate(date) {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}-${m}-${y}`
}
export function todayFolderDate() {
  return formatFolderDate(new Date())
}
export function scheduledAt(folderDate, timeSlotIndex) {
  const base = parseFolderDate(folderDate)
  const slot = TIME_SLOTS[timeSlotIndex]
  const d = new Date(base)
  d.setDate(d.getDate() + slot.dayOffset)
  d.setHours(slot.hour, 0, 0, 0)
  return d
}
export function formatScheduledAt(folderDate, timeSlotIndex) {
  const d = scheduledAt(folderDate, timeSlotIndex)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  return `${dd}-${mm}-${yyyy} ${hh}:00`
}
export function timeSlotLabel(idx) {
  return TIME_SLOTS[idx]?.label || '??:??'
}