import * as DelightRPC from 'delight-rpc'
import { isJsonRpcSuccess, isJsonRpcError } from '@blackglory/types'
import { Deferred } from 'extra-promise'
import { JsonRpcResponse } from 'justypes'
import Electron from 'electron'
import { CustomError } from '@blackglory/errors'

export function createClientInMain<IAPI extends object>(
  port: Electron.MessagePortMain
): [client: DelightRPC.RequestProxy<IAPI>, close: () => void] {
  const pendings: { [id: string]: Deferred<JsonRpcResponse<any>> } = {}

  port.addListener('message', handler)
  port.start()

  const client = DelightRPC.createClient<IAPI>(
    async function request(jsonRpc) {
      const res = new Deferred<JsonRpcResponse<any>>()
      pendings[jsonRpc.id] = res
      try {
        port.postMessage(jsonRpc)
        return await res
      } finally {
        delete pendings[jsonRpc.id]
      }
    }
  )

  return [client, close]

  function close(): void {
    port.removeListener('message', handler)
    port.close()

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: Electron.MessageEvent): void {
    const res = event.data
    if (isJsonRpcSuccess(res)) {
      pendings[res.id].resolve(res)
    } else if (isJsonRpcError(res)) {
      pendings[res.id].reject(res)
    }
  }
}

export function createClientInRenderer<IAPI extends object>(
  port: MessagePort
): [client: DelightRPC.RequestProxy<IAPI>, close: () => void] {
  const pendings: { [id: string]: Deferred<JsonRpcResponse<any>> } = {}

  port.addEventListener('message', handler)
  port.start()

  const client = DelightRPC.createClient<IAPI>(
    async function request(jsonRpc) {
      const res = new Deferred<JsonRpcResponse<any>>()
      pendings[jsonRpc.id] = res
      try {
        port.postMessage(jsonRpc)
        return await res
      } finally {
        delete pendings[jsonRpc.id]
      }
    }
  )

  return [client, close]

  function close(): void {
    port.removeEventListener('message', handler)
    port.close()

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: MessageEvent): void {
    const res = event.data
    if (isJsonRpcSuccess(res)) {
      pendings[res.id].resolve(res)
    } else if (isJsonRpcError(res)) {
      pendings[res.id].reject(res)
    }
  }
}

export class ClientClosed extends CustomError {}
