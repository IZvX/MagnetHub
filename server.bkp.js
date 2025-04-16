import express from 'express';
import WebTorrent from 'webtorrent';
import path from 'path';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import TorrentSearchApi from 'torrent-search-api';
import NyaaCustomProvider from './providers/nyaasi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const client = new WebTorrent();

app.use(express.json());

let torrents = {};
const TORRENT_DATA_FILE = path.join(__dirname, 'torrent_data.json');
const libraryFilePath = path.join(__dirname, 'library.json');

const validateParams = (params) => {
    for (const key in params) {
        if (!params[key]) {
            return `Missing parameter: ${key}`;
        }
    }
    return null;
};

// Load torrent data from file on startup
function loadTorrentData() {
    try {
        const data = fs.readFileSync(TORRENT_DATA_FILE, 'utf-8');
        torrents = JSON.parse(data);
        console.log('Torrent data loaded from file.');

        // Initialize existing torrents from data file
        for (const infoHash in torrents) {
            const torrentData = torrents[infoHash];
            if (torrentData.magnetURI) {
                console.log(`Initializing torrent from saved data: ${torrentData.name}`);
                addTorrent(torrentData.magnetURI, client); // Pass infoHash
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

app.get('/stream/:infoHash/:fileIndex', (req, res) => {
    const infoHash = req.params.infoHash;
    const fileIndex = parseInt(req.params.fileIndex, 10); // Convert to number

    const torrentData = torrents[infoHash];

    if (!torrentData || !torrentData.torrent) {
        return res.status(404).send('Torrent not found');
    }

    const torrent = torrentData.torrent;

    if (fileIndex < 0 || fileIndex >= torrent.files.length) {
        return res.status(404).send('File not found in torrent');
    }

    const file = torrent.files[fileIndex];

    res.setHeader('Content-Type', 'video/mp4'); // Example, determine dynamically
    res.setHeader('Accept-Ranges', 'bytes');  // Enable seeking

    const fileSize = file.length;
    res.setHeader('Content-Length', fileSize);
    const stream = file.createReadStream();

    stream.pipe(res); // Directly pipe the file stream to the response
});

app.post("/download", async (req, res) => {  // New /search endpoint
    const { id, type, sQuery } = req.body;
    console.log("Search Request:", { id, type, sQuery });

    const missingParamError = validateParams({ id, type, sQuery });
    if (missingParamError) {
        return res.status(400).json({ error: missingParamError });
    }

    try {
        // console.log("ALL PROVIDERS");
        // console.log("ACTIVE PROVIDERS");
        if (!TorrentSearchApi.isProviderActive('NyaaSi')) { // Check if the provider is already active
            TorrentSearchApi.loadProvider(NyaaCustomProvider);
            TorrentSearchApi.enableProvider('NyaaSi');
        }
        TorrentSearchApi.enablePublicProviders();
        console.log(TorrentSearchApi.getActiveProviders());

        const torrents = await TorrentSearchApi.search(sQuery, 'All');

        const parsedTorrents = await Promise.all(
            torrents.map(async (torrent) => {
                try {
                    const magnet = await TorrentSearchApi.getMagnet(torrent);
                    return {
                        title: torrent.title,
                        seeds: torrent.seeds,
                        peers: torrent.peers,
                        size: torrent.size,
                        provider: torrent.provider,
                        magnet: magnet,
                    };
                } catch (magnetError) {
                    console.error(`Failed to get magnet for ${torrent.title}:`, magnetError);
                    return {
                        title: torrent.title,
                        seeds: torrent.seeds,
                        peers: torrent.peers,
                        size: torrent.size,
                        provider: torrent.provider,
                        magnet: null,
                        error: "Failed to retrieve magnet link"
                    };
                }
            })
        );

        res.json({
            message: `Searching torrents for: ${id}, Type: ${type}`,
            torrents: parsedTorrents,
        });

    } catch (error) {
        console.error("Torrent Search Error:", error);
        return res.status(500).json({ error: "Failed to search torrents." });
    }
});

// Save torrent data to file
function saveTorrentData() {
    try {
        fs.writeFileSync(TORRENT_DATA_FILE, JSON.stringify(torrents, null, 2), 'utf-8');
        // console.log('Torrent data saved to file.');
    } catch (error) {
        console.error('Failed to save torrent data to file.', error);
    }
}

// WebSocket Server Setup
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', ws => {
    console.log('Client connected');
    sendTorrentList(ws);

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            console.log("Received message from client:", data);

            switch (data.type) {
                case 'ADD_TORRENT':
                    addTorrent(data.torrentId, ws);
                    break;
                case 'PAUSE_TORRENT':
                    pauseTorrent(data.torrentId);
                    break;
                case 'RESUME_TORRENT':
                    resumeTorrent(data.torrentId);
                    break;
                case 'STOP_TORRENT':
                    stopTorrent(data.torrentId);
                    break;
                case 'OPEN_FILE':
                    openFile(data.torrentId, ws); // Pass ws for error messages
                    break;
                case 'OPEN_DIRECTORY':
                    openDirectory(data.torrentId, ws); // Pass ws for error messages
                    break;
                default:
                    console.log('Unknown message type:', data.type);
                    ws.send(JSON.stringify({ type: 'ERROR', message: 'Unknown message type' })); // Send error to client
            }
        } catch (error) {
            console.error('Error parsing message or handling action:', error);
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Error processing message: ' + error.message })); // Send error to client
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function sendTorrentList(ws) {
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

let updateInterval; // Declare the interval variable

function startBroadcasting() {
    if (!updateInterval) { //Prevent multiple intervals
      updateInterval = setInterval(() => {
        for (const infoHash in torrents) {
          if (torrents.hasOwnProperty(infoHash)) {
            broadcastTorrentUpdate(torrents[infoHash]);
          }
        }
      }, 1000); // Every 1000 ms (1 second)
    }
  }
  
  function stopBroadcasting() {
    clearInterval(updateInterval);
    updateInterval = null;
  }

function broadcastTorrentUpdate(torrent) {
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

// Modified addTorrent function
function addTorrent(torrentId, ws) {
    // Check if a torrent with the same magnetURI is already downloading
    const existingTorrent = Object.values(torrents).find(t => t.magnetURI === torrentId && t.status === 'downloading');

    if (existingTorrent) {
        // Remove the new "loading" torrent, as it's a duplicate
        // Remove the new "loading" torrent, as it's a duplicate
        if (ws) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Torrent already exists and is downloading' }));
        }
        return;
    }

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
    broadcastTorrentUpdate(torrents[infoHash]);
    saveTorrentData();

    client.add(torrentId, { path: path.join(__dirname, 'torrents') }, torrent => {
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
                path: path.join(__dirname, 'torrents', torrent.name),
                magnetURI: torrentId,  // Store magnetURI
                torrent: torrent  // **THIS LINE IS CRUCIAL!**
            };
            // broadcastTorrentUpdate(torrents[torrent.infoHash]);

        if (tempInfoHash !== torrent.infoHash) {
            delete torrents[tempInfoHash]; //remove temp
        }

            saveTorrentData(); // Save to file

            torrent.on('download', bytesDownloaded => {
                try {
                    const progress = torrent.progress;
                    torrents[torrent.infoHash].progress = progress;
                    torrents[torrent.infoHash].downloadSpeed = torrent.downloadSpeed;
                    torrents[torrent.infoHash].timeRemaining = torrent.timeRemaining;
                    torrents[torrent.infoHash].status = 'downloading';
                    // broadcastTorrentUpdate(torrents[torrent.infoHash]); //Moved outside this event as update is now every second
                    saveTorrentData();
                } catch (error) {
                    console.error("Error during download event:", error);
                }

            });

            torrent.on('done', () => {
                try {
                    console.log(`Torrent downloaded: ${torrent.name}`);
                    torrents[torrent.infoHash].progress = 1;
                    torrents[torrent.infoHash].path = path.join(__dirname, 'torrents', torrent.name);
                    torrents[torrent.infoHash].status = 'done';
                    //  broadcastTorrentUpdate(torrents[torrent.infoHash]); //Moved outside this event as update is now every second
                    saveTorrentData();
                    console.log('torrent done')
                } catch (error) {
                    console.error("Error during done event:", error);
                }
            });

            torrent.on('error', err => {
                console.error(`Error downloading torrent: ${torrent.name}`, err);
                torrents[torrent.infoHash].status = 'error';
                broadcastTorrentUpdate(torrents[torrent.infoHash]);
                if (ws) ws.send(JSON.stringify({ type: 'ERROR', message: `Error downloading torrent: ${err.message}` })); // Send error to client
                saveTorrentData();
            });


            // broadcastTorrentUpdate(torrent); //Moved outside this event as update is now every second
        }).on('error', (err) => {
            console.error(`Error adding torrent: ${torrentId}`, err);
            if (ws) ws.send(JSON.stringify({ type: 'ERROR', message: `Error adding torrent: ${err.message}` })); // Send error to client
        });
}

function generateInfoHash(magnetURI) {
    // A simple placeholder.  This should be replaced with proper magnet-URI parsing
    // if you need a reliable infoHash *before* the torrent is added.  This is just
    // to make sure the UI has *something* to identify the torrent while it's loading.
    return 'loading_' + magnetURI.substring(0, 20);
}

function pauseTorrent(torrentId) {
    console.log("pauseTorrent called with torrentId:", torrentId);
    const torrentData = torrents[torrentId];

    if (!torrentData) {
        console.log("Torrent not found with torrentId:", torrentId);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ERROR', message: `Torrent with id ${torrentId} not found` }));
            }
        });
        return;
    }

    //const torrent = torrentData.torrent; // Access torrent property

    //if (!torrent) {
    //    console.log("Torrent object not found for torrentId:", torrentId);
    //    wss.clients.forEach(client => {
    //        if (client.readyState === WebSocket.OPEN) {
    //            client.send(JSON.stringify({ type: 'ERROR', message: `Torrent object not found for id ${torrentId}` }));
    //        }
    //    });
    //    return;
    //}

    client.remove(torrentData.magnetURI,  (err) => {
        if (err) {
            console.error('Error destroying torrent:', err);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'ERROR', message: `Error destroying torrent ${torrentId}: ${err.message}` }));
                }
            });
        } else {
            console.log('Torrent destroyed:', torrentId);
            torrents[torrentId].status = 'stopped';  // Set status
            broadcastTorrentUpdate({ infoHash: torrentId, status: 'stopped' }); // Update UI
            saveTorrentData();
        }
    })
}

async function resumeTorrent(infoHash) { // Pass infoHash as param
    console.log("resumeTorrent called with infoHash:", infoHash);
    const torrentData = torrents[infoHash]; // Use existing infoHash

    if (!torrentData) {
        console.log("Torrent not found with infoHash:", infoHash);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ERROR', message: `Torrent with id ${infoHash} not found` }));
            }
        });
        return;
    }

    const magnetURI = torrentData.magnetURI; // Get from stored data

    if (!magnetURI) {
        console.log("Magnet URI not found for torrentId:", infoHash);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ERROR', message: `Magnet URI not found for torrent ${infoHash}` }));
            }
        });
        return;
    }

    // Set the status to "loading" before re-adding to add the animation:
    torrents[infoHash].status = 'loading';
    broadcastTorrentUpdate(torrents[infoHash]);

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
                //torrent: torrent, // Don't save the WebTorrent object
                path: path.join(__dirname, 'torrents', torrent.name),
                magnetURI: magnetURI,
                torrent: torrent  // **THIS LINE IS CRUCIAL!**
            };
            if (infoHash !== torrent.infoHash) {
                delete torrents[infoHash]; //remove temp
            }
            saveTorrentData();
            broadcastTorrentUpdate(torrents[torrent.infoHash]);
                //broadcastTorrentUpdate(torrent);

        torrent.on('download', bytesDownloaded => {
            try {
                const progress = torrent.progress;
                torrents[torrent.infoHash].progress = progress;
                torrents[torrent.infoHash].downloadSpeed = torrent.downloadSpeed;
                torrents[torrent.infoHash].timeRemaining = torrent.timeRemaining;
                torrents[torrent.infoHash].status = 'downloading';
               // broadcastTorrentUpdate(torrents[torrent.infoHash]);
                saveTorrentData();
            } catch (error) {
                console.error("Error during download event:", error);
            }
        });

        torrent.on('done', () => {
            try {
                console.log(`Torrent downloaded: ${torrent.name}`);
                torrents[torrent.infoHash].status = 'done';
                torrents[torrent.infoHash].progress = 1; //set progress to 1 when done.
                torrents[torrent.infoHash].path = path.join(__dirname, 'torrents', torrent.name);
               // broadcastTorrentUpdate(torrents[torrent.infoHash]);
                saveTorrentData();
                console.log('torrent done')
            } catch (error) {
                console.error("Error during done event:", error);
            }
        });

        torrent.on('error', err => {
            console.error(`Error downloading torrent: ${torrent.name}`, err);
            torrents[torrent.infoHash].status = 'error';
            broadcastTorrentUpdate(torrents[torrent.infoHash]);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'ERROR', message: `Error downloading torrent ${torrent.name}: ${err.message}` }));
                }
            });
            saveTorrentData();
        });

        // Update existing data (necessary because a new torrent object is created)

       // broadcastTorrentUpdate(torrent);

    }).on('error', (err) => {
        console.error(`Error re-adding torrent: ${magnetURI}`, err);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ERROR', message: `Error re-adding torrent ${magnetURI}: ${err.message}` }));
            }
        });
    });
}

async function stopTorrent(torrentId) {
    console.log("stopTorrent called with torrentId:", torrentId);
    console.log("Existing torrents keys:", Object.keys(torrents)); // Log existing keys
    const torrentData = torrents[torrentId];

    if (!torrentData) {
        console.log("Torrent not found with torrentId:", torrentId);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ERROR', message: `Torrent with id ${torrentId} not found` }));
            }
        });
        return;
    }

    console.log(`Attempting to remove torrent with magnetURI: ${torrentData.magnetURI}`); //Log the magnetURI

    client.remove(torrentData.magnetURI, (err) => {
        if (err) {
            console.error('Error destroying torrent:', err);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'ERROR', message: `Error destroying torrent ${torrentId}: ${err.message}` }));
                }
            });
        } else {
            console.log('Torrent destroyed:', torrentId);
            console.log(`Deleting torrent with id ${torrentId} from torrents object`);
            delete torrents[torrentId];
            console.log("Current torrents object after deletion:", torrents) //Log

            broadcastTorrentUpdate({ infoHash: torrentId, status: 'removed' });
            console.log("Saving torrent data to file...");
            saveTorrentData();
            console.log("Torrent data saved to file (hopefully!)");
        }
    });
}

function getCommandLine() {
    switch (process.platform) {
        case 'darwin': return 'open';
        case 'win32': return 'start';
        case 'win64': return 'start';
        default: return 'xdg-open';
    }
}

async function openFile(torrentId, ws) {
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

function dirgetCommandLine() {
    switch (process.platform) {
        case 'darwin': return 'open';
        case 'win32': return 'explorer';
        case 'win64': return 'explorer';
        default: return 'xdg-open';
    }
}

async function openDirectory(torrentId, ws) {
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

// --- Route Handlers ---
app.use(cors()); // Enable CORS for all origins
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post("/addTorrent", (req, res) => { //Correct route
    const { torrentId } = req.body;
    if (!torrentId) {
        return res.status(400).json({ error: "Missing torrentId" });
    }
    addTorrent(torrentId, res);
    res.status(200).send()
});

app.post("/pauseTorrent", (req, res) => { //Correct route
     const { torrentId } = req.body;
    if (!torrentId) {
        return res.status(400).json({ error: "Missing torrentId" });
    }
    pauseTorrent(torrentId);
     res.status(200).send()
});

app.post("/resumeTorrent", (req, res) => { //Correct route
    const { torrentId } = req.body;
    if (!torrentId) {
        return res.status(400).json({ error: "Missing torrentId" });
    }
    resumeTorrent(torrentId);
     res.status(200).send()
});
app.post("/stopTorrent", (req, res) => { //Correct route
    const { torrentId } = req.body;
    if (!torrentId) {
        return res.status(400).json({ error: "Missing torrentId" });
    }
    stopTorrent(torrentId);
     res.status(200).send()
});
app.post("/openFile", (req, res) => { //Correct route
      const { torrentId } = req.body;
    if (!torrentId) {
        return res.status(400).json({ error: "Missing torrentId" });
    }
    openFile(torrentId);
     res.status(200).send()
});
app.post("/openDirectory", (req, res) => { //Correct route
      const { torrentId } = req.body;
    if (!torrentId) {
        return res.status(400).json({ error: "Missing torrentId" });
    }
    openDirectory(torrentId);
     res.status(200).send()
});

app.get("/torrents", (req, res) => { //Correct route
    const torrentList = Object.values(torrents).map(torrent => ({
        infoHash: torrent.infoHash,
        name: torrent.name,
        progress: torrent.progress,
        downloadSpeed: torrent.downloadSpeed,
        timeRemaining: torrent.timeRemaining,
        status: torrent.status || 'idle',
        path: torrent.path
    }));
     res.status(200).send(torrentList)
});


// Load torrent data on server start
loadTorrentData();




app.post('/addlibrary', async (req, res) => {
    try {
        // 1. Get the data from the request body
        const movieData = req.body;

        // 2. Validate the data (basic validation)
        if (!movieData.movieId || !movieData.type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 3. Call the addToLibrary function
        const addedItem = await addToLibrary(movieData, libraryFilePath);

        // 4. Send a success response with the added item
        res.status(201).json({ message: 'Movie added to library', item: addedItem });

    } catch (error) {
        // 5. Handle any errors
        console.error('Error adding to library:', error);
        res.status(500).json({ error: 'Failed to add to library', details: error.message });
    }
});


/**
 * Adds movie/TV show data to a JSON file.
 * @param {object} data - The data to add (movieId, type, movieName, seasonNumber, episodeNumber).
 * @param {string} filePath - Path to the JSON file to store library data.
 * @returns {Promise<object>} A promise that resolves with the added item.
 * @throws {Error} If there are issues reading or writing to the file.
 */
async function addToLibrary(data, filePath) {
    const { movieId, type } = data;

    if (!movieId || !type) {
        throw new Error('Missing required fields: movieId, type, and movieName are mandatory.');
    }

    try {
        // Read existing library data from the JSON file
        let library = [];
        try {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            library = JSON.parse(fileContents);
        } catch (readError) {
            // File doesn't exist or is empty/invalid JSON
            console.warn(`File ${filePath} not found or invalid, starting with a new library.`, readError.message);
        }

        const newItem = {
            id: Date.now(), // Generate a unique ID using timestamp
            movieId: movieId,
            type: type,
            addedAt: new Date(),
        };

        library.push(newItem);

        // Write the updated library data back to the JSON file
        fs.writeFileSync(filePath, JSON.stringify(library, null, 2), 'utf8');

        console.log('Added to library:', newItem);
        return newItem; // return the added item
    } catch (error) {
        console.error("Error adding to library:", error);
        throw error; // re-throw the error for the caller to handle
    }
}

/**
 * Retrieves the library data from a JSON file.
 * @param {string} filePath - Path to the JSON file containing library data.
 * @returns {Promise<Array<object>>} A promise that resolves with the library data as an array of objects.
 * @throws {Error} If there are issues reading the file or parsing the JSON.
 */
async function getLibrary(filePath) {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (error) {
        console.error("Error reading library file:", error);
        // If the file doesn't exist or is invalid JSON, return an empty array.
        return [];
    }
}

app.get('/library', async (req, res) => {
    try {
        const libraryData = await getLibrary(libraryFilePath);
        res.status(200).json(libraryData);
    } catch (error) {
        console.error('Error fetching library:', error);
        res.status(500).json({ error: 'Failed to fetch library', details: error.message });
    }
});


// Start the server
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    startBroadcasting(); // Start broadcasting torrent updates
});

// Handle server closing to save data
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    saveTorrentData();
    stopBroadcasting(); // Stop broadcasting before closing
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});