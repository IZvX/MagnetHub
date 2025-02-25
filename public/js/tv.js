document.addEventListener('DOMContentLoaded', () => {
  // Modal Functionality
  const modifyModal = document.getElementById('modify-modal');
  const closeModal = document.querySelector('.close-modal');
  const saveChangesButton = document.getElementById('save-changes');

  // TMDB Search Functionality (inside the modal)
  const tmdbSearchInput = modifyModal.querySelector('.search-input-aOiJ2');
  const tmdbSearchButton = modifyModal.querySelector('.submit-button');
  const tmdbResultsContainer = document.getElementById('tmdb-results');

  // Main Search Functionality
  const mainSearchBar = document.querySelector('.topwrap .search-input');
  const mainSearchButton = document.querySelector('.topwrap .submit-button');

  // Sidebar Functionality
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const contentDiv = document.getElementById('content'); // Where you'll load content

  // API Key (Replace with your actual key - NEVER hardcode in production)
  const API_KEY = 'a586ab7a154ede644e21b89309ed264a';

  // Helper Functions
  function setActiveSidebarItem(item) {
    sidebarItems.forEach(item => item.classList.remove('active'));
    item.classList.add('active');
  }

  // Generic function to fetch and display media (movies or TV shows)
  async function fetchAndDisplayMedia(name = 'null', type = 'movie', category = 'popular', timeWindow = null, container = contentDiv) {
    try {
      let apiUrl = `https://api.themoviedb.org/3/${type}/${category}`;
      let listName = `${type} ${category}`;

      if (category === 'trending') {
        const trendingType = (type === 'tv') ? 'tv' : 'movie'; // Adjust for the trending endpoint
        const trendingTimeWindow = timeWindow || 'day'; // Default to 'day' if not specified
        apiUrl = `https://api.themoviedb.org/3/trending/${trendingType}/${trendingTimeWindow}`;
        listName = `${type} trending ${trendingTimeWindow}`; // Update list name for trending
      } else if (category === 'top_rated') {
        apiUrl = `https://api.themoviedb.org/3/${type}/top_rated`;
        listName = `${type} top rated`;
      }
      else {
        apiUrl = `https://api.themoviedb.org/3/${type}/${category}`; //Keep Movie and TV
      }

      apiUrl += `?api_key=${API_KEY}&language=en-US&page=1`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.results) {
        displayMediaCards(data.results, container, name); // Pass type and category as list name
      } else {
        container.innerHTML = `<p>No results found for ${listName}.</p>`;
      }
    } catch (error) {
      console.error(`Error fetching ${listName}:`, error);
      container.innerHTML = `<p>Error loading ${listName}.</p>`;
    }
  }


  function MovieScrollList(name) {
    let scrollList = document.createElement("div");
    scrollList.className = "scrolling-cards";
    scrollList.setAttribute("list-id", name);
    scrollList.innerHTML = `
            <div class="info">
              <div class="title">${name}</div>
              <a class="expand" id="expand-button">
                <div class="expand-label">See All</div>
                <svg class="expand-icon" viewBox="0 0 512 512">
                  <path
                    d="M184 400.00000000000006l144-144-144-144"
                    style="
                      stroke: currentcolor;
                      stroke-linecap: round;
                      stroke-linejoin: round;
                      stroke-width: 48;
                      fill: none;
                    "
                  ></path>
                </svg>
              </a>
            </div>
        `;
    let scroll = document.createElement("div");
    scroll.className = "scroll";
    scroll.id = "movie-scroll";
    scrollList.appendChild(scroll); // Now the scroll is correctly appended to the scrollList

    return scrollList; // Only return scrollList now
  }

  function displayMediaCards(media, container, listName) {
    // Clear existing content
    // container.innerHTML = '';

    // Create the MovieScrollList
    const movieList = MovieScrollList(listName);
    const scrollContainer = movieList.querySelector('.scroll'); // Get the inner scroll container

    media.forEach(item => {
      const movieCard = document.createElement('div');
      movieCard.classList.add('card');

      const imageUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'placeholder.jpg'; // Use a placeholder if no image
      const title = item.title || item.name; // Use title for movies, name for TV shows

      // New Card Template
      movieCard.innerHTML = `
                <div class="poster-container poster-with-cursor">

                  <div class="poster-image">
                    <img
                      class="poster-image-img"
                      src="${imageUrl}"
                      alt="${title}"
                      loading="lazy"
                    />
                  </div>

                  <div title="Continue Watching" class="play-icon-wrapper">
                    <svg class="play-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="injected-svg" data-src="https://cdn.hugeicons.com/icons/view-solid-sharp.svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" color="#000000">
                    <path stroke="currentcolor" clip-rule="evenodd" d="M22.5789 12.253C22.3217 12.635 21.8796 13.2917 21.6816 13.5517C21.1666 14.2283 20.4201 15.1324 19.4945 16.0391C17.6728 17.8238 15.0244 19.75 11.9999 19.75C8.97538 19.75 6.32696 17.8238 4.50524 16.0391C3.5797 15.1324 2.83313 14.2283 2.31814 13.5517C2.12021 13.2917 1.67811 12.6351 1.42091 12.2531C1.34289 12.1372 1.28189 12.0466 1.24988 12C1.28189 11.9534 1.34289 11.8628 1.42091 11.7469C1.67811 11.3649 2.12021 10.7083 2.31814 10.4483C2.83313 9.77169 3.5797 8.86758 4.50524 7.96086C6.32696 6.17619 8.97538 4.25 11.9999 4.25C15.0244 4.25 17.6728 6.17619 19.4945 7.96086C20.4201 8.86758 21.1666 9.77169 21.6816 10.4483C21.8796 10.7083 22.3217 11.365 22.5789 11.747C22.6569 11.8628 22.7179 11.9534 22.7499 12C22.7179 12.0466 22.6569 12.1372 22.5789 12.253ZM11.9999 15.5C10.0669 15.5 8.49988 13.933 8.49988 12C8.49988 10.067 10.0669 8.5 11.9999 8.5C13.9329 8.5 15.4999 10.067 15.4999 12C15.4999 13.933 13.9329 15.5 11.9999 15.5Z"></path>
                    </svg>
                    <div class="play-icon-outer"></div>
                    <div class="play-icon-background"></div>
                  </div>
                </div>
                <div class="card-label">
                  <div class="label-text">
                    ${title}
                  </div>
                  <div class="expand-text-label">
                    <svg class="icon" viewBox="0 0 512 512">
                      <path
                        d="M256 293.592c7.4-0.016 14.7-2.22 20.9-6.339 6.2-4.109 11-9.989 13.8-16.872 2.9-6.862 3.6-14.421 2.2-21.719-1.5-7.273-5.1-13.957-10.3-19.247a38.2 38.2 0 0 0-15.7-9.399 37.47 37.47 0 0 0-18.2-0.9c-9.2 1.827-17.3 6.987-22.9 14.481-5.5 7.495-8.1 16.789-7.2 26.078 0.6 6.164 2.7 12.087 6.1 17.234 3.5 5.147 8.1 9.356 13.6 12.246 5.4 2.922 11.5 4.447 17.7 4.437"
                        style="fill: currentcolor"
                      ></path>
                      <path
                        d="M256 418.899c7.4-0.016 14.7-2.22 20.9-6.339 6.2-4.109 11-9.989 13.8-16.872 2.9-6.862 3.6-14.421 2.2-21.719-1.5-7.273-5.1-13.956-10.3-19.246a38.2 38.2 0 0 0-15.7-9.4 37.45 37.45 0 0 0-18.2-0.9c-6.1 1.211-11.7 3.894-16.5 7.814s-8.5 8.955-10.9 14.662-3.3 11.92-2.7 18.075c0.6 6.164 2.7 12.087 6.1 17.234 3.5 5.147 8.1 9.356 13.6 12.246 5.4 2.925 11.5 4.453 17.7 4.445"
                        style="fill: currentcolor"
                      ></path>
                      <path
                        d="M256 168.28199999999998c7.4-0.016 14.7-2.22 20.9-6.339 6.2-4.109 11-9.989 13.8-16.872 2.9-6.862 3.6-14.421 2.2-21.72-1.5-7.273-5.1-13.955-10.3-19.245a38.2 38.2 0 0 0-15.7-9.4 37.45 37.45 0 0 0-18.2-0.9c-6.1 1.211-11.7 3.896-16.5 7.817s-8.5 8.958-10.9 14.666-3.3 11.92-2.7 18.075c0.6 6.164 2.7 12.087 6.1 17.234 3.5 5.147 8.1 9.356 13.6 12.246 5.4 2.922 11.5 4.447 17.7 4.438"
                        style="fill: currentcolor"
                      ></path>
                    </svg>
                  </div>
                </div>
            `;

      scrollContainer.appendChild(movieCard);
    });

    container.appendChild(movieList); // Append the whole movie list (with title and scroll) to the main container
  }

  // TMDB Modal Search Function
  async function searchTMDB(searchTerm) {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${searchTerm}`);
      const data = await response.json();
      displayTMDBResults(data.results);
    } catch (error) {
      console.error("Error searching TMDB:", error);
      tmdbResultsContainer.innerHTML = '<p>Error searching TMDB.</p>';
    }
  }

  function displayTMDBResults(results) {
    tmdbResultsContainer.innerHTML = ''; // Clear existing results
    results.forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.classList.add('tmdb-result-item');
      resultItem.textContent = result.title; // Or any other relevant info

      // Add click handler to select this movie, if needed
      resultItem.addEventListener('click', () => {
        // Handle the selection (e.g., populate a field)
        console.log("Selected movie:", result.title);
        //Potentially also close the modal here:
        modifyModal.style.display = 'none';
      });
      tmdbResultsContainer.appendChild(resultItem);
    });
  }


  // Event Listeners

  // Modal close event
  closeModal.addEventListener('click', () => {
    modifyModal.style.display = 'none';
  });

  //Outside click Modal Close
  window.addEventListener('click', (event) => {
    if (event.target == modifyModal) {
      modifyModal.style.display = "none";
    }
  });


  // TMDB Search button click (inside modal)
  tmdbSearchButton.addEventListener('click', () => {
    const searchTerm = tmdbSearchInput.value.trim();
    if (searchTerm) {
      searchTMDB(searchTerm);
    }
  });

  // TMDB Search input enter press (inside modal)
  tmdbSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const searchTerm = tmdbSearchInput.value.trim();
      if (searchTerm) {
        searchTMDB(searchTerm);
      }
    }
  });


  // Save Changes button click (inside modal)
  saveChangesButton.addEventListener('click', () => {
    // Implement save logic here
    console.log("Save changes clicked");
    modifyModal.style.display = 'none'; // Close modal after saving
  });

  // Main Search
  mainSearchButton.addEventListener('click', () => {
    const searchTerm = mainSearchBar.value.trim();
    if (searchTerm) {
      // search for movies only
      fetchAndDisplayMedia('movie', 'popular');
    }
  });

  //Main search when enter is pressed
  mainSearchBar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const searchTerm = mainSearchBar.value.trim();
      if (searchTerm) {
        // search for movies only
        fetchAndDisplayMedia('movie', 'popular');
      }
    }
  });


  // Sidebar Navigation

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      setActiveSidebarItem(item);
      const gotoDir = item.getAttribute('gotodir');
      if (gotoDir === 'index.html') {
        // Load all the initial lists on home page
        loadHomePageContent();
      } else {
        contentDiv.innerHTML = `<i class="fa-light fa-spinner-third fa-spin"></i>`; // Placeholder
        // In a real app, you'd fetch content based on the 'gotodir' value
      }
    });
  });
  function loadHomePageContent() {
    // Load all the initial lists
    fetchAndDisplayMedia('Popular - TV', 'tv', 'popular');
    fetchAndDisplayMedia('Top Rated - TV', 'tv', 'top_rated');
    fetchAndDisplayMedia('Trending - TV', 'tv', 'trending', 'day');  // Trending movies for the day
  }


  // Initial Load (Home)
  loadHomePageContent();
});