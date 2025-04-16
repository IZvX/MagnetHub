import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..');

export function setupStaticRoutes(app, __dirname) {
    app.use(express.static(path.join(__dirname, 'public')));
    app.use("/langs", express.static(path.join(__dirname, 'public/langs/json')));
}