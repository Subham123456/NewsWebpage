# NewsHub - Modern News Website

A modern, full-featured news website with real-time updates, user authentication, and personalized content.

## Features

- ✅ Real-time news from RSS feeds (FREE - No API keys needed!)
- ✅ User authentication (Sign up, Login, Profile)
- ✅ Bookmark articles
- ✅ User preferences
- ✅ Newsletter subscription
- ✅ Geographic filtering (Domestic, International, District)
- ✅ Category filtering (Technology, Science, Business, Health, Entertainment, Sports)
- ✅ Responsive design
- ✅ Modern UI with glassmorphism effects
- ✅ Dark mode support

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/newshub
JWT_SECRET=your_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development

# Optional: For enhanced news sources
# NEWS_API_KEY=your_newsapi_key_here
# GNEWS_API_KEY=your_gnews_key_here
```

### 3. Start MongoDB

**Option A: Local MongoDB**
- Install MongoDB Community Server from https://www.mongodb.com/try/download/community
- MongoDB will start automatically as a Windows service
- Verify: `netstat -an | findstr ":27017"`

**Option B: MongoDB Atlas (Cloud - Free)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string and update `MONGODB_URI` in `.env`

### 4. Start the Server

```bash
npm start
```

The server will start at `http://localhost:3000`

## News Sources

The website uses a multi-tier fallback system:

1. **RSS Feeds (Primary - FREE, No API key needed!)**
   - TechCrunch, The Verge (Technology)
   - Scientific American, NASA (Science)
   - Reuters, CNBC (Business)
   - Medical News Today, Healthline (Health)
   - BBC, CNN (General)
   - And more...

2. **NewsAPI.org (Optional)**
   - Requires free API key from https://newsapi.org/register
   - 500 free requests per day
   - Add `NEWS_API_KEY` to `.env`

3. **GNews API (Optional)**
   - Requires free API key from https://gnews.io/
   - Add `GNEWS_API_KEY` to `.env`

**Note:** RSS feeds work immediately without any setup!

## Project Structure

```
NewsWebpage/
├── app.js                 # Main server file
├── config/
│   └── database.js       # MongoDB connection
├── data/
│   ├── indianStates.json # Indian states data
│   └── newsdata.json     # Fallback news data
├── middleware/
│   ├── auth.js           # Authentication middleware
│   └── errorHandler.js   # Error handling
├── models/
│   ├── User.js           # User model
│   ├── Bookmark.js       # Bookmark model
│   ├── Newsletter.js     # Newsletter model
│   └── UserPreferences.js # User preferences model
├── public/
│   ├── css/
│   │   └── style.css     # Main stylesheet
│   ├── images/
│   │   └── logotype.png  # Logo
│   ├── js/
│   │   ├── appf.js       # Main frontend JavaScript
│   │   └── auth.js       # Authentication JavaScript
│   └── robots.txt        # SEO robots file
├── routes/
│   ├── auth.js           # Authentication routes
│   └── user.js           # User routes
└── views/
    ├── index.html        # Home page
    ├── login.html        # Login page
    ├── signup.html       # Signup page
    └── profile.html      # Profile page
```

## API Endpoints

### News
- `GET /api/news` - Get news articles (supports category, region, pagination)
- `GET /api/news/trending` - Get trending articles
- `GET /api/news/popular` - Get popular articles
- `GET /api/news/related/:articleId` - Get related articles
- `GET /api/states` - Get Indian states data

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### User
- `POST /api/user/bookmarks` - Add bookmark
- `GET /api/user/bookmarks` - Get user bookmarks
- `DELETE /api/user/bookmarks/:id` - Remove bookmark
- `GET /api/user/preferences` - Get user preferences
- `PUT /api/user/preferences` - Update user preferences

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter

## Development

```bash
# Development mode with auto-reload
npm run dev
```

## Troubleshooting

### "Server error during registration"
- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify MongoDB connection string is correct

### "Port 3000 is already in use"
- The server automatically handles this
- If issues persist, change `PORT` in `.env`

### No news articles showing
- Check server console for error messages
- RSS feeds should work automatically
- Verify internet connection

### Images not loading
- Some articles may not have images
- The system uses a logo fallback automatically
- RSS feeds have limited image support

## License

ISC

## Author

NewsHub Team
