import { layouts } from './layouts'
/**
 * Pure generator logic. No UI, no canvas.
 *
 * Priorities (best-effort):
 *   1. Manual user preference
 *   2. Layout valid for source image count
 *   3. Limit layout reuse across variants
 *   4. Limit image overlap across variants
 *   5. Prefer least-used source images
 *   6. Limit main image reuse
 *   7. Random tiebreak
 *
 * Auto does NOT pick 1-image layouts (S*) unless source count is 1.
 *
 * Options:
 *   - pinnedLayoutId: string, force this layout (skip layout roll)
 *   - pinImages: number[], force this image subset (skip image roll)
 */
function weightedRandom(items) {
  if (!items.length) return null
  const total = items.reduce((s, it) => s + it.score, 0)
  if (total <= 0) return items[0].id
  let r = Math.random() * total
  for (const it of items) {
    r -= it.score
    if (r <= 0) return it.id
  }
  return items[items.length - 1].id
}
export function selectLayout(pref, sourceImageCount, otherVariants) {
  const manual = pref.layoutPreference
  if (manual && manual !== 'auto' && layouts[manual]) {
    const def = layouts[manual]
    if (def.imageCount <= sourceImageCount) return manual
  }
  const autoCandidates = Object.values(layouts).filter((l) => {
    if (l.imageCount < 1 || l.imageCount > sourceImageCount) return false
    if (l.imageCount === 1 && sourceImageCount > 1) return false
    return true
  })
  const candidates = autoCandidates.length
    ? autoCandidates
    : Object.values(layouts).filter(
        (l) => l.imageCount >= 1 && l.imageCount <= sourceImageCount
      )
  if (!candidates.length) return null
  const usedLayoutIds = new Set(
    otherVariants.map((v) => v.layoutId).filter(Boolean)
  )
  const scored = candidates.map((l) => {
    let s = 1.0
    if (usedLayoutIds.has(l.id)) s = 0.15
    s *= 0.6 + 0.4 * (l.imageCount / sourceImageCount)
    return { id: l.id, score: s }
  })
  return weightedRandom(scored)
}
export function selectImages(pref, sourceImageCount, layoutImageCount, otherVariants, pinImages) {
  // Uu tien cao nhat: pinImages (noi bo, dung khi user doi main ma khong doi images)
  if (Array.isArray(pinImages) && pinImages.length === layoutImageCount) {
    const valid = pinImages.every((i) => Number.isInteger(i) && i >= 0 && i < sourceImageCount)
    if (valid) return [...pinImages].sort((a, b) => a - b)
  }
  // Uu tien 2: imagesPreference manual cua user
  const manual = pref.imagesPreference
  if (Array.isArray(manual) && manual.length === layoutImageCount) {
    const valid = manual.every((i) => Number.isInteger(i) && i >= 0 && i < sourceImageCount)
    if (valid) return [...manual].sort((a, b) => a - b)
  }
  // Auto roll
  const usage = new Array(sourceImageCount).fill(0)
  for (const v of otherVariants) {
    if (Array.isArray(v.imageIndices)) {
      for (const idx of v.imageIndices) {
        if (idx >= 0 && idx < sourceImageCount) usage[idx]++
      }
    }
  }
  const ranked = Array.from({ length: sourceImageCount }, (_, i) => ({
    i,
    u: usage[i],
    r: Math.random(),
  }))
    .sort((a, b) => a.u - b.u || a.r - b.r)
    .map((o) => o.i)
  return ranked.slice(0, layoutImageCount).sort((a, b) => a - b)
}
export function selectMainImage(pref, imageIndices, otherVariants) {
  if (!imageIndices || !imageIndices.length) return null
  const manual = pref.mainPreference
  if (
    manual !== undefined &&
    manual !== null &&
    manual !== 'auto' &&
    imageIndices.includes(manual)
  ) {
    return manual
  }
  const mainUsage = {}
  for (const v of otherVariants) {
    if (v.mainIndex !== undefined && v.mainIndex !== null) {
      mainUsage[v.mainIndex] = (mainUsage[v.mainIndex] || 0) + 1
    }
  }
  const scored = imageIndices.map((idx) => ({
    idx,
    u: mainUsage[idx] || 0,
    r: Math.random(),
  }))
  scored.sort((a, b) => a.u - b.u || a.r - b.r)
  return scored[0].idx
}
export function generateVariantConfig(variant, sourceImageCount, otherVariants, options = {}) {
  if (sourceImageCount <= 0) return null
  let layoutId = null
  if (options.pinnedLayoutId && layouts[options.pinnedLayoutId]) {
    const def = layouts[options.pinnedLayoutId]
    if (def.imageCount <= sourceImageCount) layoutId = options.pinnedLayoutId
  }
  if (!layoutId) {
    layoutId = selectLayout(variant, sourceImageCount, otherVariants)
  }
  if (!layoutId) return null
  const layoutImageCount = layouts[layoutId].imageCount
  const imageIndices = selectImages(
    variant,
    sourceImageCount,
    layoutImageCount,
    otherVariants,
    options.pinImages
  )
  const mainIndex = selectMainImage(variant, imageIndices, otherVariants)
  return { layoutId, imageIndices, mainIndex }
}
export function generateFourVariants(sourceImageCount) {
  const variants = []
  for (let i = 0; i < 4; i++) {
    const v = {
      id: `v${i + 1}`,
      name: `Variant ${i + 1}`,
      layoutPreference: 'auto',
      imagesPreference: 'auto',
      mainPreference: 'auto',
      canvasJSON: null,
      layoutId: null,
      imageIndices: null,
      mainIndex: null,
    }
    const resolved = generateVariantConfig(v, sourceImageCount, variants)
    if (resolved) Object.assign(v, resolved)
    variants.push(v)
  }
  return variants
}