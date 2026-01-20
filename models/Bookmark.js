import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    articleTitle: {
        type: String,
        required: true
    },
    articleUrl: {
        type: String,
        required: true
    },
    articleImage: {
        type: String
    },
    articleDescription: {
        type: String
    },
    articleCategory: {
        type: String
    },
    articleAuthor: {
        type: String
    },
    articleDate: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, articleUrl: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;
