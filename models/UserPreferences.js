import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    preferredCategories: {
        type: [String],
        default: ['general'],
        enum: ['technology', 'science', 'business', 'health', 'entertainment', 'sports', 'general']
    },
    newsletterSubscribed: {
        type: Boolean,
        default: false
    },
    readingPreferences: {
        fontSize: {
            type: String,
            enum: ['small', 'medium', 'large'],
            default: 'medium'
        },
        darkMode: {
            type: Boolean,
            default: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userPreferencesSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

export default UserPreferences;
