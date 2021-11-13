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
const window = new BrowserWindow({
  webPreferences: { preload: 'preload.js' }
})
window.loadFile('renderer.html')

ipcMain.on('message-port', async event => {
  const [port] = event.ports
  const client = createClientInMain<IAPI>(port)
  await client.echo('hello world')
})

// preload.js
import { ipcRenderer } from 'electron'

const channel = new MessageChannel()
channel.port1.start()
channel.port2.start()
window.postMessage('message-port', '*', [channel.port1])
ipcRenderer.postMessage('message-port', null, [channel.port2])

// renderer.js
import { createServerInRenderer } from '@delight-rpc/electron'

const api: IAPI = {
  echo(message) {
    return message
  }
}

window.addEventListener('message', event => {
  if (event.data === 'message-port') {
    const [port] = event.ports
    createServerInRenderer(api, port)
  }
})
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

await app.whenReady()
const window = new BrowserWindow({
  webPreferences: { preload: 'preload.js' }
})
window.loadFile('renderer.html')

const api: IAPI = {
  echo(message) {
    return message
  }
}

ipcMain.on('message-port', async event => {
  const [port] = event.ports
  createServerInMain(api, port)
})

// preload.js
import { ipcRenderer } from 'electron'

const channel = new MessageChannel()
channel.port1.start()
channel.port2.start()
window.postMessage('message-port', '*', [channel.port1])
ipcRenderer.postMessage('message-port', null, [channel.port2])

// renderer.js
import { createClientInRenderer } from '@delight-rpc/electron'

window.addEventListener('message', async event => {
  if (event.data === 'message-port') {
    const [port] = event.ports
    createClientInRenderer<IAPI>(port)
    await client.echo('hello world')
  }
})
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
import { ipcRenderer } from 'electron'

ipcRenderer.on('message-port', event => {
  const [port] = event.ports
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
    createServerInRenderer(api, port)
  }
})

// renderer-b.js
import { createClientInRenderer } from '@delight-rpc/electron'

window.addEventListener('message', async event => {
  if (event.data === 'message-port') {
    const [port] = event.ports
    createClientInRenderer<IAPI>(port)
    await client.echo('hello world')
  }
})
```

## API
### createClientInMain
```ts
function createClientInMain<IAPI extends object>(
  port: Electron.MessagePortMain
): DelightRPC.RequestProxy<IAPI>
```

### createClientInRenderer
```ts
function createClientInRenderer<IAPI extends object>(
  port: MessagePort
): DelightRPC.RequestProxy<IAPI>
```

### createServerInMain
```ts
function createServerInMain<IAPI extends object>(
  api: IAPI
, port: Electron.MessagePortMain
): () => void
```

### createServerInRenderer
```ts
function createServerInRenderer<IAPI extends object>(
  api: IAPI
, port: MessagePort
): () => void
```
