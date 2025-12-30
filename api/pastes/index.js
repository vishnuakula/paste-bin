import { createPaste } from '../../lib/pasteService.js';

export default async function handler(req, res) {
    // Set JSON content type
    res.setHeader('Content-Type', 'application/json');

    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { content, ttl_seconds, max_views } = req.body;

        // Validate content (required, non-empty string)
        if (!content || typeof content !== 'string' || content.trim() === '') {
            return res.status(400).json({ error: 'Content is required and must be a non-empty string' });
        }

        // Validate ttl_seconds (optional, integer >= 1)
        if (ttl_seconds !== undefined && ttl_seconds !== null) {
            if (!Number.isInteger(ttl_seconds) || ttl_seconds < 1) {
                return res.status(400).json({ error: 'ttl_seconds must be an integer >= 1' });
            }
        }

        // Validate max_views (optional, integer >= 1)
        if (max_views !== undefined && max_views !== null) {
            if (!Number.isInteger(max_views) || max_views < 1) {
                return res.status(400).json({ error: 'max_views must be an integer >= 1' });
            }
        }

        // Create paste
        const { id } = await createPaste(
            content,
            ttl_seconds ?? null,
            max_views ?? null
        );

        // Get base URL from request
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        // Return created paste with URL
        return res.status(201).json({
            id,
            url: `${baseUrl}/p/${id}`
        });

    } catch (error) {
        console.error('Error creating paste:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
