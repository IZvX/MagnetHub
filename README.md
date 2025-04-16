# MagnetHub 🎬 🍿

A movie and TV show downloader application built with Node.js and Electron, leveraging both web scraping and torrent technologies. MagnetHub aims to provide a seamless experience for finding and downloading your favorite content.

It uses multiple sources to find the best torrent magnets from the web!

**Key Features:**

*   🔍 Search for movies and TV shows.
*   🧲 Fetches torrent magnets from various sources.
*   🌐 Integrates with web scraping techniques.
*   ⬇️ Supports torrent downloading.
*   ⚡️ Fast and efficient.
*   🖥️ Cross-platform compatibility (Windows, macOS, Linux).

**Sources:**

MagnetHub aggregates torrent magnets from several popular sources, including:

*   🏴‍☠️ ThePirateBay
*   🎞️ YTS
*   🔢 1337X
*   🐱 NyaSii
*   ➕ And many more!

## How to Compile & Run 🛠️

Follow these instructions to compile and run MagnetHub on your local machine:

**Prerequisites:**

*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   [npm](https://www.npmjs.com/) (Node Package Manager, usually included with Node.js)
*   [Git](https://git-scm.com/) (Optional, but recommended for cloning the repository)

**Steps:**

1.  **Clone the Repository (if you have Git):**

    ```bash
    git clone <YOUR_GITHUB_REPOSITORY_LINK>  # Replace with your repository link
    cd MagnetHub
    ```

    *If you don't have Git, download the source code as a ZIP file and extract it.*

2.  **Install Dependencies:**

    ```bash
    npm install
    ```
    This command installs all the necessary packages defined in the `package.json` file.

3.  **Run the Application:**

    ```bash
    npm start
    ```

    This command starts the Electron application.

**Alternatively to build the application, use those command after the dependancies install:**

1.  **Build the Application**

    ```bash
    npm run build
    ```
    This command creates an executable depending on your OS, in the dist folder.

## Project Structure 📂

A brief overview of the project structure (example):
