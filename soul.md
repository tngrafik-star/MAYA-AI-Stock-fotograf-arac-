# Project Soul & Core Guidelines

## 1. Security & API Key Management (Strict Rule)
- **Zero Client-Side Caching / Storage:** API keys, including the Gemini API key, must never be cached, stored, or preloaded in client-side storage (such as `localStorage`, `sessionStorage`, or cookies).
- **Zero Database Profile Storage:** API keys must never be stored in user profiles or tables within the database (e.g. `profiles.gemini_api_key`).
- **Server-Side Environment Variables Only:** All API keys and secrets must reside strictly in the server-side environment (`.env` file locally, and Vercel Environment Variables in production).
- **Backend Resolution:** The frontend client must never prompt users to enter their own API keys, nor should it send custom API keys in request bodies. All backend handlers must resolve API keys directly from `process.env.GEMINI_API_KEY` or `process.env.VITE_GEMINI_API_KEY`.

## 2. Image Optimization & Uploads
- **Client-Side Compression:** High-resolution images must be resized and compressed in the browser (using canvas-based compression to a maximum of 1024px width/height and 8% JPEG quality) before uploading or sending to the backend API.
- **Vercel Payload Limits:** This ensures all API payloads remain under Vercel's strict 4.5MB serverless function request body size limit, leading to faster response times, lower bandwidth, and optimized database storage.
