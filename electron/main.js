const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

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
      console.log('Dev mode: Next.js dev server is assumed to be running on port 3000.');
      resolve();
      return;
    }

    const appPath = app.getAppPath();
    const serverScript = path.join(appPath, '.next', 'standalone', 'server.js');

    // Setup environments
    const env = {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: 'production',
      AUTH_SECRET: process.env.AUTH_SECRET || 'my-super-secret-auth-key-12345',
      AUTH_URL: `http://127.0.0.1:${port}`,
      NEXTAUTH_URL: `http://127.0.0.1:${port}`,
      ELECTRON_RUN_AS_NODE: '1',
    };

    console.log('Spawning Next.js process using Electron internal Node:', serverScript);
    nextProcess = spawn(process.execPath, [serverScript], { env, cwd: appPath });

    nextProcess.stdout.on('data', (data) => {
      console.log(`[Next.js Server]: ${data.toString().trim()}`);
    });

    nextProcess.stderr.on('data', (data) => {
      console.error(`[Next.js Server Error]: ${data.toString().trim()}`);
    });

    nextProcess.on('close', (code) => {
      console.log(`Next.js process exited with code ${code}`);
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

  const url = isDev ? 'http://localhost:3000' : `http://127.0.0.1:${port}`;
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 6. Electron Application Lifecycle
app.whenReady().then(async () => {
  setupDatabase();
  const port = isDev ? 3000 : await findFreePort(3000);

  try {
    await startNextServer(port);
    createWindow(port);
  } catch (error) {
    dialog.showErrorBox(
      'Serverni ishga tushirib bo\'lmadi',
      `Tizim serverini ishga tushirishda xatolik yuz berdi: ${error.message}`
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
