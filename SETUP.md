# Melissa AI - Offline In-Browser Setup Guide 🤖

## Overview
Melissa AI now runs **100% inside your web browser offline** using **WebLLM and WebGPU**. 

* **No API keys** required
* **Zero server costs**
* **No rate limits**
* **Full privacy** (inference runs locally on your computer/device)

---

## Quick Start (Run Locally)

Because modern web browsers restrict WebGPU and ES Modules when opening files directly (`file:///`), Melissa must be served over `http://` or `https://`.

### Method 1: Using Python (Recommended)
If you have Python installed:
```bash
cd c:\melissa-ai
python -m http.server 8000
```
Open your browser and navigate to:
```
http://localhost:8000
```

### Method 2: Using Node.js / npx
If you have Node.js installed:
```bash
cd c:\melissa-ai
npx serve .
```

### Method 3: VS Code / Live Server
If you use VS Code, install the **Live Server** extension, right-click `index.html`, and click **"Open with Live Server"**.

---

## Deploying to the Web

Because Melissa is completely client-side, deployment requires **no API keys** and **no backend configuration**:

### Deploy to Netlify
1. Connect your repository to [Netlify](https://netlify.com/).
2. Keep the publish directory as `.` (root).
3. Click **Deploy**. No environment variables are required!

### Deploy to GitHub Pages
1. Push your repository to GitHub.
2. In your repository settings, navigate to **Pages**.
3. Set Source to the `main` branch root (`/`).
4. Save and your site will be live!

---

## WebGPU Requirements & Troubleshooting

Melissa uses WebGPU for hardware acceleration directly on your graphics card or chip.

### Supported Browsers:
- **Google Chrome** (version 113 or higher)
- **Microsoft Edge** (version 113 or higher)
- **Brave Browser**
- **Firefox Nightly** (requires `dom.webgpu.enabled` set to `true` in `about:config`)

### Enabling WebGPU in Chrome / Edge (If not enabled by default):
1. In your address bar, go to:
   ```
   chrome://flags/#enable-unsafe-webgpu
   ```
2. Enable **"Unsafe WebGPU"** or ensure **"Hardware Acceleration"** is turned on:
   * Go to Chrome Settings > System > Turn on **"Use graphics acceleration when available"**.
3. Restart your browser.

---

## Offline AI Model
Melissa is powered out-of-the-box by **Qwen2.5 0.5B Instruct** (`Qwen2.5-0.5B-Instruct-q4f32_1-MLC`):
* **Size**: ~350 MB download
* **Best for**: Instant startup, natural personality with zero repetition loops, and minimal GPU/RAM overhead.
* **Zero Configuration**: Melissa loads the optimized model automatically without needing user configuration.

---

## How First-Time Download Works

1. On your very first visit, Melissa will display a sleek progress bar as the model weights download from Hugging Face into your browser's local CacheStorage / IndexedDB.
2. Once the download reaches 100%, Melissa's status turns **Online**.
3. On all future visits, Melissa loads in **under 2 seconds** and works even if your WiFi is completely disconnected!
