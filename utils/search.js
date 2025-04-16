import TorrentSearchApi, { search } from 'torrent-search-api';
import NyaaCustomProvider from '../providers/nyaasi.js';

async function searchMags(searchQuery, type) {
    const providerCategories = {
        Movies: {
            '1337x': 'Movies',
            'Eztv': 'All',
            'KickassTorrents': 'Movies',
            'Limetorrents': 'Movies',
            'Rarbg': 'Movies',
            'ThePirateBay': 'Video',
            'Torrent9': 'Movies',
            'TorrentProject': 'All',
            'Torrentz2': 'All',
            'Yts': 'Movies',
            'NyaaSi': 'All'
        },
        TV: {
            '1337x': 'TV',
            'Eztv': 'All',
            'KickassTorrents': 'TV',
            'Limetorrents': 'TV',
            'Rarbg': 'TV',
            'ThePirateBay': 'Video',
            'Torrent9': 'TV',
            'TorrentProject': 'All',
            'Torrentz2': 'All',
            'Yts': 'All',
            'NyaaSi': 'All'
        }
    };

    if (!TorrentSearchApi.isProviderActive('NyaaSi')) { // Check if the provider is already active
        TorrentSearchApi.loadProvider(NyaaCustomProvider);
        TorrentSearchApi.enableProvider('NyaaSi');
    }
    TorrentSearchApi.enablePublicProviders();

    const activeProviders = TorrentSearchApi.getActiveProviders();
    console.log("Active Providers:", activeProviders);

    const torrents = await TorrentSearchApi.search(
        searchQuery,
        (provider) => {
            const categoryForProvider = providerCategories[type]?.[provider];
            return categoryForProvider || 'All'; // Default to 'All' if no specific category is found
        }
    );

    const parsedTorrents = await Promise.all(
        torrents.map(async (torrent) => {
            try {
                const magnet = await TorrentSearchApi.getMagnet(torrent);
                return {
                    title: torrent.title,
                    seeds: torrent.seeds,
                    peers: torrent.peers,
                    size: torrent.size,
                    provider: torrent.provider,
                    magnet: magnet,
                };
            } catch (magnetError) {
                console.error(`Failed to get magnet for ${torrent.title}:`, magnetError);
                return {
                    title: torrent.title,
                    seeds: torrent.seeds,
                    peers: torrent.peers,
                    size: torrent.size,
                    provider: torrent.provider,
                    magnet: null,
                    error: "Failed to retrieve magnet link"
                };
            }
        })
    );

    return {
        message: `Searched torrents for: ${searchQuery}, Type: ${type}`,
        torrents: parsedTorrents,
    }
}


export default searchMags;