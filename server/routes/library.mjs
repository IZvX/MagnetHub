// routes/library.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..');


const __prcpth = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const __finalprcpth = __prcpth + "/Keraview/"
const libraryFilePath = path.join(__finalprcpth, '/json/library.json');
export function setupLibraryRoutes(app, __dirname) {

    // Helper functions for library management
    /**

     Adds movie/TV show data to a JSON file.

     @param {object} data - The data to add (movieId, type, movieName, seasonNumber, episodeNumber).

     @param {string} filePath - Path to the JSON file to store library data.

     @returns {Promise<object>} A promise that resolves with the added item.

     @throws {Error} If there are issues reading or writing to the file.
     */
    //  const fs = require('fs');

    async function addToLibrary(data, filePath) {
        const { movieId, type } = data;
    
        if (!movieId || !type) {
            throw new Error('Missing required fields: movieId and type are mandatory.');
        }
    
        try {
            let library = [];
            try {
                const fileContents = fs.readFileSync(filePath, 'utf8');
                library = JSON.parse(fileContents);
            } catch (readError) {
                console.warn(`File ${filePath} not found or invalid, starting with a new library.`, readError.message);
            }
    
            // Check for duplicates and toggle
            const index = library.findIndex(item => item.movieId === movieId && item.type === type);
            if (index !== -1) {
                // Remove existing entry
                const removedItem = library.splice(index, 1)[0];
                fs.writeFileSync(filePath, JSON.stringify(library, null, 2), 'utf8');
                console.log('Removed from library:', removedItem);
                return { removed: true, item: removedItem };
            }
    
            // Add new entry
            const newItem = {
                id: Date.now(),
                movieId,
                type,
                addedAt: new Date(),
            };
    
            library.push(newItem);
    
            fs.writeFileSync(filePath, JSON.stringify(library, null, 2), 'utf8');
    
            console.log('Added to library:', newItem);
            return { added: true, item: newItem };
    
        } catch (error) {
            console.error("Error updating library:", error);
            throw error;
        }
    }
    
     
    /**

     Retrieves the library data from a JSON file.

     @param {string} filePath - Path to the JSON file containing library data.

     @returns {Promise<Array<object>>} A promise that resolves with the library data as an array of objects.

     @throws {Error} If there are issues reading the file or parsing the JSON.
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
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

    // Define the library routes

    app.post('/addlibrary', asyncHandler(async (req, res) => {
        const movieData = req.body;

        if (!movieData.movieId || !movieData.type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const addedItem = await addToLibrary(movieData, libraryFilePath);
        res.status(201).json({ message: 'Movie added to library', item: addedItem });


    }));
    app.get('/library', asyncHandler(async (req, res) => {
        const libraryData = await getLibrary(libraryFilePath);
        res.status(200).json(libraryData);
    }));
}