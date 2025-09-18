const BASE_URL = 'https://www.sankavollerei.com';
// Temporarily using main API for Nekopoi testing
// const NEKOPOI_BASE_URL = 'https://cu8auck2lc.3z094n2681i06q8k14w31cu4q80d5p.com/330cceade91a6a9cd30fb8042222ed56/71b8acf33b508c7543592acd9d9eb70d';
const NEKOPOI_BASE_URL = BASE_URL; // Use main API temporarily

// Nekopoi specific configuration
// NEKOPOI_URL: "https://nekopoi.care" (original website)
// BASE_URL: Custom API endpoint for Nekopoi data
const NEKOPOI_HEADERS = {
    "appbuildcode": "25032",
    "appsignature": "pOplm8IDEDGXN55IaYohQ8CzJFvWsfXyhGvwPRD9kWgzYSRuuvAOPfsE0AJbHVbAJyWGsGCNUIuQLJ7HbMbuFLMWwDgHNwxOrYMH",
    "token": "XbGSFkQsJYbFC6pcUMCFL4oNHULvHU7WdDAXYgpmqYlh7p5ZCQ4QZ13GDgowiOGvAejz9X5H6DYvEQBMrc3A17SO3qwLwVkbn6YY",
    "user-agent": "okhttp/4.9.0",
    "Accept": "application/json",
    "Content-Type": "application/json"
};

// DOM elements
const sections = document.querySelectorAll('section');
const homeContent = document.getElementById('homeContent');
const searchContent = document.getElementById('searchContent');
const ongoingContent = document.getElementById('ongoingContent');
const completedContent = document.getElementById('completedContent');
const genresContent = document.getElementById('genresContent');
const animeDetailContent = document.getElementById('animeDetailContent');
const episodeDetailContent = document.getElementById('episodeDetailContent');
const searchInput = document.getElementById('searchInput');

// Navigation history
let currentSection = 'home';
let previousSection = 'home';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
    loadGenres();
});

// Navigation
function showSection(sectionId) {
    // Update navigation history
    if (currentSection !== sectionId) {
        previousSection = currentSection;
        currentSection = sectionId;
    }

    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    // Handle search bar visibility
    const searchBar = document.querySelector('.search-bar');
    if (sectionId === 'search') {
        searchBar.classList.add('show');
        // Add title for search section if not already present
        if (!searchContent.querySelector('h2')) {
            const title = document.createElement('h2');
            title.textContent = 'Search Anime';
            searchContent.insertBefore(title, searchContent.firstChild);
        }
    } else {
        searchBar.classList.remove('show');
    }
}

// API fetch helper
async function fetchAPI(endpoint, source = 'default') {
    // Choose base URL and headers based on source
    const baseUrl = source === 'nekopoi' ? NEKOPOI_BASE_URL : BASE_URL;
    const headers = source === 'nekopoi' ? NEKOPOI_HEADERS : {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    try {
        console.log(`Fetching from ${source}: ${baseUrl}${endpoint}`);

        // Use standard CORS mode for all sources (including Nekopoi with main API)
        const fetchOptions = {
            method: 'GET',
            headers: headers
        };

        const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);

        // Handle responses for all sources (including Nekopoi with main API)

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Response is not JSON for', endpoint);
            return null;
        }

        const data = await response.json();
        console.log(`✅ Success from ${source}:`, data);
        return data;
    } catch (error) {
        console.error(`❌ Fetch error for ${source} - ${endpoint}:`, error);

        // CORS fallback for non-Nekopoi sources
        if (source !== 'nekopoi' && error.name === 'TypeError' && error.message.includes('CORS')) {
            try {
                const response = await fetch(`${baseUrl}${endpoint}`, {
                    method: 'GET',
                    mode: 'no-cors'
                });
                return { error: 'CORS_RESTRICTED', message: 'Data may not be accessible due to CORS policy' };
            } catch (corsError) {
                console.error('No-cors fallback also failed for', endpoint, ':', corsError);
            }
        }

        return null;
    }
}

// Change home source
function changeHomeSource(source) {
    currentHomeSource = source;
    console.log(`Home source changed to: ${source}`);
    // Reload home with new source
    loadHome();
}

// Load home page
async function loadHome() {
    homeAnimeData = [];

    showLoading(homeContent);

    // Use specific endpoint for each source
    let endpoint = '';
    let source = 'default';

    switch (currentHomeSource) {
        case 'otakudesu':
            endpoint = '/anime/home';
            source = 'otakudesu';
            break;
        case 'samehadaku':
            endpoint = '/anime/samehadaku/home';
            source = 'samehadaku';
            break;
        case 'kuramanime':
            endpoint = '/anime/kura/home';
            source = 'kuramanime';
            break;
        case 'stream':
            endpoint = '/anime/stream/latest';
            source = 'stream';
            break;
        case 'nekopoi':
            endpoint = '/anime/neko/release/1';
            source = 'nekopoi';
            break;
        default:
            endpoint = '/anime/home';
            source = 'default';
    }

    const data = await fetchAPI(endpoint, source);
    if (data) {
        displayHomeAnime(data, true);
    } else {
        showError(homeContent);
    }
}

// Load more home anime (disabled - API doesn't support home pagination)
async function loadMoreHomeAnime() {
    // The home API doesn't support pagination, so we can't load more
    // Remove the load more button since it won't work
    const existingButton = document.getElementById('home').querySelector('.load-more-btn');
    if (existingButton) {
        existingButton.remove();
    }

    // Optionally show a message to the user
    console.log('Home pagination not supported by API - all available anime already displayed');
}


// Load ongoing anime
async function loadOngoing(page = 1) {
    showLoading(ongoingContent);
    let endpoint = '';
    let source = 'default';

    switch (currentHomeSource) {
        case 'otakudesu':
            endpoint = `/anime/ongoing-anime?page=${page}`;
            source = 'otakudesu';
            break;
        case 'samehadaku':
            endpoint = `/anime/samehadaku/ongoing?page=${page}`;
            source = 'samehadaku';
            break;
        case 'kuramanime':
            // Kuramanime doesn't have specific ongoing endpoint, use home
            endpoint = '/anime/kura/home';
            source = 'kuramanime';
            break;
        case 'stream':
            endpoint = `/anime/stream/latest?page=${page}`;
            source = 'stream';
            break;
        case 'nekopoi':
            endpoint = `/anime/neko/release/${page}`;
            source = 'nekopoi';
            break;
        default:
            endpoint = `/anime/ongoing-anime?page=${page}`;
            source = 'default';
    }

    const data = await fetchAPI(endpoint, source);
    if (data) {
        displayOngoingAnime(data, true);
    } else {
        showError(ongoingContent);
    }
}

// Load completed anime
async function loadCompleted(page = 1) {
    showLoading(completedContent);
    let endpoint = '';
    let source = 'default';

    switch (currentHomeSource) {
        case 'otakudesu':
            endpoint = `/anime/complete-anime/${page}`;
            source = 'otakudesu';
            break;
        case 'samehadaku':
            endpoint = `/anime/samehadaku/completed?page=${page}`;
            source = 'samehadaku';
            break;
        case 'kuramanime':
            // Kuramanime doesn't have specific completed endpoint, use home
            endpoint = '/anime/kura/home';
            source = 'kuramanime';
            break;
        case 'stream':
            endpoint = `/anime/stream/movie/page/${page}`;
            source = 'stream';
            break;
        case 'nekopoi':
            // Nekopoi doesn't have completed, use release
            endpoint = `/anime/neko/release/${page}`;
            source = 'nekopoi';
            break;
        default:
            endpoint = `/anime/complete-anime/${page}`;
            source = 'default';
    }

    const data = await fetchAPI(endpoint, source);
    if (data) {
        displayCompletedAnime(data, true);
    } else {
        showError(completedContent);
    }
}

// Load genres
async function loadGenres() {
    const data = await fetchAPI('/anime/genre', 'default');
    if (data) {
        // Add title and description for genres section
        genresContent.innerHTML = `
            <h2>Anime Genres</h2>
            <p style="text-align: center; color: #ccc; margin-bottom: 1.5rem; font-size: 0.9rem;">
                Discover anime by your favorite genres
            </p>
        `;
        displayGenres(data);
    }
}

// Search anime
async function searchAnime() {
    const query = searchInput.value.trim();
    if (!query) return;

    showSection('search');
    showLoading(searchContent);

    // Try multiple sources
    const sources = ['otakudesu', 'samehadaku', 'kuramanime', 'stream', 'nekopoi'];
    let results = [];

    for (const source of sources) {
        let endpoint = '';
        switch (source) {
            case 'otakudesu':
                endpoint = `/anime/search/${encodeURIComponent(query)}`;
                break;
            case 'samehadaku':
                endpoint = `/anime/samehadaku/search?q=${encodeURIComponent(query)}`;
                break;
            case 'kuramanime':
                endpoint = `/anime/kura/search/${encodeURIComponent(query)}`;
                break;
            case 'stream':
                endpoint = `/anime/stream/search/${encodeURIComponent(query)}`;
                break;
            case 'nekopoi':
                endpoint = `/anime/neko/search/${encodeURIComponent(query)}`;
                break;
        }

        const data = await fetchAPI(endpoint, source);
        if (data) {
            // Handle normal API responses (including Nekopoi with main API)
            {
                // Handle normal API responses
                let searchResults = [];
                if (Array.isArray(data)) {
                    searchResults = data;
                } else if (data.data && Array.isArray(data.data)) {
                    searchResults = data.data;
                } else if (data.results && Array.isArray(data.results)) {
                    searchResults = data.results;
                } else if (data.anime && Array.isArray(data.anime)) {
                    searchResults = data.anime;
                } else if (typeof data === 'object' && !Array.isArray(data)) {
                    // If it's an object with numeric keys, convert to array
                    searchResults = Object.values(data).filter(item => typeof item === 'object' && (item.title || item.name || item.url));
                }

                if (searchResults.length > 0) {
                    console.log(`✅ Found ${searchResults.length} results from ${source}`);
                    results = results.concat(searchResults.map(item => ({ ...item, source })));
                } else {
                    console.log(`⚠️ No results from ${source}`);
                }
            }
        }
    }

    if (results.length > 0) {
        // Display search results with home-style formatting
        displaySearchResults(results, searchContent);
    } else {
        showError(searchContent, 'No results found');
    }
}

// Display anime list
function displayAnimeList(data, container) {
    if (!data) {
        showError(container);
        return;
    }

    // Handle error responses
    if (data.error) {
        showError(container, data.message || 'API Error occurred');
        return;
    }

    // Handle different response structures
    let animeList = [];

    // Check most specific conditions first
    if (data.data && data.data.anime && Array.isArray(data.data.anime)) {
        animeList = data.data.anime;  // For genre responses: {data: {anime: [...]}}
    } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        // Handle different nested structures
        const nestedData = data.data;

        // Handle ongoing/completed structure: {data: {ongoingAnimeData: [...], completeAnimeData: [...], paginationData: {...}}}
        if (nestedData.ongoingAnimeData && Array.isArray(nestedData.ongoingAnimeData)) {
            animeList = nestedData.ongoingAnimeData;
        } else if (nestedData.completeAnimeData && Array.isArray(nestedData.completeAnimeData)) {
            animeList = nestedData.completeAnimeData;
        }
        // Handle home page structure: {data: {ongoing_anime: [...], complete_anime: [...]}}
        else if (nestedData.ongoing_anime && Array.isArray(nestedData.ongoing_anime)) {
            animeList = animeList.concat(nestedData.ongoing_anime);
            if (nestedData.complete_anime && Array.isArray(nestedData.complete_anime)) {
                animeList = animeList.concat(nestedData.complete_anime);
            }
        }
    } else if (Array.isArray(data)) {
        animeList = data;
    } else if (data.data && Array.isArray(data.data)) {
        animeList = data.data;
    } else if (data.anime && Array.isArray(data.anime)) {
        animeList = data.anime;
    } else if (data.results && Array.isArray(data.results)) {
        animeList = data.results;
    } else if (data.list && Array.isArray(data.list)) {
        animeList = data.list;
    } else {
        // If it's an object with anime properties, convert to array
        animeList = Object.values(data).filter(item => typeof item === 'object' && (item.title || item.name));
    }

    if (animeList.length === 0) {
        showError(container, 'No anime data found');
        return;
    }

    container.innerHTML = '';
    animeList.forEach(anime => {
        const animeCard = createAnimeCard(anime);
        container.appendChild(animeCard);
    });
}

// Create anime card
function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';

    // Store anime data for click handler
    card.onclick = () => {
        const animeData = {...anime, source: anime.source || currentHomeSource};
        loadAnimeDetail(animeData, animeData.source);
    };

    const imageUrl = anime.poster || anime.thumbnail || anime.image || anime.img || anime.cover || anime.banner || anime.photo || 'https://via.placeholder.com/250x300?text=No+Image';
    const title = anime.title || anime.name || 'Unknown Title';
    const status = anime.status || anime.current_episode || anime.episode_count || '';
    const score = anime.score || anime.rating || '';
    const releaseInfo = anime.release_day ? `• ${anime.release_day}` : '';
    const episodeInfo = anime.current_episode && anime.current_episode !== status ? `• ${anime.current_episode}` :
                        anime.episode_count && anime.episode_count !== status ? `• ${anime.episode_count} Episodes` : '';

    card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjEyNSIgeT0iMTUwIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIiBmb250LXNpemU9IjE0Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='; this.onerror=null;">
        <div class="info">
            <h3>${title}</h3>
            <p>${status} ${score ? `• ${score}` : ''} ${releaseInfo} ${episodeInfo}</p>
        </div>
    `;

    return card;
}

// Display genres
function displayGenres(data) {
    if (!data) return;

    // Handle different response structures
    let genreList = [];
    if (Array.isArray(data)) {
        genreList = data;
    } else if (data.data && Array.isArray(data.data)) {
        genreList = data.data;
    } else if (data.genres && Array.isArray(data.genres)) {
        genreList = data.genres;
    } else if (data.list && Array.isArray(data.list)) {
        genreList = data.list;
    }

    if (genreList.length === 0) return;

    genresContent.innerHTML = '';

    genreList.forEach((genre, index) => {
        const genreItem = document.createElement('div');
        genreItem.className = 'genre-item';

        // Add some visual variety with different colors for different genres
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
        const colorIndex = index % colors.length;
        genreItem.style.setProperty('--genre-color', colors[colorIndex]);

        genreItem.innerHTML = `
            <span class="genre-name">${genre.name || genre.title || genre.genre}</span>
            <span class="genre-icon">🎭</span>
        `;
        genreItem.onclick = () => loadGenreAnime(genre.slug || genre.id || genre.genreId);
        genresContent.appendChild(genreItem);
    });
}

// Global variables for pagination
let currentGenrePage = 1;
let currentGenreSlug = '';
let hasMoreGenrePages = true;

// Global source selection for home page
let currentHomeSource = 'default';

// Home page variables (pagination disabled - API doesn't support it)
let homeAnimeData = [];

// Load anime by genre
async function loadGenreAnime(genreSlug, page = 1) {
    // If loading first page of a new genre, reset pagination
    if (page === 1 || genreSlug !== currentGenreSlug) {
        currentGenreSlug = genreSlug;
        currentGenrePage = 1;
        hasMoreGenrePages = true;
        showSection('search');
        showLoading(searchContent);
    }

    // Try different possible endpoints for genre anime
    let data = null;
    const endpoints = [
        `/anime/genre/${genreSlug}?page=${page}`,
        `/anime/genre/${genreSlug}/page/${page}`,
        `/anime/genres/${genreSlug}?page=${page}`,
        `/anime/genres/${genreSlug}/page/${page}`
    ];

    for (const endpoint of endpoints) {
        data = await fetchAPI(endpoint, 'default'); // Use default source for genres

        if (data && !data.error) {
            // Check if data contains anime information
            const hasAnimeData = (
                Array.isArray(data) ||
                (data.data && Array.isArray(data.data)) ||
                (data.data && typeof data.data === 'object' && (
                    data.data.anime || data.data.results || data.data.list ||
                    data.data.ongoingAnimeData || data.data.completeAnimeData ||
                    Object.keys(data.data).some(key => Array.isArray(data.data[key]))
                ))
            );

            if (hasAnimeData) {
                break;
            }
        }
    }

    if (data && !data.error) {
        // Check if there are more pages
        const pagination = data.data?.pagination || data.pagination;
        if (pagination) {
            hasMoreGenrePages = pagination.has_next_page || false;
            currentGenrePage = pagination.current_page || page;
        }

        displayGenreAnime(data, page === 1);
    } else {
        showError(searchContent, `No anime found for genre: ${genreSlug}`);
        hasMoreGenrePages = false;
    }
}

// Display ongoing anime with home-style formatting
function displayOngoingAnime(data, isFirstPage = true) {
    if (!data) {
        showError(ongoingContent);
        return;
    }

    // Handle error responses
    if (data.error) {
        showError(ongoingContent, data.message || 'API Error occurred');
        return;
    }

    // Extract ongoing anime from response based on source
    let ongoingAnimeList = [];

    // Check if data is directly at root level (Kuramanime case)
    if (currentHomeSource === 'kuramanime' && typeof data === 'object' && !Array.isArray(data) && !data.data) {
        // Kuramanime structure: {ongoing: [...]}
        if (data.ongoing && Array.isArray(data.ongoing)) {
            ongoingAnimeList = data.ongoing;
        }
    } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        const nestedData = data.data;

        if (currentHomeSource === 'samehadaku') {
            // Samehadaku structure: {ongoingAnimeData: [...]}
            if (nestedData.ongoingAnimeData && Array.isArray(nestedData.ongoingAnimeData)) {
                ongoingAnimeList = nestedData.ongoingAnimeData;
            }
        } else if (currentHomeSource === 'stream') {
            // Stream structure
            if (Array.isArray(nestedData)) {
                ongoingAnimeList = nestedData;
            } else if (nestedData.anime && Array.isArray(nestedData.anime)) {
                ongoingAnimeList = nestedData.anime;
            }
        } else if (currentHomeSource === 'nekopoi') {
            // Nekopoi structure
            if (Array.isArray(nestedData)) {
                ongoingAnimeList = nestedData;
            } else if (nestedData.anime && Array.isArray(nestedData.anime)) {
                ongoingAnimeList = nestedData.anime;
            }
        } else {
            // Default/Otakudesu structure
            if (nestedData.ongoingAnimeData && Array.isArray(nestedData.ongoingAnimeData)) {
                ongoingAnimeList = nestedData.ongoingAnimeData;
            }
        }
    } else if (Array.isArray(data.data)) {
        ongoingAnimeList = data.data;
    } else if (Array.isArray(data)) {
        ongoingAnimeList = data;
    }

    if (ongoingAnimeList.length === 0) {
        showError(ongoingContent, 'No ongoing anime data found');
        return;
    }

    // If first page, clear content and add title
    if (isFirstPage) {
        const sourceName = currentHomeSource === 'default' ? 'All Sources' : currentHomeSource.charAt(0).toUpperCase() + currentHomeSource.slice(1);
        ongoingContent.innerHTML = `
            <h2>Ongoing Anime (${sourceName})</h2>
            <div id="ongoingAnimeGrid" class="anime-grid"></div>
        `;
    }

    const grid = document.getElementById('ongoingAnimeGrid') || ongoingContent.querySelector('.anime-grid');

    // Append new anime cards
    ongoingAnimeList.forEach(anime => {
        const animeCard = createAnimeCard(anime);
        grid.appendChild(animeCard);
    });
}

// Display completed anime with home-style formatting
function displayCompletedAnime(data, isFirstPage = true) {
    if (!data) {
        showError(completedContent);
        return;
    }

    // Handle error responses
    if (data.error) {
        showError(completedContent, data.message || 'API Error occurred');
        return;
    }

    // Extract completed anime from response based on source
    let completedAnimeList = [];

    // Check if data is directly at root level (Kuramanime case)
    if (currentHomeSource === 'kuramanime' && typeof data === 'object' && !Array.isArray(data) && !data.data) {
        // Kuramanime structure: {completed: [...]}
        if (data.completed && Array.isArray(data.completed)) {
            completedAnimeList = data.completed;
        }
    } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        const nestedData = data.data;

        if (currentHomeSource === 'samehadaku') {
            // Samehadaku structure: {completeAnimeData: [...]}
            if (nestedData.completeAnimeData && Array.isArray(nestedData.completeAnimeData)) {
                completedAnimeList = nestedData.completeAnimeData;
            }
        } else if (currentHomeSource === 'stream') {
            // Stream structure
            if (Array.isArray(nestedData)) {
                completedAnimeList = nestedData;
            } else if (nestedData.anime && Array.isArray(nestedData.anime)) {
                completedAnimeList = nestedData.anime;
            }
        } else if (currentHomeSource === 'nekopoi') {
            // Nekopoi structure
            if (Array.isArray(nestedData)) {
                completedAnimeList = nestedData;
            } else if (nestedData.anime && Array.isArray(nestedData.anime)) {
                completedAnimeList = nestedData.anime;
            }
        } else {
            // Default/Otakudesu structure
            if (nestedData.completeAnimeData && Array.isArray(nestedData.completeAnimeData)) {
                completedAnimeList = nestedData.completeAnimeData;
            }
        }
    } else if (Array.isArray(data.data)) {
        completedAnimeList = data.data;
    } else if (Array.isArray(data)) {
        completedAnimeList = data;
    }

    if (completedAnimeList.length === 0) {
        showError(completedContent, 'No completed anime data found');
        return;
    }

    // If first page, clear content and add title
    if (isFirstPage) {
        const sourceName = currentHomeSource === 'default' ? 'All Sources' : currentHomeSource.charAt(0).toUpperCase() + currentHomeSource.slice(1);
        completedContent.innerHTML = `
            <h2>Completed Anime (${sourceName})</h2>
            <div id="completedAnimeGrid" class="anime-grid"></div>
        `;
    }

    const grid = document.getElementById('completedAnimeGrid') || completedContent.querySelector('.anime-grid');

    // Append new anime cards
    completedAnimeList.forEach(anime => {
        const animeCard = createAnimeCard(anime);
        grid.appendChild(animeCard);
    });
}

// Display search results with home-style formatting
function displaySearchResults(results, container) {
    // Group results by source for better organization
    const resultsBySource = {};
    results.forEach(anime => {
        const source = anime.source || 'unknown';
        if (!resultsBySource[source]) {
            resultsBySource[source] = [];
        }
        resultsBySource[source].push(anime);
    });

    // Clear container and add title
    container.innerHTML = `
        <h2>Search Results</h2>
        <div class="search-summary">
            <p>Found ${results.length} anime from ${Object.keys(resultsBySource).length} sources</p>
        </div>
        <div id="searchResultsGrid" class="anime-grid"></div>
    `;

    const grid = document.getElementById('searchResultsGrid');

    // Display results grouped by source
    Object.keys(resultsBySource).forEach(source => {
        const sourceResults = resultsBySource[source];

        // Add source header
        const sourceHeader = document.createElement('div');
        sourceHeader.className = 'source-header';
        sourceHeader.innerHTML = `
            <h3>${source.charAt(0).toUpperCase() + source.slice(1)} (${sourceResults.length} results)</h3>
        `;
        grid.appendChild(sourceHeader);

        // Add anime cards for this source
        sourceResults.forEach(anime => {
            const animeCard = createAnimeCard(anime);
            grid.appendChild(animeCard);
        });
    });
}

// Display home anime with pagination support
function displayHomeAnime(data, isFirstPage = true) {
    if (!data) {
        showError(homeContent);
        return;
    }

    // Handle error responses
    if (data.error) {
        showError(homeContent, data.message || 'API Error occurred');
        return;
    }

    // Extract anime from different home page structures based on source
    let newAnimeList = [];

    // Handle nekopoi structure: object with numeric keys
    if (currentHomeSource === 'nekopoi' && typeof data === 'object' && !Array.isArray(data) && !data.data) {
        // Nekopoi returns: {0: {...}, 1: {...}, 2: {...}, creator: "..."}
        // Convert numeric keys to array
        const numericKeys = Object.keys(data).filter(key => !isNaN(key)).sort((a, b) => parseInt(a) - parseInt(b));
        newAnimeList = numericKeys.map(key => data[key]);
    }
    // Check if data is directly at root level (Kuramanime case)
    else if (currentHomeSource === 'kuramanime' && typeof data === 'object' && !Array.isArray(data) && !data.data) {
        // Kuramanime structure: {hero: [...], ongoing: [...], completed: [...], movie: [...]}
        if (data.hero && Array.isArray(data.hero)) {
            newAnimeList = newAnimeList.concat(data.hero);
        }
        if (data.ongoing && Array.isArray(data.ongoing)) {
            newAnimeList = newAnimeList.concat(data.ongoing);
        }
        if (data.completed && Array.isArray(data.completed)) {
            newAnimeList = newAnimeList.concat(data.completed);
        }
        if (data.movie && Array.isArray(data.movie)) {
            newAnimeList = newAnimeList.concat(data.movie);
        }
        // Handle single anime response: {creator: '...', results: {anime data}}
        if (data.results && typeof data.results === 'object' && data.results.title) {
            newAnimeList = [data.results];
        }
    } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        const nestedData = data.data;

        // Handle different source structures
        if (currentHomeSource === 'samehadaku') {
            // Samehadaku structure: {recent: [...], movie: [...], top10: [...]}
            if (nestedData.recent && Array.isArray(nestedData.recent.animeList)) {
                newAnimeList = newAnimeList.concat(nestedData.recent.animeList);
            }
            if (nestedData.movie && Array.isArray(nestedData.movie.animeList)) {
                newAnimeList = newAnimeList.concat(nestedData.movie.animeList);
            }
            if (nestedData.top10 && Array.isArray(nestedData.top10.animeList)) {
                newAnimeList = newAnimeList.concat(nestedData.top10.animeList);
            }
        } else if (currentHomeSource === 'stream') {
            // Stream structure - assuming array or specific format
            if (Array.isArray(nestedData)) {
                newAnimeList = nestedData;
            } else if (nestedData.anime && Array.isArray(nestedData.anime)) {
                newAnimeList = nestedData.anime;
            }
        } else if (currentHomeSource === 'nekopoi') {
            // Nekopoi structure - assuming array
            if (Array.isArray(nestedData)) {
                newAnimeList = nestedData;
            } else if (nestedData.anime && Array.isArray(nestedData.anime)) {
                newAnimeList = nestedData.anime;
            }
        } else {
            // Default/Otakudesu structure: {ongoing_anime: [...], complete_anime: [...]}
            if (nestedData.ongoing_anime && Array.isArray(nestedData.ongoing_anime)) {
                newAnimeList = newAnimeList.concat(nestedData.ongoing_anime);
            }
            if (nestedData.complete_anime && Array.isArray(nestedData.complete_anime)) {
                newAnimeList = newAnimeList.concat(nestedData.complete_anime);
            }
        }
    } else if (Array.isArray(data.data)) {
        // If data.data is directly an array
        newAnimeList = data.data;
    } else if (Array.isArray(data)) {
        // If data is directly an array
        newAnimeList = data;
    }

    if (newAnimeList.length === 0) {
        if (isFirstPage) {
            showError(homeContent, 'No anime data found');
        }
        return;
    }

    // Add new anime to our collection
    homeAnimeData = homeAnimeData.concat(newAnimeList);

    // If first page, clear content and add title with source selector
    if (isFirstPage) {
        const sourceName = currentHomeSource === 'default' ? 'All Sources' : currentHomeSource.charAt(0).toUpperCase() + currentHomeSource.slice(1);
        homeContent.innerHTML = `
            <div class="home-header">
                <h2>Latest Anime (${sourceName})</h2>
                <div class="source-selector">
                    <label for="homeSourceSelect">Source:</label>
                    <select id="homeSourceSelect" onchange="changeHomeSource(this.value)">
                        <option value="default">All Sources</option>
                        <option value="otakudesu">OtakuDesu</option>
                        <option value="samehadaku">Samehadaku</option>
                        <option value="kuramanime">KuraMAnime</option>
                        <option value="stream">Stream</option>
                        <option value="nekopoi">Nekopoi</option>
                    </select>
                </div>
            </div>
            <div id="homeAnimeGrid" class="anime-grid"></div>
        `;

        // Set the current source in the selector
        const selector = document.getElementById('homeSourceSelect');
        if (selector) {
            selector.value = currentHomeSource;
        }
    }

    const grid = document.getElementById('homeAnimeGrid') || homeContent.querySelector('.anime-grid');

    // Append new anime cards
    newAnimeList.forEach(anime => {
        const animeCard = createAnimeCard(anime);
        grid.appendChild(animeCard);
    });

    // The home API doesn't support pagination, so disable load more after first load
    hasMoreHomePages = false;

    // Add "Load More" button to the home section (not just homeContent)
    const homeSection = document.getElementById('home');

    // Remove existing load more button if any
    const existingButton = homeSection.querySelector('.load-more-btn');
    if (existingButton) {
        existingButton.remove();
    }

    if (hasMoreHomePages) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.textContent = 'Load More Anime';
        loadMoreBtn.onclick = () => loadMoreHomeAnime();
        homeSection.appendChild(loadMoreBtn);
    }
}

// Display genre anime with pagination support
function displayGenreAnime(data, isFirstPage = true) {
    if (!data) {
        showError(searchContent);
        return;
    }

    // Handle error responses
    if (data.error) {
        showError(searchContent, data.message || 'API Error occurred');
        return;
    }

    // Handle different response structures
    let animeList = [];

    // Check most specific conditions first
    if (data.data && data.data.anime && Array.isArray(data.data.anime)) {
        animeList = data.data.anime;  // For genre responses: {data: {anime: [...]}}
    } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        // Handle different nested structures
        const nestedData = data.data;

        // Handle ongoing/completed structure: {data: {ongoingAnimeData: [...], completeAnimeData: [...], paginationData: {...}}}
        if (nestedData.ongoingAnimeData && Array.isArray(nestedData.ongoingAnimeData)) {
            animeList = nestedData.ongoingAnimeData;
        } else if (nestedData.completeAnimeData && Array.isArray(nestedData.completeAnimeData)) {
            animeList = nestedData.completeAnimeData;
        }
        // Handle home page structure: {data: {ongoing_anime: [...], complete_anime: [...]}}
        else if (nestedData.ongoing_anime && Array.isArray(nestedData.ongoing_anime)) {
            animeList = animeList.concat(nestedData.ongoing_anime);
            if (nestedData.complete_anime && Array.isArray(nestedData.complete_anime)) {
                animeList = animeList.concat(nestedData.complete_anime);
            }
        }
    } else if (Array.isArray(data)) {
        animeList = data;
    } else if (data.data && Array.isArray(data.data)) {
        animeList = data.data;
    } else if (data.anime && Array.isArray(data.anime)) {
        animeList = data.anime;
    } else if (data.results && Array.isArray(data.results)) {
        animeList = data.results;
    } else if (data.list && Array.isArray(data.list)) {
        animeList = data.list;
    } else {
        // If it's an object with anime properties, convert to array
        animeList = Object.values(data).filter(item => typeof item === 'object' && (item.title || item.name));
    }

    if (animeList.length === 0) {
        if (isFirstPage) {
            showError(searchContent, 'No anime data found');
        }
        return;
    }

    // If first page, clear content and add title
    if (isFirstPage) {
        searchContent.innerHTML = `
            <h2>Anime Genre: ${currentGenreSlug.charAt(0).toUpperCase() + currentGenreSlug.slice(1).replace('-', ' ')}</h2>
            <div id="genreAnimeGrid" class="anime-grid"></div>
        `;
    }

    const grid = document.getElementById('genreAnimeGrid') || searchContent.querySelector('.anime-grid');

    // Append new anime cards
    animeList.forEach(anime => {
        const animeCard = createAnimeCard(anime);
        grid.appendChild(animeCard);
    });

    // Add "Load More" button if there are more pages
    if (hasMoreGenrePages) {
        // Remove existing load more button if any
        const existingButton = searchContent.querySelector('.load-more-btn');
        if (existingButton) {
            existingButton.remove();
        }

        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.onclick = () => loadGenreAnime(currentGenreSlug, currentGenrePage + 1);
        searchContent.appendChild(loadMoreBtn);
    } else {
        // Remove load more button if no more pages
        const existingButton = searchContent.querySelector('.load-more-btn');
        if (existingButton) {
            existingButton.remove();
        }
    }
}

// Load anime detail
async function loadAnimeDetail(animeOrSlug, source = 'otakudesu') {
    showSection('animeDetail');
    showLoading(animeDetailContent);

    let endpoint = '';
    let slug = '';

    // Handle both object and string inputs
    if (typeof animeOrSlug === 'object') {
        const anime = animeOrSlug;
        slug = anime.slug || anime.animeId || anime.id;
        source = anime.source || source; // Use source from anime object if available

        switch (source) {
            case 'otakudesu':
                endpoint = `/anime/anime/${slug}`;
                break;
            case 'samehadaku':
                endpoint = `/anime/samehadaku/anime/${anime.animeId || slug}`;
                break;
            case 'kuramanime':
                endpoint = `/anime/kura/anime/${anime.id}/${anime.slug}`;
                break;
            case 'stream':
                endpoint = `/anime/stream/anime/${slug}`;
                break;
            case 'nekopoi':
                endpoint = `/anime/neko/get?url=${encodeURIComponent(anime.url || slug)}`;
                break;
            default:
                endpoint = `/anime/anime/${slug}`;
        }
    } else {
        // Legacy string input
        slug = animeOrSlug;
        switch (source) {
            case 'otakudesu':
                endpoint = `/anime/anime/${slug}`;
                break;
            case 'samehadaku':
                endpoint = `/anime/samehadaku/anime/${slug}`;
                break;
            case 'kuramanime':
                endpoint = `/anime/kura/anime/${slug}`;
                break;
            case 'stream':
                endpoint = `/anime/stream/anime/${slug}`;
                break;
            case 'nekopoi':
                endpoint = `/anime/neko/get?url=${encodeURIComponent(slug)}`;
                break;
            default:
                endpoint = `/anime/anime/${slug}`;
        }
    }

    const data = await fetchAPI(endpoint, source);

    if (data) {
        // Handle normal API responses
        displayAnimeDetail(data, source);
    } else {
        showError(animeDetailContent);
    }
}

// Display anime detail
function displayAnimeDetail(data, source) {

    // Handle different response structures
    let anime = null;
    if (data.data && typeof data.data === 'object') {
        anime = data.data;
    } else if (data.anime && typeof data.anime === 'object') {
        anime = data.anime;
    } else if (data.detail && typeof data.detail === 'object') {
        anime = data.detail;
    } else if (data.results && typeof data.results === 'object') {
        anime = data.results;
    } else if (typeof data === 'object' && data.title) {
        anime = data;
    }

    if (!anime) {
        showError(animeDetailContent);
        return;
    }

    const imageUrl = anime.thumbnail || anime.image || anime.poster || anime.img || anime.cover || anime.banner || anime.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIiBmb250LXNpemU9IjE0Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    const title = anime.title || anime.name || 'Unknown Title';
    const synopsis = anime.synopsis || anime.description || anime.plot || 'No description available';
    const genres = anime.genres ? (Array.isArray(anime.genres) ? anime.genres.map(g => g.name || g.title || g).join(', ') : anime.genres) : '';
    let episodes = [];

    // Prioritize arrays over other types
    if (Array.isArray(anime.episodes)) {
        episodes = anime.episodes;
    } else if (Array.isArray(anime.episodeList)) {
        episodes = anime.episodeList;
    } else if (Array.isArray(anime.episodes_list)) {
        episodes = anime.episodes_list;
    } else if (Array.isArray(anime.episode_lists)) {
        episodes = anime.episode_lists;
    } else if (Array.isArray(anime.videos)) {
        episodes = anime.videos;
    } else if (Array.isArray(anime.streams)) {
        episodes = anime.streams;
    }

    // Special handling for kuramanime episodes (array of numbers)
    if (source === 'kuramanime' && Array.isArray(anime.episode)) {
        episodes = anime.episode.map(num => ({
            number: num,
            title: `Episode ${num}`,
            id: anime.id,
            slug: anime.slug
        }));
    }

    // Special handling for nekopoi
    if (source === 'nekopoi') {
        if (anime.url && Array.isArray(anime.url)) {
            // Multi-episode series
            episodes = anime.url.map((episodeUrl, index) => ({
                title: `Episode ${index + 1}`,
                slug: episodeUrl,
                number: index + 1,
                url: episodeUrl
            }));
        } else if (anime.url && typeof anime.url === 'string') {
            // Single video
            episodes = [{
                title: anime.title || 'Watch Video',
                slug: anime.url,
                number: 1,
                url: anime.url
            }];
        }
    }

    // Special handling for samehadaku
    if (source === 'samehadaku') {
        if (anime.episodes && typeof anime.episodes === 'object' && !Array.isArray(anime.episodes)) {
            // Convert object to array if episodes is an object
            episodes = Object.values(anime.episodes).filter(ep => typeof ep === 'object' && (ep.title || ep.number || ep.id));
        } else if (!Array.isArray(episodes)) {
            episodes = [];
        }
    }

    // Ensure episodes is always an array
    if (!Array.isArray(episodes)) {
        episodes = [];
    }


    animeDetailContent.innerHTML = `
        <button class="back-button" onclick="showSection('${previousSection}')">← Back</button>

        <!-- Hero Section -->
        <div class="anime-hero">
            <div class="anime-backdrop" style="background: linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(42, 42, 42, 0.8) 100%), url('${imageUrl}'); background-size: cover; background-position: center;">
                <div class="anime-overlay">
                    <div class="anime-poster-mobile">
                        <img src="${imageUrl}" alt="${title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIiBmb250LXNpemU9IjEyIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='; this.onerror=null;">
                    </div>
                    <div class="anime-info-mobile">
                        <h1 class="anime-title-mobile">${title}</h1>
                        <div class="anime-meta-mobile">
                            <span class="meta-item status-${(anime.status || 'Unknown').toLowerCase()}">${anime.status || 'Unknown'}</span>
                            <span class="meta-item">⭐ ${anime.score || anime.rating || 'N/A'}</span>
                            <span class="meta-item">📺 ${anime.episode_count || anime.episode || episodes.length || 'N/A'} Episodes</span>
                        </div>
                        <div class="anime-genres-mobile">
                            ${genres ? genres.split(', ').map(genre => `<span class="genre-tag">${genre.trim()}</span>`).join('') : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Synopsis Section -->
        <div class="anime-synopsis-section">
            <h3>Synopsis</h3>
            <div class="synopsis-content">
                <p>${synopsis}</p>
            </div>

            <!-- Additional Info -->
            <div class="anime-details-grid">
                <div class="detail-item">
                    <span class="detail-label">🎭 Studio</span>
                    <span class="detail-value">${anime.studio || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">📅 Release Date</span>
                    <span class="detail-value">${anime.release_date || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">⏱️ Duration</span>
                    <span class="detail-value">${anime.duration || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">🌍 Source</span>
                    <span class="detail-value">${source.charAt(0).toUpperCase() + source.slice(1)}</span>
                </div>
            </div>
        </div>

        <h3 class="episodes-header">Episodes</h3>
        <div class="episode-grid">
            ${episodes.map((episode, index) => `
                <div class="episode-card" onclick="loadEpisodeDetail('${btoa(JSON.stringify(episode))}', '${source}')">
                    <div class="episode-image">
                        <img src="${anime.poster || anime.img || anime.thumbnail || anime.image || anime.cover || anime.banner || anime.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9Ijc1IiB5PSIxMDAiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIiBmb250LXNpemU9IjEwIj5FcGlzb2RlICR7ZXBpc29kZS5udW1iZXIgfHwgZXBpc29kZS5lcGlzb2RlX251bWJlciB8fCBpbmRleCArIDEpfTwvdGV4dD48L3N2Zz4='}"
                             alt="Episode ${episode.number || episode.episode_number || index + 1}"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9Ijc1IiB5PSIxMDAiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIiBmb250LXNpemU9IjEwIj5FcGlzb2RlICR7ZXBpc29kZS5udW1iZXIgfHwgZXBpc29kZS5lcGlzb2RlX251bWJlciB8fCBpbmRleCArIDEpfTwvdGV4dD48L3N2Zz4='; this.onerror=null;">
                        <div class="episode-number">${episode.number || episode.episode_number || index + 1}</div>
                    </div>
                    <div class="episode-info">
                        <h4>${episode.title || `Episode ${episode.number || episode.episode_number || index + 1}`}</h4>
                        <p class="episode-desc">${episode.synopsis || episode.description || 'Watch this episode to continue the story'}</p>
                        <div class="episode-meta">
                            <span class="duration">${episode.duration || '23 min'}</span>
                            <span class="air-date">${episode.release_date || episode.air_date || ''}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load episode detail
async function loadEpisodeDetail(episodeOrSlug, source = 'otakudesu') {
    showSection('episodeDetail');
    showLoading(episodeDetailContent);

    let endpoint = '';
    let slug = '';

    // Handle both object and string inputs (from onclick JSON)
    let episode = null;
    if (typeof episodeOrSlug === 'string' && !episodeOrSlug.startsWith('{')) {
        // Base64 encoded JSON
        episode = JSON.parse(atob(episodeOrSlug));
    } else if (typeof episodeOrSlug === 'string' && episodeOrSlug.startsWith('{')) {
        // Old JSON string
        episode = JSON.parse(episodeOrSlug);
    } else if (typeof episodeOrSlug === 'object') {
        episode = episodeOrSlug;
    }

    if (episode) {
        slug = episode.slug || episode.id;

        switch (source) {
            case 'otakudesu':
                endpoint = `/anime/episode/${slug}`;
                break;
            case 'samehadaku':
                endpoint = `/anime/samehadaku/episode/${episode.episodeId || slug}`;
                break;
            case 'kuramanime':
                endpoint = `/anime/kura/watch/${episode.id}/${episode.slug}/${episode.number || 1}`;
                break;
            case 'stream':
                endpoint = `/anime/stream/episode/${slug}`;
                break;
            case 'nekopoi':
                endpoint = `/anime/neko/get?url=${encodeURIComponent(episode.url || slug)}`;
                break;
            default:
                endpoint = `/anime/episode/${slug}`;
        }
    } else if (typeof episodeOrSlug === 'object') {
        const episode = episodeOrSlug;
        slug = episode.slug || episode.id;

        switch (source) {
            case 'otakudesu':
                endpoint = `/anime/episode/${slug}`;
                break;
            case 'samehadaku':
                endpoint = `/anime/samehadaku/episode/${episode.episodeId || slug}`;
                break;
            case 'kuramanime':
                endpoint = `/anime/kura/watch/${episode.id || episode.animeId}/${episode.slug || episode.animeSlug}/${episode.number || episode.episode_number || 1}`;
                break;
            case 'stream':
                endpoint = `/anime/stream/episode/${slug}`;
                break;
            case 'nekopoi':
                endpoint = `/anime/neko/get?url=${encodeURIComponent(episode.url || slug)}`;
                break;
            default:
                endpoint = `/anime/episode/${slug}`;
        }
    } else {
        // Legacy string input
        slug = episodeOrSlug;
        switch (source) {
            case 'otakudesu':
                endpoint = `/anime/episode/${slug}`;
                break;
            case 'samehadaku':
                endpoint = `/anime/samehadaku/episode/${slug}`;
                break;
            case 'kuramanime':
                endpoint = `/anime/kura/watch/${slug}`;
                break;
            case 'stream':
                endpoint = `/anime/stream/episode/${slug}`;
                break;
            case 'nekopoi':
                endpoint = `/anime/neko/get?url=${encodeURIComponent(slug)}`;
                break;
            default:
                endpoint = `/anime/episode/${slug}`;
        }
    }

    const data = await fetchAPI(endpoint, source);

    if (data) {
        // Handle normal API responses
        displayEpisodeDetail(data, source);
    } else {
        showError(episodeDetailContent);
    }
}

// Display episode detail
function displayEpisodeDetail(data, source) {
    // Handle different response structures
    let episode = null;
    if (data.data && typeof data.data === 'object') {
        episode = data.data;
    } else if (data.episode && typeof data.episode === 'object') {
        episode = data.episode;
    } else if (data.detail && typeof data.detail === 'object') {
        episode = data.detail;
    } else if (typeof data === 'object' && (data.title || data.streamingLinks || data.servers)) {
        episode = data;
    }


    if (!episode) {
        showError(episodeDetailContent);
        return;
    }

    // Handle different streaming data structures
    let servers = [];
    let downloadLinks = [];

    // For samehadaku, prioritize defaultStreamingUrl as main server
    if (source === 'samehadaku' && episode.defaultStreamingUrl) {
        servers = [{
            name: 'Main Server',
            url: episode.defaultStreamingUrl,
            quality: 'Default'
        }];

        // Add additional qualities if available
        if (episode.server && episode.server.qualities && Array.isArray(episode.server.qualities)) {
            const qualityServers = episode.server.qualities
                .filter(quality => quality.url || quality.link || quality.embed_url) // Only add if has URL
                .map(quality => ({
                    name: quality.name || quality.quality || `Quality ${quality.quality || 'HD'}`,
                    url: quality.url || quality.link || quality.embed_url,
                    quality: quality.quality || 'HD'
                }));
            servers = servers.concat(qualityServers);
        }
    }
    // Check for stream_servers array
    else if (episode.stream_servers && Array.isArray(episode.stream_servers)) {
        servers = episode.stream_servers.map(server => ({
            name: server.name || server.quality || `Server ${servers.length + 1}`,
            url: server.url || server.link || server.embed_url,
            quality: server.quality || server.name || 'Default'
        }));
    }
    // Check for single stream_url
    else if (episode.stream_url) {
        servers = [{
            name: 'Main Server',
            url: episode.stream_url,
            quality: 'Default'
        }];
    }
    // Handle samehadaku server.qualities structure (fallback)
    else if (episode.server && episode.server.qualities && Array.isArray(episode.server.qualities)) {
        servers = episode.server.qualities.map(quality => ({
            name: quality.name || quality.quality || `Quality ${quality.quality || 'Default'}`,
            url: quality.url || quality.link || quality.embed_url,
            quality: quality.quality || 'Default'
        }));
    }
    // Fallback to old property names
    else {
        servers = episode.servers || episode.streamingLinks || episode.streams || episode.video || episode.embed || episode.url || [];

        // Handle kuramanime server array
        if (!servers.length && episode.server && Array.isArray(episode.server)) {
            servers = episode.server.map(server => {
                console.log('Server object keys:', Object.keys(server));
                console.log('Server object:', server);
                return {
                    name: server.name || server.quality || server.title || `Server ${servers.length + 1}`,
                    url: server.url || server.link || server.embed_url || server.src || server.href || server.video_url || server.stream_url || server.embed,
                    quality: server.quality || server.name || server.resolution || 'Default'
                };
            });
        }

        // If servers is a string, convert to array
        if (typeof servers === 'string') {
            servers = [{
                name: 'Main Server',
                url: servers,
                quality: 'Default'
            }];
        }
    }

    // Use defaultStreamingUrl as final fallback if no servers found
    if (servers.length === 0 && episode.defaultStreamingUrl) {
        servers = [{
            name: 'Main Server',
            url: episode.defaultStreamingUrl,
            quality: 'Default'
        }];
    }

    // Handle download URLs
    if (episode.download_urls && Array.isArray(episode.download_urls)) {
        downloadLinks = episode.download_urls.map(link => ({
            name: link.name || link.quality || `Download ${downloadLinks.length + 1}`,
            url: link.url || link.link,
            quality: link.quality || link.name || 'Default'
        }));
    } else {
        downloadLinks = episode.downloadLinks || episode.downloads || [];
    }

    // Handle kuramanime HTML parsing
    console.log('Source:', source);
    console.log('Episode.url type:', typeof episode.url);
    console.log('Episode.url length:', episode.url ? episode.url.length : 0);
    console.log('Episode.url includes html:', episode.url && episode.url.includes('<html'));
    console.log('Episode.url includes /html:', episode.url && episode.url.includes('</html>'));

    if (source === 'kuramanime' && episode.url && typeof episode.url === 'string' && (episode.url.includes('<html') || episode.url.includes('</html>'))) {
        console.log('Full HTML content:', episode.url);
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(episode.url, 'text/html');
            const iframes = doc.querySelectorAll('iframe');
            const videos = doc.querySelectorAll('video');
            const scripts = doc.querySelectorAll('script');

            console.log('Found iframes:', iframes.length);
            console.log('Found videos:', videos.length);
            console.log('Found scripts:', scripts.length);

            // Extract iframe sources
            iframes.forEach((iframe, index) => {
                console.log('Iframe src:', iframe.src);
                if (iframe.src && servers[index]) {
                    servers[index].url = iframe.src;
                }
            });

            // Extract video sources if iframes not found
            if (iframes.length === 0) {
                videos.forEach((video, index) => {
                    console.log('Video src:', video.src);
                    if (video.src && servers[index]) {
                        servers[index].url = video.src;
                    }
                });
            }

            // Look for video URLs in script content
            if (servers.some(s => !s.url)) {
                scripts.forEach(script => {
                    const content = script.textContent || '';
                    const urlMatches = content.match(/https?:\/\/[^\s'"]+(?:kuramadrive|filemoon|mega|rpmshare|streamwish|vidguard)[^\s'"]*/g);
                    if (urlMatches) {
                        console.log('Found URLs in script:', urlMatches);
                        urlMatches.forEach((url, idx) => {
                            if (servers[idx] && !servers[idx].url) {
                                servers[idx].url = url;
                            }
                        });
                    }
                });
            }

            // If still no URLs, look for links with video hosting domains
            if (servers.some(s => !s.url)) {
                const links = doc.querySelectorAll('a[href]');
                const videoHosts = ['kuramadrive', 'filemoon', 'mega', 'rpmshare', 'streamwish', 'vidguard'];
                let linkIndex = 0;

                links.forEach(link => {
                    const href = link.href;
                    console.log('Link href:', href);
                    if (videoHosts.some(host => href.includes(host)) && servers[linkIndex] && !servers[linkIndex].url) {
                        servers[linkIndex].url = href;
                        linkIndex++;
                    }
                });
            }
        } catch (error) {
            console.error('Error parsing kuramanime HTML:', error);
        }
    }

    // Debug logging for kuramanime
    if (source === 'kuramanime') {
        console.log('Episode data:', episode);
        console.log('Servers array after parsing:', servers);
    }


    episodeDetailContent.innerHTML = `
        <button class="back-button" onclick="showSection('animeDetail')">← Back</button>
        <h2 style="margin-top: 1rem;">${episode.title || 'Episode'}</h2>
        <div class="video-player">
            <iframe id="videoFrame" src="" allowfullscreen></iframe>
        </div>
        <div class="server-list">
            ${servers.map(server => `
                <button class="server-button" onclick="changeServer('${server.url || server.link}')">
                    ${server.name || server.quality || 'Server'}
                </button>
            `).join('')}
        </div>
        ${downloadLinks.length > 0 ? `
            <h3 style="margin-top: 2rem;">Download Links</h3>
            <div class="server-list">
                ${downloadLinks.map(link => `
                    <a href="${link.url || link.link}" target="_blank" class="server-button" style="text-decoration: none;">
                        ${link.name || link.quality || 'Download'}
                    </a>
                `).join('')}
            </div>
        ` : ''}
    `;

    // Load first server by default
    if (servers.length > 0 && servers[0].url) {
        changeServer(servers[0].url);
    } else if (servers.length > 0) {
        // If no valid URL, show message
        const videoFrame = document.getElementById('videoFrame');
        if (videoFrame) {
            videoFrame.style.display = 'none';
            const message = document.createElement('div');
            message.style.cssText = 'text-align: center; padding: 2rem; color: #ccc; font-size: 1.1rem;';
            message.innerHTML = 'Video tidak tersedia untuk source ini.<br>Silakan coba source lain atau episode lain.';
            videoFrame.parentNode.appendChild(message);
        }
    }
}

// Change video server
function changeServer(url) {
    const videoFrame = document.getElementById('videoFrame');
    if (videoFrame) {
        videoFrame.src = url;
    }
}

// Utility functions
function showLoading(container) {
    container.innerHTML = '<div class="loading">Loading...</div>';
}

function showError(container, message = 'Error loading data') {
    container.innerHTML = `<div class="error">${message}</div>`;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadHome();
    loadGenres();

    // Navigation event listeners
    document.querySelector('button[onclick*="ongoing"]').addEventListener('click', () => loadOngoing());
    document.querySelector('button[onclick*="completed"]').addEventListener('click', () => loadCompleted(1));
});

// Search on Enter key
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchAnime();
    }
});