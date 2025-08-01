# Melissa AI - OpenRouter Integration Setup

## Overview
This project uses OpenRouter AI with Mistral 7B for intelligent and dynamic responses. The system features a modern chat interface with persistent history, smart error handling, and optimized performance.

## Setup Instructions

### 1. Get OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to your API keys section
4. Create a new API key (should start with `sk-or-`)
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
3. You should receive intelligent, concise responses from the AI
4. Test the reset button to clear chat history
5. Verify audio notifications are working

## Features
- **Modern Chat UI**: Clean, iOS-style chat interface with typing indicators
- **Intelligent AI**: Uses Mistral 7B via OpenRouter for reliable performance
- **Chat History**: Persistent chat history using sessionStorage
- **Smart Error Handling**: Rate limit detection with friendly "tired" messages
- **Local Responses**: Common greetings handled locally to save API credits
- **Audio Feedback**: MP3 notification sounds with Web Audio API fallback
- **Reset Functionality**: Clear chat button to start fresh conversations
- **CORS Support**: Properly configured for web deployment
- **Health Monitoring**: Built-in debugging endpoints
- **Optimized Responses**: Concise responses (max 80 tokens) that fit perfectly

## File Structure
```
├── index.html          # Main chat interface with modern UI
├── jscript.js          # Frontend JavaScript with chat history
├── stylesheet.css      # Modern chat interface styling
├── chat.mp3           # Message notification sound
├── melissa.jpg        # Melissa's avatar image
├── functions/
│   ├── chat.js         # Netlify function for API calls
│   ├── package.json    # Function dependencies
│   └── package-lock.json # Locked dependency versions
├── netlify.toml        # Netlify configuration
├── _headers           # Netlify headers for audio files
└── SETUP.md           # This file
```

## Debugging & Testing

### Health Check
Test your function's status by visiting:
```
https://your-site.netlify.app/.netlify/functions/chat
```
This will return JSON with function status and API key information.

### Browser Console Testing
Open Developer Tools (F12) and use these commands:

```javascript
// Test health check
fetch('/.netlify/functions/chat', {method: 'GET'})
  .then(r => r.json())
  .then(console.log)

// Test chat function
fetch('/.netlify/functions/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'Hello'})
})
.then(r => r.json())
.then(console.log)

// Check chat history
console.log(JSON.parse(sessionStorage.getItem('melissa_chat_history')))

// Clear chat history
sessionStorage.removeItem('melissa_chat_history')
```

### Netlify Function Logs
1. Go to your Netlify dashboard
2. Navigate to your site
3. Click on the "Functions" tab
4. Click on the `chat` function
5. Check the "Function logs" section for detailed error information

### Testing Modes
Add these environment variables in Netlify for debugging:

**Test Mode** (bypasses API):
- Name: `TEST_MODE`
- Value: `true`

**Debug Mode** (returns API details):
- Name: `DEBUG_MODE`
- Value: `true`

## Troubleshooting

### Common Issues

1. **"I'm having trouble connecting right now"**
   - Check your OpenRouter API key in Netlify environment variables
   - Verify the API key starts with `sk-or-`
   - Check Netlify function logs for detailed error information
   - Test the health check endpoint

2. **Audio not playing**
   - Ensure `chat.mp3` is committed to the repository (not in .gitignore)
   - Check browser console for audio loading errors
   - Verify the file is accessible at the deployed URL
   - Check that `*.mp3` is not ignored in `.gitignore`

3. **Function deployment fails**
   - Ensure `package-lock.json` is committed to the repository
   - Check that the build command in `netlify.toml` is correct
   - Verify Node.js version compatibility (18+)

4. **Rate limiting errors**
   - The app now shows a friendly "tired" message instead of generic errors
   - Wait until the next day for free tier reset
   - Consider upgrading your OpenRouter plan for higher limits

5. **Chat history not persisting**
   - Check if sessionStorage is enabled in your browser
   - Clear browser cache and try again
   - Check browser console for storage errors

6. **Responses too long or getting cut off**
   - The function is optimized for concise responses (max 80 tokens)
   - Responses are automatically trimmed to fit the chat interface
   - Check the system prompt for response length instructions

### Debugging Steps

1. **Test the health check**: Visit `/.netlify/functions/chat` with a GET request
2. **Check function logs**: Review Netlify function logs for error details
3. **Verify API key**: Ensure `OPENROUTER_API_KEY` is set in Netlify environment variables
4. **Enable test mode**: Add `TEST_MODE=true` to test without API calls
5. **Check browser console**: Look for JavaScript errors or network issues
6. **Test audio**: Check if `chat.mp3` is accessible at your deployed URL

### Error Messages Explained

- **"I'm feeling very tired tonight, will talk tomorrow xoxo 😴"**: Rate limit exceeded, try again tomorrow
- **"I'm having authentication issues"**: API key is invalid or missing
- **"The AI service is having issues"**: Model is down, try later
- **"The AI is taking too long to respond"**: Request timed out, try again
- **"I'm having network connectivity issues"**: Network problem, check connection

## Cost Considerations
- OpenRouter offers free tier with limited requests
- Local responses for common greetings save API credits
- Mistral 7B is cost-effective and reliable
- Monitor your usage in the OpenRouter dashboard
- Consider upgrading if you expect high traffic

## Performance Optimization
- Responses are limited to 80 tokens for faster processing
- 25-second timeout prevents hanging requests
- Local responses for common greetings reduce API calls
- Concise responses reduce token usage and costs
- Automatic response trimming ensures chat interface compatibility
- Chat history limited to 50 messages to prevent memory issues

## Security Notes
- API keys are stored securely in Netlify environment variables
- Function includes proper CORS headers for web deployment
- No sensitive data is logged or stored
- Health check endpoint doesn't expose full API key
- Chat history is stored locally in sessionStorage

## Audio Configuration
- `chat.mp3` provides notification sounds for new messages
- Web Audio API fallback generates pleasant beep if MP3 fails
- Audio volume set to 30% for pleasant experience
- `_headers` file ensures proper content type for audio files
- Graceful error handling for audio loading failures 