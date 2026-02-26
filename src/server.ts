import * as DelightRPC from 'delight-rpc'
import Electron from 'electron'
import { isntNull } from '@blackglory/prelude'
import { HashMap } from '@blackglory/structures'
import { SyncDestructor } from 'extra-defer'

export function createServerInMain<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, port: Electron.MessagePortMain
, { parameterValidators, version, channel, ownPropsOnly }: {
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
    version?: `${number}.${number}.${number}`
    channel?: string | RegExp | typeof DelightRPC.AnyChannel
    ownPropsOnly?: boolean
  } = {}
): () => void {
  const destructor = new SyncDestructor()

  const channelIdToController: HashMap<
    {
      channel?: string
    , id: string
    }
  , AbortController
  > = new HashMap(({ channel, id }) => JSON.stringify([channel, id]))
  destructor.defer(abortAllPendings)

  port.addListener('message', receive)
  destructor.defer(() => port.removeListener('message', receive))

  port.addListener('close', close)
  destructor.defer(() => port.removeListener('close', close))

  return close

  function close(): void {
    destructor.execute()
  }

  function abortAllPendings(): void {
    for (const controller of channelIdToController.values()) {
      controller.abort()
    }

    channelIdToController.clear()
  }

  async function receive(event: Electron.MessageEvent): Promise<void> {
    const message = event.data
    if (DelightRPC.isRequest(message) || DelightRPC.isBatchRequest(message)) {
      const destructor = new SyncDestructor()

      const controller = new AbortController()
      channelIdToController.set(message, controller)
      destructor.defer(() => channelIdToController.delete(message))

      try {
        const result = await DelightRPC.createResponse(
          api
        , message
        , {
            parameterValidators
          , version
          , channel
          , ownPropsOnly
          , signal: controller.signal
          }
        )

        if (isntNull(result)) {
          port.postMessage(result)
        }
      } finally {
        destructor.execute()
      }
    } else if (DelightRPC.isAbort(message)) {
      if (DelightRPC.matchChannel(message, channel)) {
        channelIdToController.get(message)?.abort()
        channelIdToController.delete(message)
      }
    }
  }
}

export function createServerInRenderer<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, port: MessagePort
, { parameterValidators, version, channel, ownPropsOnly }: {
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
    version?: `${number}.${number}.${number}`
    channel?: string | RegExp | typeof DelightRPC.AnyChannel
    ownPropsOnly?: boolean
  } = {}
): () => void {
  const destructor = new SyncDestructor()

  const channelIdToController: HashMap<
    {
      channel?: string
    , id: string
    }
  , AbortController
  > = new HashMap(({ channel, id }) => JSON.stringify([channel, id]))
  destructor.defer(abortAllPendings)

  port.addEventListener('message', receive)
  destructor.defer(() => port.removeEventListener('message', receive))

  return close

  function close(): void {
    destructor.execute()
  }

  function abortAllPendings(): void {
    for (const controller of channelIdToController.values()) {
      controller.abort()
    }

    channelIdToController.clear()
  }

  async function receive(event: MessageEvent): Promise<void> {
    const message = event.data
    if (DelightRPC.isRequest(message) || DelightRPC.isBatchRequest(message)) {
      const destructor = new SyncDestructor()

      const controller = new AbortController()
      channelIdToController.set(message, controller)
      destructor.defer(() => channelIdToController.delete(message))

      try {
        const result = await DelightRPC.createResponse(
          api
        , message
        , {
            parameterValidators
          , version
          , channel
          , ownPropsOnly
          , signal: controller.signal
          }
        )

        if (isntNull(result)) {
          port.postMessage(result)
        }
      } finally {
        destructor.execute()
      }
    } else if (DelightRPC.isAbort(message)) {
      if (DelightRPC.matchChannel(message, channel)) {
        channelIdToController.get(message)?.abort()
        channelIdToController.delete(message)
      }
    }
  }
}
