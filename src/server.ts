import * as DelightRPC from 'delight-rpc'
import Electron from 'electron'
import { isntNull } from '@blackglory/prelude'
import { HashMap } from '@blackglory/structures'

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
  const channelIdToController: HashMap<
    {
      channel?: string
    , id: string
    }
  , AbortController
  > = new HashMap(({ channel, id }) => JSON.stringify([channel, id]))

  port.addListener('message', handler)
  port.addListener('close', () => {
    for (const controller of channelIdToController.values()) {
      controller.abort()
    }

    channelIdToController.clear()
  })
  return () => port.removeListener('message', handler)

  async function handler(event: Electron.MessageEvent): Promise<void> {
    const message = event.data
    if (DelightRPC.isRequest(message) || DelightRPC.isBatchRequest(message)) {
      const controller = new AbortController()
      channelIdToController.set(message, controller)

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
        channelIdToController.delete(message)
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
  const channelIdToController: HashMap<
    {
      channel?: string
    , id: string
    }
  , AbortController
  > = new HashMap(({ channel, id }) => JSON.stringify([channel, id]))

  port.addEventListener('message', handler)
  return () => port.removeEventListener('message', handler)

  async function handler(event: MessageEvent): Promise<void> {
    const message = event.data
    if (DelightRPC.isRequest(message) || DelightRPC.isBatchRequest(message)) {
      const controller = new AbortController()
      channelIdToController.set(message, controller)

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
        channelIdToController.delete(message)
      }
    } else if (DelightRPC.isAbort(message)) {
      if (DelightRPC.matchChannel(message, channel)) {
        channelIdToController.get(message)?.abort()
        channelIdToController.delete(message)
      }
    }
  }
}
