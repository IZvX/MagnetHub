# Keraview

## What is Keraview
Keraview is a webapp built with NodeJS. It allows you to download Movies and TV shows.

## How does it works
Keraview utilizes multiple APIs to function

 - TMDB ( Searching and displaying movie/tv show details and images
 - Torrent-Search-API : a NPM package that uses multiple providers like
	 - ThePirateBay API
	 - YTS API
	 - 1337X API
	 - NyaSii API

	 And many more to search for magnet links
 - webtorrent ( downloading magnet links)

## How to install

 1. Download the source code
	 a. extract some where 
 2. Install nodeJS [from here](https://nodejs.org/en)
 3. Check if NodeJS is installed in the cmd node --version
	 a. If everything went well you should see
	 ```bash
	 v22.14.0
	 ``` 
	
 4. Install dependencies:
	 a. Open cmd
	 b. chdir to Keraview's directory
	 c. Run the command below
	 ```bash
	  npm install
	```
5. Run with ```node .```
6. If everything works well you should see 
	```bash
	Server listening on port 3000
	```
7. Open your browser of choice and go to [localhost:3000](localhost:3000)
8. Enjoy!

# Sources
https://www.npmjs.com/package/torrent-search-api
http://webtorrent.io/
