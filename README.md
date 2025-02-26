# Keraview: Torrent Movie & TV Show Downloader

## 🌟 What is Keraview?

Keraview is a sleek, web-based application built with **Node.js** that allows you to effortlessly download movies and TV shows via magnet links. With its clean UI and powerful backend, you can search and download content from multiple sources—all in one place.

## 🔧 How Does It Work?

Keraview works by leveraging several APIs and technologies to search, find, and download content:

- **TMDB API**: For fetching movie and TV show details (e.g., titles, images, descriptions).
- **Torrent-Search-API**: A powerful NPM package that integrates with several torrent providers, including:
  - ThePirateBay
  - YTS
  - 1337X
  - NyaSii
  - And many more...
- **WebTorrent**: Handles the actual downloading of the content via magnet links.

## 🛠️ How to Install

Getting Keraview up and running is simple! Follow these steps:

1. **Download the source code**  
   - Extract it to a location of your choice.

2. **Install Node.js**  
   - If you don't have Node.js, download it [here](https://nodejs.org/en).

3. **Verify Node.js Installation**  
   - Open your terminal/command prompt and run:
     ```bash
     node --version
     ```
   - You should see something like:
     ```bash
     v22.14.0
     ```

4. **Install Dependencies**  
   - Navigate to the project directory:
     ```bash
     cd /path/to/Keraview
     ```
   - Run the following command to install the required dependencies:
     ```bash
     npm install
     ```

5. **Start the Server**  
   - Run the app using:
     ```bash
     node .
     ```

6. **Access the Web App**  
   - If everything is working correctly, you should see:
     ```bash
     Server listening on port 3000
     ```
   - Open your browser and go to [localhost:3000](http://localhost:3000).

7. **Enjoy!**  
   - Start searching and downloading your favorite movies and TV shows!

---

## 🔗 Sources

- [Torrent-Search-API on NPM](https://www.npmjs.com/package/torrent-search-api)
- [WebTorrent Official Site](http://webtorrent.io/)
