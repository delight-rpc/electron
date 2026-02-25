import * as DelightRPC from 'delight-rpc'
import { Deferred } from 'extra-promise'
import Electron from 'electron'
import { CustomError } from '@blackglory/errors'
import { IResponse, IError, IBatchResponse } from '@delight-rpc/protocol'
import { raceAbortSignals, timeoutSignal, withAbortSignal } from 'extra-abort'
import { isntUndefined } from '@blackglory/prelude'

export function createClientInMain<IAPI extends object>(
  port: Electron.MessagePortMain
, { parameterValidators, expectedVersion, channel, timeout }: {
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
  , expectedVersion?: string
  , channel?: string
  , timeout?: number
  } = {}
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void] {
  const pendings: Map<string, Deferred<IResponse<unknown>>> = new Map()

  port.addListener('message', handler)

  const client = DelightRPC.createClient<IAPI>(
    async function send(request, signal) {
      const res = new Deferred<IResponse<unknown>>()
      pendings.set(request.id, res)
      try {
        port.postMessage(request)

        const mergedSignal = raceAbortSignals([
          isntUndefined(timeout) && timeoutSignal(timeout)
        , signal
        ])
        mergedSignal.addEventListener('abort', () => {
          const abort = DelightRPC.createAbort(request.id, channel)
          port.postMessage(abort)
        })

        return await withAbortSignal(mergedSignal, () => res)
      } finally {
        pendings.delete(request.id)
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

    for (const [key, deferred] of pendings.entries()) {
      deferred.reject(new ClientClosed())
      pendings.delete(key)
    }
  }

  function handler(event: Electron.MessageEvent): void {
    const res = event.data
    if (DelightRPC.isResult(res) || DelightRPC.isError(res)) {
      pendings.get(res.id)?.resolve(res)
    }
  }
}

export function createClientInRenderer<IAPI extends object>(
  port: MessagePort
, { parameterValidators, expectedVersion, channel, timeout }: {
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
    expectedVersion?: string
    channel?: string
    timeout?: number
  } = {}
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void] {
  const pendings: Map<
    string
  , Deferred<IResponse<unknown>>
  > = new Map()

  port.addEventListener('message', handler)

  const client = DelightRPC.createClient<IAPI>(
    async function send(request) {
      const res = new Deferred<IResponse<unknown>>()
      pendings.set(request.id, res)
      try {
        port.postMessage(request)

        const mergedSignal = raceAbortSignals([
          isntUndefined(timeout) && timeoutSignal(timeout)
        ])
        mergedSignal.addEventListener('abort', () => {
          const abort = DelightRPC.createAbort(request.id, channel)
          port.postMessage(abort)
        })

        return await withAbortSignal(mergedSignal, () => res)
      } finally {
        pendings.delete(request.id)
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

    for (const [key, deferred] of pendings.entries()) {
      deferred.reject(new ClientClosed())
      pendings.delete(key)
    }
  }

  function handler(event: MessageEvent): void {
    const res = event.data
    if (DelightRPC.isResult(res) || DelightRPC.isError(res)) {
      pendings.get(res.id)?.resolve(res)
    }
  }
}

export function createBatchClientInMain<DataType>(
  port: Electron.MessagePortMain
, { expectedVersion, channel, timeout }: {
    expectedVersion?: string
    channel?: string
    timeout?: number
  } = {}
): [client: DelightRPC.BatchClient<DataType>, close: () => void] {
  const pendings: Map<
    string
  , Deferred<IError | IBatchResponse<unknown>>
  > = new Map()

  port.addListener('message', handler)

  const client = new DelightRPC.BatchClient(
    async function send(request) {
      const res = new Deferred<
      | IError
      | IBatchResponse<unknown>
      >()
      pendings.set(request.id, res)
      try {
        port.postMessage(request)

        const mergedSignal = raceAbortSignals([
          isntUndefined(timeout) && timeoutSignal(timeout)
        ])
        mergedSignal.addEventListener('abort', () => {
          const abort = DelightRPC.createAbort(request.id, channel)
          port.postMessage(abort)
        })

        return await withAbortSignal(mergedSignal, () => res)
      } finally {
        pendings.delete(request.id)
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

    for (const [key, deferred] of pendings.entries()) {
      deferred.reject(new ClientClosed())
      pendings.delete(key)
    }
  }

  function handler(event: Electron.MessageEvent): void {
    const res = event.data
    if (DelightRPC.isError(res) || DelightRPC.isBatchResponse(res)) {
      pendings.get(res.id)?.resolve(res)
    }
  }
}

export function createBatchClientInRenderer<DataType>(
  port: MessagePort
, { expectedVersion, channel, timeout }: {
    expectedVersion?: string
    channel?: string
    timeout?: number
  } = {}
): [client: DelightRPC.BatchClient<DataType>, close: () => void] {
  const pendings: Map<
    string
  , Deferred<IError | IBatchResponse<unknown>>
  > = new Map()

  port.addEventListener('message', handler)

  const client = new DelightRPC.BatchClient(
    async function send(request) {
      const res = new Deferred<
      | IError
      | IBatchResponse<unknown>
      >()
      pendings.set(request.id, res)
      try {
        port.postMessage(request)

        const mergedSignal = raceAbortSignals([
          isntUndefined(timeout) && timeoutSignal(timeout)
        ])
        mergedSignal.addEventListener('abort', () => {
          const abort = DelightRPC.createAbort(request.id, channel)
          port.postMessage(abort)
        })

        return await withAbortSignal(mergedSignal, () => res)
      } finally {
        pendings.delete(request.id)
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

    for (const [key, deferred] of pendings.entries()) {
      deferred.reject(new ClientClosed())
      pendings.delete(key)
    }
  }

  function handler(event: MessageEvent): void {
    const res = event.data
    if (DelightRPC.isError(res) || DelightRPC.isBatchResponse(res)) {
      pendings.get(res.id)?.resolve(res)
    }
  }
}

export class ClientClosed extends CustomError {}
