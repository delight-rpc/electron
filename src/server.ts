import * as DelightRPC from 'delight-rpc'
import Electron from 'electron'

export function createServerInMain<IAPI extends object>(
  api: IAPI
, port: Electron.MessagePortMain
): () => void {
  port.addListener('message', handler)
  port.start()
  return () => {
    port.removeListener('message', handler)
    port.close()
  }

  async function handler(event: Electron.MessageEvent): Promise<void> {
    const req = event.data
    if (DelightRPC.isRequest(req)) {
      const result = await DelightRPC.createResponse(api, req)

      port.postMessage(result)
    }
  }
}

export function createServerInRenderer<IAPI extends object>(
  api: IAPI
, port: MessagePort
): () => void {
  port.addEventListener('message', handler)
  port.start()
  return () => {
    port.removeEventListener('message', handler)
    port.close()
  }

  async function handler(event: MessageEvent): Promise<void> {
    const req = event.data
    if (DelightRPC.isRequest(req)) {
      const result = await DelightRPC.createResponse(api, req)

      port.postMessage(result)
    }
  }
}
