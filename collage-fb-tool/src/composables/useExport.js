export function useExport() {
  function exportCurrent(canvas, filename) {
    if (!canvas) return
    const zoom = canvas.getZoom() || 1
    const dataURL = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.93,
      multiplier: 1 / zoom,
    })
    downloadDataURL(dataURL, `${filename}.jpg`)
  }
  function downloadDataURL(dataURL, filename) {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  return { exportCurrent, downloadDataURL }
}