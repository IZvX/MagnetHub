// server.mjs
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { loadSettings, generateDefaultSettings } from './server/utils/settings.mjs';
import { initializeWebTorrent } from './server/utils/webtorrent.mjs';
import { setupTorrentRoutes } from './server/routes/torrents.mjs';
import { setupLibraryRoutes } from './server/routes/library.mjs';
import { setupSettingsRoutes } from './server/routes/settings.mjs';
import { setupSubtitleRoutes } from './server/routes/subtitles.mjs';
import { loadTorrentData, saveTorrentData, torrents } from './server/utils/torrentData.mjs';
import { startBroadcasting, stopBroadcasting } from './server/utils/websocket.mjs';
import { handleWebsocketConnection } from './server/websocket/handlers.mjs';
import { setupStaticRoutes } from './server/routes/static.mjs';
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// const port = process.env.PORT || 3000;

const __prcpth = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const __finalprcpth = __prcpth + "/Keraview/"
// const port = "3000" || fs.readFile(path.join(__finalprcpth,'port.txt'));
let port = "3000"; // Default port

const portPath = path.join(__finalprcpth, 'port.txt');
if (fs.existsSync(portPath)) {
    const fileContent = fs.readFileSync(portPath, 'utf-8').trim();
    if (fileContent) {
        port = fileContent;
    }
}   

console.log("port loaded :", port);console.log("port loaded : " + port);

// Settings file
const SETTINGS_FILE = path.join(__finalprcpth, '/json/settings.json');

// Load settings or generate default
let settings = loadSettings(SETTINGS_FILE);
if (Object.keys(settings).length === 0) {
    settings = generateDefaultSettings(SETTINGS_FILE);
    console.log('Settings.json Not found, generating....');
}

// Initialize WebTorrent client with settings
let client;
try {
    client = initializeWebTorrent(settings.webTorrent);
    console.log('WebTorrent client initialized with settings:', settings.webTorrent);
} catch (error) {
    console.error('Failed to initialize WebTorrent client.', error);
    process.exit(1); // Exit the process if WebTorrent fails to initialize.
}

// WebSocket Server Setup
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', ws => {
    console.log('Client connected');
    handleWebsocketConnection(ws, torrents, client, settings, SETTINGS_FILE);
});

// --- Express Middleware ---
app.use(cors());
app.use(express.json());

// --- Route Handlers ---

// Setup static routes
setupStaticRoutes(app, __dirname);

// Setup torrent routes
setupTorrentRoutes(app, client, settings, __dirname, torrents);

// Setup library routes
setupLibraryRoutes(app, __dirname);

// Setup settings routes
setupSettingsRoutes(app, settings, SETTINGS_FILE);

// Setup subtitle routes
setupSubtitleRoutes(app, process.env.TMDB_API_KEY);

// --- Error Handling ---

// Common error handling middleware
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

let server; // Declare server outside the function

// Function to start the server
async function serverStart() {
    try {
        // Load torrent data
        await loadTorrentData(torrents, client, settings, wss);

        // Start the server
        server = app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
            startBroadcasting(wss, torrents);

            // Signal to the main process that the server is ready
            if (process.send) {
                process.send('server-ready'); // Send message to parent process
            } else {
                console.warn('Not running as a child process, cannot send "server-ready" signal.');
            }
        });
    } catch (error) {
        
        console.error("Error starting server:", error);
    }
}

// Function to stop the server
async function serverStop() {
    console.log('Shutting down server...');
    await saveTorrentData(torrents);
    stopBroadcasting(wss);

    return new Promise((resolve, reject) => {
        server.close((err) => {
            if (err) {
                console.error('Error closing server:', err);
                reject(err);
                return;
            }
            console.log('Server closed.');
            resolve();
        });
    });
}

// Handle server closing to save data when SIGINT is received
process.on('SIGINT', async () => {
    try {
        await serverStop();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the server if this is the main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    serverStart();
}

// Export the server start and stop functions
export { serverStart, serverStop };
