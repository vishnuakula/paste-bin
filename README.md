# Pastebin-Lite

A lightweight, serverless Pastebin application built with Node.js and Redis. Share text snippets with optional time-based expiry and view count limits.

## 🚀 Live Demo

**Deployed URL:** https://paste-bin-3x1r.onrender.com

## 📋 Features

- **Create text pastes** with arbitrary content
- **Shareable URLs** for easy distribution
- **Time-based expiry (TTL)** - pastes can automatically expire after a set duration
- **View count limits** - restrict how many times a paste can be viewed
- **Combined constraints** - paste becomes unavailable when either TTL or view limit is reached
- **Safe content rendering** - XSS protection via HTML escaping
- **Deterministic time testing** - supports `x-test-now-ms` header for testing TTL expiry

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Deployment:** Render.com
- **Database:** Upstash Redis (serverless-compatible)
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Dependencies:** 
  - `@upstash/redis` - Redis client optimized for serverless
  - `nanoid` - Unique ID generation

## 📦 Installation & Local Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Upstash Redis account (free tier available at [console.upstash.com](https://console.upstash.com/))

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Paste-Bin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Upstash Redis credentials:
   ```env
   UPSTASH_REDIS_REST_URL=your_redis_rest_url_here
   UPSTASH_REDIS_REST_TOKEN=your_redis_rest_token_here
   TEST_MODE=0
   ```
   
   **To get Redis credentials:**
   - Go to [Upstash Console](https://console.upstash.com/)
   - Create a new Redis database (choose any region)
   - Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the database details page
   - Paste them into your `.env.local` file

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at **http://localhost:3000**

## 🌐 Deployment to Render.com

### Quick Deployment Steps

1. **Sign up at Render.com**
   - Go to [render.com](https://render.com)
   - Sign in with GitHub

2. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service**
   - **Name:** paste-bin (or any name you prefer)
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add these variables:
     - `UPSTASH_REDIS_REST_URL` = your Redis URL
     - `UPSTASH_REDIS_REST_TOKEN` = your Redis token
     - `TEST_MODE` = 0

5. **Deploy!**
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - You'll get a URL like: `https://your-app.onrender.com`

## 📖 API Documentation

### Health Check

**Endpoint:** `GET /api/healthz`

**Response (200):**
```json
{
  "ok": true
}
```

**Response (500):**
```json
{
  "ok": false,
  "error": "Unable to connect to persistence layer"
}
```

---

### Create Paste

**Endpoint:** `POST /api/pastes`

**Request Body:**
```json
{
  "content": "Hello, world!",
  "ttl_seconds": 3600,
  "max_views": 10
}
```

**Parameters:**
- `content` (string, required) - The paste content (non-empty)
- `ttl_seconds` (integer, optional) - Time-to-live in seconds (≥ 1)
- `max_views` (integer, optional) - Maximum view count (≥ 1)

**Response (201):**
```json
{
  "id": "xK2mP9qR1z",
  "url": "https://your-app.onrender.com/p/xK2mP9qR1z"
}
```

**Error Response (400):**
```json
{
  "error": "Content is required and must be a non-empty string"
}
```

---

### Fetch Paste (API)

**Endpoint:** `GET /api/pastes/:id`

**Response (200):**
```json
{
  "content": "Hello, world!",
  "remaining_views": 9,
  "expires_at": "2026-01-01T12:00:00.000Z"
}
```

**Notes:**
- `remaining_views` is `null` if no view limit is set
- `expires_at` is `null` if no TTL is set
- Each successful API fetch increments the view count

**Error Response (404):**
```json
{
  "error": "Paste not found or expired"
}
```

---

### View Paste (HTML)

**Endpoint:** `GET /p/:id`

**Response (200):**
- Returns HTML page with the paste content
- Content is safely escaped to prevent XSS attacks
- Shows remaining views and expiry time if applicable

**Response (404):**
- Returns HTML error page

## 🗄️ Persistence Layer

This application uses **Upstash Redis** as its persistence layer.

### Why Upstash Redis?

1. **Serverless-Compatible:** Designed for serverless environments with REST API access
2. **Free Tier:** Generous free tier perfect for this assignment
3. **Global Distribution:** Low-latency access worldwide
4. **Simple Setup:** Easy integration via environment variables
5. **No Connection Pooling:** Works perfectly with serverless functions

### Data Model

Each paste is stored as a Redis hash with the key pattern `paste:{id}`:

```
paste:xK2mP9qR1z {
  content: "Hello, world!",
  created_at: "1704067200000",
  ttl_seconds: "3600",
  max_views: "10",
  view_count: "0"
}
```

**Fields:**
- `content` - The paste text content
- `created_at` - Timestamp in milliseconds (for TTL calculation)
- `ttl_seconds` - Optional expiry duration
- `max_views` - Optional view limit
- `view_count` - Current view count (incremented atomically)

## 🧪 Testing with Deterministic Time

For automated testing of TTL expiry, set the environment variable:

```env
TEST_MODE=1
```

When `TEST_MODE=1`, the application will respect the `x-test-now-ms` header:

```bash
curl -H "x-test-now-ms: 1704070800000" \
  https://your-app.onrender.com/api/pastes/abc123
```

This allows precise testing of expiry logic without waiting for real time to pass.

## 🏗️ Design Decisions

### 1. **Atomic View Counting**
- Uses Redis `HINCRBY` command to atomically increment view count
- Prevents race conditions when multiple users access a paste simultaneously
- Ensures view counts remain accurate under concurrent load

### 2. **Application-Level TTL (Not Redis EXPIRE)**
- TTL is checked in application code rather than using Redis's native EXPIRE
- Enables deterministic time testing via `x-test-now-ms` header
- Allows precise control over expiry logic for automated grading

### 3. **Serverless-Ready Architecture**
- Stateless design - all state stored in Redis
- Works with any serverless platform (Render.com, Vercel, AWS Lambda, etc.)
- Scales automatically with traffic

### 4. **XSS Protection**
- All paste content is HTML-escaped before rendering
- Prevents script injection attacks
- Uses character entity encoding (`<` → `&lt;`, etc.)

### 5. **Combined Constraints**
- When both TTL and view limits are set, paste becomes unavailable when **either** triggers
- Check order: TTL first (cheaper), then view count
- View count still increments even if paste is about to expire

### 6. **Error Handling**
- Consistent JSON error format: `{ "error": "message" }`
- Appropriate HTTP status codes (400 for validation, 404 for unavailable)
- User-friendly error messages

## 📁 Project Structure

```
Paste-Bin/
├── api/
│   ├── healthz.js              # Health check endpoint
│   ├── pastes/
│   │   ├── index.js            # POST /api/pastes - Create paste
│   │   └── [id].js             # GET /api/pastes/:id - Fetch paste (API)
│   └── p/
│       └── [id].js             # GET /p/:id - View paste (HTML)
├── lib/
│   ├── redis.js                # Redis client initialization
│   ├── timeHelper.js           # Deterministic time helper
│   └── pasteService.js         # Core paste business logic
├── public/
│   └── index.html              # Frontend UI
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies
└── README.md                   # This file
```

## 🔐 Security Considerations

- **No secrets in code:** All credentials stored in environment variables
- **XSS prevention:** HTML escaping for user-generated content
- **Input validation:** Strict validation of all user inputs
- **Rate limiting:** Consider adding rate limiting for production use
- **HTTPS only:** Enforced by Render.com and most modern hosting platforms

## 📝 License

MIT License - feel free to use this code for learning and projects.

## 🤝 Contributing

This is a take-home assignment project. Contributions are welcome for educational purposes!

## 📧 Contact

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ using Node.js, Redis, and Render.com**
