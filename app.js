import express from "express"
import fetch from "node-fetch";
import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import Newsletter from './models/Newsletter.js';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to database
connectDB().catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('   The server will continue but authentication features will not work.');
    console.error('   Please start MongoDB and restart the server.');
    // Continue running even if DB fails (for development)
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            scriptSrc: ["'self'", "'unsafe-inline'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from public directory with caching
app.use(express.static('public', {
    maxAge: '1d', // Cache static files for 1 day
    etag: true
}));

// Enable CORS for API requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Load Indian states data
let indianStatesData = null;
try {
    const statesDataPath = path.join(__dirname, 'data', 'indianStates.json');
    indianStatesData = JSON.parse(fs.readFileSync(statesDataPath, 'utf8'));
    console.log('✓ Loaded Indian states data');
} catch (error) {
    console.warn('⚠ Could not load Indian states data:', error.message);
}

// Serve newsdata.json (fallback)
app.get('/newsdata.json', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'newsdata.json');
    console.log('Serving newsdata.json from:', filePath);
    res.sendFile(filePath);
});

// Serve Indian states data
app.get('/api/states', (req, res) => {
    if (indianStatesData) {
        res.json(indianStatesData);
    } else {
        res.status(500).json({ error: 'States data not available' });
    }
});

// Core function to fetch news articles - RSS FEEDS FIRST (FREE, NO API KEYS NEEDED!)
async function fetchNewsArticles(options = {}) {
    const {
        category = 'general',
        page = 1,
        pageSize = 20,
        region = null,
        state = null,
        district = null,
        country = null
    } = options;
    
    let articles = [];
    
    // Option 1: Use RSS feeds FIRST (completely free, no API key needed!)
    try {
        articles = await fetchNewsFromRSS(category, pageSize, region, state, district, country);
        if (articles.length > 0) {
            // Sort by latest time (newest first)
            articles = articles.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });
            console.log(`✓ Fetched ${articles.length} articles from RSS feeds (FREE - No API key needed!)`);
            return articles;
        }
    } catch (error) {
        console.log('RSS feeds failed, trying alternatives...');
    }
    
    // Option 2: Try NewsAPI.org (optional - requires free API key)
    const newsApiKey = process.env.NEWS_API_KEY || '';
    if (newsApiKey && newsApiKey !== '') {
        try {
            const url = `https://newsapi.org/v2/top-headlines?category=${category}&pageSize=${pageSize}&page=${page}&apiKey=${newsApiKey}&country=us`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'ok' && data.articles && data.articles.length > 0) {
                articles = data.articles.map(article => {
                    let imageUrl = article.urlToImage || null;
                    if (imageUrl && (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
                        imageUrl = null;
                    }
                    
                    let articleDate = new Date().toISOString();
                    if (article.publishedAt) {
                        const parsedDate = new Date(article.publishedAt);
                        if (!isNaN(parsedDate.getTime())) {
                            articleDate = parsedDate.toISOString();
                        }
                    }
                    
                    return addGeographicMetadata({
                        title: article.title || 'Untitled',
                        description: (article.description || article.content?.substring(0, 200) || 'No description available.').replace(/<[^>]*>/g, ''),
                        image: imageUrl,
                        author: article.author || article.source?.name || 'Unknown',
                        date: articleDate,
                        category: mapCategoryFromApi(category),
                        url: article.url
                    }, region, state, district, country || 'US');
                }).filter(article => article.title !== 'Untitled' && article.title);
                
                if (articles.length > 0) {
                    articles = articles.sort((a, b) => {
                        const dateA = new Date(a.date || 0);
                        const dateB = new Date(b.date || 0);
                        return dateB - dateA;
                    });
                    console.log(`✓ Fetched ${articles.length} articles from NewsAPI.org`);
                    return articles;
                }
            }
        } catch (error) {
            console.log('NewsAPI.org failed, trying alternatives...');
        }
    }
    
    // Option 3: Try GNews API (optional - requires free API key)
    const gnewsApiKey = process.env.GNEWS_API_KEY || '';
    if (gnewsApiKey && gnewsApiKey !== '') {
        try {
            const gnewsUrl = `https://gnews.io/api/v4/top-headlines?category=${category}&max=${pageSize}&lang=en&apikey=${gnewsApiKey}`;
            const response = await fetch(gnewsUrl);
            const data = await response.json();
            
            if (data.articles && data.articles.length > 0) {
                articles = data.articles.map(article => addGeographicMetadata({
                    title: article.title || 'Untitled',
                    description: article.description || article.content?.substring(0, 200) || 'No description available.',
                    image: article.image || null,
                    author: article.source?.name || 'Unknown',
                    date: article.publishedAt || new Date().toISOString(),
                    category: mapCategoryFromApi(category),
                    url: article.url
                }, region, state, district, country)).filter(article => article.title !== 'Untitled');
                
                if (articles.length > 0) {
                    articles = articles.sort((a, b) => {
                        const dateA = new Date(a.date || 0);
                        const dateB = new Date(b.date || 0);
                        return dateB - dateA;
                    });
                    console.log(`✓ Fetched ${articles.length} articles from GNews API`);
                    return articles;
                }
            }
        } catch (error) {
            console.log('GNews API failed, using fallback...');
        }
    }
    
    // Final fallback: Sample articles
    articles = getSampleArticlesFromCategory(category, pageSize);
    articles = articles.map(article => addGeographicMetadata(article, region, state, district, country));
    
    if (region || state || district || country) {
        articles = filterByGeography(articles, region, state, district, country);
    }
    
    articles = articles.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
    });
    
    console.log(`⚠ Using sample articles (${articles.length}) - RSS feeds should work automatically (no API key needed)`);
    return articles;
}

// API endpoint to fetch real news
app.get('/api/news', async (req, res) => {
    try {
        const category = req.query.category || 'general';
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const region = req.query.region || null;
        const state = req.query.state || null;
        const district = req.query.district || null;
        const country = req.query.country || null;
        
        const articles = await fetchNewsArticles({
            category,
            page,
            pageSize,
            region,
            state,
            district,
            country
        });
        
        res.json(articles);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news', message: error.message });
    }
});

// Helper function to map API categories to our categories
function mapCategoryFromApi(apiCategory) {
    const categoryMap = {
        'technology': 'Technology',
        'science': 'Science',
        'business': 'Business',
        'health': 'Health',
        'entertainment': 'Entertainment',
        'sports': 'Sports',
        'general': 'General'
    };
    return categoryMap[apiCategory] || 'General';
}

// Helper function to determine geographic metadata for an article
function addGeographicMetadata(article, region = null, state = null, district = null, country = null) {
    if (!region) {
        if (country === 'India' || article.country === 'India') {
            if (state || article.state) {
                region = 'district';
            } else {
                region = 'domestic';
            }
        } else if (country || article.country) {
            region = 'international';
        } else {
            const titleLower = (article.title || '').toLowerCase();
            const descLower = (article.description || '').toLowerCase();
            const indianKeywords = ['india', 'indian', 'delhi', 'mumbai', 'bangalore', 'kolkata', 'chennai', 'hyderabad', 'pune', 'ahmedabad'];
            const hasIndianKeyword = indianKeywords.some(keyword => 
                titleLower.includes(keyword) || descLower.includes(keyword)
            );
            if (hasIndianKeyword) {
                region = 'domestic';
            } else {
                region = 'international';
            }
        }
    }
    
    return {
        ...article,
        region: region || 'international',
        country: country || article.country || 'Unknown',
        state: state || article.state || null,
        district: district || article.district || null
    };
}

// Helper function to filter articles by geography
function filterByGeography(articles, region, state, district, country) {
    return articles.filter(article => {
        if (region === 'domestic' && country === 'India') {
            return article.region === 'domestic' || article.country === 'India';
        } else if (region === 'international') {
            return article.region === 'international' && article.country !== 'India';
        } else if (region === 'district' && country === 'India') {
            if (state && article.state !== state) return false;
            if (district && article.district !== district) return false;
            return article.region === 'district' || (article.country === 'India' && article.state);
        }
        return true;
    });
}

// Fetch news from RSS feeds (completely free, no API key needed!)
async function fetchNewsFromRSS(category, pageSize, region = null, state = null, district = null, country = null) {
    const parser = new Parser({
        customFields: {
            item: ['media:content', 'enclosure']
        }
    });
    
    const rssFeeds = {
        'technology': [
            'https://techcrunch.com/feed/',
            'https://www.theverge.com/rss/index.xml',
            'https://feeds.feedburner.com/oreilly/radar',
            'https://www.wired.com/feed/rss',
            'https://www.engadget.com/rss.xml'
        ],
        'science': [
            'https://www.scientificamerican.com/rss/',
            'https://www.nasa.gov/rss/dyn/breaking_news.rss',
            'https://www.nature.com/nature.rss',
            'https://feeds.sciencemag.org/science'
        ],
        'business': [
            'https://feeds.reuters.com/reuters/businessNews',
            'https://www.cnbc.com/id/100003114/device/rss/rss.html',
            'https://feeds.bloomberg.com/markets/news.rss',
            'https://www.forbes.com/real-time/feed2/'
        ],
        'health': [
            'https://www.medicalnewstoday.com/rss',
            'https://www.healthline.com/rss',
            'https://www.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC_HOME',
            'https://www.mayoclinic.org/rss/all-mayo-clinic-news'
        ],
        'entertainment': [
            'https://www.rollingstone.com/feed/',
            'https://variety.com/feed/',
            'https://www.hollywoodreporter.com/feed/',
            'https://www.entertainmentweekly.com/feed/'
        ],
        'sports': [
            'https://www.espn.com/espn/rss/news',
            'https://feeds.bbci.co.uk/sport/rss.xml',
            'https://www.skysports.com/rss/12040',
            'https://www.theguardian.com/sport/rss'
        ],
        'general': [
            'https://feeds.bbci.co.uk/news/rss.xml',
            'https://rss.cnn.com/rss/edition.rss',
            'https://feeds.reuters.com/reuters/topNews',
            'https://www.theguardian.com/world/rss',
            'https://www.npr.org/rss/rss.php?id=1001'
        ]
    };
    
    const feeds = rssFeeds[category] || rssFeeds['general'];
    const allArticles = [];
    
    // Try up to 3 feeds per category for better coverage
    for (const feedUrl of feeds.slice(0, 3)) {
        try {
            const feed = await parser.parseURL(feedUrl);
            
            if (feed.items && feed.items.length > 0) {
                const articles = feed.items.slice(0, Math.ceil(pageSize / feeds.length)).map(item => {
                    let imageUrl = null;
                    
                    if (item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
                        imageUrl = item.enclosure.url;
                    }
                    
                    if (!imageUrl && item['media:content']) {
                        if (typeof item['media:content'] === 'object' && item['media:content'].$) {
                            imageUrl = item['media:content'].$.url;
                        } else if (Array.isArray(item['media:content']) && item['media:content'][0]?.$?.url) {
                            imageUrl = item['media:content'][0].$.url;
                        }
                    }
                    
                    if (!imageUrl && item.content) {
                        const contentStr = typeof item.content === 'string' ? item.content : item.content[''] || item.contentSnippet || '';
                        const patterns = [
                            /<img[^>]+src=["']([^"']+)["']/i,
                            /<img[^>]+src=([^\s>]+)/i,
                            /background-image:\s*url\(["']?([^"')]+)["']?\)/i
                        ];
                        
                        for (const pattern of patterns) {
                            const imgMatch = contentStr.match(pattern);
                            if (imgMatch && imgMatch[1]) {
                                imageUrl = imgMatch[1].trim();
                                if (imageUrl.startsWith('/')) {
                                    try {
                                        const feedUrlObj = new URL(feedUrl);
                                        imageUrl = feedUrlObj.origin + imageUrl;
                                    } catch (e) {}
                                } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('//')) {
                                    try {
                                        const feedUrlObj = new URL(feedUrl);
                                        imageUrl = feedUrlObj.origin + '/' + imageUrl;
                                    } catch (e) {}
                                }
                                break;
                            }
                        }
                    }
                    
                    if (!imageUrl && item.contentSnippet) {
                        const patterns = [
                            /<img[^>]+src=["']([^"']+)["']/i,
                            /<img[^>]+src=([^\s>]+)/i
                        ];
                        for (const pattern of patterns) {
                            const imgMatch = item.contentSnippet.match(pattern);
                            if (imgMatch && imgMatch[1]) {
                                imageUrl = imgMatch[1].trim();
                                break;
                            }
                        }
                    }
                    
                    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
                    const articleDate = isNaN(pubDate.getTime()) ? new Date().toISOString() : pubDate.toISOString();
                    
                    return addGeographicMetadata({
                        title: item.title || 'Untitled',
                        description: item.contentSnippet || item.content?.substring(0, 200) || item.description || 'No description available.',
                        image: imageUrl,
                        author: item.creator || item.author || feed.title || 'Unknown',
                        date: articleDate,
                        category: mapCategoryFromApi(category),
                        url: item.link || item.guid || '#'
                    }, region, state, district, country);
                }).filter(article => article.title !== 'Untitled' && article.title);
                
                allArticles.push(...articles);
            }
        } catch (error) {
            console.log(`Failed to fetch from ${feedUrl}:`, error.message);
            continue;
        }
    }
    
    return allArticles;
}

// Get sample articles from category (fallback)
function getSampleArticlesFromCategory(category, count) {
    try {
        const dataPath = path.join(__dirname, 'data', 'newsdata.json');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        const categoryMap = {
            'technology': 'Technology',
            'science': 'Science',
            'business': 'Business',
            'health': 'Health',
            'entertainment': 'Entertainment',
            'sports': 'Sports'
        };
        
        const targetCategory = categoryMap[category] || 'General';
        const filtered = data.filter(article => 
            (article.category || '').toLowerCase() === targetCategory.toLowerCase()
        );
        
        if (filtered.length > 0) {
            return filtered.slice(0, count).map(article => ({
                ...article,
                date: new Date().toISOString() // Make dates recent
            }));
        }
        
        return data.slice(0, count).map(article => ({
            ...article,
            date: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error loading sample articles:', error);
        return [];
    }
}

// Calculate reading time
function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

// Sort articles by date (newest first)
function sortArticlesByDate(articles) {
    return articles.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
    });
}

// Additional news endpoints
app.get('/api/news/trending', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const articles = await fetchNewsArticles({ category: 'general', pageSize: 50 });
        const sorted = sortArticlesByDate(articles).slice(0, limit);
        res.json(sorted);
    } catch (error) {
        console.error('Error fetching trending news:', error);
        res.status(500).json({ error: 'Failed to fetch trending news', message: error.message });
    }
});

app.get('/api/news/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const articles = await fetchNewsArticles({ category: 'general', pageSize: 50 });
        const sorted = sortArticlesByDate(articles).slice(0, limit);
        res.json(sorted);
    } catch (error) {
        console.error('Error fetching popular news:', error);
        res.status(500).json({ error: 'Failed to fetch popular news', message: error.message });
    }
});

app.get('/api/news/related/:articleId', async (req, res) => {
    try {
        const { articleId } = req.params;
        const category = req.query.category || 'general';
        const limit = parseInt(req.query.limit) || 3;
        const articles = await fetchNewsArticles({ category, pageSize: limit + 1 });
        const filtered = articles.filter((_, index) => index !== parseInt(articleId)).slice(0, limit);
        res.json(filtered);
    } catch (error) {
        console.error('Error fetching related news:', error);
        res.status(500).json({ error: 'Failed to fetch related news', message: error.message });
    }
});

// Newsletter subscription
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        try {
            const newsletter = await Newsletter.create({ email });
            res.json({
                success: true,
                message: 'Successfully subscribed to newsletter',
                email: newsletter.email
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already subscribed'
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during subscription'
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Serve HTML files from views directory
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'views', 'index.html');
    res.sendFile(filePath);
});

app.get('/login', (req, res) => {
    const filePath = path.join(__dirname, 'views', 'login.html');
    res.sendFile(filePath);
});

app.get('/signup', (req, res) => {
    const filePath = path.join(__dirname, 'views', 'signup.html');
    res.sendFile(filePath);
});

app.get('/profile', (req, res) => {
    const filePath = path.join(__dirname, 'views', 'profile.html');
    res.sendFile(filePath);
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Function to kill process on port (Windows)
async function killProcessOnPort(port) {
    try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 0) {
                const pid = parts[parts.length - 1];
                if (pid && !isNaN(pid)) {
                    pids.add(pid);
                }
            }
        }
        
        for (const pid of pids) {
            try {
                await execAsync(`taskkill /PID ${pid} /F`);
                console.log(`✓ Killed process ${pid} on port ${port}`);
            } catch (error) {
                // Process might already be dead
            }
        }
    } catch (error) {
        // No process found on port, which is fine
    }
}

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
    // Try to kill any process on the port first
    await killProcessOnPort(PORT);
    
    // Wait a bit for port to be released
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    app.listen(PORT, () => {
        console.log("=========================================");
        console.log(`✓ Server started at http://localhost:${PORT}`);
        console.log("=========================================");
        console.log(`✓ RSS Feeds: ENABLED (FREE - No API keys needed!)`);
        console.log(`✓ NewsAPI.org: ${process.env.NEWS_API_KEY ? 'ENABLED' : 'DISABLED (optional)'}`);
        console.log(`✓ GNews API: ${process.env.GNEWS_API_KEY ? 'ENABLED' : 'DISABLED (optional)'}`);
        console.log("=========================================");
    }).on('error', async (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Attempting to free it...`);
            await killProcessOnPort(PORT);
            await new Promise(resolve => setTimeout(resolve, 2000));
            startServer();
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
}

startServer();
