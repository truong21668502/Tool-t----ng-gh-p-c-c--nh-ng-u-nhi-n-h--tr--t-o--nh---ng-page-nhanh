import * as fabric from 'fabric'
export function createCircle(opts = {}) {
  const {
    left = 440,
    top = 440,
    radius = 100,
    stroke = '#d32f2f',
    strokeWidth = 8,
  } = opts
  const c = new fabric.Circle({
    left,
    top,
    radius,
    fill: 'transparent',
    stroke,
    strokeWidth,
    originX: 'left',
    originY: 'top',
  })
  c._isCircle = true
  return c
}