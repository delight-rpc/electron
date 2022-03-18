import * as DelightRPC from 'delight-rpc'
import { Deferred } from 'extra-promise'
import Electron from 'electron'
import { CustomError } from '@blackglory/errors'

export function createClientInMain<IAPI extends object>(
  port: Electron.MessagePortMain
, parameterValidators?: DelightRPC.ParameterValidators<IAPI>
, expectedVersion?: `${number}.${number}.${number}`
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void] {
  const pendings: { [id: string]: Deferred<DelightRPC.IResponse<unknown>> } = {}

  port.addListener('message', handler)

  const client = DelightRPC.createClient<IAPI>(
    async function send(request) {
      const res = new Deferred<DelightRPC.IResponse<unknown>>()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
      }
    }
  , parameterValidators
  , expectedVersion
  )

  return [client, close]

  function close(): void {
    port.removeListener('message', handler)

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: Electron.MessageEvent): void {
    const res = event.data
    if (DelightRPC.isResult(res) || DelightRPC.isError(res)) {
      pendings[res.id].resolve(res)
    }
  }
}

export function createClientInRenderer<IAPI extends object>(
  port: MessagePort
, parameterValidators?: DelightRPC.ParameterValidators<IAPI>
, expectedVersion?: `${number}.${number}.${number}`
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void] {
  const pendings: { [id: string]: Deferred<DelightRPC.IResponse<unknown>> } = {}

  port.addEventListener('message', handler)

  const client = DelightRPC.createClient<IAPI>(
    async function send(request) {
      const res = new Deferred<DelightRPC.IResponse<unknown>>()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
      }
    }
  , parameterValidators
  , expectedVersion
  )

  return [client, close]

  function close(): void {
    port.removeEventListener('message', handler)

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: MessageEvent): void {
    const res = event.data
    if (DelightRPC.isResult(res) || DelightRPC.isError(res)) {
      pendings[res.id].resolve(res)
    }
  }
}

export function createBatchClientInMain(
  port: Electron.MessagePortMain
, expectedVersion?: `${number}.${number}.${number}`
): [client: DelightRPC.BatchClient, close: () => void] {
  const pendings: {
    [id: string]: Deferred<
    | DelightRPC.IError
    | DelightRPC.IBatchResponse<unknown>
    >
  } = {}

  port.addListener('message', handler)

  const client = new DelightRPC.BatchClient(
    async function send(request) {
      const res = new Deferred<
      | DelightRPC.IError
      | DelightRPC.IBatchResponse<unknown>
      >()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
      }
    }
  , expectedVersion
  )

  return [client, close]

  function close(): void {
    port.removeListener('message', handler)

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: Electron.MessageEvent): void {
    const res = event.data
    if (DelightRPC.isError(res) || DelightRPC.isBatchResponse(res)) {
      pendings[res.id].resolve(res)
    }
  }
}

export function createBatchClientInRenderer(
  port: MessagePort
, expectedVersion?: `${number}.${number}.${number}`
): [client: DelightRPC.BatchClient, close: () => void] {
  const pendings: {
    [id: string]: Deferred<
    | DelightRPC.IError
    | DelightRPC.IBatchResponse<unknown>
    >
  } = {}

  port.addEventListener('message', handler)

  const client = new DelightRPC.BatchClient(
    async function send(request) {
      const res = new Deferred<
      | DelightRPC.IError
      | DelightRPC.IBatchResponse<unknown>
      >()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
      }
    }
  , expectedVersion
  )

  return [client, close]

  function close(): void {
    port.removeEventListener('message', handler)

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: MessageEvent): void {
    const res = event.data
    if (DelightRPC.isError(res) || DelightRPC.isBatchResponse(res)) {
      pendings[res.id].resolve(res)
    }
  }
}

export class ClientClosed extends CustomError {}
