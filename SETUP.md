# Melissa AI - Setup & Deployment Guide 🤖🚀

This guide explains how Melissa AI is deployed and how Netlify (`.netlify.app`) works in tandem with Cloudflare Workers AI.

---

## ⚡ The Mechanism: Netlify + Cloudflare Workers AI

Previously, Melissa relied on OpenRouter which hit daily rate limits and required external API keys. Later, an offline WebLLM approach was tried, but it required a 350MB download and failed on browsers without WebGPU.

The new system gives you the best of all worlds:
1. **Netlify Frontend (`.netlify.app`)**: Fast global static CDN delivery of your HTML, CSS, JavaScript, and audio.
2. **Netlify Edge Rewrite (Proxy)**: Requests to `/api/chat` are transparently forwarded behind the scenes to Cloudflare without exposing the `.workers.dev` domain to the client.
3. **Cloudflare Workers AI Edge Inference**: Cloudflare runs `@cf/meta/llama-3.1-8b-instruct-fp8` directly on its GPU network without needing third-party API keys or rate-limited providers.

---

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Cloudflare Worker (Backend)

The worker is located in `melissa-ai/worker.js` with `melissa-ai/wrangler.jsonc`.

To deploy or update:
```bash
cd melissa-ai
npx wrangler deploy --config ./wrangler.jsonc
```
This produces your active worker endpoint:
`https://melissa-ai.anmone-gaming.workers.dev`

---

### Step 2: Deploy to Netlify (Frontend)

1. Connect your repository to Netlify (or drag and drop the `melissa-ai` folder in the Netlify dashboard).
2. Set the **Publish directory** to `.` (the folder containing `index.html`).
3. No environment variables are required!
4. Netlify will read `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://melissa-ai.anmone-gaming.workers.dev/api/:splat"
     status = 200
     force = true
   ```
5. Click **Deploy Site**.

Your bot is now live at `https://<your-app>.netlify.app`!

---

## 🧪 Testing Endpoints

### 1. Test Cloudflare Worker Health Check
```bash
curl https://melissa-ai.anmone-gaming.workers.dev/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "service": "Melissa AI",
  "provider": "Cloudflare Workers AI",
  "models": ["@cf/meta/llama-3.1-8b-instruct-fp8", ...]
}
```

### 2. Test Chat Query
```bash
curl -X POST https://melissa-ai.anmone-gaming.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hey melissa! What are you doing?"}'
```

---

## 💻 Running Locally

To test locally:
```bash
cd melissa-ai
npx serve .
```
Visit `http://localhost:3000`. The frontend will connect to Melissa with instant greetings and streaming AI responses!
