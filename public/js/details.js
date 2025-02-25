const ws = new WebSocket('ws://localhost:8080');


document.addEventListener("DOMContentLoaded", function () {
    const apikey = "a586ab7a154ede644e21b89309ed264a"; // TMDB API key
    const imageBaseUrl = "https://image.tmdb.org/t/p/original"; // Adjust image size as needed

    async function generateEpisodeCards(seasonNumber, tmdbId) {
        try {
            // 1. Fetch Episode Data from TMDB API

            const apiUrl = `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${apikey}`;  // Or remove `&language=fr-FR` for English.  Choose your desired language.
            const apiUrl2 = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apikey}&language=en-US`;  // Or remove `&language=fr-FR` for English.  Choose your desired language.
            const response = await fetch(apiUrl);
            const response2 = await fetch(apiUrl2);

            if (!response.ok) {
                throw new Error(`TMDB API Error: ${response.status} - ${response.statusText}`);
            }

            if (!response2.ok) {
                throw new Error(`TMDB API 2 Error: ${response2.status} - ${response2.statusText}`);
            }

            const data = await response.json();
            const data2 = await response2.json();
            const episodes = data.episodes;
            const posterBaseUrl = "https://image.tmdb.org/t/p/w227_and_h127_bestv2"; // Adjust poster size if needed

            // 2. Generate HTML Cards
            let episodeCardsHTML = '';

            document.getElementById('movie-name').textContent = data2.name;


            episodes.forEach(episode => {
                const episodeTitle = episode.name;
                const episodeNumber = episode.episode_number;
                const episodeAirDate = episode.air_date;  //Format this if needed (e.g., using `new Date(episode.air_date).toLocaleDateString()`)
                const episodeRuntime = episode.runtime || 43; // Default to 43 if runtime is not provided
                const episodeImageUrl = episode.still_path ? `${posterBaseUrl}${episode.still_path}` : 'placeholder_image_url.jpg';  // Use placeholder if no image path
                console.log(data2)
                episodeCardsHTML += `
              <div class="episode">
                <img src="${episodeImageUrl}" alt="${episodeTitle}">
                <div class="episode-title-container">
                  <div class="title">
                    <div class="label">${episodeTitle}</div>
                  </div>
                  <div class="info">
                    <div class="label">${episodeAirDate} • ${episodeRuntime}m</div>
                  </div>
                </div>
                    <div class="icon-container">
                        <svg class="icon downEpisode" showname="${data2.name}" data-season="${seasonNumber}" data-episode="${episodeNumber}" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" d="M9.5 12L12 14.5L14.5 12M12 4.5V13.8912" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                          <path stroke="currentColor" d="M20 16.5L19.7785 17.8288C19.6178 18.7932 18.7834 19.5 17.8057 19.5H6.19425C5.21658 19.5 4.3822 18.7932 4.22147 17.8288L4 16.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>

                    </div>
                  </div>
              </div>
            `;
            });

            return episodeCardsHTML;

        } catch (error) {
            console.error("Error generating episode cards:", error);
            return `<p>Error loading episodes.</p>`; // Or some other appropriate error display
        }
    }

    async function displayEpisodes(season, id, list, numberOfSeasons) {
        const seasonNumber = season;
        const tmdbId = id; // Example: Breaking Bad TMDB ID

        try {
            const episodeCards = await generateEpisodeCards(seasonNumber, tmdbId);
            list.innerHTML = episodeCards; // Replace 'episode-container' with the actual ID of the HTML element where you want to display the cards

            // Attach event listeners to the "downEpisode" buttons *after* the episode cards are generated
            const downEpisodeButtons = document.querySelectorAll('.downEpisode');
            downEpisodeButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const season = this.dataset.season;
                    const episode = this.dataset.episode;
                    const showName = this.getAttribute("showname");// Get the show name from the element
                    // const searchTerm = `${showName} S${String(secason).padStart(2, '0')}E${String(episode).padStart(2, '0')}`; // Create the search term
                    let dropdownContent = document.getElementById("dropdown-content");
                    if (numberOfSeasons > 1) {
                        // more than one season
                        document.getElementById('season').textContent = `S${String(season).padStart(2, '0')}`;
                    } else {
                        // only one season
                        document.getElementById('season').textContent = ``;
                    }

                    if (document.getElementById('season').textContent == '') {
                        const searchTerm = `${showName} - S01E${String(episode).padStart(2, '0')}`; // Create the search term
                        console.log(searchTerm)
                        downloadEpisode(id, type, searchTerm, button); // Call the download function with the search term
                    } else {
                        const searchTerm = `${showName} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`; // Create the search term

                        downloadEpisode(id, type, searchTerm, button); // Call the download function with the search term

                    }
                });
            });

        } catch (error) {
            console.error("Failed to display episodes:", error);
            list.innerHTML = `<p>Failed to load episodes.</p>`;
        }
    }


    // Function to get URL parameters
    function getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const movieId = getUrlParam("id");
    const type = getUrlParam("type"); // 'movie' or 'tv'

    if (!movieId) {
        console.error("No movie ID found in the URL.");
        document.getElementById("summary").textContent =
            "No movie ID provided in the URL.";
        return;
    }

    const isTvShow = type === "tv";

    let sourceList = document.getElementById("download-list-wrapper");
    let eplist = document.getElementById("source-list");
    let dropdownContent = document.getElementById("dropdown-content");

    if (type == 'movie') {
        sourceList.style.opacity = "0";


    }

    console.log("Movie ID:", movieId);
    console.log("Content Type:", type);

    const movieid = document.getElementById("movie-id");

    // These are just for storing information that's no longer coming from Electron.
    // Setting dummy values.  Update these from your own source if necessary.
    movieid.textContent = movieId; // Still useful: keep movieId

    // Determine the API endpoint based on the content type (Movie or TV Show)
    const endpoint = isTvShow
        ? `https://api.themoviedb.org/3/tv/${movieId}?api_key=${apikey}&language=en-US`
        : `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apikey}&language=en-US`;

    // Fetch movie or TV show details
    fetch(endpoint)
        .then((response) => response.json())
        .then((data) => {
            const logoImg = document.getElementById("logo");
            const runtimeLabel = document.getElementById("runtime-label");
            const yearLabel = document.getElementById("year-label");
            const imdbRatingSpan = document.getElementById("rating-label");
            const genresContainer = document.getElementById("genres-container");
            const castContainer = document.getElementById("cast-container");
            const summaryP = document.getElementById("summary");
            const backgroundImg = document.getElementById("background");


            if (type == 'movie') {
                console.log(data)
                console.log(data.title)
                document.getElementById('movie-name').textContent = data.title;
                const releaseDate = data.release_date;
                const year = releaseDate ? releaseDate.substring(0, 4) : null;

                document.getElementById('season').textContent = year;
            }


            // Update the logo and background image
            const imageEndpoint = isTvShow
                ? `https://api.themoviedb.org/3/tv/${movieId}/images?api_key=${apikey}`
                : `https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${apikey}`;

            fetch(imageEndpoint)
                .then((response) => response.json())
                .then((imageData) => {


                    console.log(imageData);
                    const logos = imageData.logos;
                    const originalLanguage = data.original_language; // Store original language

                    if (logos && logos.length > 0) {
                        // Function to score a logo based on language, original language, and aspect ratio
                        const scoreLogo = (logo) => {
                            let score = 0;

                            // Prefer logo with the same language with original title.
                            if (logo.iso_639_1 === originalLanguage) {
                                score += 100; //Highest.
                            }
                            // Prefer English logos
                            if (logo.iso_639_1 === 'en') {
                                score += 150; // Give a high score boost to English
                            }
                            // Add score for alphabet
                            if (logo.iso_639_1 === 'fr') {
                                score += 95;
                            }

                            if (logo.iso_639_1 === 'de') {
                                score += 90;
                            }

                            // Penalize logos in non-Latin scripts (Japanese, Chinese, etc.)
                            if (['ja', 'zh', 'ko', 'ru'].includes(logo.iso_639_1)) {
                                score -= 50;  // Big penalty, can make score negative
                            }

                            // Aspect Ratio Preference (closer to 2.725 is better)
                            score -= Math.abs(logo.aspect_ratio - 2.725); // Subtract the difference, smaller is better

                            return score;
                        };

                        // Sort logos based on score (higher score is better)
                        logos.sort((a, b) => scoreLogo(b) - scoreLogo(a));

                        // Check if the top-scoring logo has a valid file path
                        if (logos[0].file_path) {
                            logoImg.src = imageBaseUrl + logos[0].file_path;
                            logoImg.alt = "Movie Logo";
                        } else {
                            logoImg.alt = "No logo available";
                        }
                    } else {
                        logoImg.alt = "No logo available";
                        logoImg.src = ""; //Clear for safety
                    } const backdrops = imageData.backdrops;

                    // Favor English backdrops, fallback to others if no English ones are available
                    let selectedBackdrop =
                        backdrops.find((backdrop) => backdrop.iso_639_1 === "en") ||
                        backdrops[0];

                    // Update the background image
                    if (selectedBackdrop) {
                        backgroundImg.src = imageBaseUrl + selectedBackdrop.file_path;
                    } else {
                        console.warn("No backdrops available for this content.");
                    }
                });

            // Update runtime and release year
            runtimeLabel.textContent = isTvShow
                ? data.last_episode_to_air?.runtime
                    ? `${data.last_episode_to_air.runtime} min`
                    : "N/A"
                : `${data.runtime || "N/A"} min`;
            yearLabel.textContent = isTvShow
                ? data.first_air_date?.substring(0, 4) || "N/A"
                : data.release_date.substring(0, 4);

            // Update rating and summary
            imdbRatingSpan.textContent = data.vote_average;
            summaryP.textContent = data.overview;



            // Fetch genres
            genresContainer.innerHTML = "";
            data.genres.forEach((genre) => {
                const genreDiv = document.createElement("div");
                genreDiv.classList.add("card", "button-hover-2");
                genreDiv.textContent = genre.name;
                genresContainer.appendChild(genreDiv);
            });

            // Fetch cast
            const creditsEndpoint = isTvShow
                ? `https://api.themoviedb.org/3/tv/${movieId}/credits?api_key=${apikey}`
                : `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apikey}`;

            fetch(creditsEndpoint)
                .then((response) => response.json())
                .then((creditsData) => {
                    castContainer.innerHTML = "";
                    creditsData.cast.slice(0, 3).forEach((castMember) => {
                        const castDiv = document.createElement("div");
                        castDiv.classList.add("card", "button-hover-2");
                        castDiv.textContent = castMember.name;
                        castContainer.appendChild(castDiv);
                    });
                });


            // Populate the dropdown with seasons
            if (isTvShow) {
                const numberOfSeasons = data.number_of_seasons;
                dropdownContent.innerHTML = ""; // Clear existing options

                let validSeasonCount = 0;
                let initialSeason = 1; // default season

                // Async function to check if a season is valid
                // Async function to check if a season is valid
                async function isValidSeason(seasonNumber) { // Marked as 'async'
                    const seasonApiUrl = `https://api.themoviedb.org/3/tv/${movieId}/season/${seasonNumber}?api_key=${apikey}`;
                    const response = await fetch(seasonApiUrl); // 'await' here is fine now

                    if (!response.ok) {
                        console.warn(`Error fetching season ${seasonNumber}:`, response.status);

                        return false; // Treat errors as invalid seasons
                    }

                    const seasonData = await response.json();

                    if (!seasonData.episodes || seasonData.episodes.length === 0) {

                        return false; // No episodes, invalid season
                    }

                    // Check for null properties in episodes.
                    for (const episode of seasonData.episodes) {
                        if (episode.name === null || episode.name === undefined ||
                            episode.episode_number === null || episode.episode_number === undefined ||
                            episode.air_date === null || episode.air_date === undefined) {
                            return false; // Found null/undefined property, invalid season
                        }
                    }

                    return true; // Season has episodes and no null properties
                }

                // Determine number of 'valid' seasons
                for (let i = 1; i <= numberOfSeasons; i++) {
                    async function doStuff() {
                        const isValid = await isValidSeason(i); // AWAIT IT!
                        if (isValid) {
                            validSeasonCount++;
                            console.log(validSeasonCount)

                            if (i => numberOfSeasons) {
                                if (validSeasonCount > 1) {
                                    console.log(validSeasonCount)

                                    // more than one valid season
                                    // document.getElementById('drop-down').style.display = 'block'; // show dropdown
                                    document.getElementById('season').textContent = 'S1';

                                } else {

                                    // only one valid season
                                    console.log(validSeasonCount)

                                    // document.getElementById('drop-down').style.display = 'none'; // hide dropdown
                                    document.getElementById('season').textContent = ''; // empty season label
                                }
                            }
                        }
                    }
                    doStuff();
                }


                document.getElementById('drop-down').addEventListener('mouseover', () => {
                    dropdownContent.style.display = 'block';
                })





                for (let i = 1; i <= numberOfSeasons; i++) {
                    const seasonLink = document.createElement("a");
                    seasonLink.href = "#"; // Prevent page jump
                    seasonLink.textContent = `Season ${i}`;
                    seasonLink.dataset.season = i; // Store season number in data attribute

                    seasonLink.addEventListener("click", function (event) {
                        event.preventDefault(); // Prevent default link behavior
                        // dropdownContent.style.display = 'none';
                        const selectedSeason = parseInt(this.dataset.season); // Get the season number
                        document.getElementById('current-season').textContent = 'Season ' + selectedSeason;
                        displayEpisodes(selectedSeason, movieId, eplist, validSeasonCount); // Load episodes for the selected season
                    });

                    dropdownContent.appendChild(seasonLink);
                }

                displayEpisodes(initialSeason, movieId, eplist, validSeasonCount);

            }
        })
        .catch((error) => {
            console.error("Error fetching TMDB data:", error);
        });


    // formattedTorrents.forEach((torrent) => {
    //   let torrentDiv = document.createElement("div");
    //   torrentDiv.classList.add("source-item");

    //   // Create the label
    //   let labelDiv = document.createElement("div");
    //   labelDiv.classList.add("label");
    //   labelDiv.textContent = "TorrentGalaxy";

    //   // Create the description
    //   let descriptionDiv = document.createElement("div");
    //   descriptionDiv.classList.add("description");
    //   descriptionDiv.innerHTML = `${torrent.title} 👤 ${torrent.leech} 💾 ${torrent.size} ⚙️ TorrentGalaxy`;

    //   // Create the SVG icon
    //   let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    //   svg.classList.add("icon");
    //   svg.setAttribute("viewBox", "0 0 512 512");
    //   let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    //   path.setAttribute(
    //     "d",
    //     "M396.099 246.09999999999945l-231.9-160.6c-1.443-1-3.07-1.71-4.787-2.08a13.3 13.3 0 0 0-5.219-0.08 13.32 13.32 0 0 0-8.594 5.56 13.7 13.7 0 0 0-2.4 7.6v321.4c0.003 1.75 0.352 3.49 1.028 5.11a13.2 13.2 0 0 0 2.91 4.32 13.2 13.2 0 0 0 4.346 2.88c1.624 0.66 3.363 1 5.116 0.99 2.723 0.02 5.383-0.82 7.6-2.4L396.099 268.1999999999998c1.448-1 2.684-2.27 3.639-3.74a13.4 13.4 0 0 0 1.925-4.85 13.35 13.35 0 0 0-2.164-10.01 13.7 13.7 0 0 0-3.4-3.4z"
    //   );
    //   path.setAttribute("style", "fill: currentcolor;");
    //   svg.id = 'play-magnet';
    //   svg.setAttribute('magnet',torrent.magnet)

    //   // Append the elements to the container
    //   torrentDiv.appendChild(labelDiv);
    //   torrentDiv.appendChild(descriptionDiv);
    //   torrentDiv.appendChild(svg);

    //   // Append the new div to the source list
    //   sourceList.appendChild(torrentDiv);
    // });

    function downloadEpisode(id, type, searchTerm, container) {
        animatesvg('Searching torrents!', container)
        fetch("/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: id, type: type, sQuery: searchTerm }),
        })
            .then(response => response.json()) // Parse JSON response
            .then(data => {
                console.log("Server Response:", data);
                if (data.torrents && data.torrents.length > 0) {
                    console.log("Torrents:", data.torrents);
                    document.getElementById('download-modal').style.display = "flex";
                    const list = document.getElementById('download-list');
                    list.innerHTML = '';
                    data.torrents.forEach(torrent => {
                        list.appendChild(createTorrentElement(torrent));
                    });
                } else {
                    console.log("No torrents found.");
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });


    }

});

function animatesvg(text, container) {
    // Find all existing download-animation elements within the container and remove them
    const existingAnimations = container.querySelectorAll('.svg-download-animation');
    existingAnimations.forEach(animation => {
        animation.remove();
    });

    // Create the new download-animation element
    const anim = document.createElement('div');
    anim.className = 'svg-download-animation';

    // Create the text element
    const animtext = document.createElement('div');
    animtext.className = 'text';
    animtext.textContent = text;

    // Append the text element to the animation element
    anim.appendChild(animtext);

    // Append the animation element to the container
    container.parentElement.appendChild(anim);

    // Select the new animation element
    // const animationContainer = anim;

    // Apply the animation
    animtext.style.animation = 'text-rise-fall 1s 1 ease-in-out';

    // Remove the inline style after the animation ends
    animtext.addEventListener('animationend', () => {
        animtext.style.animation = '';
    });
}

document.getElementById('addToLib').addEventListener('click', () => {
    addToLibrary(getUrlParam('id'), getUrlParam('type'));
})

async function addToLibrary(movieId, type) {
    try {
        const response = await fetch("/addlibrary", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                movieId: movieId,
                type: type
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Added to library:", data);
        // Optionally update the UI to reflect that the item has been added
        // For example, change the "Add to Library" button to "Remove from Library"
        return data; // return the response data for further processing
    } catch (error) {
        console.error("Error adding to library:", error);
        // Handle the error appropriately (e.g., display an error message)
        throw error; // Re-throw the error for the calling function to handle, if needed.
    }
}

// Back button (no longer using Electron)
document.getElementById("backButton").addEventListener("click", () => {
    if (
        !document.referrer.toString().includes('downloads.html') ||
        !document.referrer.toString().includes('settings.html') ||
        !document.referrer.toString().includes('details.html')
    ) {
        console.log(document.referrer)
        window.history.back()
    } else {
        window.location.href = 'index.html';
    }
});


const $ = (s, o = document) => o.querySelector(s);
const $$ = (s, o = document) => o.querySelectorAll(s);

gsap.registerPlugin(Physics2DPlugin);

/**
 * Animates the button when the "watch-btn" is clicked.  The animation initiates with the line before the button press.
 */

const button = $('.button'); // Select the button element
const isUpload = button.classList.contains('upload');
const icon = $('.icon', button);
const line = $('.line', icon);

// Proxy object to manage the Y position of the line in the SVG.
const svgPath = new Proxy(
    { y: null },
    {
        set(target, key, value) {
            target[key] = value;
            if (target.y !== null) {
                line.innerHTML = getPath(target.y, 0.25, null);
            }
            return true;
        },
        get(target, key) {
            return target[key];
        }
    }
);

// Initial Y position of the line.  Set this *before* defining the timeline
svgPath.y = 12;

// GSAP timeline for the button animation.
const timeline = gsap.timeline({ paused: true }); // Set to paused initially
let interval;


// Define the animation sequence.
timeline
    .to(icon, {
        '--arrow-y': 6,
        '--arrow-rotate': isUpload ? 70 : 150,
        ease: 'elastic.in(1.1, .8)',
        duration: 0.7,
        onComplete() {
            // Add particle effects when the arrow reaches its initial "launched" state.
            particles(icon, 6, 10, 18, -60, -120);
        }
    })
    .to(icon, {
        '--arrow-y': 0,
        '--arrow-rotate': isUpload ? 45 : 135,
        ease: 'elastic.out(1.1, .8)',
        duration: 0.7
    });

timeline
    .to(
        svgPath,
        {
            y: 15,
            duration: 0.15
        },
        0.65
    )
    .to(
        svgPath,
        {
            y: 12,
            ease: 'elastic.out(1.2, .7)',
            duration: 0.6
        },
        0.8
    );

function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}


function startDownload(magnet) {
    const torrentId = magnet;

    if (!torrentId) {
        return;
    }

    // Send ADD_TORRENT message to the server
    ws.send(JSON.stringify({ type: 'ADD_TORRENT', torrentId: torrentId }));
    // statusDiv.textContent = 'Adding torrent...';
    // torrentIdInput.value = '';  // Clear the input
}


function createTorrentElement(torrent) {
    const container = document.createElement("div");
    container.classList.add("source-item");

    // Create label
    const label = document.createElement("div");
    label.classList.add("label");
    label.textContent = torrent.provider; // You can replace this dynamically if needed

    // Create description
    const description = document.createElement("div");
    description.classList.add("description");
    description.innerHTML = `${torrent.title} 👤 ${torrent.peers} 💾 ${torrent.size} ⚙️ ${torrent.provider}`;

    // Create icon (SVG)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.addEventListener('click', () => {
        startDownload(torrent.magnet);
        console.log(torrent.magnet);
    })
    svg.setAttribute("class", "icon");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.innerHTML = `
        <path stroke="currentColor" d="M9.5 12L12 14.5L14.5 12M12 4.5V13.8912" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
        <path stroke="currentColor" d="M20 16.5L19.7785 17.8288C19.6178 18.7932 18.7834 19.5 17.8057 19.5H6.19425C5.21658 19.5 4.3822 18.7932 4.22147 17.8288L4 16.5" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
    `;

    // Append elements
    container.appendChild(label);
    container.appendChild(description);
    container.appendChild(svg);

    return container;
}



// Watch button (no longer using Electron. Implement your own logic here)
document.getElementById("watch-btn").addEventListener("click", function () {

    animate('Starting download!')
    fetch("/download", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            id: getUrlParam("id"),
            type: getUrlParam("type"),
            sQuery: `${document.getElementById('movie-name').textContent} ${document.getElementById('season').textContent}`
        }),
    })
        .then(response => response.json()) // Parse JSON response
        .then(data => {
            console.log("Server Response:", data);
            if (data.torrents && data.torrents.length > 0) {
                console.log("Torrents:", data.torrents);
                document.getElementById('download-modal').style.display = "flex";
                const list = document.getElementById('download-list');
                list.innerHTML = '';
                data.torrents.forEach(torrent => {
                    list.appendChild(createTorrentElement(torrent));
                });
            } else {
                console.log("No torrents found.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });

    function animate(text) {
        const animationContainer = document.querySelector(".download-animation .text");
        animationContainer.textContent = text;

        animationContainer.style = 'animation: text-rise-fall 1s 1 ease-in-out;';
        animationContainer.addEventListener('animationend', () => {
            animationContainer.style = '';
        })
    }
    //download animation
    timeline.restart(); // Restart the timeline on click.
    clearInterval(interval);




});

/**
 * Calculates the control points for a smooth curve between points.
 * @param {array} point - The current point.
 * @param {number} i - The index of the current point.
 * @param {array} a - The array of all points.
 * @param {number} smoothing - The smoothing factor.
 * @returns {string} - The SVG path command for the curve.
 */
function getPoint(point, i, a, smoothing) {
    const cp = (current, previous, next, reverse) => {
        const p = previous || current;
        const n = next || current;
        const o = {
            length: Math.sqrt(Math.pow(n[0] - p[0], 2) + Math.pow(n[1] - p[1], 2)),
            angle: Math.atan2(n[1] - p[1], n[0] - p[0])
        };
        const angle = o.angle + (reverse ? Math.PI : 0);
        const length = o.length * smoothing;
        return [current[0] + Math.cos(angle) * length, current[1] + Math.sin(angle) * length];
    };

    const cps = cp(a[i - 1], a[i - 2], point, false);
    const cpe = cp(point, a[i - 1], a[i + 1], true);
    return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
}

/**
 * Generates an SVG path string for a curved line.
 * @param {number} update - The value to update the Y coordinate of the middle point.
 * @param {number} smoothing - The smoothing factor for the curve.
 * @param {array} pointsNew - Optional array of points to use. If not provided, default points are used.
 * @returns {string} - The SVG path string.
 */
function getPath(update, smoothing, pointsNew) {
    const points = pointsNew
        ? pointsNew
        : [
            [5, 12],
            [12, update],
            [19, 12]
        ];

    const d = points.reduce(
        (acc, point, i, a) => (i === 0 ? `M ${point[0]},${point[1]}` : `${acc} ${getPoint(point, i, a, smoothing)}`),
        ''
    );
    return `<path d="${d}" />`;
}


/**
 * Creates particle effects.
 * @param {HTMLElement} parent - The parent element to append the particles to.
 * @param {number} quantity - The number of particles to create.
 * @param {number} x - The initial X position of the particles.
 * @param {number} y - The initial Y position of the particles.
 * @param {number} minAngle - The minimum angle for the particle trajectory.
 * @param {number} maxAngle - The maximum angle for the particle trajectory.
 */
function particles(parent, quantity, x, y, minAngle, maxAngle) {
    const minScale = 0.07;
    const maxScale = 0.5;

    for (let i = quantity - 1; i >= 0; i--) {
        const angle = minAngle + Math.random() * (maxAngle - minAngle);
        const scale = minScale + Math.random() * (maxScale - minScale);
        const velocity = 12 + Math.random() * (80 - 60);
        const dot = document.createElement('div');
        dot.className = 'dot';
        parent.appendChild(dot);

        gsap.set(dot, {
            opacity: 1,
            x: x,
            y: y,
            scale: scale
        });

        gsap.timeline({
            onComplete() {
                dot.remove();
            }
        })
            .to(dot, 1.2, {
                physics2D: {
                    angle: angle,
                    velocity: velocity,
                    gravity: 20
                }
            })
            .to(dot, 0.4, {
                opacity: 0
            }, 0.8);
    }
}

document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('download-modal').style.display = 'none';
})