import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env.local');
}

export async function connectDB(): Promise<void> {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB is already connected');
            return;
        }

        await mongoose.connect(MONGODB_URI);

        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        throw error;
    }
}
