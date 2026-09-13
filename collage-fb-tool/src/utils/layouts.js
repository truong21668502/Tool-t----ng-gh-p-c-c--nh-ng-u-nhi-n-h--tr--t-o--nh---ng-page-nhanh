/**
 * Layout library.
 * - id/name: metadata for UI + generator
 * - imageCount: = regions.length, computed at import time
 * - role: 'main' | 'secondary' | 'any'
 *   - 'any' only for 1-image layouts (no main distinction)
 *   - 'main'  maps to the variant main image
 *   - 'secondary' index is positional inside the non-main subset (0..N-2)
 */
const RAW = {
  S1: { name: 'Full', regions: [{ role: 'any', index: 0, x: 0, y: 0, w: 1, h: 1 }] },
  S2: { name: 'Full', regions: [{ role: 'any', index: 0, x: 0, y: 0, w: 1, h: 1 }] },
  S3: { name: 'Full', regions: [{ role: 'any', index: 0, x: 0, y: 0, w: 1, h: 1 }] },
  S4: { name: 'Full', regions: [{ role: 'any', index: 0, x: 0, y: 0, w: 1, h: 1 }] },
  T1: {
    name: 'Doc (main trai)',
    regions: [
      { role: 'main', x: 0, y: 0, w: 0.5, h: 1 },
      { role: 'secondary', index: 0, x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  T2: {
    name: 'Doc (main phai)',
    regions: [
      { role: 'secondary', index: 0, x: 0, y: 0, w: 0.5, h: 1 },
      { role: 'main', x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  T3: {
    name: 'Ngang (main tren)',
    regions: [
      { role: 'main', x: 0, y: 0, w: 1, h: 0.5 },
      { role: 'secondary', index: 0, x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  T4: {
    name: 'Ngang (main duoi)',
    regions: [
      { role: 'secondary', index: 0, x: 0, y: 0, w: 1, h: 0.5 },
      { role: 'main', x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  U1: {
    name: 'Main tren',
    regions: [
      { role: 'main', x: 0, y: 0, w: 1, h: 0.58 },
      { role: 'secondary', index: 0, x: 0, y: 0.58, w: 0.5, h: 0.42 },
      { role: 'secondary', index: 1, x: 0.5, y: 0.58, w: 0.5, h: 0.42 },
    ],
  },
  U2: {
    name: 'Main trai',
    regions: [
      { role: 'main', x: 0, y: 0, w: 0.58, h: 1 },
      { role: 'secondary', index: 0, x: 0.58, y: 0, w: 0.42, h: 0.5 },
      { role: 'secondary', index: 1, x: 0.58, y: 0.5, w: 0.42, h: 0.5 },
    ],
  },
  U3: {
    name: 'Main duoi',
    regions: [
      { role: 'secondary', index: 0, x: 0, y: 0, w: 0.5, h: 0.42 },
      { role: 'secondary', index: 1, x: 0.5, y: 0, w: 0.5, h: 0.42 },
      { role: 'main', x: 0, y: 0.42, w: 1, h: 0.58 },
    ],
  },
  U4: {
    name: 'Main phai',
    regions: [
      { role: 'secondary', index: 0, x: 0, y: 0, w: 0.42, h: 0.5 },
      { role: 'secondary', index: 1, x: 0, y: 0.5, w: 0.42, h: 0.5 },
      { role: 'main', x: 0.42, y: 0, w: 0.58, h: 1 },
    ],
  },
  V1: {
    name: 'Grid 2x2',
    regions: [
      { role: 'main', x: 0, y: 0, w: 0.5, h: 0.5 },
      { role: 'secondary', index: 0, x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { role: 'secondary', index: 1, x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { role: 'secondary', index: 2, x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  V2: {
    name: 'Main tren',
    regions: [
      { role: 'main', x: 0, y: 0, w: 1, h: 0.6 },
      { role: 'secondary', index: 0, x: 0, y: 0.6, w: 1 / 3, h: 0.4 },
      { role: 'secondary', index: 1, x: 1 / 3, y: 0.6, w: 1 / 3, h: 0.4 },
      { role: 'secondary', index: 2, x: 2 / 3, y: 0.6, w: 1 / 3, h: 0.4 },
    ],
  },
  V3: {
    name: 'Main trai',
    regions: [
      { role: 'main', x: 0, y: 0, w: 0.6, h: 1 },
      { role: 'secondary', index: 0, x: 0.6, y: 0, w: 0.4, h: 1 / 3 },
      { role: 'secondary', index: 1, x: 0.6, y: 1 / 3, w: 0.4, h: 1 / 3 },
      { role: 'secondary', index: 2, x: 0.6, y: 2 / 3, w: 0.4, h: 1 / 3 },
    ],
  },
  V4: {
    name: '4 cot doc',
    regions: [
      { role: 'main', x: 0, y: 0, w: 0.25, h: 1 },
      { role: 'secondary', index: 0, x: 0.25, y: 0, w: 0.25, h: 1 },
      { role: 'secondary', index: 1, x: 0.5, y: 0, w: 0.25, h: 1 },
      { role: 'secondary', index: 2, x: 0.75, y: 0, w: 0.25, h: 1 },
    ],
  },
  W1: {
    name: 'Main tren + 4 duoi',
    regions: [
      { role: 'main', x: 0, y: 0, w: 1, h: 0.5 },
      { role: 'secondary', index: 0, x: 0, y: 0.5, w: 0.25, h: 0.5 },
      { role: 'secondary', index: 1, x: 0.25, y: 0.5, w: 0.25, h: 0.5 },
      { role: 'secondary', index: 2, x: 0.5, y: 0.5, w: 0.25, h: 0.5 },
      { role: 'secondary', index: 3, x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
    ],
  },
  W2: {
    name: '4 tren + main duoi',
    regions: [
      { role: 'secondary', index: 0, x: 0, y: 0, w: 0.25, h: 0.5 },
      { role: 'secondary', index: 1, x: 0.25, y: 0, w: 0.25, h: 0.5 },
      { role: 'secondary', index: 2, x: 0.5, y: 0, w: 0.25, h: 0.5 },
      { role: 'secondary', index: 3, x: 0.75, y: 0, w: 0.25, h: 0.5 },
      { role: 'main', x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  W3: {
    name: 'Main trai + 4 phai',
    regions: [
      { role: 'main', x: 0, y: 0, w: 0.5, h: 1 },
      { role: 'secondary', index: 0, x: 0.5, y: 0, w: 0.5, h: 0.25 },
      { role: 'secondary', index: 1, x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
      { role: 'secondary', index: 2, x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
      { role: 'secondary', index: 3, x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
    ],
  },
  W4: {
    name: '4 trai + main phai',
    regions: [
      { role: 'secondary', index: 0, x: 0, y: 0, w: 0.5, h: 0.25 },
      { role: 'secondary', index: 1, x: 0, y: 0.25, w: 0.5, h: 0.25 },
      { role: 'secondary', index: 2, x: 0, y: 0.5, w: 0.5, h: 0.25 },
      { role: 'secondary', index: 3, x: 0, y: 0.75, w: 0.5, h: 0.25 },
      { role: 'main', x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
}
export const layouts = Object.fromEntries(
  Object.entries(RAW).map(([id, def]) => [
    id,
    { id, name: def.name, imageCount: def.regions.length, regions: def.regions },
  ])
)
export function getLayoutIds() { return Object.keys(layouts) }
export function getLayout(id) { return layouts[id] || null }
export function getLayoutImageCount(id) { return layouts[id]?.imageCount || 0 }
/**
 * Group layouts by image count, for UI optgroups.
 * Returns { [imageCount]: [{ id, name }, ...] }
 */
export function getLayoutsByCount() {
  const groups = {}
  for (const [id, def] of Object.entries(layouts)) {
    const n = def.imageCount
    if (!groups[n]) groups[n] = []
    groups[n].push({ id, name: def.name })
  }
  return groups
}
/**
 * Kept for backward compatibility. Do not rely on it in new code.
 */
export function getLayoutsForCount(count) {
  if (count <= 1) return ['S1', 'S2', 'S3', 'S4']
  if (count === 2) return ['T1', 'T2', 'T3', 'T4']
  if (count === 3) return ['U1', 'U2', 'U3', 'U4']
  if (count === 4) return ['V1', 'V2', 'V3', 'V4']
  return ['W1', 'W2', 'W3', 'W4']
}
/**
 * Kept for backward compatibility. In the new architecture, image selection
 * is done by variantGenerator, not here.
 */
export function resolveImageIndices(region, mainIndex, totalImages) {
  if (totalImages === 0) return 0
  if (region.role === 'any') return 0
  if (region.role === 'main') return mainIndex
  const all = Array.from({ length: totalImages }, (_, i) => i)
  const nonMain = all.filter((i) => i !== mainIndex)
  if (nonMain.length === 0) return mainIndex
  return nonMain[region.index % nonMain.length]
}