const API_KEY = '07d8997d926482e109cc5f7e44851d77';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const searchInput = document.getElementById('searchInput');
const homeButton = document.getElementById('homeButton');
const genreList = document.getElementById('genre-list');
const moviesContainer = document.getElementById('movies-container');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const paginationContainer = document.querySelector('.pagination-buttons');

let allMovies = [];
let currentPage = 1;
const moviesPerPage = 20;
const pagesToFetch = 10;

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function getRandomAvailability() {
    const statuses = [
        { class: 'status-available', text: 'Disponible' },
        { class: 'status-low-stock', text: 'Plus que 1 en stock' },
        { class: 'status-out-of-stock', text: 'En rupture' }
    ];
    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex];
}

function generatePlaceholders(count) {
    let placeholders = '';
    for (let i = 0; i < count; i++) {
        placeholders += `
            <div class="placeholder-card">
                <div class="placeholder-img"></div>
                <div class="placeholder-text" style="width: 80%;"></div>
                <div class="placeholder-text" style="width: 60%;"></div>
                <div class="placeholder-text" style="width: 50%;"></div>
            </div>
        `;
    }
    return placeholders;
}

async function fetchInitialMovies() {
    allMovies = [];
    moviesContainer.innerHTML = generatePlaceholders(moviesPerPage);
    
    for (let page = 1; page <= pagesToFetch; page++) {
        const url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                allMovies = allMovies.concat(data.results);
            } else {
                break;
            }
        } catch (error) {
            moviesContainer.innerHTML = `<p class="loading-message">Erreur lors du chargement des films populaires.</p>`;
            return;
        }
    }
    if (allMovies.length > 0) {
        displayMovies();
    } else {
        moviesContainer.innerHTML = `<p class="loading-message">Aucun film populaire trouvé. Vérifiez votre clé API.</p>`;
    }
}

async function searchMovies(query) {
    if (!query || query.length < 3) {
        fetchInitialMovies();
        return;
    }
    
    allMovies = [];
    currentPage = 1;
    moviesContainer.innerHTML = generatePlaceholders(moviesPerPage);

    try {
        const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            allMovies = data.results;
            displayMovies();
        } else {
            moviesContainer.innerHTML = `<p class="loading-message">Aucun film trouvé pour la recherche "${query}".</p>`;
            paginationContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        moviesContainer.innerHTML = `<p class="loading-message">Erreur lors de la recherche de films.</p>`;
        paginationContainer.style.display = 'none';
    }
}

async function fetchMoviesByGenre(genreId) {
    allMovies = [];
    currentPage = 1;
    moviesContainer.innerHTML = generatePlaceholders(moviesPerPage);

    // Boucle pour charger les 5 premières pages de films par genre
    for (let page = 1; page <= pagesToFetch; page++) {
        const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                allMovies = allMovies.concat(data.results);
            } else {
                break; // Arrête la boucle s'il n'y a plus de résultats
            }
        } catch (error) {
            console.error('Erreur lors de la recherche par genre:', error);
            moviesContainer.innerHTML = `<p class="loading-message">Erreur lors de la recherche de films.</p>`;
            paginationContainer.style.display = 'none';
            return;
        }
    }

    if (allMovies.length > 0) {
        displayMovies();
    } else {
        moviesContainer.innerHTML = `<p class="loading-message">Aucun film trouvé pour ce genre.</p>`;
        paginationContainer.style.display = 'none';
    }
}

async function displayMovies() {
    moviesContainer.classList.add('fade-out');
    await new Promise(resolve => setTimeout(resolve, 300));
    moviesContainer.innerHTML = '';
    
    const start = (currentPage - 1) * moviesPerPage;
    const end = start + moviesPerPage;
    const moviesToDisplay = allMovies.slice(start, end);

    if (moviesToDisplay.length === 0) {
        moviesContainer.innerHTML = `<p class="loading-message">Aucun film à afficher pour le moment.</p>`;
        paginationContainer.style.display = 'none';
        moviesContainer.classList.remove('fade-out');
        return;
    }

    moviesToDisplay.forEach((movie, index) => {
        const availability = getRandomAvailability();
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        const posterPath = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/250x350?text=Image+non+disponible';

        movieCard.innerHTML = `
            <h2>${movie.title}</h2>
            <img src="${posterPath}" alt="${movie.title}">
            <p><strong>Date de sortie :</strong> ${movie.release_date || 'Non disponible'}</p>
            <p><strong>Synopsis :</strong> ${movie.overview || 'Synopsis non disponible.'}</p>
            <div class="availability-label">
                <span class="availability-indicator ${availability.class}"></span>
                <span>${availability.text}</span>
            </div>
        `;
        movieCard.style.animationDelay = `${index * 0.05}s`;
        moviesContainer.appendChild(movieCard);
    });

    moviesContainer.classList.remove('fade-out');
    paginationContainer.style.display = allMovies.length > moviesPerPage ? 'block' : 'none';
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = end >= allMovies.length;
}

// Gestion des événements
const debouncedSearch = debounce((query) => searchMovies(query), 500);
searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value.trim());
});

homeButton.addEventListener('click', () => {
    searchInput.value = '';
    fetchInitialMovies();
});

genreList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        const genreId = e.target.dataset.genreId;
        searchInput.value = '';
        fetchMoviesByGenre(genreId);
    }
});

prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayMovies();
    }
});

nextButton.addEventListener('click', () => {
    if ((currentPage * moviesPerPage) < allMovies.length) {
        currentPage++;
        displayMovies();
    }
});

// Lancement de la récupération des films populaires au chargement initial de la page
fetchInitialMovies();