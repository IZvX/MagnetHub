// routes/settings.js
import express from 'express';
import fs from 'fs';
import { deepMerge } from '../utils/settings.mjs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..');


export function setupSettingsRoutes(app, settings, SETTINGS_FILE) {
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

    app.get('/settings', asyncHandler(async (req, res) => {
        const settingsData = settings;
        res.status(200).json(settingsData);
    }));

    app.post('/addSettings', asyncHandler(async (req, res) => {
        const settingsData = req.body;

        if (!settingsData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // updateSettings(settingsData,ws)
        settings = settingsData;
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settingsData, null, 2), 'utf-8');
        res.status(201).json({ message: 'Settings Updated.', item: settingsData });
    }));
}