# Melissa AI - OpenRouter Integration Setup

## Overview
This project has been updated to use OpenRouter AI instead of Google Sheets for more intelligent and dynamic responses.

## Setup Instructions

### 1. Get OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to your API keys section
4. Create a new API key
5. Copy the API key for the next step

### 2. Deploy to Netlify

#### Option A: Deploy via Netlify UI
1. Push your code to a GitHub repository
2. Go to [Netlify](https://netlify.com/) and sign in
3. Click "New site from Git"
4. Connect your GitHub account and select your repository
5. In the deploy settings, add an environment variable:
   - Key: `OPENROUTER_API_KEY`
   - Value: Your OpenRouter API key from step 1
6. Click "Deploy site"

#### Option B: Deploy via Netlify CLI
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login to Netlify: `netlify login`
3. Initialize your site: `netlify init`
4. Set the environment variable: `netlify env:set OPENROUTER_API_KEY your-api-key-here`
5. Deploy: `netlify deploy --prod`

### 3. Test the Chatbot
1. Once deployed, visit your Netlify URL
2. Try sending a message to Melissa
3. You should receive intelligent responses from the AI

## Features
- **Modern AI**: Uses Google Gemini 2.0 Flash via OpenRouter
- **Conversational**: Maintains context and provides natural responses
- **Error Handling**: Graceful fallbacks if the API is unavailable
- **CORS Support**: Properly configured for web deployment
- **Typing Indicators**: Shows when Melissa is "thinking"

## File Structure
```
├── index.html          # Main chat interface
├── jscript.js          # Frontend JavaScript (updated for OpenRouter)
├── stylesheet.css      # Styling
├── functions/
│   ├── chat.js         # Netlify function for API calls
│   └── package.json    # Function dependencies
├── netlify.toml        # Netlify configuration
└── SETUP.md           # This file
```

## Troubleshooting
- **API Key Issues**: Make sure your OpenRouter API key is correctly set in Netlify environment variables
- **CORS Errors**: The function includes proper CORS headers for web deployment
- **Function Timeout**: Responses are limited to 150 tokens to stay within function limits

## Cost Considerations
- OpenRouter offers free tier with limited requests
- Monitor your usage in the OpenRouter dashboard
- Consider upgrading if you expect high traffic 