import * as DelightRPC from 'delight-rpc'
import Electron from 'electron'

export function createServerInMain<IAPI extends object>(
  api: IAPI
, port: Electron.MessagePortMain
, parametersValidators?: DelightRPC.ParameterValidators<IAPI>
): () => void {
  port.addListener('message', handler)
  return () => port.removeListener('message', handler)

  async function handler(event: Electron.MessageEvent): Promise<void> {
    const req = event.data
    if (DelightRPC.isRequest(req)) {
      const result = await DelightRPC.createResponse(api, req, parametersValidators)

      port.postMessage(result)
    }
  }
}

export function createServerInRenderer<IAPI extends object>(
  api: IAPI
, port: MessagePort
, parametersValidators?: DelightRPC.ParameterValidators<IAPI>
): () => void {
  port.addEventListener('message', handler)
  return () => port.removeEventListener('message', handler)

  async function handler(event: MessageEvent): Promise<void> {
    const req = event.data
    if (DelightRPC.isRequest(req)) {
      const result = await DelightRPC.createResponse(api, req, parametersValidators)

      port.postMessage(result)
    }
  }
}
