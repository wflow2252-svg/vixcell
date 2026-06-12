const { app, BrowserWindow, ipcMain, shell, session, globalShortcut, screen, Tray, Menu, nativeImage } = require('electron')
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
let barWindow = null
let meetingWindow = null
let tray = null
let isQuitting = false  // true only when the user really exits (tray → Quit)

function getIconPath() {
  const candidates = [
    path.join(__dirname, '..', 'public', 'icon.ico'),       // dev
    path.join(process.resourcesPath || '', 'icon.ico'),      // packaged (extraResources)
    path.join(__dirname, '..', 'dist', 'icon.ico'),
  ]
  return candidates.find(p => { try { return fs.existsSync(p) } catch { return false } }) || candidates[0]
}

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

// ─── Floating Assistant Bar ───────────────────────────────────────────────────
// A slim always-on-top voice bar pinned to the top of the screen, available
// over every app on the machine (toggled with Ctrl+Shift+Space).
const BAR_WIDTH = 480
const BAR_HEIGHT = 72
const BAR_EXPANDED = 220

function createBarWindow() {
  if (barWindow && !barWindow.isDestroyed()) return barWindow
  const { width: screenW } = screen.getPrimaryDisplay().workAreaSize
  barWindow = new BrowserWindow({
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    x: Math.round((screenW - BAR_WIDTH) / 2),
    y: 8,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !isDev,
    },
  })
  // Above fullscreen apps too
  barWindow.setAlwaysOnTop(true, 'screen-saver')
  barWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (isDev) barWindow.loadURL('http://localhost:5173/#/bar')
  else barWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), { hash: '/bar' })

  barWindow.on('closed', () => { barWindow = null })
  return barWindow
}

function toggleBar(forceShow = false) {
  const win = createBarWindow()
  if (win.isVisible() && !forceShow) {
    win.hide()
  } else {
    win.show()
    win.focus()
  }
  return win.isVisible()
}

ipcMain.handle('bar-toggle', () => toggleBar())
ipcMain.on('bar-hide', () => { if (barWindow && !barWindow.isDestroyed()) barWindow.hide() })
ipcMain.on('bar-set-height', (_e, expanded) => {
  if (!barWindow || barWindow.isDestroyed()) return
  const b = barWindow.getBounds()
  barWindow.setBounds({ ...b, height: expanded ? BAR_EXPANDED : BAR_HEIGHT })
})

// Bar → main app navigation (bar lives in its own window)
ipcMain.on('bar-navigate', (_e, route) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('assistant-navigate', route)
  }
})

// ─── Meeting Window ───────────────────────────────────────────────────────────
// Opens the vixcell.com meeting room as a dedicated desktop window (admin),
// with camera/microphone allowed — no browser needed.
ipcMain.handle('open-meeting', (_e, url) => {
  if (meetingWindow && !meetingWindow.isDestroyed()) {
    meetingWindow.focus()
    meetingWindow.loadURL(url)
    return true
  }
  meetingWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    backgroundColor: '#0f0f1a',
    autoHideMenuBar: true,
    title: 'Vixcell Meeting',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:meeting', // own session keeps site login/devices
    },
  })
  // Camera + mic for the meeting session only
  meetingWindow.webContents.session.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(['media', 'audioCapture', 'videoCapture', 'display-capture'].includes(permission))
  })
  meetingWindow.loadURL(url)
  meetingWindow.on('closed', () => { meetingWindow = null })
  return true
})

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
  })

  // Surface load failures instead of hanging invisibly
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) =>
    console.error(`[Electron] Page failed to load: ${code} ${desc} ${url}`))
  mainWindow.webContents.on('render-process-gone', (_e, details) =>
    console.error('[Electron] Renderer gone:', details.reason))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Closing the main app takes the floating bar and meeting window with it —
  // otherwise the hidden bar keeps the process alive forever
  mainWindow.on('closed', () => {
    mainWindow = null
    if (barWindow && !barWindow.isDestroyed()) barWindow.destroy()
    if (meetingWindow && !meetingWindow.isDestroyed()) meetingWindow.destroy()
  })

  // Failsafe: never leave the user with an invisible app if ready-to-show
  // is delayed or skipped (observed with packaged file:// loads)
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      console.warn('[Electron] ready-to-show timeout — forcing window visible')
      mainWindow.show()
    }
  }, 4000)

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173')
    // DevTools available via Ctrl+Shift+I — not auto-opened
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // Closing the main window hides it to the tray instead of quitting —
  // the assistant (bar + backend + global shortcut) keeps running.
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow.hide()
      return false
    }
  })

  // Custom window controls via IPC
  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window-close', () => mainWindow?.hide()) // X = hide to tray
}

// ─── System Tray (keeps the assistant alive in the background) ────────────────
function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) { createWindow(); return }
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function buildTrayMenu() {
  const openAtLogin = app.getLoginItemSettings().openAtLogin
  return Menu.buildFromTemplate([
    { label: 'افتح Vixcell', click: showMainWindow },
    { label: 'إظهار/إخفاء الشريط', click: () => toggleBar() },
    { type: 'separator' },
    {
      label: 'يفتح مع تشغيل الويندوز',
      type: 'checkbox',
      checked: openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked, openAsHidden: false })
        if (tray) tray.setContextMenu(buildTrayMenu())
      },
    },
    { type: 'separator' },
    { label: 'خروج تام', click: () => { isQuitting = true; app.quit() } },
  ])
}

function createTray() {
  if (tray) return tray
  let img = nativeImage.createFromPath(getIconPath())
  if (!img.isEmpty()) img = img.resize({ width: 16, height: 16 })
  tray = new Tray(img.isEmpty() ? getIconPath() : img)
  tray.setToolTip('Vixcell AI OS — شغّال في الخلفية')
  tray.setContextMenu(buildTrayMenu())
  // Left-click toggles the main window
  tray.on('click', () => {
    if (mainWindow && mainWindow.isVisible() && !mainWindow.isMinimized()) mainWindow.hide()
    else showMainWindow()
  })
  return tray
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
// Single instance: a second launch focuses the existing window instead of
// piling up hidden background processes
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })
}

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

  // Live in the system tray and start with Windows — the assistant is
  // meant to stay open and available, not close when you hit X.
  createTray()
  if (app.getLoginItemSettings().openAtLogin !== true) {
    app.setLoginItemSettings({ openAtLogin: true, openAsHidden: false })
  }

  // Floating voice bar over the whole desktop, ready from launch
  createBarWindow()
  toggleBar(true)

  // Global push-to-talk: works from ANY app — shows the bar and toggles the mic
  globalShortcut.register('Control+Shift+Space', () => {
    const win = createBarWindow()
    win.show()
    win.focus()
    win.webContents.send('bar-ptt')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else showMainWindow()
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())

// With the tray, the app intentionally keeps running when every window is
// hidden/closed. Only actually exit when the user chose Quit.
app.on('window-all-closed', () => {
  if (isQuitting && process.platform !== 'darwin') {
    if (backendProcess) { backendProcess.kill('SIGTERM'); backendProcess = null }
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  if (backendProcess) backendProcess.kill('SIGTERM')
})
