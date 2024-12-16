import { IpcRendererEvent } from 'electron'

// IPC 通信事件名称
export enum IpcEvents {
  MINIMIZE_WINDOW = 'minimize-window',
  MAXIMIZE_WINDOW = 'maximize-window',
  CLOSE_WINDOW = 'close-window',
  NEW_MESSAGE = 'new-message',
  NOTIFICATION = 'notification'
}

// IPC 通信处理器类型
export type IpcHandler = (event: IpcRendererEvent, ...args: any[]) => void

// IPC 通信监听器类型
export interface IpcListener {
  event: IpcEvents
  handler: IpcHandler
}

// IPC 通信服务
export interface IpcService {
  on(event: IpcEvents, handler: IpcHandler): void
  off(event: IpcEvents, handler: IpcHandler): void
  send(event: IpcEvents, ...args: any[]): void
  invoke(event: IpcEvents, ...args: any[]): Promise<any>
} 