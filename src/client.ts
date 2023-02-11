import * as DelightRPC from 'delight-rpc'
import { Deferred } from 'extra-promise'
import Electron from 'electron'
import { CustomError } from '@blackglory/errors'
import { IResponse, IError, IBatchResponse } from '@delight-rpc/protocol'

export function createClientInMain<IAPI extends object>(
  port: Electron.MessagePortMain
, { parameterValidators, expectedVersion, channel }: {
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
  , expectedVersion?: string
  , channel?: string
  } = {}
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void] {
  const pendings: Record<string, Deferred<IResponse<unknown>> | undefined> = {}

  port.addListener('message', handler)

  const client = DelightRPC.createClient<IAPI>(
    async function send(request) {
      const res = new Deferred<IResponse<unknown>>()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
      }
    }
  , {
      parameterValidators
    , expectedVersion
    , channel
    }
  )

  return [client, close]

  function close(): void {
    port.removeListener('message', handler)

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred!.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: Electron.MessageEvent): void {
    const res = event.data
    if (DelightRPC.isResult(res) || DelightRPC.isError(res)) {
      pendings[res.id]?.resolve(res)
    }
  }
}

export function createClientInRenderer<IAPI extends object>(
  port: MessagePort
, { parameterValidators, expectedVersion, channel }: {
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
    expectedVersion?: string
    channel?: string
  } = {}
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void] {
  const pendings: Record<
    string
  , | Deferred<IResponse<unknown>>
    | undefined
  > = {}

  port.addEventListener('message', handler)

  const client = DelightRPC.createClient<IAPI>(
    async function send(request) {
      const res = new Deferred<IResponse<unknown>>()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
      }
    }
  , {
      parameterValidators
    , expectedVersion
    , channel
    }
  )

  return [client, close]

  function close(): void {
    port.removeEventListener('message', handler)

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred!.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: MessageEvent): void {
    const res = event.data
    if (DelightRPC.isResult(res) || DelightRPC.isError(res)) {
      pendings[res.id]?.resolve(res)
    }
  }
}

export function createBatchClientInMain<DataType>(
  port: Electron.MessagePortMain
, { expectedVersion, channel }: {
    expectedVersion?: string
    channel?: string
  } = {}
): [client: DelightRPC.BatchClient<DataType>, close: () => void] {
  const pendings: Record<
    string
  , | Deferred<IError | IBatchResponse<unknown>>
    | undefined
  > = {}

  port.addListener('message', handler)

  const client = new DelightRPC.BatchClient(
    async function send(request) {
      const res = new Deferred<
      | IError
      | IBatchResponse<unknown>
      >()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
      }
    }
  , {
      expectedVersion
    , channel
    }
  )

  return [client, close]

  function close(): void {
    port.removeListener('message', handler)

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred!.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: Electron.MessageEvent): void {
    const res = event.data
    if (DelightRPC.isError(res) || DelightRPC.isBatchResponse(res)) {
      pendings[res.id]?.resolve(res)
    }
  }
}

export function createBatchClientInRenderer<DataType>(
  port: MessagePort
, { expectedVersion, channel }: {
    expectedVersion?: string
    channel?: string
  } = {}
): [client: DelightRPC.BatchClient<DataType>, close: () => void] {
  const pendings: Record<
    string
  , | Deferred<IError | IBatchResponse<unknown>>
    | undefined
  > = {}

  port.addEventListener('message', handler)

  const client = new DelightRPC.BatchClient(
    async function send(request) {
      const res = new Deferred<
      | IError
      | IBatchResponse<unknown>
      >()
      pendings[request.id] = res
      try {
        port.postMessage(request)
        return await res
      } finally {
        delete pendings[request.id]
      }
    }
  , {
      expectedVersion
    , channel
    }
  )

  return [client, close]

  function close(): void {
    port.removeEventListener('message', handler)

    for (const [key, deferred] of Object.entries(pendings)) {
      deferred!.reject(new ClientClosed())
      delete pendings[key]
    }
  }

  function handler(event: MessageEvent): void {
    const res = event.data
    if (DelightRPC.isError(res) || DelightRPC.isBatchResponse(res)) {
      pendings[res.id]?.resolve(res)
    }
  }
}

export class ClientClosed extends CustomError {}
