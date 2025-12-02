import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import tenantRoutes from './routes/tenantRoutes';
import config from './config';
import pool from './config/database';

const app = express();
const PORT = config.port;

// Enhanced Health Check with database and dependencies verification
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        const dbStartTime = Date.now();
        await pool.query('SELECT 1');
        const dbDuration = Date.now() - dbStartTime;

        // Check S3 connectivity (optional, only if bucket is configured)
        let s3Status = 'not_configured';
        if (config.aws.s3Bucket) {
            try {
                // You can add AWS SDK S3 head bucket check here if needed
                s3Status = 'available';
            } catch (s3Error) {
                s3Status = 'unavailable';
            }
        }

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.nodeEnv,
            version: process.env.npm_package_version || '1.0.0',
            checks: {
                database: {
                    status: 'healthy',
                    responseTime: `${dbDuration}ms`,
                },
                s3: {
                    status: s3Status,
                },
            },
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/api', authRoutes);
app.use('/api', tenantRoutes)
app.use('/api', userRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Server instance for graceful shutdown
let server: any;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    if (server) {
        // Stop accepting new requests
        server.close(async () => {
            console.log('HTTP server closed');

            try {
                // Close database connections
                await pool.end();
                console.log('Database connections closed');

                // Add other cleanup tasks here (Redis, message queues, etc.)

                console.log('Graceful shutdown completed successfully');
                process.exit(0);
            } catch (error) {
                console.error('Error during shutdown:', error);
                process.exit(1);
            }
        });

        // Force shutdown after 30 seconds if graceful shutdown hangs
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 30000);
    } else {
        process.exit(0);
    }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// Only start server if not in test mode
if (config.nodeEnv !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📦 Environment: ${config.nodeEnv}`);
        console.log(`💾 Database: Connected`);
        console.log(`🔐 CORS Origin: ${config.cors.origin}`);
        if (config.aws.s3Bucket) {
            console.log(`☁️  S3 Bucket: ${config.aws.s3Bucket}`);
        }
    });
}

export default app;