const API_KEY = 'a586ab7a154ede644e21b89309ed264a';  // NEVER DO THIS IN PRODUCTION!!!

async function fetchMovies() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();
        displayMovies(data.results, 'movieGrid');
    } catch (error) {
        console.error("Error fetching movies:", error);
        document.getElementById('movieGrid').innerHTML = '<p>Error loading movies.</p>';
    }
}

  async function fetchTVShows() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();
        displayMovies(data.results, 'tvShowGrid');
    } catch (error) {
        console.error("Error fetching tv shows:", error);
        document.getElementById('tvShowGrid').innerHTML = '<p>Error loading tv shows.</p>';
    }
}

function displayMovies(movies, gridId) {
    const movieGrid = document.getElementById(gridId);
    movieGrid.innerHTML = ''; // Clear existing content

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        const imageUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'placeholder.jpg'; // Use a placeholder if no image
        movieCard.innerHTML = `
            <img src="${imageUrl}" alt="${movie.title || movie.name}">
            <div class="movie-info">
                <h3>${movie.title || movie.name}</h3>
                <p>Rating: ${movie.vote_average}</p>
                <a href="details.html?id=${movie.id}&type=${gridId === 'movieGrid' ? 'movie' : 'tv'}" class="button">Details</a>
            </div>
        `;
        movieGrid.appendChild(movieCard);
    });
}



document.addEventListener('DOMContentLoaded', () => {
    fetchMovies();
    fetchTVShows();
});

