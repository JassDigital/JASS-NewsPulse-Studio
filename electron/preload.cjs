const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('newsPulse', {
  searchNews: (options) => ipcRenderer.invoke('news:search', options)
})
