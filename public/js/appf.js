// ============================================
// MODERN NEWS WEBSITE - ENHANCED JAVASCRIPT
// ============================================

// Global variables
let newsArticles = [];
let filteredArticles = [];
let currentFilter = 'all';
let currentRegion = 'all'; // all, domestic, international, district
let currentLocation = { state: null, district: null };
let featuredArticles = [];
let currentFeaturedIndex = 0;
let featuredAutoSlideInterval = null;
let newsAutoRefreshInterval = null;
let indianStatesData = null;
let currentPage = 1;
let articlesPerPage = 12;
let displayedArticlesCount = 0;
let allArticles = []; // Store all fetched articles

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// ============================================
// INITIALIZATION
// ============================================

function initializeApp() {
    setupDarkMode();
    setupNavigation();
    setupMobileMenu();
    setupSearch();
    setupFilters();
    setupGeographicTabs();
    setupLocationSelector();
    setupScrollToTop();
    setupSubscriptionForm();
    setupCategoriesModal();
    setupAuthUI();
    loadIndianStatesData();
    fetchNewsData();
    setupFeaturedCarousel();
    setupNewsAutoRefresh();
    setupTrendingWidget();
    setupMostReadSection();
    setupLoadMoreButton();
    setupAnimations();
}

// ============================================
// DARK MODE TOGGLE
// ============================================

function setupDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeIcons = document.querySelectorAll('.dark-mode-icon');
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeIcons.forEach(icon => icon.classList.toggle('hidden'));
    }
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            
            // Save preference
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // Toggle icons
            darkModeIcons.forEach(icon => icon.classList.toggle('hidden'));
        });
    }
}

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id], main');

    // Handle navigation clicks
  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
  
      const targetId = link.getAttribute('href');
            
            // Special handling for Categories - show modal instead of scrolling
            if (targetId === '#categories') {
                showCategoriesModal();
                // Close mobile menu if open
                const navList = document.querySelector('.nav-list');
                navList.classList.remove('active');
                return;
            }
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
      const targetSection = document.querySelector(targetId);
  
            if (targetSection) {
                const headerOffset = 80;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
        behavior: 'smooth'
      });
            }
            
            // Close mobile menu if open
            const navList = document.querySelector('.nav-list');
            navList.classList.remove('active');
        });
    });

    // Update active nav link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.pageYOffset + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
            }
    });
  });
}

// ============================================
// MOBILE MENU
// ============================================

function setupMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navList.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navList.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
    const suggestionTags = document.querySelectorAll('.suggestion-tag');

    // Search on button click
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    // Search on Enter key
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });

        // Real-time search as user types (debounced)
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (searchInput.value.length > 2) {
                    performSearch();
                } else if (searchInput.value.length === 0) {
                    // Reset to show first 12 articles
                    displayedArticlesCount = 0;
                    allArticles = sortArticlesByDate([...newsArticles]);
                    const firstBatch = allArticles.slice(0, articlesPerPage);
                    displayNewsArticles(firstBatch);
                    displayedArticlesCount = firstBatch.length;
                    
                    const loadMoreBtn = document.querySelector('.load-more-btn');
                    if (loadMoreBtn) {
                        if (allArticles.length > articlesPerPage) {
                            loadMoreBtn.style.display = 'block';
                        } else {
                            loadMoreBtn.style.display = 'none';
                        }
                    }
                }
            }, 300);
        });
    }

    // Handle suggestion tag clicks
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            const keyword = tag.textContent.trim();
            searchInput.value = keyword;
            performSearch();
        });
    });
}

function performSearch() {
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput.value.toLowerCase().trim();

    if (!keyword) {
        displayNewsArticles(newsArticles);
        return;
    }

    // Track search
    trackSearch(keyword);

    // Filter articles based on keyword
    const filtered = newsArticles.filter(article => {
        const titleMatch = article.title?.toLowerCase().includes(keyword);
        const descMatch = article.description?.toLowerCase().includes(keyword);
        const authorMatch = article.author?.toLowerCase().includes(keyword);
        const categoryMatch = article.category?.toLowerCase().includes(keyword);
        
        return titleMatch || descMatch || authorMatch || categoryMatch;
    });

    displayNewsArticles(filtered);
    
    // Show message if no results
    showNoResults(filtered.length === 0);
}

function showNoResults(show) {
    const newsContainer = document.getElementById('news-container');
    if (show && newsContainer && newsContainer.children.length === 0) {
        newsContainer.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: white;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1rem; opacity: 0.5;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No articles found</h3>
                <p style="opacity: 0.8;">Try searching with different keywords or filters</p>
            </div>
        `;
    }
}

// ============================================
// FILTER FUNCTIONALITY
// ============================================

function setupFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Get filter value
            const newFilter = tab.getAttribute('data-filter');
            currentFilter = newFilter;
            
            // Track category filter
            if (currentFilter !== 'all') {
                trackCategoryFilter(currentFilter);
            }
            
            // Reset pagination
            currentPage = 1;
            displayedArticlesCount = 0;
            
            // Refetch news with the new filter
            console.log('Filter changed to:', currentFilter);
            fetchNewsByRegion();
  });
});
}

function applyFilter() {
    displayedArticlesCount = 0; // Reset pagination
    currentPage = 1; // Reset to first page
    
    // If we have articles loaded, filter them
    if (newsArticles.length > 0) {
        if (currentFilter === 'all') {
            filteredArticles = newsArticles;
            allArticles = sortArticlesByDate([...newsArticles]);
        } else {
            // Filter existing articles by category (case-insensitive)
            filteredArticles = newsArticles.filter(article => {
                const category = (article.category || '').toLowerCase();
                const filterLower = currentFilter.toLowerCase();
                // Match exact or partial
                return category === filterLower || category.includes(filterLower);
            });
            allArticles = sortArticlesByDate([...filteredArticles]);
        }
        
        // Display first 12 articles
        const firstBatch = allArticles.slice(0, articlesPerPage);
        displayNewsArticles(firstBatch);
        displayedArticlesCount = firstBatch.length;
        
        // Show/hide Load More button
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            if (allArticles.length > articlesPerPage) {
                loadMoreBtn.style.display = 'block';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    } else {
        // No articles loaded yet, fetch from API with current filter
        console.log('No articles loaded, fetching from API with filter:', currentFilter);
        fetchNewsByRegion();
    }
}

// Function to filter by category from category cards
function filterByCategory(category) {
    console.log('Filtering by category:', category);
    
    // Close modal if open
    const modal = document.getElementById('categories-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Update current filter
    currentFilter = category;
    
    // Reset pagination
    currentPage = 1;
    displayedArticlesCount = 0;
    
    // Update filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-filter') === category) {
            tab.classList.add('active');
        } else if (category === 'all') {
            const allTab = document.querySelector('.filter-tab[data-filter="all"]');
            if (allTab) allTab.classList.add('active');
        }
    });
    
    // Refetch news with the new filter
    fetchNewsByRegion();
    
    // Scroll to news section
    setTimeout(() => {
        const newsSection = document.querySelector('#news');
        if (newsSection) {
            const headerOffset = 80;
            const elementPosition = newsSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }, 100);
    
    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#news') {
            link.classList.add('active');
        }
    });
}

// Make filterByCategory globally available
window.filterByCategory = filterByCategory;

// ============================================
// CATEGORIES MODAL
// ============================================

function setupCategoriesModal() {
    const modal = document.getElementById('categories-modal');
    if (!modal) {
        console.warn('Categories modal not found');
        return;
    }
    
    // Use specific ID selectors for categories modal elements
    const modalClose = document.getElementById('categories-modal-close');
    const modalOverlay = document.getElementById('categories-modal-overlay');

    // Close modal function
    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Show modal function
    function showModal() {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Close button click - use specific ID selector
    if (modalClose) {
        modalClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
    } else {
        console.warn('Categories modal close button not found');
    }

    // Overlay click to close
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
    } else {
        console.warn('Categories modal overlay not found');
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Make showModal globally available
    window.showCategoriesModal = showModal;
    
    // Also make closeModal available globally for onclick handlers
    window.closeCategoriesModal = closeModal;
    
    console.log('Categories modal setup complete');
}

// ============================================
// GEOGRAPHIC TABS
// ============================================

function setupGeographicTabs() {
    const geoTabs = document.querySelectorAll('.geo-tab');
    
    geoTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            geoTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Get region value
            currentRegion = tab.getAttribute('data-region');
            displayedArticlesCount = 0; // Reset pagination
            
            // Fetch news for the selected region
            fetchNewsByRegion();
        });
    });
}

function fetchNewsByRegion() {
    let apiUrl = '/api/news?';
    
    // Build API URL based on region
    if (currentRegion === 'domestic') {
        apiUrl += 'region=domestic&country=India';
        if (currentLocation.state) {
            apiUrl += `&state=${encodeURIComponent(currentLocation.state)}`;
        }
        if (currentLocation.district) {
            apiUrl += `&district=${encodeURIComponent(currentLocation.district)}`;
        }
    } else if (currentRegion === 'international') {
        apiUrl += 'region=international';
    } else if (currentRegion === 'district') {
        apiUrl += 'region=district&country=India';
        if (currentLocation.state) {
            apiUrl += `&state=${encodeURIComponent(currentLocation.state)}`;
        }
        if (currentLocation.district) {
            apiUrl += `&district=${encodeURIComponent(currentLocation.district)}`;
        }
    }
    
    // Add category filter if not 'all'
    if (currentFilter && currentFilter !== 'all') {
        // Map frontend category names to API category names
        const categoryMap = {
            'technology': 'technology',
            'science': 'science',
            'business': 'business',
            'health': 'health',
            'entertainment': 'entertainment',
            'sports': 'sports'
        };
        const apiCategory = categoryMap[currentFilter] || currentFilter;
        apiUrl += `&category=${apiCategory}`;
    }
    
    // Fetch a larger batch to have enough articles for pagination
    apiUrl += `&page=1&pageSize=100`;
    
    console.log('Fetching news from:', apiUrl);
    
    fetch(apiUrl)
        .then(response => {
            console.log('API response status:', response.status);
            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API response data:', data);
            if (data && Array.isArray(data) && data.length > 0) {
                // Sort articles by latest time (newest first)
                allArticles = sortArticlesByDate(data);
                newsArticles = allArticles;
                filteredArticles = allArticles;
                
                // Reset pagination
                displayedArticlesCount = 0;
                
                // Display first 12 articles
                const firstBatch = allArticles.slice(0, articlesPerPage);
                displayNewsArticles(firstBatch);
                displayedArticlesCount = firstBatch.length;
                
                // Show/hide Load More button
                const loadMoreBtn = document.querySelector('.load-more-btn');
                if (loadMoreBtn) {
                    if (allArticles.length > articlesPerPage) {
                        loadMoreBtn.style.display = 'block';
                    } else {
                        loadMoreBtn.style.display = 'none';
                    }
                }
                
                // Update featured articles (top 5 articles)
                featuredArticles = allArticles.slice(0, 5);
                updateFeaturedCarousel();
                
                console.log('✓ News loaded from API:', allArticles.length, 'articles');
            } else {
                console.warn('API returned empty or invalid data, trying local fallback');
                allArticles = [];
                displayNewsArticles([]);
                const loadMoreBtn = document.querySelector('.load-more-btn');
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
                // Try local fallback
                fetchLocalNews();
            }
        })
        .catch(error => {
            console.warn('API fetch failed, trying local fallback:', error);
            // Fallback to local news data
            fetchLocalNews();
        });
}

// ============================================
// LOCATION SELECTOR
// ============================================

function setupLocationSelector() {
    const locationBtn = document.getElementById('location-selector-btn');
    const locationModal = document.getElementById('location-modal');
    const locationModalClose = locationModal?.querySelector('.modal-close');
    const locationModalOverlay = locationModal?.querySelector('.modal-overlay');
    const locationTabs = locationModal?.querySelectorAll('.location-tab');
    const locationSearchInput = document.getElementById('location-search-input');
    
    if (!locationBtn || !locationModal) return;
    
    // Open modal
    locationBtn.addEventListener('click', () => {
        locationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadLocationList('state');
    });
    
    // Close modal
    function closeModal() {
        locationModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (locationModalClose) {
        locationModalClose.addEventListener('click', closeModal);
    }
    
    if (locationModalOverlay) {
        locationModalOverlay.addEventListener('click', closeModal);
    }
    
    // Location type tabs
    locationTabs?.forEach(tab => {
        tab.addEventListener('click', () => {
            locationTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const locationType = tab.getAttribute('data-location-type');
            loadLocationList(locationType);
        });
    });
    
    // Search functionality
    if (locationSearchInput) {
        locationSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterLocationList(searchTerm);
        });
    }
}

function loadIndianStatesData() {
    fetch('/api/states')
        .then(response => response.json())
        .then(data => {
            indianStatesData = data;
            console.log('Loaded Indian states data');
        })
        .catch(error => {
            console.warn('Failed to load Indian states data:', error);
        });
}

function loadLocationList(type) {
    const locationList = document.getElementById('location-list');
    if (!locationList || !indianStatesData) return;
    
    locationList.innerHTML = '';
    
    if (type === 'state') {
        // Show all states
        indianStatesData.states.forEach(state => {
            const item = document.createElement('div');
            item.className = 'location-item';
            item.textContent = state.name;
            item.addEventListener('click', () => {
                selectLocation(state.name, null);
                document.getElementById('location-modal').classList.remove('active');
                document.body.style.overflow = '';
            });
            locationList.appendChild(item);
        });
    } else if (type === 'district') {
        // Show all districts grouped by state
        indianStatesData.states.forEach(state => {
            const stateHeader = document.createElement('div');
            stateHeader.className = 'location-state-header';
            stateHeader.textContent = state.name;
            locationList.appendChild(stateHeader);
            
            state.districts.forEach(district => {
                const item = document.createElement('div');
                item.className = 'location-item location-district';
                item.textContent = district;
                item.addEventListener('click', () => {
                    selectLocation(state.name, district);
                    document.getElementById('location-modal').classList.remove('active');
                    document.body.style.overflow = '';
                });
                locationList.appendChild(item);
            });
        });
    }
}

function filterLocationList(searchTerm) {
    const items = document.querySelectorAll('.location-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function selectLocation(state, district) {
    currentLocation = { state, district };
    
    // Update location button text
    const locationText = document.getElementById('location-text');
    if (locationText) {
        if (district) {
            locationText.textContent = `${district}, ${state}`;
        } else if (state) {
            locationText.textContent = state;
        } else {
            locationText.textContent = 'Select Location';
        }
    }
    
    // Refresh news if region requires location
    if (currentRegion === 'district' || currentRegion === 'domestic') {
        displayedArticlesCount = 0;
        fetchNewsByRegion();
    }
}

// ============================================
// NEWS DATA FETCHING
// ============================================

function fetchNewsData() {
    // Use the new region-based fetching
    fetchNewsByRegion();
}

function fetchLocalNews() {
    console.log('Fetching local news from /newsdata.json');
    fetch('/newsdata.json')
        .then(response => {
            console.log('Local news response status:', response.status);
            if (!response.ok) {
                throw new Error(`Local news fetch failed with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Local news data received:', data);
            if (data && Array.isArray(data) && data.length > 0) {
                // Apply category filter if not 'all'
                let filteredData = data;
                if (currentFilter && currentFilter !== 'all') {
                    filteredData = data.filter(article => {
                        const category = (article.category || '').toLowerCase();
                        const filterLower = currentFilter.toLowerCase();
                        // Match exact or partial (e.g., "technology" matches "Technology")
                        return category === filterLower || category.includes(filterLower) || 
                               category === currentFilter || category.includes(currentFilter);
                    });
                }
                
                // Sort by latest time
                allArticles = sortArticlesByDate(filteredData);
                newsArticles = allArticles;
                filteredArticles = allArticles;
                
                // Reset pagination
                displayedArticlesCount = 0;
                
                // Display first 12 articles
                const firstBatch = allArticles.slice(0, articlesPerPage);
                displayNewsArticles(firstBatch);
                displayedArticlesCount = firstBatch.length;
                
                // Show/hide Load More button
                const loadMoreBtn = document.querySelector('.load-more-btn');
                if (loadMoreBtn) {
                    if (allArticles.length > articlesPerPage) {
                        loadMoreBtn.style.display = 'block';
                    } else {
                        loadMoreBtn.style.display = 'none';
                    }
                }
                
                // Update featured articles (top 5 articles)
                featuredArticles = allArticles.slice(0, 5);
                updateFeaturedCarousel();
                
                console.log('✓ News loaded from local file:', allArticles.length, 'articles');
            } else {
                console.error('Local news data is empty or invalid');
                displayError();
            }
        })
        .catch(error => {
            console.error('Error fetching local news data:', error);
            displayError();
        });
}

// Function to fetch news by category from API
function fetchNewsByCategory(category) {
    const apiCategory = category.toLowerCase();
    fetch(`/api/news?category=${apiCategory}&pageSize=20`)
        .then(response => {
            if (!response.ok) {
                throw new Error('API request failed');
            }
            return response.json();
        })
        .then(data => {
            if (data && Array.isArray(data) && data.length > 0) {
                newsArticles = data;
                filteredArticles = data;
                displayNewsArticles(data);
            }
        })
        .catch(error => {
            console.warn('API fetch failed for category:', category, error);
            // Filter existing articles instead
            applyFilter();
        });
}

// ============================================
// IMAGE SELECTION BY CATEGORY
// ============================================

function getImageForCategory(category, title) {
    // Use our logo as the default fallback image
    return 'images/logotype.png';
}

// ============================================
// DISPLAY NEWS ARTICLES
// ============================================

function displayNewsArticles(articles) {
  const newsContainer = document.getElementById('news-container');
    
    if (!newsContainer) {
        console.error('News container element not found!');
        return;
    }
    
    console.log('Displaying', articles ? articles.length : 0, 'articles');

  // Clear existing content
  newsContainer.innerHTML = '';

    if (!articles || articles.length === 0) {
        newsContainer.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: white;">
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No articles available</h3>
                <p style="opacity: 0.8;">Check back later for the latest news</p>
            </div>
        `;
        return;
    }

    // Create article cards
    articles.forEach((article, index) => {
        const articleCard = createArticleCard(article, index);
        newsContainer.appendChild(articleCard);
    });

    // Animate cards on load
    animateCards();
}

function createArticleCard(article, index) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const title = article.title || 'Untitled Article';
    const description = article.description || 'No description available.';
    const author = article.author || 'Anonymous';
    const date = article.date || new Date().toLocaleDateString();
    const category = article.category || 'General';
    const readingTime = article.readingTime || calculateReadingTime(description);
    const viewCount = article.viewCount || 0;
    
    // Use real image from API if available, otherwise use category-based placeholder
    let imageUrl = article.image || article.urlToImage || '';
    
    // Clean and validate image URL
    if (imageUrl) {
        imageUrl = imageUrl.trim();
        
        // Check if it's a valid URL
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            // Try to make it absolute if it's relative
            if (imageUrl.startsWith('//')) {
                imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
                // Can't make relative URLs absolute without base URL, so use fallback
                imageUrl = '';
            } else {
                imageUrl = '';
            }
        }
        
        // Validate URL format
        try {
            new URL(imageUrl);
        } catch (e) {
            imageUrl = '';
        }
    }
    
    // If no valid image, use our logo
    if (!imageUrl || imageUrl === '') {
        imageUrl = 'images/logotype.png';
    }

    // Use logo as fallback
    const fallbackImage = 'images/logotype.png';
    
    const articleUrl = article.url || article.link || '#';
    const isBookmarked = false; // Will be updated after checking user's bookmarks
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" class="news-card-image" 
             onerror="this.onerror=null; this.src='${fallbackImage}'; this.style.objectFit='contain'; this.style.padding='15px'; this.style.backgroundColor='rgba(99, 102, 241, 0.1)';"
             onload="this.style.opacity='1'"
             loading="lazy"
             style="opacity:0; transition: opacity 0.3s;">
        <div class="news-card-content">
            <div class="news-card-meta">
                <span class="article-category">${category}</span>
                <span class="article-date">${formatDate(date)}</span>
                <span class="article-reading-time">${readingTime} min read</span>
            </div>
            <h3 class="news-card-title">${title}</h3>
            <p class="news-card-description">${description}</p>
            <div class="news-card-footer">
                <div class="news-card-author-info">
                    <span class="news-card-author">By ${author}</span>
                    ${viewCount > 0 ? `<span class="article-views">${viewCount} views</span>` : ''}
                </div>
                <button class="bookmark-btn" data-article-url="${articleUrl}" onclick="event.stopPropagation(); toggleBookmark(this, '${title.replace(/'/g, "\\'")}', '${articleUrl}', '${imageUrl}', '${description.replace(/'/g, "\\'")}', '${category}')" title="Bookmark article">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;

    // Add click event to card - open article URL if available
    card.addEventListener('click', (e) => {
        // Don't navigate if clicking bookmark button
        if (e.target.closest('.bookmark-btn')) {
            return;
        }
        // Track view
        trackArticleView(article);
        // Show preview modal on click
        showArticlePreview(article);
    });
    
    // Make card clickable
    card.style.cursor = 'pointer';

    return card;
}

// ============================================
// ARTICLE PREVIEW MODAL
// ============================================

function showArticlePreview(article) {
    // Create preview modal if it doesn't exist
    let previewModal = document.getElementById('article-preview-modal');
    if (!previewModal) {
        previewModal = document.createElement('div');
        previewModal.id = 'article-preview-modal';
        previewModal.className = 'modal';
        previewModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content article-preview-content">
                <button class="modal-close" aria-label="Close modal">×</button>
                <div id="article-preview-body"></div>
            </div>
        `;
        document.body.appendChild(previewModal);
        
        // Setup close handlers
        const closeBtn = previewModal.querySelector('.modal-close');
        const overlay = previewModal.querySelector('.modal-overlay');
        closeBtn.addEventListener('click', () => closeArticlePreview());
        overlay.addEventListener('click', () => closeArticlePreview());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && previewModal.classList.contains('active')) {
                closeArticlePreview();
            }
        });
    }
    
    // Populate preview content
    const previewBody = document.getElementById('article-preview-body');
    previewBody.innerHTML = `
        <div class="article-preview-image">
            <img src="${article.image || 'images/logotype.png'}" alt="${article.title}" 
                 onerror="this.src='images/logotype.png'; this.style.objectFit='contain'; this.style.padding='20px';">
        </div>
        <div class="article-preview-content-inner">
            <div class="article-preview-meta">
                <span class="article-category">${article.category || 'General'}</span>
                <span class="article-date">${formatDate(article.date)}</span>
                <span class="article-reading-time">${article.readingTime || calculateReadingTime(article.description)} min read</span>
            </div>
            <h2 class="article-preview-title">${article.title}</h2>
            <p class="article-preview-author">By ${article.author || 'Unknown'}</p>
            <div class="article-preview-description">${article.description}</div>
            <div class="article-preview-actions">
                <a href="${article.url || '#'}" target="_blank" class="read-full-btn">
                    Read Full Article
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>
                <div class="article-share-buttons">
                    <button class="share-btn" onclick="shareArticle('${article.url}', '${article.title.replace(/'/g, "\\'")}', 'whatsapp')" title="Share on WhatsApp">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                    </button>
                    <button class="share-btn" onclick="shareArticle('${article.url}', '${article.title.replace(/'/g, "\\'")}', 'telegram')" title="Share on Telegram">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.559z"/>
                        </svg>
                    </button>
                    <button class="share-btn" onclick="shareArticle('${article.url}', '${article.title.replace(/'/g, "\\'")}', 'twitter')" title="Share on Twitter">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                        </svg>
                    </button>
                    <button class="share-btn" onclick="shareArticle('${article.url}', '${article.title.replace(/'/g, "\\'")}', 'facebook')" title="Share on Facebook">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="related-articles-preview" id="related-articles-preview">
                <!-- Related articles will be loaded here -->
            </div>
        </div>
    `;
    
    // Show modal
    previewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Load related articles
    loadRelatedArticles(article);
}

function closeArticlePreview() {
    const previewModal = document.getElementById('article-preview-modal');
    if (previewModal) {
        previewModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function loadRelatedArticles(article) {
    // Use category to find related articles
    const category = article.category?.toLowerCase() || 'general';
    fetch(`/api/news/related/0?category=${category}&limit=3`)
        .then(response => response.json())
        .then(articles => {
            const relatedContainer = document.getElementById('related-articles-preview');
            if (!relatedContainer || !articles || articles.length === 0) return;
            
            relatedContainer.innerHTML = `
                <h3 class="related-articles-title">Related Articles</h3>
                <div class="related-articles-list">
                    ${articles.map(related => `
                        <div class="related-article-item" onclick="showArticlePreview(${JSON.stringify(related).replace(/"/g, '&quot;')})">
                            <img src="${related.image || 'images/logotype.png'}" alt="${related.title}">
                            <div class="related-article-content">
                                <h4>${related.title}</h4>
                                <span>${formatDate(related.date)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
      })
      .catch(error => {
            console.warn('Failed to load related articles:', error);
        });
}

// Enhanced share function
window.shareArticle = function(url, title, platform) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    let shareUrl = '';
    
    switch(platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            break;
        default:
            if (navigator.share) {
                navigator.share({ title, url });
                return;
            } else {
                navigator.clipboard.writeText(url);
                showNotification('Article link copied to clipboard!', 'success');
                return;
            }
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
};

// ============================================
// BOOKMARK FUNCTIONALITY
// ============================================

async function toggleBookmark(btn, title, url, image, description, category) {
    if (!window.authAPI || !window.authAPI.isAuthenticated()) {
        showNotification('Please login to bookmark articles', 'info');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }

    const token = window.authAPI.getToken();
    const isBookmarked = btn.classList.contains('bookmarked');

    try {
        if (isBookmarked) {
            // Remove bookmark
            const response = await fetch('/api/user/bookmarks', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ articleUrl: url })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                btn.classList.remove('bookmarked');
                btn.querySelector('svg').setAttribute('fill', 'none');
                showNotification('Bookmark removed', 'success');
            } else {
                showNotification('Failed to remove bookmark', 'error');
            }
        } else {
            // Add bookmark
            const response = await fetch('/api/user/bookmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    articleTitle: title,
                    articleUrl: url,
                    articleImage: image,
                    articleDescription: description,
                    articleCategory: category
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                btn.classList.add('bookmarked');
                btn.querySelector('svg').setAttribute('fill', 'currentColor');
                showNotification('Article bookmarked', 'success');
            } else {
                showNotification(data.message || 'Failed to bookmark article', 'error');
            }
        }
    } catch (error) {
        console.error('Bookmark error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Calculate reading time
function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute) || 1;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Today';
        }
        
        const now = new Date();
        const diffTime = now - date; // Positive if date is in the past
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // If date is in the future or very recent, show "Today"
        if (diffTime < 0 || diffHours < 24) {
            if (diffHours < 1) {
                return 'Just now';
            } else if (diffHours < 2) {
                return '1 hour ago';
            } else {
                return `${diffHours} hours ago`;
            }
        }
        
        // Show relative time for recent articles
        if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        }
        
        // For older articles, show full date
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'Today';
    }
}

// ============================================
// SCROLL TO TOP
// ============================================

function setupScrollToTop() {
    const scrollToTopBtn = document.querySelector('.scroll-to-top');

    if (scrollToTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        // Scroll to top on click
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ============================================
// SUBSCRIPTION FORM
// ============================================

// ============================================
// AUTHENTICATION UI
// ============================================

function setupAuthUI() {
    // Wait for auth.js to be loaded
    if (window.authAPI) {
        window.authAPI.checkAuth();
    } else {
        // Retry after a short delay
        setTimeout(() => {
            if (window.authAPI) {
                window.authAPI.checkAuth();
            }
        }, 500);
    }
}

// This function is called from auth.js
window.updateAuthUI = function(isLoggedIn, user) {
    const authNav = document.getElementById('auth-nav');
    if (!authNav) return;

    if (isLoggedIn && user) {
        authNav.innerHTML = `
            <div class="user-menu">
                <a href="/profile" class="user-link">
                    <span class="user-name">${user.name || user.email}</span>
                </a>
                <button class="logout-btn" onclick="window.authAPI.logout()">
                    Logout
                </button>
            </div>
        `;
    } else {
        authNav.innerHTML = `
            <div class="auth-buttons">
                <a href="/login" class="btn-login">Login</a>
                <a href="/signup" class="btn-signup">Sign Up</a>
            </div>
        `;
    }
};

// ============================================
// SUBSCRIPTION FORM
// ============================================

function setupSubscriptionForm() {
  const subscriptionForm = document.getElementById('subscription-form');

    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

    const emailInput = document.getElementById('email-input');
            const email = emailInput.value.trim();

            if (validateEmail(email)) {
                try {
                    const response = await fetch('/api/newsletter/subscribe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email })
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        showNotification('Successfully subscribed! Check your email for confirmation.', 'success');
    subscriptionForm.reset();
                    } else {
                        showNotification(data.message || 'Subscription failed. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Subscription error:', error);
                    showNotification('Network error. Please try again later.', 'error');
                }
            } else {
                showNotification('Please enter a valid email address.', 'error');
            }
        });
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ============================================
// ANIMATIONS
// ============================================

function setupAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}


function animateCards() {
    const cards = document.querySelectorAll('.news-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// ============================================
// ERROR HANDLING
// ============================================

function displayError() {
    const newsContainer = document.getElementById('news-container');
    if (newsContainer) {
        newsContainer.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: white;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1rem; opacity: 0.5;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Failed to load news</h3>
                <p style="opacity: 0.8; margin-bottom: 1rem;">Please try refreshing the page</p>
                <button onclick="location.reload()" style="
                    padding: 0.75rem 1.5rem;
                    background: white;
                    color: #6366f1;
                    border: none;
                    border-radius: 9999px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                ">Refresh Page</button>
            </div>
        `;
    }
}


// ============================================
// ADDITIONAL CSS ANIMATIONS (via JavaScript)
// ============================================

// Add slide-in animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// ANALYTICS TRACKING
// ============================================

function trackArticleView(article) {
    // Track article views
    if (article.url && article.url !== '#') {
        // Send analytics event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'article_view', {
                'article_title': article.title,
                'article_category': article.category,
                'article_url': article.url
            });
        }
        
        // Track in local storage for analytics
        const viewHistory = JSON.parse(localStorage.getItem('articleViews') || '[]');
        viewHistory.push({
            title: article.title,
            url: article.url,
            category: article.category,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 views
        if (viewHistory.length > 100) {
            viewHistory.shift();
        }
        
        localStorage.setItem('articleViews', JSON.stringify(viewHistory));
    }
}

function trackSearch(query) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'search', {
            'search_term': query
        });
    }
}

function trackCategoryFilter(category) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'category_filter', {
            'category': category
        });
    }
}

// Track article clicks
document.addEventListener('click', (e) => {
    const articleCard = e.target.closest('.news-card');
    if (articleCard) {
        const articleUrl = articleCard.querySelector('.bookmark-btn')?.getAttribute('data-article-url');
        if (articleUrl) {
            const article = newsArticles.find(a => a.url === articleUrl);
            if (article) {
                trackArticleView(article);
            }
        }
    }
});

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Optimize scroll event listener
window.addEventListener('scroll', throttle(() => {
    // Scroll-based animations can be added here
}, 100));

// ============================================
// FEATURED CAROUSEL
// ============================================

function setupFeaturedCarousel() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const slidesContainer = document.getElementById('featured-slides');
    
    if (!slidesContainer) return;
    
    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showPreviousFeatured();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showNextFeatured();
        });
    }
    
    // Auto-slide every 8 seconds
    featuredAutoSlideInterval = setInterval(() => {
        showNextFeatured();
    }, 8000);
    
    // Pause on hover
    const carousel = document.querySelector('.featured-carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => {
            if (featuredAutoSlideInterval) {
                clearInterval(featuredAutoSlideInterval);
            }
        });
        
        carousel.addEventListener('mouseleave', () => {
            featuredAutoSlideInterval = setInterval(() => {
                showNextFeatured();
            }, 8000);
        });
    }
}

function updateFeaturedCarousel() {
    const slidesContainer = document.getElementById('featured-slides');
    if (!slidesContainer || featuredArticles.length === 0) return;
    
    // Clear existing slides
    slidesContainer.innerHTML = '';
    
    // Create slides for each featured article
    featuredArticles.forEach((article, index) => {
        const slide = createFeaturedSlide(article, index);
        slidesContainer.appendChild(slide);
    });
    
    // Update indicators
    updateFeaturedIndicators();
    
    // Show first slide
    showFeaturedSlide(0);
}

function createFeaturedSlide(article, index) {
    const slide = document.createElement('div');
    slide.className = 'featured-slide';
    slide.dataset.index = index;
    
    const imageUrl = article.image || article.urlToImage || 'images/logotype.png';
    const articleUrl = article.url || '#';
    const logoFallback = 'images/logotype.png';
    
    slide.innerHTML = `
        <article class="featured-article">
            <div class="featured-image-wrapper">
                <img src="${imageUrl}" alt="${article.title}" class="featured-image" 
                     onerror="this.onerror=null; this.src='${logoFallback}'; this.style.objectFit='contain'; this.style.padding='20px';">
                <div class="article-badge">Featured</div>
            </div>
            <div class="featured-content">
                <div class="article-meta">
                    <span class="article-category">${article.category || 'General'}</span>
                    <span class="article-date">${formatDate(article.date)}</span>
                </div>
                <h2 class="article-title">${article.title || 'Untitled'}</h2>
                <p class="article-excerpt">${(article.description || 'No description available.').substring(0, 200)}...</p>
                <div class="article-footer">
                    <a href="${articleUrl}" class="read-more-btn" target="_blank" onclick="event.stopPropagation()">
                        Read Full Article
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                    <div class="article-actions">
                        <button class="action-btn" aria-label="Share article" onclick="event.stopPropagation(); shareArticle('${articleUrl}', '${article.title.replace(/'/g, "\\'")}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
    
    return slide;
}

function showFeaturedSlide(index) {
    const slides = document.querySelectorAll('.featured-slide');
    if (slides.length === 0) return;
    
    // Ensure index is within bounds
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    
    currentFeaturedIndex = index;
    
    // Remove active class from all slides
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'slide-in', 'slide-out');
        if (i === index) {
            slide.classList.add('active', 'slide-in');
        } else if (i < index) {
            slide.classList.add('slide-out');
        }
    });
    
    // Update indicators
    updateFeaturedIndicators();
}

function showNextFeatured() {
    showFeaturedSlide(currentFeaturedIndex + 1);
}

function showPreviousFeatured() {
    showFeaturedSlide(currentFeaturedIndex - 1);
}

function updateFeaturedIndicators() {
    const indicatorsContainer = document.querySelector('.featured-indicators');
    if (!indicatorsContainer) return;
    
    indicatorsContainer.innerHTML = '';
    
    featuredArticles.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = `featured-indicator ${index === currentFeaturedIndex ? 'active' : ''}`;
        indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
        indicator.addEventListener('click', () => {
            showFeaturedSlide(index);
        });
        indicatorsContainer.appendChild(indicator);
    });
}

// Share article function
function shareArticle(url, title) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url);
        showNotification('Article link copied to clipboard!', 'success');
    }
}

// Make shareArticle globally available
window.shareArticle = shareArticle;

// ============================================
// TRENDING WIDGET
// ============================================

function setupTrendingWidget() {
    fetchTrendingArticles();
    // Refresh trending every 10 minutes
    setInterval(fetchTrendingArticles, 600000);
}

function fetchTrendingArticles() {
    fetch('/api/news/trending?limit=5')
        .then(response => response.json())
        .then(articles => {
            const trendingContainer = document.getElementById('trending-articles');
            if (!trendingContainer) return;
            
            trendingContainer.innerHTML = '';
            
            articles.forEach((article, index) => {
                const item = document.createElement('div');
                item.className = 'trending-item';
                item.innerHTML = `
                    <span class="trending-number">${index + 1}</span>
                    <div class="trending-content">
                        <h4 class="trending-title">${article.title}</h4>
                        <span class="trending-meta">${formatDate(article.date)}</span>
                    </div>
                `;
                item.addEventListener('click', () => {
                    if (article.url && article.url !== '#') {
                        window.open(article.url, '_blank');
                    }
                });
                trendingContainer.appendChild(item);
            });
        })
        .catch(error => {
            console.warn('Failed to fetch trending articles:', error);
        });
}

// ============================================
// MOST READ SECTION
// ============================================

function setupMostReadSection() {
    fetchMostReadArticles();
    // Refresh most read every 10 minutes
    setInterval(fetchMostReadArticles, 600000);
}

function fetchMostReadArticles() {
    fetch('/api/news/popular?limit=5')
        .then(response => response.json())
        .then(articles => {
            const mostReadContainer = document.getElementById('most-read-articles');
            if (!mostReadContainer) return;
            
            mostReadContainer.innerHTML = '';
            
            articles.forEach((article, index) => {
                const item = document.createElement('div');
                item.className = 'most-read-item';
                item.innerHTML = `
                    <div class="most-read-image">
                        <img src="${article.image || 'images/logotype.png'}" alt="${article.title}" 
                             onerror="this.src='images/logotype.png'; this.style.objectFit='contain'; this.style.padding='10px';">
                    </div>
                    <div class="most-read-content">
                        <h4 class="most-read-title">${article.title}</h4>
                        <div class="most-read-meta">
                            <span>${formatDate(article.date)}</span>
                            <span>•</span>
                            <span>${article.viewCount || 0} views</span>
                        </div>
                    </div>
                `;
                item.addEventListener('click', () => {
                    if (article.url && article.url !== '#') {
                        window.open(article.url, '_blank');
                    }
                });
                mostReadContainer.appendChild(item);
            });
        })
        .catch(error => {
            console.warn('Failed to fetch most read articles:', error);
        });
}

// ============================================
// INFINITE SCROLL
// ============================================

// ============================================
// LOAD MORE ARTICLES FUNCTIONALITY
// ============================================

function setupLoadMoreButton() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadMoreArticles();
        });
    }
}

function loadMoreArticles() {
    const nextBatch = allArticles.slice(displayedArticlesCount, displayedArticlesCount + articlesPerPage);
    
    if (nextBatch.length === 0) {
        // No more articles to load
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        return;
    }
    
    // Display next batch
    nextBatch.forEach((article, index) => {
        const articleCard = createArticleCard(article, displayedArticlesCount + index);
        const newsContainer = document.getElementById('news-container');
        if (newsContainer) {
            newsContainer.appendChild(articleCard);
        }
    });
    
    displayedArticlesCount += nextBatch.length;
    
    // Hide button if no more articles
    if (displayedArticlesCount >= allArticles.length) {
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }
}

// Sort articles by latest time (newest first)
function sortArticlesByDate(articles) {
    return articles.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA; // Newest first
    });
}

// ============================================
// AUTO REFRESH NEWS
// ============================================

function setupNewsAutoRefresh() {
    // Refresh news every 5 minutes (300000 ms)
    newsAutoRefreshInterval = setInterval(() => {
        console.log('Auto-refreshing news...');
        refreshNews();
    }, 300000); // 5 minutes
}

function refreshNews() {
    currentPage = 1;
    fetchNewsByRegion();
}

