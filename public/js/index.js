document.addEventListener('DOMContentLoaded', () => {
  // Modal Functionality
  const modifyModal = document.getElementById('modify-modal');
  const closeModal = document.querySelector('.close-modal');
  const saveChangesButton = document.getElementById('save-changes');

  //  Search Functionality (inside the modal)
  const steamSearchInput = modifyModal.querySelector('.search-input-aOiJ2');
  const steamSearchButton = modifyModal.querySelector('.submit-button');
  const steamResultsContainer = document.getElementById('igdb-results'); // Keep id as is

  // Main Search Functionality
  const mainSearchBar = document.querySelector('.topwrap .search-input');
  const mainSearchButton = document.querySelector('.topwrap .submit-button');

  // Sidebar Functionality
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const contentDiv = document.getElementById('content'); // Where you'll load content

  // Helper Functions
  function setActiveSidebarItem(item) {
    sidebarItems.forEach(item => item.classList.remove('active'));
    item.classList.add('active');
  }

  // Generic function to fetch and display games from Steam
  async function fetchAndDisplaySteamGames(search = null, category = 'popular', container = contentDiv) {
    try {
      let apiUrl = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/';
      let listName = `Games ${category}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data && data.applist && data.applist.apps) {
        let games = data.applist.apps;

        // Filter by search term if provided
        if (search) {
          games = games.filter(game => game.name.toLowerCase().includes(search.toLowerCase()));
        }

        // Limit to 20 results for display
        games = games.slice(0, 20);

        displayGameCards(games, container, listName, 'steam');
      } else {
        container.innerHTML = `<p>No results found for ${listName}.</p>`;
      }
    } catch (error) {
      console.error(`Error fetching ${listName} from Steam:`, error);
      container.innerHTML = `<p>Error loading ${listName}.</p>`;
    }
  }

  function GameScrollList(name) {
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
    scroll.id = "game-scroll"; // Changed ID to be game specific
    scrollList.appendChild(scroll); // Now the scroll is correctly appended to the scrollList

    return scrollList; // Only return scrollList now
  }

  function displayGameCards(games, container, listName, source = 'steam') {
    // Clear existing content
    const movieList = GameScrollList(listName);
    const scrollContainer = movieList.querySelector('.scroll');

    games.forEach(game => {
      const gameCard = document.createElement('div');
      gameCard.classList.add('card');

      // Adjust the image url for game vs movies (also use https:)
      let imageUrl;
      if (source === 'steam') {
        // Steam doesn't provide images directly through THIS API.  You'll likely need to use the SteamGridDB API or similar to retrieve images based on the appid.
        //  Example (requires you to obtain an API key from SteamGridDB):
        const appId = game.appid;
        imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`; // Standard Header Image

        // Alternative (SteamGridDB - requires an API key which is against instructions, leave out for now)
        //imageUrl = `https://www.steamgriddb.com/api/v2/search/autocomplete?q=${game.name}`; // This is just an example, you'd need to handle the API response and extract the image URL
        // Another option is using local placeholders and let the user configure it with the SteamID (appId)
      } else {
        // This branch is unreachable now, since IGDB search functionality is gone
        imageUrl = game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : 'placeholder.jpg'; // Use a placeholder if no image
      }

      const title = game.name;

      gameCard.innerHTML = `
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

      gameCard.addEventListener('click', () => {
        // Modify this URL as needed to match your game details page.
        //  Using the Steam appid.
        const appId = game.appid;
        window.location.href = `game-details.html?appid=${appId}`;
      });

      scrollContainer.appendChild(gameCard);
    });

    container.appendChild(movieList);
  }

  // Steam Modal Search Function
  async function searchSteam(searchTerm) {
    try {
      const response = await fetch('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
      const data = await response.json();

      if (data && data.applist && data.applist.apps) {
        let games = data.applist.apps;
        games = games.filter(game => game.name.toLowerCase().includes(searchTerm.toLowerCase()));
        games = games.slice(0, 10);
        displaySteamResults(games);
      } else {
        steamResultsContainer.innerHTML = '<p>Error searching Steam.</p>';
      }

    } catch (error) {
      console.error("Error searching Steam:", error);
      steamResultsContainer.innerHTML = '<p>Error searching Steam.</p>';
    }
  }

  function displaySteamResults(results) {
    steamResultsContainer.innerHTML = ''; // Clear existing results
    results.forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.classList.add('igdb-result-item'); // Reuse class name
      resultItem.textContent = result.name; // Or any other relevant info

      // Add click handler to select this game, if needed
      resultItem.addEventListener('click', () => {
        // Handle the selection (e.g., populate a field)
        console.log("Selected game:", result.name);
        // Potentially also close the modal here:
        modifyModal.style.display = 'none';
      });
      steamResultsContainer.appendChild(resultItem);
    });
  }

  // Event Listeners

  // Modal close event
  closeModal.addEventListener('click', () => {
    modifyModal.style.display = 'none';
  });

  // Outside click Modal Close
  window.addEventListener('click', (event) => {
    if (event.target == modifyModal) {
      modifyModal.style.display = "none";
    }
  });

  // Steam Search button click (inside modal)
  steamSearchButton.addEventListener('click', () => {
    const searchTerm = steamSearchInput.value.trim();
    if (searchTerm) {
      searchSteam(searchTerm);
    }
  });

  // Main Search button click
  mainSearchButton.addEventListener('click', () => {
    const searchTerm = mainSearchBar.value.trim();
    if (searchTerm) {
      window.location.href = 'search.html?query=' + searchTerm;
    }
  });

  // Main Search input enter press (inside modal)
  mainSearchBar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const searchTerm = mainSearchBar.value.trim();
      if (searchTerm) {
        window.location.href = 'search.html?query=' + searchTerm;
      }
    }
  });

  // Save Changes button click (inside modal)
  saveChangesButton.addEventListener('click', () => {
    // Implement save logic here
    console.log("Save changes clicked");
    modifyModal.style.display = 'none'; // Close modal after saving
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
    const currentPage = window.location.pathname.split('/').pop(); // Get the current filename

    switch (currentPage) {
      case 'index.html':
        fetchAndDisplaySteamGames(null, 'popular');
        break;
      default:
        break;
    }
    // Load all the initial lists
  }

  // Initial Load (Home)
  loadHomePageContent();
});