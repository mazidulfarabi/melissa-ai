# Melissa AI - Friend.AI 🤖 (Offline In-Browser AI)

A modern, intelligent chatbot powered by **WebLLM and WebGPU** that runs **100% inside your browser offline**. No API keys, no server costs, no rate limits, and absolute privacy.

## ✨ Features

- **🌐 100% Offline & In-Browser**: Powered by WebLLM via WebGPU. Once downloaded, Melissa works completely offline without an internet connection!
- **⚡ Zero API Keys & Zero Cost**: No accounts, no credit cards, no OpenRouter or OpenAI keys needed.
- **🚀 Zero Rate Limits**: Chat endlessly without getting 429 errors or waiting for daily resets.
- **🪶 Ultra-Lightweight & Fast Model**: Powered by **Qwen2.5 0.5B** (~350MB download), the highest-rated sub-1B in-browser model for crisp, intelligent, and snappy conversations without repetition loops.
- **🌊 Real-time Token Streaming**: Responses stream token-by-token with a sleek live typing cursor.
- **🔒 Complete Privacy**: All inference runs on your device's GPU/hardware. Your chats never leave your browser.
- **💾 Automatic Caching**: Model weights are stored in browser CacheStorage/IndexedDB. Subsequent visits load in 1–2 seconds!
- **🎯 Instant Local Fast-Path**: Common greetings (hi, hello, time, date) respond instantly (0ms) to save battery and GPU cycles.
- **🎨 Modern iOS-Style Chat UI**: Clean chat bubbles, sound effects, dynamic status indicators, and mobile-responsive layout.
- **🔊 Audio Feedback**: Sound effects for message notifications (`chat.mp3`).
- **🔄 Reset Functionality**: Clear chat button to start fresh conversations anytime.

---

## 🚀 Quick Start

### Running Locally

Because Melissa runs client-side ES modules and WebGPU, she needs to be served over `http://` or `https://` (not `file://`):

1. **Clone this repository**:
   ```bash
   git clone https://github.com/your-username/melissa-ai.git
   cd melissa-ai
   ```

2. **Start a local web server**:
   * With Python:
     ```bash
     python -m http.server 8000
     ```
   * Or with Node / npx:
     ```bash
     npx serve .
     ```

3. **Open in browser**:
   Navigate to `http://localhost:8000` in **Google Chrome**, **Microsoft Edge**, or **Brave** (browsers with WebGPU support).

---

### Deployment

Deploying Melissa is simpler than ever because she is a pure static web app. You can deploy to any static host:

- **Netlify**: Drag and drop or connect repo (no environment variables needed!).
- **GitHub Pages**: Turn on GitHub Pages under repository settings.
- **Vercel / Cloudflare Pages**: Connect the repository and click Deploy.

---

## 🏗️ Project Structure

```
melissa-ai/
├── index.html              # Main chat interface with progress bar
├── jscript.js              # In-browser WebLLM engine, streaming & chat state
├── stylesheet.css          # iOS-style chat UI styling, status & progress styles
├── chat.mp3                # Notification sound
├── melissa.jpg             # Melissa's avatar image
├── functions/              # (Legacy) Netlify functions kept for optional backend fallback
├── netlify.toml           # Netlify static publishing configuration
├── _headers               # Web headers for caching and audio assets
├── SETUP.md               # Detailed setup & WebGPU guide
└── README.md              # This file
```

---

## 🛠️ Technology Stack

- **Inference Engine**: [WebLLM](https://github.com/mlc-ai/web-llm) (`@mlc-ai/web-llm`)
- **Acceleration**: WebGPU (Hardware accelerated in browser)
- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules + jQuery)
- **Weight Storage**: Browser CacheStorage & IndexedDB
- **Styling**: DM Sans font with glassmorphism & responsive layouts
- **Audio**: HTML5 Audio API (`chat.mp3`)

---

## 🌐 Browser Requirements (WebGPU)

Melissa requires a browser with WebGPU enabled:
- **Google Chrome** 113+ (Windows, macOS, Linux, ChromeOS, Android)
- **Microsoft Edge** 113+
- **Brave Browser** (with hardware acceleration enabled)
- **Firefox Nightly** (with `dom.webgpu.enabled` set to true)

If WebGPU is not supported by your hardware or browser, Melissa will display a friendly message explaining how to enable it.

---

## 🔒 Security & Privacy

* **100% Client-Side**: No user messages or chat logs are ever sent to an external server or API.
* **Local Storage**: Chat history is kept in `sessionStorage` and cleared when you close your browser or click the reset button.
* **No Telemetry**: No third-party trackers or data harvesting.
