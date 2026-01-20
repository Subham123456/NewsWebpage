import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newshub';

const connectDB = async () => {
    try {
        // Check if MongoDB URI is set
        if (!process.env.MONGODB_URI && MONGODB_URI === 'mongodb://localhost:27017/newshub') {
            console.warn('⚠️  WARNING: Using default MongoDB URI. Set MONGODB_URI in .env file for production.');
        }
        
        const conn = await mongoose.connect(MONGODB_URI);

        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
        console.log(`✓ Database: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('   Make sure MongoDB is running on your system.');
        console.error('   For local MongoDB: Start MongoDB service or run: mongod');
        console.error('   For MongoDB Atlas: Check your connection string in .env file');
        // In production, you might want to exit the process
        // process.exit(1);
        throw error;
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

export default connectDB;
