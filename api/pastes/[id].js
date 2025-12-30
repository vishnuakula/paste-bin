import { getPaste, getRemainingViews, getExpiresAt } from '../../lib/pasteService.js';
import { getCurrentTime } from '../../lib/timeHelper.js';

export default async function handler(req, res) {
    // Set JSON content type
    res.setHeader('Content-Type', 'application/json');

    // Only accept GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Paste ID is required' });
        }

        // Get current time (supports deterministic testing)
        const currentTime = getCurrentTime(req);

        // Get paste and increment view count (atomically)
        const paste = await getPaste(id, currentTime, true);

        if (!paste) {
            return res.status(404).json({ error: 'Paste not found or expired' });
        }

        // Return paste data
        return res.status(200).json({
            content: paste.content,
            remaining_views: getRemainingViews(paste),
            expires_at: getExpiresAt(paste)
        });

    } catch (error) {
        console.error('Error fetching paste:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
