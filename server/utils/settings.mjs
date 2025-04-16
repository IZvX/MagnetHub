// utils/settings.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default settings
const defaultSettings = {
    webTorrent: {
        maxConns: 55,
        nodeId: null,
        peerId: null,
        tracker: true,
        dht: true,
        lsd: true,
        webSeeds: true,
        utp: true,
        blocklist: null,
        downloadLimit: -1,
        uploadLimit: -1,
    },
    app: {
        language: 'en',
        showAdultContent: false,
        enabledProviders: {
            "1337x": true,
            "Eztv": true,
            "KickassTorrents": true,
            "Limetorrents": true,
            "Rarbg": true,
            "ThePirateBay": true,
            "Torrent9": true,
            "TorrentProject": true,
            "Torrentz2": true,
            "Yts": true,
            "NyaaSi": true
        },
        downloadPath: path.join(__dirname, 'torrents'), // Default download path
    },
};

// Function to load settings
export function loadSettings(SETTINGS_FILE) {
    try {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        generateDefaultSettings(SETTINGS_FILE);
        console.warn('Failed to load settings. Using defaults.', error);
        return defaultSettings;
    }
}

// Function to generate settings file with default options.
export function generateDefaultSettings(SETTINGS_FILE) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf-8');
        console.log('Generated default settings file.');
        return defaultSettings;
    } catch (error) {
        console.error('Failed to generate default settings file.', error);
        return defaultSettings;
    }
}

// Helper function for deep merging objects
export function deepMerge(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof target[key] === 'object' && typeof source[key] === 'object' && target[key] !== null && source[key] !== null) {
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}

// export { generateDefaultSettings, deepMerge, loadSettings };
