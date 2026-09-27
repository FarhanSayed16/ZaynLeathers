import brand from '@brand'

/** Convert #RRGGBB or #RGB to "R G B" channels for Tailwind opacity support. */
function hexToRgbChannels(hex) {
  if (!hex || typeof hex !== 'string') return null
  let h = hex.trim().replace('#', '')
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('')
  }
  if (h.length !== 6) return null
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

function setRgbVar(root, name, hex) {
  const channels = hexToRgbChannels(hex)
  if (channels) root.style.setProperty(name, channels)
}

/** Apply brand identity to admin document head. */
export function applyBrandToDocument() {
  document.title = brand.admin?.panelTitle || `${brand.name} Admin`

  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.type = brand.logos.favicon?.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
  link.href = brand.logos.favicon

  const root = document.documentElement
  const c = brand.theme?.colors || {}

  if (c.primary) root.style.setProperty('--brand-primary', c.primary)
  if (c.secondary) root.style.setProperty('--brand-secondary', c.secondary)
  if (c.accent) root.style.setProperty('--brand-accent', c.accent)
  if (c.muted) root.style.setProperty('--brand-muted', c.muted)
  if (c.background) root.style.setProperty('--brand-bg', c.background)
  if (c.surface) root.style.setProperty('--brand-surface', c.surface)

  setRgbVar(root, '--tz-pink', c.primary)
  setRgbVar(root, '--tz-pink-soft', c.soft || c.secondary)
  setRgbVar(root, '--tz-blue', c.secondary)
  setRgbVar(root, '--tz-blue-soft', c.soft || '#E8DED2')
  setRgbVar(root, '--tz-navy', c.muted || c.accent)
  setRgbVar(root, '--tz-cream', c.background)
  setRgbVar(root, '--tz-cherry', c.danger || '#B45353')

  const f = brand.theme?.fonts || {}
  if (f.body) root.style.setProperty('--brand-font-body', f.body.replace(/["']/g, ''))
  if (f.heading) root.style.setProperty('--brand-font-heading', f.heading.replace(/["']/g, ''))
}

export default brand
