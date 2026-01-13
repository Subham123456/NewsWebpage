// ============================================
// MODERN NEWS WEBSITE - ENHANCED JAVASCRIPT
// ============================================

// Global variables
let newsArticles = [];
let filteredArticles = [];
let currentFilter = 'all';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// ============================================
// INITIALIZATION
// ============================================

function initializeApp() {
    setupNavigation();
    setupMobileMenu();
    setupSearch();
    setupFilters();
    setupScrollToTop();
    setupSubscriptionForm();
    fetchNewsData();
    setupAnimations();
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
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            const targetId = link.getAttribute('href');
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
                    displayNewsArticles(newsArticles);
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
    const newsContainer = document.getElementById('news-container');
    if (filtered.length === 0 && newsContainer) {
        newsContainer.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: white;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1rem; opacity: 0.5;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No articles found</h3>
                <p style="opacity: 0.8;">Try searching with different keywords</p>
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
            currentFilter = tab.getAttribute('data-filter');
            
            // Filter and display articles
            applyFilter();
        });
    });
}

function applyFilter() {
    if (currentFilter === 'all') {
        filteredArticles = newsArticles;
    } else {
        filteredArticles = newsArticles.filter(article => {
            const category = article.category?.toLowerCase() || '';
            return category.includes(currentFilter);
        });
    }
    
    displayNewsArticles(filteredArticles);
}

// ============================================
// NEWS DATA FETCHING
// ============================================

function fetchNewsData() {
    fetch('./newsdata.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            newsArticles = data;
            filteredArticles = data;
            displayNewsArticles(data);
        })
        .catch(error => {
            console.error('Error fetching news data:', error);
            displayError();
        });
}

// ============================================
// IMAGE SELECTION BY CATEGORY
// ============================================

function getImageForCategory(category, title) {
    // Use reliable placeholder service with category-specific colors and text
    const categoryLower = (category || '').toLowerCase();
    const titleLower = (title || '').toLowerCase();
    
    // Color scheme for each category
    const categoryColors = {
        'technology': { bg: '6366f1', text: 'ffffff', label: 'Technology' },
        'science': { bg: '8b5cf6', text: 'ffffff', label: 'Science' },
        'business': { bg: 'ec4899', text: 'ffffff', label: 'Business' },
        'health': { bg: '10b981', text: 'ffffff', label: 'Health' }
    };
    
    // Determine category from title keywords if not explicitly set
    let finalCategory = categoryLower;
    if (titleLower.includes('quantum') || titleLower.includes('computing') || titleLower.includes('ai') || titleLower.includes('tech') || titleLower.includes('energy') || titleLower.includes('renewable')) {
        finalCategory = 'technology';
    } else if (titleLower.includes('climate') || titleLower.includes('space') || titleLower.includes('mars') || titleLower.includes('dna') || titleLower.includes('exploration')) {
        finalCategory = 'science';
    } else if (titleLower.includes('economy') || titleLower.includes('business') || titleLower.includes('finance') || titleLower.includes('partnership') || titleLower.includes('giants')) {
        finalCategory = 'business';
    } else if (titleLower.includes('cancer') || titleLower.includes('treatment') || titleLower.includes('health') || titleLower.includes('exercise') || titleLower.includes('brain')) {
        finalCategory = 'health';
    }
    
    // Get color scheme for category
    const colors = categoryColors[finalCategory] || { bg: '6b7280', text: 'ffffff', label: 'News' };
    
    // Use placeholder.com - very reliable service
    return `https://via.placeholder.com/800x600/${colors.bg}/${colors.text}?text=${encodeURIComponent(colors.label)}`;
}

// ============================================
// DISPLAY NEWS ARTICLES
// ============================================

function displayNewsArticles(articles) {
    const newsContainer = document.getElementById('news-container');
    
    if (!newsContainer) return;

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
    
    // Use category-specific image instead of hardcoded DNA image
    const imageUrl = article.image && article.image !== 'images/Dna article png.jpg' 
        ? article.image 
        : getImageForCategory(category, title);

    // Get fallback image with category color
    const fallbackImage = getImageForCategory(category, title);
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" class="news-card-image" 
             onerror="this.onerror=null; this.src='${fallbackImage}'"
             loading="lazy">
        <div class="news-card-content">
            <div class="news-card-meta">
                <span class="article-category">${category}</span>
                <span class="article-date">${formatDate(date)}</span>
            </div>
            <h3 class="news-card-title">${title}</h3>
            <p class="news-card-description">${description}</p>
            <div class="news-card-footer">
                <span class="news-card-author">By ${author}</span>
                <span class="news-card-date">${formatDate(date)}</span>
            </div>
        </div>
    `;

    // Add click event to card
    card.addEventListener('click', () => {
        // You can add navigation to article detail page here
        console.log('Article clicked:', title);
    });

    return card;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
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

function setupSubscriptionForm() {
    const subscriptionForm = document.getElementById('subscription-form');

    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email-input');
            const email = emailInput.value.trim();

            if (validateEmail(email)) {
                // Simulate subscription (replace with actual API call)
                showNotification('Successfully subscribed! Check your email for confirmation.', 'success');
                subscriptionForm.reset();
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
// LOAD MORE FUNCTIONALITY
// ============================================

const loadMoreBtn = document.querySelector('.load-more-btn');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        // This can be extended to load more articles from an API
        showNotification('More articles coming soon!', 'success');
    });
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
