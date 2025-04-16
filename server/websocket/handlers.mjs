// websocket/handlers.js
import path from 'path';
import { sendTorrentList, broadcastTorrentUpdate } from '../utils/websocket.mjs';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..');



function getCommandLine() {
    switch (process.platform) {
        case 'darwin': return 'open';
        case 'win32': return 'start';
        case 'win64': return 'start';
        default: return 'xdg-open';
    }
}

function dirgetCommandLine() {
    switch (process.platform) {
        case 'darwin': return 'open';
        case 'win32': return 'explorer';
        case 'win64': return 'explorer';
        default: return 'xdg-open';
    }
}

export function handleWebsocketConnection(ws, torrents, client, settings, SETTINGS_FILE) {
    sendTorrentList(ws, torrents);

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            console.log("Received message from client:", data);

            switch (data.type) {
                case 'ADD_TORRENT':
                    addTorrent(data.torrentId, ws, torrents, client, settings);
                    break;
                case 'PAUSE_TORRENT':
                    pauseTorrent(data.torrentId, ws, torrents, client);
                    break;
                case 'RESUME_TORRENT':
                    resumeTorrent(data.torrentId, ws, torrents, client, settings);
                    break;
                case 'STOP_TORRENT':
                    stopTorrent(data.torrentId, ws, torrents, client);
                    break;
                case 'OPEN_FILE':
                    openFile(data.torrentId, ws, torrents);
                    break;
                case 'OPEN_DIRECTORY':
                    openDirectory(data.torrentId, ws, torrents);
                    break;
                case 'UPDATE_SETTINGS':
                    updateSettings(data.settings, ws, settings, SETTINGS_FILE, client); // Handle settings updates
                    break;
                default:
                    console.log('Unknown message type:', data.type);
                    ws.send(JSON.stringify({ type: 'ERROR', message: 'Unknown message type' }));
            }
        } catch (error) {
            console.error('Error parsing message or handling action:', error);
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Error processing message: ' + error.message }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Clean up resources associated with the client if necessary
    });
}

// Modified addTorrent function
function addTorrent(torrentId, ws, torrents, client, settings, tmdbid) {
    if (!torrentId) {
        console.error('Torrent ID is required.');
        if (ws) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Torrent ID is required.' }));
        }
        return;
    }

    // Check if a torrent with the same magnetURI is already downloading
    const existingTorrent = Object.values(torrents).find(t => t.magnetURI === torrentId && t.status === 'downloading');

    if (existingTorrent) {
        if (ws) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Torrent already exists and is downloading' }));
        }
        return;
    }

    const downloadPath = settings.app.downloadPath;

    // Generate a Unique Temporary InfoHash with a name and a number
    const tempInfoHash = `loading_${Date.now()}`;
    const infoHash = tempInfoHash;

    // Immediately add the torrent to the `torrents` object and broadcast it
    torrents[infoHash] = {
        infoHash: infoHash, // Use the generated placeholder
        name: 'Loading...',
        progress: 0,
        downloadSpeed: 0,
        timeRemaining: Infinity,
        status: 'pending', // or 'adding'
        path: null,
        magnetURI: torrentId
    };
    broadcastTorrentUpdate(ws, torrents[infoHash]);

    client.add(torrentId, { path: downloadPath }, torrent => {
        console.log(`Torrent added: ${torrent.name}`);
        console.log("infoHash during add event:", torrent.infoHash);

        if (existingTorrent) {
            // Remove the new "loading" torrent, as it's a duplicate
            delete torrents[infoHash]; // Remove the temp one.
            console.warn(`Removing duplicated torrent loading with id ${infoHash}. UI will update properly shortly`)
        }

        // **Crucial:** Overwrite the temporary entry with the real infoHash
        torrents[torrent.infoHash] = { // Store by real infoHash
            infoHash: torrent.infoHash,
            name: torrent.name,
            progress: torrent.progress,
            downloadSpeed: torrent.downloadSpeed,
            timeRemaining: torrent.timeRemaining,
            status: 'downloading',
            path: path.join(downloadPath, torrent.name),
            magnetURI: torrentId,  // Store magnetURI
            torrent: torrent  // **THIS LINE IS CRUCIAL!**
        };
        // broadcastTorrentUpdate(torrents[torrent.infoHash]);

        if (tempInfoHash !== torrent.infoHash) {
            delete torrents[tempInfoHash]; //remove temp
        }


        const onDownload = bytesDownloaded => {
            try {
                const progress = torrent.progress;
                torrents[torrent.infoHash].progress = progress;
                torrents[torrent.infoHash].downloadSpeed = torrent.downloadSpeed;
                torrents[torrent.infoHash].timeRemaining = torrent.timeRemaining;
                torrents[torrent.infoHash].status = 'downloading';
            } catch (error) {
                console.error("Error during download event:", error);
            }
        };

        const onDone = () => {
            try {
                console.log(`Torrent downloaded: ${torrent.name}`);
                torrents[torrent.infoHash].progress = 1;
                torrents[torrent.infoHash].path = path.join(downloadPath, torrent.name);
                torrents[torrent.infoHash].status = 'done';
                console.log('torrent done')
                torrent.removeListener('download', onDownload); // Remove the 'download' event listener
                torrent.removeListener('done', onDone); // Remove the 'done' event listener
                torrent.removeListener('error', onError); // Remove the 'error' event listener
            } catch (error) {
                console.error("Error during done event:", error);
            }
        };

        const onError = err => {
            console.error(`Error downloading torrent: ${torrent.name}`, err);
            torrents[torrent.infoHash].status = 'error';
            broadcastTorrentUpdate(ws, torrents[torrent.infoHash]);
            if (ws) ws.send(JSON.stringify({ type: 'ERROR', message: `Error downloading torrent: ${err.message}` }));
            torrent.removeListener('download', onDownload); // Remove the 'download' event listener
            torrent.removeListener('done', onDone); // Remove the 'done' event listener
            torrent.removeListener('error', onError); // Remove the 'error' event listener
        };

        torrent.on('download', onDownload);
        torrent.on('done', onDone);
        torrent.on('error', onError);

    }).on('error', (err) => {
        console.error(`Error adding torrent: ${torrentId}`, err);
        if (ws) ws.send(JSON.stringify({ type: 'ERROR', message: `Error adding torrent: ${err.message}` }));
    });
}

function pauseTorrent(torrentId, ws, torrents, client) {
    console.log("pauseTorrent called with torrentId:", torrentId);
    const torrentData = torrents[torrentId];

    if (!torrentData) {
        console.log("Torrent not found with torrentId:", torrentId);
        if (ws) {
            ws.send(JSON.stringify({ type: 'ERROR', message: `Torrent with id ${torrentId} not found` }));
        }
        return;
    }

    const torrent = torrentData.torrent;

    if (torrent) {
        torrent.pause();  // Pause the torrent
    }

    client.remove(torrentData.magnetURI, (err) => {
        if (err) {
            console.error('Error destroying torrent:', err);
            if (ws) {
                ws.send(JSON.stringify({ type: 'ERROR', message: `Error destroying torrent ${torrentId}: ${err.message}` }));
            }
        } else {
            console.log('Torrent destroyed:', torrentId);
            torrents[torrentId].status = 'stopped';  // Set status
            broadcastTorrentUpdate(ws, { infoHash: torrentId, status: 'stopped' }); // Update UI
        }
    })
}

async function resumeTorrent(infoHash, ws, torrents, client, settings) { // Pass infoHash as param
    console.log("resumeTorrent called with infoHash:", infoHash);
    const torrentData = torrents[infoHash]; // Use existing infoHash

    if (!torrentData) {
        console.log("Torrent not found with infoHash:", infoHash);
        if (ws) {
            ws.send(JSON.stringify({ type: 'ERROR', message: `Torrent with id ${infoHash} not found` }));
        }
        return;
    }

    const magnetURI = torrentData.magnetURI; // Get from stored data

    if (!magnetURI) {
        console.log("Magnet URI not found for torrentId:", infoHash);
        if (ws) {
            ws.send(JSON.stringify({ type: 'ERROR', message: `Magnet URI not found for torrent ${infoHash}` }));
        }
        return;
    }

    // Set the status to "loading" before re-adding to add the animation:
    torrents[infoHash].status = 'loading';
    broadcastTorrentUpdate(ws, torrents[infoHash]);

    // Re-add the torrent using the magnet URI
    client.add(magnetURI, { path: path.join(__dirname, 'torrents') }, torrent => {
        console.log(`Torrent re-added: ${torrent.name}`);

        // **Crucial:** Update the `infoHash` in the torrents object only if the torrent object has the correct infoHash
        torrents[torrent.infoHash] = { // Store by real infoHash
            infoHash: torrent.infoHash,
            name: torrent.name,
            progress: torrent.progress,
            downloadSpeed: torrent.downloadSpeed,
            timeRemaining: torrent.timeRemaining,
            status: torrent.status,
            path: path.join(__dirname, 'torrents', torrent.name),
            magnetURI: magnetURI,
            torrent: torrent
        };
        if (infoHash !== torrent.infoHash) {
            delete torrents[infoHash]; //remove temp
        }
        broadcastTorrentUpdate(ws, torrents[torrent.infoHash]);


        const onDownload = bytesDownloaded => {
            try {
                const progress = torrent.progress;
                torrents[torrent.infoHash].progress = progress;
                torrents[torrent.infoHash].downloadSpeed = torrent.downloadSpeed;
                torrents[torrent.infoHash].timeRemaining = torrent.timeRemaining;
                torrents[torrent.infoHash].status = 'downloading';
            } catch (error) {
                console.error("Error during download event:", error);
            }
        };

        const onDone = () => {
            try {
                console.log(`Torrent downloaded: ${torrent.name}`);
                torrents[torrent.infoHash].status = 'done';
                torrents[torrent.infoHash].progress = 1; //set progress to 1 when done.
                torrents[torrent.infoHash].path = path.join(__dirname, 'torrents', torrent.name);
                console.log('torrent done')

                torrent.removeListener('download', onDownload); // Remove the 'download' event listener
                torrent.removeListener('done', onDone); // Remove the 'done' event listener
                torrent.removeListener('error', onError); // Remove the 'error' event listener

            } catch (error) {
                console.error("Error during done event:", error);
            }
        };

        const onError = err => {
            console.error(`Error downloading torrent: ${torrent.name}`, err);
            torrents[torrent.infoHash].status = 'error';
            broadcastTorrentUpdate(ws, torrents[torrent.infoHash]);
            if (ws) {
                ws.send(JSON.stringify({ type: 'ERROR', message: `Error downloading torrent ${torrent.name}: ${err.message}` }));
            }
            torrent.removeListener('download', onDownload); // Remove the 'download' event listener
            torrent.removeListener('done', onDone); // Remove the 'done' event listener
            torrent.removeListener('error', onError); // Remove the 'error' event listener
        };

        torrent.on('download', onDownload);
        torrent.on('done', onDone);
        torrent.on('error', onError);


    }).on('error', (err) => {
        console.error(`Error re-adding torrent: ${magnetURI}`, err);
        if (ws) {
            ws.send(JSON.stringify({ type: 'ERROR', message: `Error re-adding torrent ${magnetURI}: ${err.message}` }));
        }
    });
}

async function stopTorrent(torrentId, ws, torrents, client) {
    console.log("stopTorrent called with torrentId:", torrentId);
    console.log("Existing torrents keys:", Object.keys(torrents)); // Log existing keys
    const torrentData = torrents[torrentId];

    if (!torrentData) {
        console.log("Torrent not found with torrentId:", torrentId);
        if (ws) {
            ws.send(JSON.stringify({ type: 'ERROR', message: `Torrent with id ${torrentId} not found` }));
        }
        return;
    }

    const torrent = torrentData.torrent;

    if (torrent) {
        torrent.removeAllListeners('download');
        torrent.removeAllListeners('done');
        torrent.removeAllListeners('error');
    }

    console.log(`Attempting to remove torrent with magnetURI: ${torrentData.magnetURI}`); //Log the magnetURI

    client.remove(torrentData.magnetURI, { destroyStore: true }, (err) => {
        if (err) {
            console.error('Error destroying torrent:', err);
            if (ws) {
                ws.send(JSON.stringify({ type: 'ERROR', message: `Error destroying torrent ${torrentId}: ${err.message}` }));
            }
        } else {
            console.log('Torrent destroyed:', torrentId);
            console.log(`Deleting torrent with id ${torrentId} from torrents object`);
            delete torrents[torrentId];
            console.log("Current torrents object after deletion:", torrents) //Log

            broadcastTorrentUpdate(ws, { infoHash: torrentId, status: 'removed' });
            console.log("Saving torrent data to file...");
            console.log("Torrent data saved to file (hopefully!)");
        }
    });
}

async function openFile(torrentId, ws, torrents) {
    const torrent = torrents[torrentId];
    if (!torrent) {
        console.log("Torrent not found with torrentId:", torrentId);
        ws.send(JSON.stringify({ type: 'ERROR', message: `Torrent with id ${torrentId} not found` }));
        return;
    }

    if (!torrent.path) {
        console.log("Torrent path not found:", torrentId);
        ws.send(JSON.stringify({ type: 'ERROR', message: `Torrent path not found for torrent id ${torrentId}` }));
        return;
    }

    try {
        const { exec } = await import('child_process');
        exec(`${getCommandLine()} "${path.dirname(torrent.path) + "\\" + torrent.name}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                ws.send(JSON.stringify({ type: 'ERROR', message: `Error opening file: ${error.message}` }));
            }
        });
    } catch (error) {
        console.error("Error opening file:", error);
        ws.send(JSON.stringify({ type: 'ERROR', message: `Error opening file: ${error.message}` }));
    }
}

async function openDirectory(torrentId, ws, torrents) {
    const torrent = torrents[torrentId];
    if (!torrent) {
        console.log("Torrent not found with torrentId:", torrentId);
        ws.send(JSON.stringify({ type: 'ERROR', message: `Torrent with id ${torrentId} not found` }));
        return;
    }

    if (!torrent.path) {
        console.log("Torrent path not found:", torrentId);
        ws.send(JSON.stringify({ type: 'ERROR', message: `Torrent path not found for torrent id ${torrentId}` }));
        return;
    }

    const directoryPath = path.dirname(torrent.path) + "\\" + torrent.name; // Get the directory
    try {
        const { exec } = await import('child_process');
        exec(`${dirgetCommandLine()} "${directoryPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                ws.send(JSON.stringify({ type: 'ERROR', message: `Error opening directory: ${error.message}` }));
            }
        });
    } catch (error) {
        console.error("Error opening directory:", error);
        ws.send(JSON.stringify({ type: 'ERROR', message: `Error opening directory: ${error.message}` }));
    }
}

// Updates settings and saves them to the file
function updateSettings(newSettings, ws, settings, SETTINGS_FILE, client) {
    try {
        // Validate the new settings (add more validation as needed)
        if (typeof newSettings !== 'object') {
            throw new Error('Invalid settings format.');
        }

        // Deep merge settings, preserving defaults and overwriting with new values
        settings = deepMerge(settings, newSettings);

        // Save settings to file
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
        console.log('Settings updated and saved to file.');

        // Reconfigure WebTorrent client if necessary
        client.destroy(function (err) {
            if (err) {
                console.error("Error destroying webtorrent client", err);
            }
            try {
                client = new WebTorrent(settings.webTorrent);
                console.log('WebTorrent client reinitialized with new settings:', settings.webTorrent);
            } catch (error) {
                console.error('Failed to reinitialize WebTorrent client.', error);
                // Optionally, send an error to the client and revert to previous settings
                if (ws) {
                    ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to reinitialize WebTorrent client. ' + error.message }));
                }
                return; // Exit the function to prevent further actions
            }

            // Send success message to client
            if (ws) {
                ws.send(JSON.stringify({ type: 'SETTINGS_UPDATED', message: 'Settings updated successfully.' }));
            }
        });

    } catch (error) {
        console.error('Failed to update settings.', error);
        if (ws) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to update settings: ' + error.message }));
        }
    }
}