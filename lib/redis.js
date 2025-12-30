import { Redis } from '@upstash/redis';

// Debug: Check if environment variables are loaded
console.log('Redis Config:');
console.log('  URL:', process.env.UPSTASH_REDIS_REST_URL);
console.log('  TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'NOT SET');

// Initialize Redis client with Upstash REST API
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default redis;
