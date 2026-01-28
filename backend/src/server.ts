import dotenv from 'dotenv';
dotenv.config();

import app from './app';
// Routes are mounted in app.ts via routes/index.ts

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    const { seedCategories, seedAdmin } = await import('./utils/seeder');
    await seedCategories();
    await seedAdmin();
});

// Graceful Custom Shutdown
const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
