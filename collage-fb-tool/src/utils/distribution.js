/**
 * Distribute variants of contents across (page, timeSlot) grid.
 *
 * Rules:
 *  1. One variant only once per schedule
 *  2. One content at same timeSlot only once across all pages (auto-satisfied
 *     because each content has exactly one variant per time slot)
 *  3. One page cannot receive >1 variant from same content
 *  4. Empty slots allowed
 *  5. Even distribution
 *
 * @param {Array} contents - [{id, variantCount}]
 * @param {number} pageCount
 * @returns {Array<{contentId, variantIndex, pageNumber, timeSlot}>}
 */
export function distributeVariants(contents, pageCount) {
  if (!contents.length || pageCount <= 0) return []
  const used = new Set()                              // "page:timeSlot"
  const pagePostCount = new Array(pageCount + 1).fill(0)
  const contentPages = new Map()                      // contentId -> Set of pages
  const assignments = []
  for (let ci = 0; ci < contents.length; ci++) {
    const content = contents[ci]
    const variantCount = Math.min(content.variantCount || 4, 4)
    contentPages.set(content.id, new Set())
    for (let v = 0; v < variantCount; v++) {
      const candidates = []
      for (let p = 1; p <= pageCount; p++) {
        if (contentPages.get(content.id).has(p)) continue
        if (used.has(`${p}:${v}`)) continue
        candidates.push(p)
      }
      if (!candidates.length) continue
      candidates.sort((a, b) => {
        const diff = pagePostCount[a] - pagePostCount[b]
        if (diff !== 0) return diff
        const aRot = (a + ci) % pageCount
        const bRot = (b + ci) % pageCount
        return aRot - bRot
      })
      const chosen = candidates[0]
      used.add(`${chosen}:${v}`)
      pagePostCount[chosen]++
      contentPages.get(content.id).add(chosen)
      assignments.push({
        contentId: content.id,
        variantIndex: v,
        pageNumber: chosen,
        timeSlot: v,
      })
    }
  }
  return assignments
}