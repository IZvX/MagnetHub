// utils/torrentData.js
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// Torrent data file
const __prcpth = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const __finalprcpth = __prcpth + "/Keraview/"

const TORRENT_DATA_FILE = path.join(__finalprcpth, '/tmp/torrent_data.json');

// Centralized torrents object
export let torrents = {};

// Load torrent data from file on startup
export function loadTorrentData(torrents, client, settings, wss) {
    try {
        const data = fs.readFileSync(TORRENT_DATA_FILE, 'utf-8');
        torrents = JSON.parse(data);
        console.log('Torrent data loaded from file.');

        // Initialize existing torrents from data file
        for (const infoHash in torrents) {
            const torrentData = torrents[infoHash];
            if (torrentData.magnetURI) {
                console.log(`Initializing torrent from saved data: ${torrentData.name}`);
                addTorrent(torrentData.magnetURI, null, torrentData.path);
            }
        }

        // Broadcast initial torrent list after loading
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                sendTorrentList(client);
            }
        });
    } catch (error) {
        console.warn('Failed to load torrent data from file. Starting with empty state.', error);
        torrents = {};
    }
}

// Save torrent data to file
export function saveTorrentData(torrents) {
    try {
        // Extract only the magnetURI and name from torrent data
        const torrentDataToSave = Object.entries(torrents).reduce((acc, [key, torrent]) => {
            acc[key] = {
                name: torrent.name,
                magnetURI: torrent.magnetURI,
            };
            return acc;
        }, {});

        fs.writeFileSync(TORRENT_DATA_FILE, JSON.stringify(torrentDataToSave, null, 2), 'utf-8');
        // console.log('Torrent data saved to file.');
    } catch (error) {
        console.error('Failed to save torrent data to file.', error);
    }
}