import { WebSocket } from 'ws'; // Make sure you import WebSocket

let updateInterval; // Declare the interval variable
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..');


export function sendTorrentList(ws, torrents) {
    const torrentList = Object.values(torrents).map(torrent => ({
        infoHash: torrent.infoHash,
        name: torrent.name,
        progress: torrent.progress,
        downloadSpeed: torrent.downloadSpeed,
        timeRemaining: torrent.timeRemaining,
        status: torrent.status || 'idle',
        path: torrent.path
    }));

    ws.send(JSON.stringify({ type: 'TORRENT_LIST', torrents: torrentList }));
}

export function startBroadcasting(wss, torrents) {
    if (!updateInterval) { //Prevent multiple intervals
        updateInterval = setInterval(() => {
            for (const infoHash in torrents) {
                if (torrents.hasOwnProperty(infoHash)) {
                    broadcastTorrentUpdate(wss, torrents[infoHash]);
                }
            }
        }, 1000); // Every 1000 ms (1 second)
    }
}

export function stopBroadcasting(wss) {
    clearInterval(updateInterval);
    updateInterval = null;
}

export function broadcastTorrentUpdate(wss, torrent) {
    // Debugging: Check if wss and wss.clients are valid
    if (!wss) {
        console.error("Error: WebSocket server (wss) is undefined in broadcastTorrentUpdate.");
        return; // Exit if wss is undefined
    }

    if (!wss.clients) {
        console.error("Error: wss.clients is undefined in broadcastTorrentUpdate.");
        return; // Exit if wss.clients is undefined
    }

    if (!(wss.clients instanceof Set)) { // Added a check if wss.clients is a Set.
        console.error("Error: wss.clients is not an instance of Set.");
        return;
    }


    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify({
                    type: 'TORRENT_UPDATE',
                    torrent: {
                        infoHash: torrent.infoHash || torrent.infoHash, // Allow string or actual torrent.
                        name: torrent.name,
                        progress: torrent.progress,
                        downloadSpeed: torrent.downloadSpeed,
                        timeRemaining: torrent.timeRemaining,
                        status: torrent.status,
                        path: torrent.path
                    }
                }));
            } catch (error) {
                console.error("Error broadcasting torrent update:", error);
            }
        }
    });
}