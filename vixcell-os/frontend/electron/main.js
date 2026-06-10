const { app, BrowserWindow, ipcMain, shell, session } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const net = require('net')
const os = require('os')

// ─── Configuration ───────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
// Dev: fixed key so the vite browser preview can share the same backend.
// Production: random per-launch key locks the API to this app instance.
const INTERNAL_API_KEY = isDev
  ? 'vixcell_secret_dev_key'
  : crypto.randomBytes(32).toString('hex')
let backendPort = 8000
let backendProcess = null
let mainWindow = null

// ─── Storage Root Auto-Detection ─────────────────────────────────────────────
function getStorageRoot() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
  const configFile = path.join(appData, 'VixcellAI', 'settings.json')
  if (fs.existsSync(configFile)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'))
      if (cfg.STORAGE_ROOT) return cfg.STORAGE_ROOT
    } catch (_) {}
  }
  // Auto-detect non-system partition
  for (const drive of ['D:\\', 'E:\\']) {
    if (fs.existsSync(drive)) return path.join(drive, 'VixcellAI')
  }
  return path.join(os.homedir(), 'VixcellAI')
}

// ─── Find Available Port ──────────────────────────────────────────────────────
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
    server.on('error', () => findAvailablePort(startPort + 1).then(resolve).catch(reject))
  })
}

// ─── Start Python FastAPI Backend ─────────────────────────────────────────────
async function startBackend() {
  backendPort = await findAvailablePort(8000)
  const storageRoot = getStorageRoot()

  // Determine python executable path
  // __dirname = <repo>/frontend/electron — the backend lives two levels up
  const devBackendDir = path.join(__dirname, '..', '..', 'backend')
  let pythonExe
  if (isDev) {
    // Development: use venv
    pythonExe = path.join(devBackendDir, 'venv', 'Scripts', 'python.exe')
    if (!fs.existsSync(pythonExe)) {
      pythonExe = 'python'
    }
  } else {
    // Production: use bundled Python runtime in resources
    pythonExe = path.join(process.resourcesPath, 'backend', 'venv', 'Scripts', 'python.exe')
    if (!fs.existsSync(pythonExe)) {
      pythonExe = path.join(process.resourcesPath, 'python', 'python.exe')
    }
  }

  const runScript = isDev
    ? path.join(devBackendDir, 'run.py')
    : path.join(process.resourcesPath, 'backend', 'run.py')

  const env = {
    ...process.env,
    VIXCELL_INTERNAL_API_KEY: INTERNAL_API_KEY,
    VIXCELL_STORAGE_ROOT: storageRoot,
    VIXCELL_PORT: String(backendPort),
  }

  console.log(`[Electron] Starting backend on port ${backendPort}...`)
  console.log(`[Electron] Python: ${pythonExe}`)
  backendProcess = spawn(pythonExe, [runScript, '--port', String(backendPort)], {
    env,
    cwd: isDev ? devBackendDir : path.join(process.resourcesPath, 'backend'),
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  backendProcess.stdout.on('data', (d) => console.log('[Backend]', d.toString().trim()))
  backendProcess.stderr.on('data', (d) => console.error('[Backend ERR]', d.toString().trim()))
  backendProcess.on('error', (err) => console.error('[Electron] Backend spawn failed:', err.message))
  backendProcess.on('exit', (code) => console.log(`[Electron] Backend exited with code ${code}`))

  // Wait for backend to be ready
  await waitForBackend(backendPort)
  console.log(`[Electron] Backend is ready on port ${backendPort}`)
}

function waitForBackend(port, retries = 30, delay = 500) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = new net.Socket()
      socket.setTimeout(1000)
      socket.on('connect', () => { socket.destroy(); resolve() })
      socket.on('error', () => {
        socket.destroy()
        if (retries-- > 0) setTimeout(attempt, delay)
        else reject(new Error('Backend failed to start'))
      })
      socket.on('timeout', () => { socket.destroy() })
      socket.connect(port, '127.0.0.1')
    }
    attempt()
  })
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-config', () => ({
  apiBase: `http://127.0.0.1:${backendPort}/api/v1`,
  internalKey: INTERNAL_API_KEY,
  port: backendPort,
}))

ipcMain.handle('open-external', (_, url) => shell.openExternal(url))

ipcMain.handle('get-storage-root', () => getStorageRoot())

// ─── Create Main Window ───────────────────────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !isDev,
    },
    show: false,
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
  })

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173')
    // DevTools available via Ctrl+Shift+I — not auto-opened
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Custom window controls via IPC
  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window-close', () => mainWindow?.close())
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Voice assistant: auto-grant microphone for our local app only
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media' || permission === 'audioCapture')
  })

  try {
    await startBackend()
  } catch (err) {
    console.error('[Electron] Failed to start backend:', err)
  }
  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill('SIGTERM')
    backendProcess = null
  }
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill('SIGTERM')
  }
})
