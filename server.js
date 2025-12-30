import './dotenv-config.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API handlers
import healthzHandler from './api/healthz.js';
import createPasteHandler from './api/pastes/index.js';
import getPasteHandler from './api/pastes/[id].js';
import viewPasteHandler from './api/p/[id].js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Wrapper to convert Vercel-style handlers to Express
function wrapHandler(handler) {
    return async (req, res) => {
        // Add Vercel-like query parsing for dynamic routes
        req.query = { ...req.query, ...req.params };

        try {
            await handler(req, res);
        } catch (error) {
            console.error('Handler error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };
}

// API Routes
app.get('/api/healthz', wrapHandler(healthzHandler));
app.post('/api/pastes', wrapHandler(createPasteHandler));
app.get('/api/pastes/:id', wrapHandler(getPasteHandler));
app.get('/p/:id', wrapHandler(viewPasteHandler));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Pastebin-Lite running at http://localhost:${PORT}`);
    console.log(`\n📋 Create pastes at: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/healthz\n`);
});
