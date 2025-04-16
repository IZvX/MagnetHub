// routes/subtitles.js
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..');

export function setupSubtitleRoutes(app, subdlapikey) {
    app.post('/subtitles', async (req, res) => {
        const { searchTerm } = req.body;

        if (!searchTerm) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        try {
            const subdlUrl = `https://api.subdl.com/v1/subtitles?tmdb_id=${encodeURIComponent(searchTerm)}&apikey=${subdlapikey}`;
            const response = await fetch(subdlUrl);

            if (!response.ok) {
                throw new Error(`subdl API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error('Error fetching subtitles:', error);
            res.status(500).json({ error: 'Failed to fetch subtitles' });
        }
    });
}