import redis from '../../lib/redis.js';

export default async function handler(req, res) {
    // Set JSON content type
    res.setHeader('Content-Type', 'application/json');

    try {
        // Test Redis connectivity
        await redis.ping();

        // Return success response
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Health check failed:', error);

        // Return error response
        return res.status(500).json({
            ok: false,
            error: 'Unable to connect to persistence layer'
        });
    }
}
