import { IpcRenderer, IpcMain } from 'electron'

declare global {
  interface Window {
    ipcRenderer: IpcRenderer
    require: NodeRequire
  }
} 