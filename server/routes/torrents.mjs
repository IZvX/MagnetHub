// routes/torrents.js
import express from 'express';
import path from 'path';
import { validateParams } from '../utils/validation.mjs';
import TorrentSearchApi from 'torrent-search-api';
import NyaaCustomProvider from '../../providers/nyaasi.js';
TorrentSearchApi.loadProvider(NyaaCustomProvider);

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..');



export function setupTorrentRoutes(app, client, settings, __dirname, torrents) {
    // Stream route
    app.get('/stream/:infoHash/:fileIndex', (req, res) => {
        const infoHash = req.params.infoHash;
        const fileIndex = parseInt(req.params.fileIndex, 10); // Convert to number

        if (isNaN(fileIndex)) {
            return res.status(400).send('Invalid file index');
        }

        const torrentData = torrents[infoHash];

        if (!torrentData || !torrentData.torrent) {
            return res.status(404).send('Torrent not found');
        }

        const torrent = torrentData.torrent;

        if (fileIndex < 0 || fileIndex >= torrent.files.length) {
            return res.status(404).send('File not found in torrent');
        }

        const file = torrent.files[fileIndex];
        const fileSize = file.length;

        // Determine content type based on file extension
        const ext = path.extname(file.name).toLowerCase();
        let contentType = 'application/octet-stream'; // Default
        if (ext === '.mp4') {
            contentType = 'video/mp4';
        } else if (ext === '.mkv') {
            contentType = 'video/x-matroska';
        } else if (ext === '.webm') {
            contentType = 'video/webm';
        }
        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', 'bytes');  // Enable seeking
        res.setHeader('Content-Length', fileSize);

        const stream = file.createReadStream();

        stream.on('error', (err) => {
            console.error('Error streaming file:', err);
            res.status(500).send('Error streaming file');
        });

        stream.pipe(res);
        stream.on('close', () => { //memory leak fix
            stream.destroy();
        });
    });
    app.post("/download", async (req, res) => {  // New /search endpoint
        const { id, type, sQuery } = req.body;
        console.log("Search Request:", { id, type, sQuery });

        const missingParamError = validateParams({ id, type, sQuery });
        if (missingParamError) {
            return res.status(400).json({ error: missingParamError });
        }


        try {

            TorrentSearchApi.disableAllProviders(); // Make sure we enable public providers (or you'll never find anything)

            // Enable providers based on settings:  (VERY IMPORTANT)
            const enabledProviders = settings.app.enabledProviders;

            for (const providerName in enabledProviders) {
                if (enabledProviders[providerName] === true) {
                    try {
                        TorrentSearchApi.enableProvider(providerName);
                        console.log(`Enabled provider: ${providerName}`);

                        if (providerName == "NyaaSi") {
                            TorrentSearchApi.enableProvider('NyaaSi');
                        }
                    } catch (providerError) {
                        console.error(`Failed to enable provider ${providerName}:`, providerError);
                        // Handle the error appropriately (e.g., disable the provider in settings).
                    }
                } else {
                    try {
                        TorrentSearchApi.disableProvider(providerName);
                        console.log(`Disabled provider: ${providerName}`);
                        if (providerName == "NyaaSi") {
                            // TorrentSearchApi.loadProvider(NyaaCustomProvider);
                            TorrentSearchApi.disableProvider('NyaaSi');
                        }
                    } catch (providerError) {
                        console.error(`Failed to disable provider ${providerName}:`, providerError);
                    }
                }
            }

            console.log(TorrentSearchApi.getActiveProviders());

            const torrents = await TorrentSearchApi.search(sQuery, 'All');  // Search ALL enabled providers

            // Filter out adult content if the setting is disabled
            let filteredTorrents = torrents;
            if (!settings.app.showAdultContent) {
                filteredTorrents = torrents.filter(torrent => !torrent.title.toLowerCase().includes('18+')); //Basic 18+ filter (not perfect)
            }

            const parsedTorrents = await Promise.all(
                filteredTorrents.map(async (torrent) => {
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

}