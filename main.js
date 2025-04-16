// main.js
import { app, BrowserWindow, ipcMain, screen, dialog } from 'electron';
import { fork } from 'child_process';  // Import fork
import path from 'path';
// const fs = require('fs');
import fs from 'fs';
import { fileURLToPath } from 'url';

let mainWindow;
let splashWindow;
let errorWindow;  // New error window reference
let serverProcess = null; // Store the server process reference

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const version = "0.2.3";
// const path = require('path');
// import { version } from "./package.json";
const __prcpth = process.env.APPDATA || (process.platform === 'darwin'
    ? path.join(process.env.HOME, 'Library/Preferences')
    : path.join(process.env.HOME, '.local/share'));
  
  const __finalprcpth = path.join(__prcpth, 'Keraview');
  
  // Subdirectories to create
  const subdirs = ['tmp', 'json'];
  
  // Files to create with default content
  const filesToCreate = [
      { path: path.join(__finalprcpth, 'tmp', 'torrent_data.json'), content: '{}' },
    { path: path.join(__finalprcpth, 'tmp', 'webtorrent_settings.json'), content: '{}' },
    // { path: path.join(__finalprcpth, 'json', 'library.json'), content: '{}' },
    // { path: path.join(__finalprcpth, 'json', 'settings.json'), content: '{}' },
    { path: path.join(__finalprcpth, 'port.txt'), content: "3000" },
    { path: path.join(__finalprcpth, 'appver.txt'), content: version },
];
  
let port = "3000"; // Default port

const portPath = path.join(__finalprcpth, 'port.txt');
if (fs.existsSync(portPath)) {
    const fileContent = fs.readFileSync(portPath, 'utf-8').trim();
    if (fileContent) {
        port = fileContent;
    }
}

console.log("port loaded :", port);
// Ensure main directory exists
  if (!fs.existsSync(__finalprcpth)) {
    fs.mkdirSync(__finalprcpth, { recursive: true });
  }
  
  // Ensure subdirectories exist
  for (const dir of subdirs) {
    const dirPath = path.join(__finalprcpth, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  // Create files if they don't exist
  for (const file of filesToCreate) {
    if (!fs.existsSync(file.path)) {
      fs.writeFileSync(file.path, file.content, 'utf-8');
    }
  }
  

const createSplashWindow = () => {
    splashWindow = new BrowserWindow({
        width: 512,
        height: 256,
        frame: false,
        resizable: false,
        transparent: true,
        backgroundColor: '#00FFFFFF',
        alwaysOnTop: true,
        center: true,
        show: false,
        icon: "bin/icons/icon.ico"
    });

    splashWindow.loadFile('splash.html');

    splashWindow.once('ready-to-show', () => {
        splashWindow.show();

        // Start the server in a separate thread
        const serverPath = path.join(__dirname, 'server.mjs');
        serverProcess = fork(serverPath, [], { execArgv: ['--es-module-specifier-resolution=node'] });  // Fork the server process

        serverProcess.on('message', (message) => {
            if (message === 'server-ready') {
                createMainWindow(); // Create main window when server is ready
            }
        });

        // let errMsg;

        serverProcess.on('uncaughtException', (err) => {
            console.error('Server process error:', err);
            // showErrorWindow(err.stack || err.message || String(err));
            // errMsg = err.stack || err.message || String(err);
        });

        serverProcess.on('exit', (code, signal) => {
            console.log(`Server process exited with code ${code}, signal ${signal}`);

            if (code !== 0) {
                showErrorWindow(
                    `Server exited with code ${code}${signal ? `, signal: ${signal}` : ''} <br>
                Common Trouble Shooting Methods :<br>
                    1.Press Windows + R and type in %appdata%<br>
                    2.Navigate to the Keraview folder<br>
                    3.Find port.txt file<br>
                    4.Open it and change the port to something else ( 4 digits )<br>
                If you're still having issues please run the app via CMD by opening cmd and setting the directory via chdir to the app's folder and typing Keraview.exe and examine the error message or contact me and I'll help you fix it.<br>
                Contact : khalilbadis6@gmail.com<br>
                Or via discord : khalil_yfz<br>`
                );
            }

            if (splashWindow) {
                splashWindow.close();
                splashWindow = null;
            }
        });
    });
};

const createMainWindow = () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize

    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        icon: "bin/icons/icon.ico",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        titleBarStyle: 'hiddenInset',
        show: false,
        fullscreenable: true
    });

    mainWindow.removeMenu()

    mainWindow.maximize();
    mainWindow.loadURL(`http://localhost:${port}/index.html`);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
    });
};

const createErrorWindow = () => {
    // Create the error window
    errorWindow = new BrowserWindow({
        width: 512,
        height: 256,
        frame: false,
        resizable: false,
        transparent: true,
        // backgroundColor: '#FF0000',  // Red background for error
        alwaysOnTop: false,
        center: true,
        show: false,
        icon: "bin/icons/icon.ico",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    errorWindow.loadFile('error.html');  // Load error page

    errorWindow.once('ready-to-show', () => {
        errorWindow.show();
        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
    });
};

const showErrorWindow = (errorMessage = 'An unknown error occurred.') => {
    if (!errorWindow) {
        createErrorWindow();

        errorWindow.once('ready-to-show', () => {
            errorWindow.webContents.send('show-error', errorMessage);
            errorWindow.show();
        });
    } else {
        errorWindow.webContents.send('show-error', errorMessage);
    }

    if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
    }
};

app.whenReady().then(() => {
    createSplashWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    if (serverProcess) {
        serverProcess.kill(); // Kill the server process on app close
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createSplashWindow();
    }
});

ipcMain.handle('select-directory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (canceled) {
        return null; // User cancelled
    } else {
        return filePaths[0]; // Return the full path of the selected directory
    }
});

ipcMain.on("download", (event, info) => {
    info.properties.onProgress = status => window.webContents.send("download progress", status);
    download(BrowserWindow.getFocusedWindow(), info.url, info.properties)
        .then(dl => window.webContents.send("download complete", dl.getSavePath()));
});


ipcMain.on('close-error-window', () => {
    app.quit();
});
