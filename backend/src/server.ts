import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { initializeStorage } from './services/storage.service';
import uploadRoutes from './routes/upload';
import queryRoutes from './routes/query';
import userRoutes from './routes/user';
import authRoutes from './routes/auth';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev')); // Logging

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api', (req: Request, res: Response) => {
    res.json({ message: 'BookBuddy API Server' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);
app.use('/api/ingest', uploadRoutes);

// Query routes
app.use('/api/query', queryRoutes);
app.use('/api/chat', queryRoutes);

// User routes
app.use('/api/user', userRoutes);
app.use('/api/book', userRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize storage and start server
async function startServer() {
    try {
        // Initialize storage (create directories/buckets)
        await initializeStorage();

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 BookBuddy API server running on port ${PORT}`);
            console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
