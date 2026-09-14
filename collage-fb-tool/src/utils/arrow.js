import * as fabric from 'fabric'
import { applyUniformScaling } from './uniformScaling'
/**
 * Create an arrow as ONE object (Group: line + triangle head).
 * Default: red, horizontal, length 240px.
 */
export function createArrow(opts = {}) {
  const {
    left = 420,
    top = 540,
    length = 240,
    strokeWidth = 10,
    color = '#d32f2f',
  } = opts
  const headSize = Math.max(24, strokeWidth * 3)
  const line = new fabric.Line(
    [0, 0, length - headSize * 0.6, 0],
    {
      stroke: color,
      strokeWidth: strokeWidth,
      strokeLineCap: 'round',
      originX: 'left',
      originY: 'center',
    }
  )
  const tri = new fabric.Triangle({
    width: headSize,
    height: headSize * 1.4,
    fill: color,
    left: length - headSize * 0.4,
    top: 0,
    originX: 'center',
    originY: 'center',
    angle: 90,
  })
  const group = new fabric.Group([line, tri], {
    left,
    top,
    originX: 'left',
    originY: 'top',
    subTargetCheck: false,
  })
  group._isArrow = true
  group._arrowLength = length
  group._arrowColor = color
  group._arrowStrokeWidth = strokeWidth
  applyUniformScaling(group)
  return group
}
/**
 * Rebuild arrow with new stroke width while keeping position/rotation.
 */
export function rebuildArrow(oldArrow, newStrokeWidth) {
  const angle = oldArrow.angle || 0
  const left = oldArrow.left
  const top = oldArrow.top
  const color = oldArrow._arrowColor || '#d32f2f'
  const length = oldArrow._arrowLength || 240
  return createArrow({ left, top, length, strokeWidth: newStrokeWidth, color }).set('angle', angle)
}