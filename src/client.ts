import * as DelightRPC from 'delight-rpc'
import { Deferred } from 'extra-promise'
import Electron from 'electron'
import { CustomError } from '@blackglory/errors'

export function createClientInMain<IAPI extends object>(
  port: Electron.MessagePortMain
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void] {
  const pendings: { [id: string]: Deferred<DelightRPC.IResponse<any>> } = {}

  port.addListener('message', handler)
  port.start()

  const client = DelightRPC.createClient<IAPI>(
    async function send(request) {
      const res = new Deferred<DelightRPC.IResponse<any>>()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
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
    if (DelightRPC.isResult(res)) {
      pendings[res.id].resolve(res)
    } else if (DelightRPC.isError(res)) {
      pendings[res.id].reject(res)
    }
  }
}

export function createClientInRenderer<IAPI extends object>(
  port: MessagePort
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void] {
  const pendings: { [id: string]: Deferred<DelightRPC.IResponse<any>> } = {}

  port.addEventListener('message', handler)
  port.start()

  const client = DelightRPC.createClient<IAPI>(
    async function send(request) {
      const res = new Deferred<DelightRPC.IResponse<any>>()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
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
    if (DelightRPC.isResult(res)) {
      pendings[res.id].resolve(res)
    } else if (DelightRPC.isError(res)) {
      pendings[res.id].reject(res)
    }
  }
}

export class ClientClosed extends CustomError {}
