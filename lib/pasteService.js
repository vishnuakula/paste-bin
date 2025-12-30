import { nanoid } from 'nanoid';
import redis from './redis.js';

/**
 * Create a new paste and store it in Redis
 * 
 * @param {string} content - The paste content
 * @param {number|null} ttlSeconds - Optional time-to-live in seconds
 * @param {number|null} maxViews - Optional maximum view count
 * @returns {Promise<{id: string, url: string}>} The created paste ID and URL
 */
export async function createPaste(content, ttlSeconds = null, maxViews = null) {
    const id = nanoid(10); // Generate short, URL-safe ID
    const createdAt = Date.now();

    const pasteData = {
        content,
        created_at: createdAt.toString(),
        view_count: '0',
    };

    if (ttlSeconds !== null) {
        pasteData.ttl_seconds = ttlSeconds.toString();
    }

    if (maxViews !== null) {
        pasteData.max_views = maxViews.toString();
    }

    // Store paste as Redis hash
    await redis.hset(`paste:${id}`, pasteData);

    return { id, pasteData };
}

/**
 * Get a paste by ID and optionally increment view count
 * 
 * @param {string} id - The paste ID
 * @param {number} currentTime - Current time in milliseconds
 * @param {boolean} incrementView - Whether to increment the view count
 * @returns {Promise<Object|null>} The paste data or null if unavailable
 */
export async function getPaste(id, currentTime, incrementView = false) {
    // Fetch paste data from Redis
    const paste = await redis.hgetall(`paste:${id}`);

    if (!paste || !paste.content) {
        return null;
    }

    // Parse numeric fields
    const pasteData = {
        content: paste.content,
        created_at: parseInt(paste.created_at, 10),
        view_count: parseInt(paste.view_count, 10),
        ttl_seconds: paste.ttl_seconds ? parseInt(paste.ttl_seconds, 10) : null,
        max_views: paste.max_views ? parseInt(paste.max_views, 10) : null,
    };

    // Check if paste has expired (TTL)
    if (isExpired(pasteData, currentTime)) {
        return null;
    }

    // Increment view count if requested (atomically)
    if (incrementView) {
        const newViewCount = await redis.hincrby(`paste:${id}`, 'view_count', 1);
        pasteData.view_count = newViewCount;
    }

    // Check if view limit exceeded AFTER incrementing
    if (isViewLimitExceeded(pasteData)) {
        return null;
    }

    return pasteData;
}

/**
 * Check if a paste has expired based on TTL
 * 
 * @param {Object} paste - The paste data
 * @param {number} currentTime - Current time in milliseconds
 * @returns {boolean} True if expired
 */
export function isExpired(paste, currentTime) {
    if (paste.ttl_seconds === null) {
        return false;
    }

    const expiresAt = paste.created_at + (paste.ttl_seconds * 1000);
    return currentTime >= expiresAt;
}

/**
 * Check if a paste has exceeded its view limit
 * 
 * @param {Object} paste - The paste data
 * @returns {boolean} True if view limit exceeded
 */
export function isViewLimitExceeded(paste) {
    if (paste.max_views === null) {
        return false;
    }

    return paste.view_count > paste.max_views;
}

/**
 * Calculate remaining views for a paste
 * 
 * @param {Object} paste - The paste data
 * @returns {number|null} Remaining views or null if unlimited
 */
export function getRemainingViews(paste) {
    if (paste.max_views === null) {
        return null;
    }

    const remaining = paste.max_views - paste.view_count;
    return Math.max(0, remaining);
}

/**
 * Get expiry timestamp in ISO-8601 format
 * 
 * @param {Object} paste - The paste data
 * @returns {string|null} Expiry timestamp or null if no TTL
 */
export function getExpiresAt(paste) {
    if (paste.ttl_seconds === null) {
        return null;
    }

    const expiresAtMs = paste.created_at + (paste.ttl_seconds * 1000);
    return new Date(expiresAtMs).toISOString();
}
