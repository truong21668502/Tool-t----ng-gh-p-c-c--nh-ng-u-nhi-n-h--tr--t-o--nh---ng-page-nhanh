import { ref } from 'vue'
import { safeLoadFromJSON } from '../utils/canvasRestore'
const MAX_STATES = 40
export function useCanvasHistory(getCanvas) {
  const canUndo = ref(false)
  const canRedo = ref(false)
  const stack = []
  let index = -1
  let locked = false
  const EXTRA_PROPS = [
    '_isFrame', '_frameW', '_frameH', '_naturalW', '_naturalH',
    '_regionRole', '_regionIndex', '_isArrow', '_isCircle',
    '_arrowLength', '_arrowColor', '_arrowStrokeWidth',
  ]
  function snapshot() {
    const c = getCanvas()
    if (!c) return null
    return JSON.stringify(c.toObject(EXTRA_PROPS))
  }
  function refreshFlags() {
    canUndo.value = index > 0
    canRedo.value = index < stack.length - 1
  }
  function push() {
    if (locked) return
    const json = snapshot()
    if (!json) return
    stack.splice(index + 1)
    stack.push(json)
    if (stack.length > MAX_STATES) stack.shift()
    index = stack.length - 1
    refreshFlags()
  }
  function reset(initialJson) {
    stack.length = 0
    index = -1
    if (initialJson) {
      stack.push(initialJson)
      index = 0
    }
    refreshFlags()
  }
  async function undo() {
    if (index <= 0) return
    index--
    locked = true
    await safeLoadFromJSON(getCanvas(), stack[index])
    locked = false
    refreshFlags()
  }
  async function redo() {
    if (index >= stack.length - 1) return
    index++
    locked = true
    await safeLoadFromJSON(getCanvas(), stack[index])
    locked = false
    refreshFlags()
  }
  function isLocked() { return locked }
  return { push, reset, undo, redo, canUndo, canRedo, isLocked }
}