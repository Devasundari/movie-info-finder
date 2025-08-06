const API_KEY = 'e7ce26ec';
        const SEARCH_ENDPOINT = 'https://www.omdbapi.com/?s=';
        const DETAIL_ENDPOINT = 'https://www.omdbapi.com/?i=';

        // DOM elements
        const searchInput = document.getElementById('query');
        const searchBtn = document.getElementById('searchbtn');
        const moviesContainer = document.getElementById('movies');
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.querySelector('.close');

        // Show loading state
        function showLoading() {
            moviesContainer.innerHTML = '<div class="loading">Searching for movies...</div>';
        }

        

        // Fetch movies from OMDB API
        async function fetchMovies(searchTerm) {
            try {
                if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
                    throw new Error('Invalid or missing API key. Please get a valid key from http://www.omdbapi.com/apikey.aspx');
                }
                
                const response = await fetch(`${SEARCH_ENDPOINT}${encodeURIComponent(searchTerm)}&apikey=${API_KEY}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.Response === 'False') {
                    throw new Error(data.Error || 'No movies found');
                }
                
                return data.Search;
            } catch (error) {
                console.error('Error fetching movies:', error.message);
                moviesContainer.innerHTML = `<div class="no-results"><h3>Error: ${error.message}</h3><p>Please try a different search term</p></div>`;
                return [];
            }
        }

        // Fetch movie details by IMDb ID
        async function fetchMovieDetails(imdbID) {
            try {
                const response = await fetch(`${DETAIL_ENDPOINT}${imdbID}&apikey=${API_KEY}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.Response === 'False') {
                    throw new Error(data.Error || 'Movie details not found');
                }
                
                return data;
            } catch (error) {
                console.error('Error fetching movie details:', error.message);
                modalBody.innerHTML = `<p>Error: ${error.message}</p>`;
                return null;
            }
        }

        // Cache for movie details to avoid repeated API calls
        const movieDetailsCache = new Map();

        // Render movie cards
        function renderMovies(movies) {
            moviesContainer.innerHTML = '';
            
            if (movies.length === 0) {
                moviesContainer.innerHTML = '<div class="no-results"><h3>No movies found</h3><p>Try a different search term</p></div>';
                return;
            }

            movies.forEach(async (movie) => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.dataset.imdbID = movie.imdbID;
                
                // Check if poster exists, otherwise use clapperboard
                const posterContent = movie.Poster !== 'N/A' 
                    ? `<img src="${movie.Poster}" alt="${movie.Title}" onerror="this.parentElement.innerHTML='<div class=\\'clapperboard-placeholder\\'><div class=\\'clapper-icon\\'>🎬</div><div class=\\'clapper-text\\'>No Poster Available</div></div>'">`
                    : `<div class="clapperboard-placeholder"><div class="clapper-icon">🎬</div><div class="clapper-text">No Poster Available</div></div>`;

                
                card.innerHTML = `
                    <div class="movie-poster">
                        ${posterContent}
                        <div class="poster-overlay"></div>
                        <div class="movie-reviews-overlay">
                            <div class="loading-reviews">click to see more...</div>
                        </div>
                    </div>
                    <div class="movie-info">
                        <h3>${movie.Title}</h3>
                        <p>${movie.Year}</p>
                    </div>
                `;
                
                moviesContainer.appendChild(card);

                // Fetch real movie details when card is created
                fetchAndCacheMovieDetails(movie.imdbID);
            });
        }

        // Fetch and cache movie details for reviews
        async function fetchAndCacheMovieDetails(imdbID) {
            if (movieDetailsCache.has(imdbID)) {
                return movieDetailsCache.get(imdbID);
            }

            try {
                const response = await fetch(`${DETAIL_ENDPOINT}${imdbID}&apikey=${API_KEY}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const movieDetails = await response.json();
                
                if (movieDetails.Response === 'False') {
                    throw new Error(movieDetails.Error || 'Movie details not found');
                }
                
                movieDetailsCache.set(imdbID, movieDetails);
                updateCardWithRealReviews(imdbID, movieDetails);
                return movieDetails;
            } catch (error) {
                console.error('Error fetching movie details for reviews:', error.message);
                updateCardWithErrorState(imdbID);
                return null;
            }
        }

        // Update movie card with real reviews and ratings
        function updateCardWithRealReviews(imdbID, movieDetails) {
            const card = document.querySelector(`[data-imdb-id="${imdbID}"]`);
            if (!card) return;

            const reviewsOverlay = card.querySelector('.movie-reviews-overlay');
            if (!reviewsOverlay) return;

            const realReviews = generateRealReviews(movieDetails);
            reviewsOverlay.innerHTML = realReviews;
        }

        // Update card with error state
        function updateCardWithErrorState(imdbID) {
            const card = document.querySelector(`[data-imdb-id="${imdbID}"]`);
            if (!card) return;

            const reviewsOverlay = card.querySelector('.movie-reviews-overlay');
            if (!reviewsOverlay) return;

            reviewsOverlay.innerHTML = `
                <div class="review-item">
                    <div class="review-text" style="text-align: center; color: #888;">
                        Reviews unavailable
                    </div>
                </div>
            `;
        }

        // Generate reviews from real OMDB data
        function generateRealReviews(movieDetails) {
            let reviewsHTML = '';
            let reviewCount = 0;

            // Parse and display real ratings from OMDB
            if (movieDetails.Ratings && movieDetails.Ratings.length > 0) {
                movieDetails.Ratings.forEach((rating, index) => {
                    if (reviewCount >= 3) return; // Limit to 3 reviews
                    
                    let source = rating.Source;
                    let score = rating.Value;
                    let normalizedRating = '';
                    let reviewText = '';

                    // Normalize ratings and add context
                    switch (source) {
                        case 'Internet Movie Database':
                            source = 'IMDb';
                            normalizedRating = score;
                            reviewText = `Professional critics and audiences rate this ${parseFloat(score) >= 7.0 ? 'highly' : parseFloat(score) >= 5.0 ? 'moderately' : 'poorly'}.`;
                            break;
                        case 'Rotten Tomatoes':
                            normalizedRating = score;
                            reviewText = `${parseInt(score)}% of critics ${parseInt(score) >= 70 ? 'recommend' : parseInt(score) >= 40 ? 'are mixed on' : 'do not recommend'} this film.`;
                            break;
                        case 'Metacritic':
                            normalizedRating = score;
                            const metaScore = parseInt(score);
                            reviewText = `Critics give this ${metaScore >= 70 ? 'universal acclaim' : metaScore >= 50 ? 'mixed reviews' : 'generally unfavorable reviews'}.`;
                            break;
                        default:
                            normalizedRating = score;
                            reviewText = `Professional review score from ${source}.`;
                    }

                    reviewsHTML += `
                        <div class="review-item">
                            <div class="review-header">
                                <div class="review-source">${source}</div>
                                <div class="review-rating">${normalizedRating}</div>
                            </div>
                            <div class="review-text">${reviewText}</div>
                        </div>
                    `;
                    reviewCount++;
                });
            }

            // Add additional context from movie details
            if (reviewCount < 3 && movieDetails.Awards && movieDetails.Awards !== 'N/A') {
                reviewsHTML += `
                    <div class="review-item">
                        <div class="review-header">
                            <div class="review-source">Awards</div>
                            <div class="review-rating">🏆</div>
                        </div>
                        <div class="review-text">${movieDetails.Awards}</div>
                    </div>
                `;
                reviewCount++;
            }

            // Add director and cast info if no ratings available
            if (reviewCount === 0) {
                if (movieDetails.Director && movieDetails.Director !== 'N/A') {
                    reviewsHTML += `
                        <div class="review-item">
                            <div class="review-header">
                                <div class="review-source">Director</div>
                                <div class="review-rating">🎬</div>
                            </div>
                            <div class="review-text">Directed by ${movieDetails.Director}</div>
                        </div>
                    `;
                }

                if (movieDetails.Writer && movieDetails.Writer !== 'N/A') {
                    reviewsHTML += `
                        <div class="review-item">
                            <div class="review-header">
                                <div class="review-source">Writer</div>
                                <div class="review-rating">✍️</div>
                            </div>
                            <div class="review-text">Written by ${movieDetails.Writer.split(',')[0]}</div>
                        </div>
                    `;
                }
            }

            // Add IMDb rating if available
            if (movieDetails.imdbRating && movieDetails.imdbRating !== 'N/A') {
                const rating = parseFloat(movieDetails.imdbRating);
                const votes = movieDetails.imdbVotes && movieDetails.imdbVotes !== 'N/A' 
                    ? movieDetails.imdbVotes 
                    : 'votes';
                    
                reviewsHTML += `<div class="imdb-rating">IMDb: ${movieDetails.imdbRating}/10 (${votes})</div>`;
            }

            return reviewsHTML || `
                <div class="review-item">
                    <div class="review-text" style="text-align: center; color: #888;">
                        No ratings available
                    </div>
                </div>
            `;
        }

        // Render movie details in modal
        function renderMovieDetails(movie) {
            const plotIcon = movie.Plot && movie.Plot !== 'N/A' ? '📖' : '❌';
            const genreIcon = movie.Genre && movie.Genre !== 'N/A' ? '🎭' : '❌';
            const runtimeIcon = movie.Runtime && movie.Runtime !== 'N/A' ? '⏱️' : '❌';
            const directorIcon = movie.Director && movie.Director !== 'N/A' ? '🎬' : '❌';
            const actorsIcon = movie.Actors && movie.Actors !== 'N/A' ? '🎭' : '❌';
            const ratingIcon = movie.imdbRating && movie.imdbRating !== 'N/A' ? '⭐' : '❌';

            modalBody.innerHTML = `
                <h2>${movie.Title} (${movie.Year})</h2>
                <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300/333333/ffffff?text=No+Poster'}" alt="${movie.Title}">
                <p><strong>${plotIcon} Plot:</strong> ${movie.Plot || 'Not available'}</p>
                <p><strong>${genreIcon} Genre:</strong> ${movie.Genre || 'Not available'}</p>
                <p><strong>${runtimeIcon} Runtime:</strong> ${movie.Runtime || 'Not available'}</p>
                <p><strong>${directorIcon} Director:</strong> ${movie.Director || 'Not available'}</p>
                <p><strong>${actorsIcon} Cast:</strong> ${movie.Actors || 'Not available'}</p>
                <p><strong>${ratingIcon} IMDb Rating:</strong> ${movie.imdbRating || 'Not available'}/10</p>
            `;
            modal.style.display = 'flex';
        }

        // Search function
        async function performSearch() {
            const query = searchInput.value.trim();
            if (!query) {
                moviesContainer.innerHTML = '<div class="no-results"><h3>Please enter a movie title</h3><p>Start typing to search for movies</p></div>';
                return;
            }
            
            showLoading();
            const movies = await fetchMovies(query);
            renderMovies(movies);
        }

        // Event listeners
        searchBtn.addEventListener('click', performSearch);

        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        moviesContainer.addEventListener('click', async (e) => {
            const card = e.target.closest('.movie-card');
            if (card) {
                const imdbID = card.dataset.imdbID;
                modalBody.innerHTML = '<div class="loading">Loading movie details...</div>';
                modal.style.display = 'flex';
                
                const movie = await fetchMovieDetails(imdbID);
                if (movie) {
                    renderMovieDetails(movie);
                }
            }
        });

        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Add smooth scrolling and enhanced interactions
        document.addEventListener('DOMContentLoaded', () => {
            // Add initial animation to search bar
            const searchBar = document.querySelector('.search-bar');
            searchBar.style.transform = 'translateY(20px)';
            searchBar.style.opacity = '0';
            
            setTimeout(() => {
                searchBar.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                searchBar.style.transform = 'translateY(0)';
                searchBar.style.opacity = '1';
            }, 300);
        });