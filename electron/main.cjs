const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')

function decodeEntities(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
}
function tagValue(block, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  return decodeEntities((block.match(re) || [,''])[1]).trim()
}
function stripHtml(value = '') {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim()
}
ipcMain.handle('news:search', async (_event, options = {}) => {
  const query = String(options.query || 'top news').slice(0, 180)
  const country = String(options.country || 'IN').toUpperCase()
  const language = String(options.language || 'en').toLowerCase()
  const days = Math.max(0, Math.min(30, Number(options.days || 0)))
  const locales = {
    IN: { hl: `${language}-${country}`, gl: 'IN', ceid: `IN:${language}` },
    CA: { hl: `${language}-CA`, gl: 'CA', ceid: `CA:${language}` },
    US: { hl: `${language}-US`, gl: 'US', ceid: `US:${language}` },
    GB: { hl: `${language}-GB`, gl: 'GB', ceid: `GB:${language}` },
    AU: { hl: `${language}-AU`, gl: 'AU', ceid: `AU:${language}` },
    WORLD: { hl: 'en-US', gl: 'US', ceid: 'US:en' }
  }
  const locale = locales[country] || locales.IN
  const q = `${query}${days ? ` when:${days}d` : ''}`
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'JASS-NewsPulse-Studio/0.2' }, signal: AbortSignal.timeout(12000) })
    if (!response.ok) throw new Error(`News source returned HTTP ${response.status}`)
    const xml = await response.text()
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match, index) => {
      const block = match[1]
      const title = stripHtml(tagValue(block, 'title'))
      const link = tagValue(block, 'link')
      const source = stripHtml(tagValue(block, 'source')) || 'Google News'
      const pubDate = tagValue(block, 'pubDate')
      const description = stripHtml(tagValue(block, 'description'))
      return { id: `${index}-${link}`, title, link, source, pubDate, description }
    }).filter(item => item.title && /^https?:\/\//i.test(item.link))
    const seen = new Set()
    const unique = items.filter(item => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      if (seen.has(key)) return false
      seen.add(key); return true
    })
    return { ok: true, items: unique.slice(0, 35), fetchedAt: new Date().toISOString(), query }
  } catch (error) {
    return { ok: false, items: [], error: error.message || 'Could not fetch headlines.' }
  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 1050, minHeight: 700,
    backgroundColor: '#10121b', title: 'JASS NewsPulse Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  if (app.isPackaged) win.loadFile(path.join(__dirname, '../dist/index.html'))
  else win.loadURL('http://127.0.0.1:5173')
}
app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
