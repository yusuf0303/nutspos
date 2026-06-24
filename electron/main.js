const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

// Log fayli yozuvchi
function getLogPath() {
  return path.join(app.getPath('userData'), 'app.log');
}
function log(...args) {
  const msg = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  process.stdout.write(msg);
  try { fs.appendFileSync(getLogPath(), msg); } catch(e) {}
}

let mainWindow;
let nextProcess = null;
const isDev = !app.isPackaged;

// 1. Find a free port starting from a default port
function findFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.on('error', () => {
      resolve(findFreePort(startPort + 1));
    });
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

// 2. Setup SQLite Database in User Data directory
function setupDatabase() {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'dev.db');
  const appPath = app.getAppPath();
  const templateDbPath = path.join(appPath, 'prisma', 'dev.db');

  console.log('Database path:', dbPath);
  console.log('Template database path:', templateDbPath);

  // If the db file does not exist in the userData folder, copy the template dev.db
  if (!fs.existsSync(dbPath)) {
    if (fs.existsSync(templateDbPath)) {
      try {
        fs.copyFileSync(templateDbPath, dbPath);
        console.log('Database template successfully copied to:', dbPath);
      } catch (err) {
        console.error('Failed to copy database template:', err);
      }
    } else {
      console.warn('Database template not found at:', templateDbPath);
    }
  }

  // Set the environment variable for Prisma
  // Standard SQLite URL format: file:C:/Users/name/AppData/...
  const prismaDbUrl = `file:${dbPath.replace(/\\/g, '/')}`;
  process.env.DATABASE_URL = prismaDbUrl;
  console.log('DATABASE_URL set to:', process.env.DATABASE_URL);
}

// 3. Wait for the Next.js server to be active on the given port
function waitForServer(port, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Next.js server startup timed out.'));
        return;
      }

      const req = http.get(`http://127.0.0.1:${port}/login`, (res) => {
        // Any response code means the server is running and accepting requests
        clearInterval(interval);
        resolve();
      });
      req.on('error', () => {
        // Keep trying, server is not up yet
      });
      req.end();
    }, 200);
  });
}

// 4. Start Next.js server as a child process
function startNextServer(port) {
  return new Promise((resolve, reject) => {
    if (isDev) {
      log('Dev mode: Next.js dev server is assumed to be running on port 3000.');
      resolve();
      return;
    }

    const appPath = app.getAppPath();
    const serverScript = path.join(appPath, '.next', 'standalone', 'server.js');

    log('Server script path:', serverScript);
    log('Server script exists:', fs.existsSync(serverScript));
    log('DATABASE_URL:', process.env.DATABASE_URL);

    // Standalone node.js o'rniga Electron ni o'zidan Node sifatida foydalanamiz
    const nodeBin = process.execPath;

    // Setup environments
    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1', // Electron ni Node.js backend sifatida ishlatish uchun
      PORT: port.toString(),
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL, // main.js setupDatabase() tomonidan o'rnatilgan
      AUTH_SECRET: process.env.AUTH_SECRET || 'my-super-secret-auth-key-12345',
      AUTH_URL: `http://127.0.0.1:${port}/api/auth`, // next-auth uchun to'g'ri URL
      NEXTAUTH_URL: `http://127.0.0.1:${port}`, // next-auth v4 va server actions uchun
    };

    log('Spawning Next.js with node:', nodeBin);
    // process.execPath (Electron) emas, balki oddiy node binary ishlatamiz
    nextProcess = spawn(nodeBin, [serverScript], {
      env,
      cwd: path.join(appPath, '.next', 'standalone'),
      shell: false,
    });

    nextProcess.stdout.on('data', (data) => {
      log(`[Next.js]: ${data.toString().trim()}`);
    });

    nextProcess.stderr.on('data', (data) => {
      log(`[Next.js ERR]: ${data.toString().trim()}`);
    });

    nextProcess.on('close', (code) => {
      log(`Next.js process exited with code ${code}`);
    });

    nextProcess.on('error', (err) => {
      log('Failed to start Next.js:', err.message);
      reject(err);
    });

    // Wait for Next.js to start serving pages
    waitForServer(port)
      .then(resolve)
      .catch((err) => {
        if (nextProcess) {
          nextProcess.kill();
        }
        reject(err);
      });
  });
}

// 5. Create Electron Window
function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Nuts POS & Warehouse',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Hide the default electron menu bar
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.session.clearCache().then(() => console.log('Cache cleared'));

  const url = isDev ? 'http://localhost:3000' : `http://127.0.0.1:${port}`;
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 6. Electron Application Lifecycle
app.whenReady().then(async () => {
  setupDatabase();
  log('App ready. userData:', app.getPath('userData'));
  log('App path:', app.getAppPath());
  const port = isDev ? 3000 : await findFreePort(3000);
  log('Using port:', port);

  try {
    await startNextServer(port);
    log('Next.js server started successfully on port', port);
    createWindow(port);
  } catch (error) {
    log('ERROR starting server:', error.message);
    dialog.showErrorBox(
      'Serverni ishga tushirib bo\'lmadi',
      `Xatolik: ${error.message}\n\nLog fayl: ${getLogPath()}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (nextProcess) {
    console.log('Killing Next.js child process...');
    nextProcess.kill();
  }
});
