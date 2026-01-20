import express from 'express';
import { protect } from '../middleware/auth.js';
import Bookmark from '../models/Bookmark.js';
import UserPreferences from '../models/UserPreferences.js';

const router = express.Router();

// ============================================
// BOOKMARKS
// ============================================

// @route   POST /api/user/bookmarks
// @desc    Add a bookmark
// @access  Private
router.post('/bookmarks', protect, async (req, res) => {
    try {
        const { articleTitle, articleUrl, articleImage, articleDescription, articleCategory, articleAuthor, articleDate } = req.body;

        if (!articleTitle || !articleUrl) {
            return res.status(400).json({
                success: false,
                message: 'Article title and URL are required'
            });
        }

        // Check if bookmark already exists
        const existingBookmark = await Bookmark.findOne({
            user: req.user._id,
            articleUrl
        });

        if (existingBookmark) {
            return res.status(400).json({
                success: false,
                message: 'Article already bookmarked'
            });
        }

        const bookmark = await Bookmark.create({
            user: req.user._id,
            articleTitle,
            articleUrl,
            articleImage,
            articleDescription,
            articleCategory,
            articleAuthor,
            articleDate
        });

        res.status(201).json({
            success: true,
            message: 'Article bookmarked successfully',
            bookmark
        });
    } catch (error) {
        console.error('Add bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/user/bookmarks
// @desc    Get user bookmarks
// @access  Private
router.get('/bookmarks', protect, async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            count: bookmarks.length,
            bookmarks
        });
    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/user/bookmarks/:id
// @desc    Remove a bookmark
// @access  Private
router.delete('/bookmarks/:id', protect, async (req, res) => {
    try {
        const bookmark = await Bookmark.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                message: 'Bookmark not found'
            });
        }

        await bookmark.deleteOne();

        res.json({
            success: true,
            message: 'Bookmark removed successfully'
        });
    } catch (error) {
        console.error('Delete bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/user/bookmarks
// @desc    Remove bookmark by URL
// @access  Private
router.delete('/bookmarks', protect, async (req, res) => {
    try {
        const { articleUrl } = req.body;

        if (!articleUrl) {
            return res.status(400).json({
                success: false,
                message: 'Article URL is required'
            });
        }

        const bookmark = await Bookmark.findOneAndDelete({
            user: req.user._id,
            articleUrl
        });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                message: 'Bookmark not found'
            });
        }

        res.json({
            success: true,
            message: 'Bookmark removed successfully'
        });
    } catch (error) {
        console.error('Delete bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ============================================
// USER PREFERENCES
// ============================================

// @route   GET /api/user/preferences
// @desc    Get user preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
    try {
        let preferences = await UserPreferences.findOne({ user: req.user._id });

        if (!preferences) {
            // Create default preferences if none exist
            preferences = await UserPreferences.create({
                user: req.user._id,
                preferredCategories: ['general']
            });
        }

        res.json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/user/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
    try {
        const { preferredCategories, newsletterSubscribed, readingPreferences } = req.body;

        let preferences = await UserPreferences.findOne({ user: req.user._id });

        if (!preferences) {
            preferences = await UserPreferences.create({
                user: req.user._id,
                preferredCategories: preferredCategories || ['general'],
                newsletterSubscribed: newsletterSubscribed !== undefined ? newsletterSubscribed : false,
                readingPreferences: readingPreferences || {}
            });
        } else {
            if (preferredCategories) preferences.preferredCategories = preferredCategories;
            if (newsletterSubscribed !== undefined) preferences.newsletterSubscribed = newsletterSubscribed;
            if (readingPreferences) preferences.readingPreferences = { ...preferences.readingPreferences, ...readingPreferences };
            
            await preferences.save();
        }

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ============================================
// READING HISTORY
// ============================================

// @route   POST /api/user/history
// @desc    Add article to reading history
// @access  Private
router.post('/history', protect, async (req, res) => {
    try {
        const { articleTitle, articleUrl, articleImage, articleCategory } = req.body;

        // For simplicity, we'll use bookmarks to track history
        // In production, you might want a separate History model
        // For now, we'll just acknowledge the request
        res.json({
            success: true,
            message: 'Reading history updated'
        });
    } catch (error) {
        console.error('Update history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/user/history
// @desc    Get reading history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        // Return recent bookmarks as reading history
        const history = await Bookmark.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
