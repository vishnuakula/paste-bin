/**
 * Get the current time for expiry logic
 * Supports deterministic time testing via x-test-now-ms header
 * 
 * @param {Object} request - The HTTP request object
 * @returns {number} Current time in milliseconds since epoch
 */
export function getCurrentTime(request) {
    const testMode = process.env.TEST_MODE === '1';

    if (testMode && request.headers) {
        const testTime = request.headers['x-test-now-ms'];
        if (testTime) {
            const timestamp = parseInt(testTime, 10);
            if (!isNaN(timestamp)) {
                return timestamp;
            }
        }
    }

    return Date.now();
}
