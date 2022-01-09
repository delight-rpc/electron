import * as DelightRPC from 'delight-rpc'
import Electron from 'electron'

export function createServerInMain<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, port: Electron.MessagePortMain
, parameterValidators?: DelightRPC.ParameterValidators<IAPI>
): () => void {
  port.addListener('message', handler)
  return () => port.removeListener('message', handler)

  async function handler(event: Electron.MessageEvent): Promise<void> {
    const req = event.data
    if (DelightRPC.isRequest(req)) {
      const result = await DelightRPC.createResponse(api, req, parameterValidators)

      port.postMessage(result)
    }
  }
}

export function createServerInRenderer<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, port: MessagePort
, parameterValidators?: DelightRPC.ParameterValidators<IAPI>
): () => void {
  port.addEventListener('message', handler)
  return () => port.removeEventListener('message', handler)

  async function handler(event: MessageEvent): Promise<void> {
    const req = event.data
    if (DelightRPC.isRequest(req)) {
      const result = await DelightRPC.createResponse(api, req, parameterValidators)

      port.postMessage(result)
    }
  }
}
