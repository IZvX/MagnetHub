import express from 'express';
import { DOMParser } from 'xmldom';
import fetch from 'node-fetch';

const app = express();
let server; // Declare server variable to close it later

// Function to start the server
export async function start(port = 4000) { // make it async to wait for server to load
  // API endpoint for searching Nyaa.si
  app.get('/api/nyaasi/search', async (req, res) => {
    const searchQuery = req.query.q; // Get the search query from the request

    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    try {
      const results = await fetchXmlToJson(searchQuery);

      if (results) {
        res.json(results);
      } else {
        res.status(500).json({ error: 'Failed to retrieve or parse results.' });
      }
    } catch (error) {
      console.error("Error in /api/nyaasi/search:", error);
      res.status(500).json({ error: 'Internal server error.', details: error.message });
    }
  });

  // Define the fetchXmlToJson function here
  async function fetchXmlToJson(searchQuery) {
    const rssUrl = `https://nyaa.si/?page=rss&q=${encodeURIComponent(searchQuery)}`;

    try {
      const response = await fetch(rssUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const xmlString = await response.text();
      return xmlToJson(xmlString); // Call the xmlToJson function
    } catch (error) {
      console.error("Error fetching or parsing XML:", error);
      throw error; // Re-throw the error so it's caught in the API endpoint
    }
  }

  // Define the xmlToJson function here
  function xmlToJson(xmlString) {
    const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString);

      const items = xml.getElementsByTagName("item");
      const jsonArray = [];

      for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const title = item.getElementsByTagName("title")[0]?.textContent || "";
          const link = item.getElementsByTagName("link")[0]?.textContent || "";
          const seeders = parseInt(item.getElementsByTagNameNS("https://nyaa.si/xmlns/nyaa", "seeders")[0]?.textContent || "0", 10);
          const leechers = parseInt(item.getElementsByTagNameNS("https://nyaa.si/xmlns/nyaa", "leechers")[0]?.textContent || "0", 10);
          const downloads = parseInt(item.getElementsByTagNameNS("https://nyaa.si/xmlns/nyaa", "downloads")[0]?.textContent || "0", 10);
          const size = item.getElementsByTagNameNS("https://nyaa.si/xmlns/nyaa", "size")[0]?.textContent || "";
          const infoHash = item.getElementsByTagNameNS("https://nyaa.si/xmlns/nyaa", "infoHash")[0]?.textContent || "";
          const category = item.getElementsByTagNameNS("https://nyaa.si/xmlns/nyaa", "category")[0]?.textContent || "";

          // Construct the magnet link (if infoHash is available)
          let magnet = "";
          if (infoHash) {
              magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=http%3A%2F%2Ftracker.files.fm%3A6969%2Fannounce`;
          }

          jsonArray.push({
              title: title,
              link: link,
              seeds: seeders,
              peers: leechers,
              downloads: downloads,
              size: size,
              magnet: magnet,
              provider: "Nyaa.si", // Hardcoded provider name for this source
              category: category
          });
      }

      return jsonArray;
  }

  return new Promise((resolve, reject) => { // to tell the start() function to end
    server = app.listen(port, () => {
      console.log(`NyaaSi API Running http://localhost:${port}`);
      resolve(server); // Resolve the promise with the server instance
    });

    server.on('error', (err) => {
      console.error('Error starting server:', err);
      reject(err); // Reject the promise if there's an error
    });
  });
}

// Function to stop the server
export function stop() {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err) => {
        if (err) {
          console.error('Error stopping server:', err);
          reject(err);
          return;
        }
        console.log('NyaaSi API stopped');
        resolve();
      });
    } else {
      resolve(); // Resolve immediately if the server wasn't started
    }
  });
}