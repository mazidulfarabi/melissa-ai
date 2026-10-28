# Melissa AI 🤖✨

A friendly, modern cyber-girl AI friend powered by **Cloudflare Workers AI** and hosted seamlessly on **Netlify** with real-time streaming, zero API keys, and zero rate limits.

---

## 🌟 Key Highlights

- **⚡ Cloudflare Workers AI Edge Inference**: Powered by `@cf/meta/llama-3.1-8b-instruct-fp8` running on Cloudflare GPUs globally.
- **🌐 Netlify Custom & `.netlify.app` Domain**: Fully hosted and accessible on Netlify. Netlify acts as a transparent reverse proxy (Status 200 Rewrite) so users only see your `.netlify.app` domain—no `.workers.dev` exposed in client URLs.
- **🔑 Zero API Keys Required**: No OpenRouter keys, no OpenAI billing, no secret key leaks.
- **🚫 Zero Rate Limits**: Free from 429 quota errors and daily model caps (`free-models-per-day`).
- **📱 Universal Device Support**: Runs on all browsers (Mobile Safari, iOS Chrome, Android, Desktop) without needing 350MB WebGPU model downloads.
- **🌊 Live Token Streaming**: Responses stream token-by-token with an animated typing cursor.
- **🎯 0ms Fast-Path**: Instant replies for basic greetings and pleasantries (hi, hello, time, date) to maximize snappiness.
- **🎨 iOS-Style UI**: Sleek chat bubbles, sound effects (`chat.mp3`), auto-resizing input, and clear history controls.

---

## 🏗️ Architecture: How Netlify + Cloudflare Work Together

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                                  │
│            Visits: https://your-melissa.netlify.app                    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                    Requests /api/chat (POST)
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       NETLIFY EDGE PROXY                               │
│       netlify.toml: [[redirects]] from="/api/*" status=200             │
│       Proxies transparently to Cloudflare Worker behind the scenes      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                 Forwarded to Cloudflare Edge Worker
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKER BACKEND                           │
│          https://melissa-ai.anmone-gaming.workers.dev                  │
│                                                                        │
│   • CORS Enabled (Access-Control-Allow-Origin: *)                      │
│   • Melissa Personality System Prompt                                  │
│   • Native Workers AI Binding (`env.AI`)                               │
│   • Model: @cf/meta/llama-3.1-8b-instruct-fp8                          │
│   • Real-time SSE Token Streaming                                      │
└────────────────────────────────────────────────────────────────────────┘
```

### Why this solves the `.workers.dev` problem:
When deploying to Cloudflare Workers, Cloudflare defaults to a `*.workers.dev` URL. By using Netlify's **Status 200 Rewrite Proxy** in `netlify.toml`:
1. Your frontend is served on your `.netlify.app` domain.
2. The browser only calls `/api/chat` (same origin).
3. Netlify proxies the request directly to the Cloudflare Worker.
4. Visitors never see `.workers.dev`, and you avoid all cross-origin CORS limitations.

---

## 📁 Project Structure

```
melissa-ai/
├── index.html              # Chat interface
├── jscript.js              # Streaming client with instant replies & session history
├── stylesheet.css          # iOS-style chat styling, status & typing cursor
├── chat.mp3                # Message notification sound
├── melissa.jpg             # Melissa avatar
├── worker.js               # Cloudflare Worker backend (Workers AI Llama 3)
├── wrangler.jsonc          # Cloudflare Worker deployment configuration
├── netlify.toml           # Netlify publish & Status 200 proxy configuration
├── functions/              # Netlify functions bridge (fallback)
│   └── chat.js             # Serverless bridge forwarding to Cloudflare Worker
├── SETUP.md               # Quick setup & deployment guide
└── README.md              # This file
```

---

## 🚀 Deployment Guide

### 1. Cloudflare Worker (Backend)
The backend Cloudflare Worker is already configured and deployed at:
`https://melissa-ai.anmone-gaming.workers.dev`

If you ever make changes to `worker.js`, redeploy with:
```bash
npx wrangler deploy --config ./wrangler.jsonc
```

### 2. Netlify (Frontend)
1. Link your repository or upload the `melissa-ai` folder to **Netlify**.
2. Build Settings:
   - **Publish directory**: `.` (or root of melissa-ai)
   - **Build command**: (leave empty)
3. Deploy!
4. Your site will immediately be live at `https://<your-site-name>.netlify.app`!

---

## 💻 Local Development

Run any static local web server inside `melissa-ai/`:

```bash
# With Node / npx
npx serve .

# Or with Python
python -m http.server 8000
```

Open `http://localhost:3000` or `http://localhost:8000` in your browser. Melissa will immediately connect and chat!
