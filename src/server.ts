import * as DelightRPC from 'delight-rpc'
import Electron from 'electron'
import { isntNull } from '@blackglory/prelude'

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
  port.addListener('message', handler)
  return () => port.removeListener('message', handler)

  async function handler(event: Electron.MessageEvent): Promise<void> {
    const req = event.data
    if (DelightRPC.isRequest(req) || DelightRPC.isBatchRequest(req)) {
      const result = await DelightRPC.createResponse(
        api
      , req
      , {
          parameterValidators
        , version
        , channel
        , ownPropsOnly
        }
      )

      if (isntNull(result)) {
        port.postMessage(result)
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
  port.addEventListener('message', handler)
  return () => port.removeEventListener('message', handler)

  async function handler(event: MessageEvent): Promise<void> {
    const req = event.data
    if (DelightRPC.isRequest(req) || DelightRPC.isBatchRequest(req)) {
      const result = await DelightRPC.createResponse(
        api
      , req
      , {
          parameterValidators
        , version
        , channel
        , ownPropsOnly
        }
      )

      if (isntNull(result)) {
        port.postMessage(result)
      }
    }
  }
}
