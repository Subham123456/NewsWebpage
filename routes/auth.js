import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User.js';
import UserPreferences from '../models/UserPreferences.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'Database not connected. Please start MongoDB and restart the server. See SETUP_GUIDE.md for help.'
        });
    }
    
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        // Create default preferences
        await UserPreferences.create({
            user: user._id,
            preferredCategories: ['general']
        });

        // Generate token
        const token = user.generateAuthToken();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        
        // Provide more specific error messages
        let errorMessage = 'Server error during registration';
        
        if (error.name === 'MongoServerError' && error.code === 11000) {
            errorMessage = 'Email already exists';
        } else if (error.name === 'ValidationError') {
            errorMessage = 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ');
        } else if (error.message && error.message.includes('MongoDB')) {
            errorMessage = 'Database connection error. Please check if MongoDB is running.';
        } else if (error.message && error.message.includes('JWT')) {
            errorMessage = 'Authentication configuration error. Please check JWT_SECRET in .env file.';
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { 
                error: error.message,
                details: error.stack 
            })
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        await user.updateLastLogin();

        // Generate token
        const token = user.generateAuthToken();

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, async (req, res) => {
    // JWT is stateless, so logout is handled client-side
    // But we can log the logout event if needed
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

export default router;
