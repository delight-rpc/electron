# @delight-rpc/electron
## Install
```sh
npm install --save @delight-rpc/electron
# or
yarn add @delight-rpc/electron
```

## Usage
### Main as Client, Renderer as Server
```ts
// api.d.ts
interface IAPI {
  echo(message: string): string
}

// main.js
import { app, ipcMain } from 'electron'
import { createClientInMain } from '@delight-rpc/electron'

await app.whenReady()

ipcMain.on('message-port', async event => {
  const [port] = event.ports

  port.start()
  const [client] = createClientInMain<IAPI>(port)
  await client.echo('hello world')
})

const window = new BrowserWindow({
  webPreferences: { preload: 'preload.js' }
})
window.loadFile('renderer.html')

// preload.js
import { ipcRenderer } from 'electron'

window.addEventListener('message', event => {
  if (event.data === 'message-port') {
    const [port] = event.ports
    ipcRenderer.postMessage('message-port', null, [port])
  }
})

// renderer.js
import { createServerInRenderer } from '@delight-rpc/electron'

const api: IAPI = {
  echo(message) {
    return message
  }
}

// create the MessageChannel in the renderer,
// because its script file is always executed last.
const channel = new MessageChannel()

channel.port1.start()
createServerInRenderer(api, channel.port1)
window.postMessage('message-port', '*', [channel.port2])
```

### Renderer as Client, Main as Server
```ts
// api.d.ts
interface IAPI {
  echo(message: string): string
}

// main.js
import { app, ipcMain } from 'electron'
import { createClientInMain } from '@delight-rpc/electron'

const api: IAPI = {
  echo(message) {
    return message
  }
}

await app.whenReady()

ipcMain.on('message-port', async event => {
  const [port] = event.ports

  port.start()
  createServerInMain(api, port)
})

const window = new BrowserWindow({
  webPreferences: { preload: 'preload.js' }
})
window.loadFile('renderer.html')

// preload.js
import { ipcRenderer } from 'electron'

window.addEventListener('message', event => {
  if (event.data === 'message-port') {
    const [port] = event.ports
    ipcRenderer.postMessage('message-port', null, [port])
  }
})

// renderer.js
import { createClientInRenderer } from '@delight-rpc/electron'

// create the MessageChannel in the renderer,
// because its script file is always executed last.
const channel = new MessageChannel()
window.postMessage('message-port', '*', [channel.port2])

channel.port1.start()
const [client] = createClientInRenderer(api, channel.port1)
await client.echo('hello world')
```

### Renderer as Client, Renderer as Server
```ts
// api.d.ts
interface IAPI {
  echo(message: string): string
}

// main.js
import { app, ipcMain, MessageChannelMain } from 'electron'

await app.whenReady()

const windowA = new BrowserWindow({
  webPreferences: { preload: 'preload.js' }
})
windowA.loadFile('renderer-a.html')

const windowB = new BrowserWindow({
  webPreferences: { preload: 'preload.js' }
})
windowB.loadFile('renderer-b.html')

const channel = new MessageChannelMain()
windowA.webContents.postMessage('message-port', null, [channel.port1])
windowB.webContents.postMessage('message-port', null, [channel.port2])

// preload.ts
import { ipcRenderer, contextBridge } from 'electron'
import { Deferred } from 'extra-promise'

const ready = new Deferred<void>()
contextBridge.exposeInMainWorld('ready', () => {
  ready.resolve()
})

ipcRenderer.on('message-port', event => {
  const [port] = event.ports
  await ready
  window.postMessage('message-port', '*', [port])
})

// renderer-a.js
import { createServerInRenderer } from '@delight-rpc/electron'

const api: IAPI = {
  echo(message) {
    return message
  }
}

window.addEventListener('message', async event => {
  if (event.data === 'message-port') {
    const [port] = event.ports

    port.start()
    createServerInRenderer(api, port)
  }
})

window.ready()

// renderer-b.js
import { createClientInRenderer } from '@delight-rpc/electron'

window.addEventListener('message', async event => {
  if (event.data === 'message-port') {
    const [port] = event.ports

    port.start()
    const [client] = createClientInRenderer<IAPI>(port)
    await client.echo('hello world')
  }
})

window.ready()
```

## API
### createClientInMain
```ts
function createClientInMain<IAPI extends object>(
  port: Electron.MessagePortMain
, parameterValidators?: DelightRPC.ParameterValidators<IAPI>
, expectedVersion?: `${number}.${number}.${number}`
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void]
```

### createClientInRenderer
```ts
function createClientInRenderer<IAPI extends object>(
  port: MessagePort
, parameterValidators?: DelightRPC.ParameterValidators<IAPI>
, expectedVersion?: `${number}.${number}.${number}`
): [client: DelightRPC.ClientProxy<IAPI>, close: () => void]
```

### createServerInMain
```ts
function createServerInMain<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, port: Electron.MessagePortMain
, parameterValidators?: DelightRPC.ParameterValidators<IAPI>
, version?: `${number}.${number}.${number}`
): () => void
```

### createServerInRenderer
```ts
function createServerInRenderer<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, port: MessagePort
, parameterValidators?: DelightRPC.ParameterValidators<IAPI>
, version?: `${number}.${number}.${number}`
): () => void
```
