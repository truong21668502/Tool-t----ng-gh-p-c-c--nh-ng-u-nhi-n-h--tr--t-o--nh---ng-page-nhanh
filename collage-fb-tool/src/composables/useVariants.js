import { ref } from 'vue'
import { generateVariantConfig, generateFourVariants } from '../utils/variantGenerator'
export function useVariants() {
  const variants = ref([])
  const activeVariantIndex = ref(0)
  function generateAll(sourceImageCount) {
    variants.value = generateFourVariants(sourceImageCount)
    activeVariantIndex.value = 0
  }
  function regenerateOne(index, sourceImageCount) {
    const v = variants.value[index]
    if (!v) return null
    const others = variants.value.filter((_, i) => i !== index)
    const resolved = generateVariantConfig(v, sourceImageCount, others)
    if (!resolved) return null
    Object.assign(v, resolved)
    v.canvasJSON = null
    return v
  }
  function updatePreferences(index, patch) {
    const v = variants.value[index]
    if (!v) return
    if ('layoutPreference' in patch) v.layoutPreference = patch.layoutPreference
    if ('imagesPreference' in patch) v.imagesPreference = patch.imagesPreference
    if ('mainPreference' in patch) v.mainPreference = patch.mainPreference
  }
  /**
   * @param {number} index
   * @param {number} sourceImageCount
   * @param {object} [options]
   * @param {string} [options.pinnedLayoutId]
   */
  function resolveOne(index, sourceImageCount, options = {}) {
    const v = variants.value[index]
    if (!v) return null
    const others = variants.value.filter((_, i) => i !== index)
    const resolved = generateVariantConfig(v, sourceImageCount, others, options)
    if (!resolved) return null
    Object.assign(v, resolved)
    v.canvasJSON = null
    return v
  }
  function switchVariant(index) {
    if (index >= 0 && index < variants.value.length) {
      activeVariantIndex.value = index
    }
  }
  return {
    variants,
    activeVariantIndex,
    generateAll,
    regenerateOne,
    updatePreferences,
    resolveOne,
    switchVariant,
  }
}