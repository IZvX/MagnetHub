import TorrentProvider from 'torrent-search-api/lib/TorrentProvider.js';
import { URL } from 'url';
import fetch from 'node-fetch';
import cheerio from 'cheerio'; // Will be used for the description
import xml2js from 'xml2js';  // For parsing XML

class NyaaCustomProvider extends TorrentProvider {
    constructor() {
        super({
            name: 'NyaaSi',
            baseUrl: 'https://nyaa.si',
            searchUrl: '/?page=rss&q={query}&c={cat}&f=0', // RSS Feed URL
            categories: {
                All: '0_0', // RSS Category IDs
                Anime: '1_0',
                Audio: '2_0',
                Literature: '3_0',
                Pictures: '4_0',
                Software: '5_0'
            },
            defaultCategory: '0_0',
            resultsPerPageCount: 50,
            public: true,
        });
        this.userAgent = 'YourAppName/1.0 (your@email.com)';
    }

    async search(query, category) {
        console.log(`NyaaSi: Starting search for query "${query}" in category "${category}"`);
        const url = this.getUrl(category, query);

        if (url === null) {
            console.warn(`NyaaSi: Could not generate URL for query "${query}" in category "${category}"`);
            return [];
        }

        console.log(`NyaaSi: Search URL: ${url}`);

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': this.userAgent }
            });

            if (!response.ok) {
                console.error(`NyaaSi: HTTP error! Status: ${response.status}`);
                throw new Error(`NyaaSi: HTTP error! Status: ${response.status}`);
            }

            const xml = await response.text();
            console.log(`NyaaSi: Received XML response (length: ${xml.length})`);
            return this.parseResults(xml);
        } catch (error) {
            console.error(`NyaaSi: Error during NyaaCustom search:`, error);
            return [];
        }
    }

    formatMagnet(infoHash, name) {
        const trackers = [
            "http://nyaa.tracker.wf:7777/announce",
            "udp://open.stealth.si:80/announce",
            "udp://tracker.opentrackr.org:1337/announce",
            "udp://exodus.desync.com:6969/announce",
            "udp://tracker.torrent.eu.org:451/announce"
        ];
        const trackersQueryString = `&tr=${trackers.map(encodeURIComponent).join('&tr=')}`;
        return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(name)}${trackersQueryString}`;
    }

    async parseResults(xml) {
        console.log(`NyaaSi: Starting to parse XML results...`);
        const parser = new xml2js.Parser({ explicitArray: false });

        try {
            const result = await parser.parseStringPromise(xml);
            // console.log("NyaaSi: Parsed XML result:", result); //Log the full result for debugging.

            if (!result || !result.rss || !result.rss.channel) {
                // console.warn("NyaaSi: Invalid RSS feed structure.");
                return [];
            }

            // Check if items exists before accessing it
            let items = result.rss.channel.item;

            if (!items) {
                // console.warn("NyaaSi: No items found in the RSS feed for this search.");
                return []; // Return an empty array
            }

            if (!Array.isArray(items)) {
                // console.warn("NyaaSi: RSS feed item is not an array, converting it to array.");
                items = [items];
            }

            const torrents = items.map((item, index) => {
                try {
                    console.log(`NyaaSi: Processing RSS item ${index + 1}`); // Add logging to track progress
                    const descriptionText = item.description;
                    const $ = cheerio.load(descriptionText);
                    const linkFromDescription = $('a').attr('href');
                    const parts = descriptionText.split(' | ');
                    const id = linkFromDescription ? linkFromDescription.split('/').pop() : null;
                    let infoHash = item['nyaa:infoHash'];
                    let name = item.title;
                    const torrent = {
                        provider: this.name,
                        title: item.title,
                        link: item.link,
                        guid: item.guid,
                        pubDate: item.pubDate,
                        seeds: parseInt(item['nyaa:seeders']),
                        peers: parseInt(item['nyaa:leechers']),
                        downloads: parseInt(item['nyaa:downloads'], 10),
                        infoHash: item['nyaa:infoHash'],
                        magnet: this.formatMagnet(infoHash, name),
                        categoryId: item['nyaa:categoryId'],
                        category: item['nyaa:category'],
                        size: item['nyaa:size'],
                        comments: parseInt(item['nyaa:comments'], 10),
                        trusted: item['nyaa:trusted'] === 'Yes',
                        remake: item['nyaa:remake'] === 'Yes',
                        id: id
                    };
                    // console.log(`NyaaSi: Successfully processed torrent item "${torrent.title}"`);
                    return torrent;

                } catch (itemError) {
                    // console.warn(`NyaaSi: Error processing single RSS feed item: ${itemError}`);
                    return null;
                }
            }).filter(item => item !== null);

            // console.log(`NyaaSi: Successfully parsed ${torrents.length} torrent items.`);
            return torrents;
        } catch (error) {
            console.error("NyaaSi: Error parsing XML:", error);
            return [];
        }
    }


    async getTorrentDetails(torrent) {
        // Since we have most details from RSS, you might skip fetching details page
        console.log(`NyaaSi: getTorrentDetails called, but returning static message`);
        return `Torrent details not available as the data comes from RSS`;
    }

    async downloadTorrent(torrent) {
        //The torrent URL is available directly from the RSS feed; return it here.
        console.log(`NyaaSi: Downloading torrent from URL: ${torrent.link}`);
        return torrent.link;
    }
}

export default NyaaCustomProvider;