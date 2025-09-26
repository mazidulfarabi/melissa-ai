# Melissa AI - OpenRouter Integration Setup

## Overview
This project uses OpenRouter AI with Mistral 7B for intelligent and dynamic responses. The system features a modern chat interface with persistent history, smart error handling, optimized performance, and **automatic API key fallback** for continuous service.

## Setup Instructions

### 1. Get OpenRouter API Keys
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to your API keys section
4. Create **two API keys** (both should start with `sk-or-`)
   - **Primary Key**: Your main API key
   - **Backup Key**: A second API key for fallback when primary runs out
5. Copy both API keys for the next step

### 2. Deploy to Netlify

#### Option A: Deploy via Netlify UI
1. Push your code to a GitHub repository
2. Go to [Netlify](https://netlify.com/) and sign in
3. Click "New site from Git"
4. Connect your GitHub account and select your repository
5. In the deploy settings, add **two environment variables**:
   - Key: `OPENROUTER_API_KEY` (Primary key)
   - Value: Your primary OpenRouter API key
   - Key: `OPENROUTER_API_KEY_BACKUP` (Backup key)
   - Value: Your backup OpenRouter API key
6. Click "Deploy site"

#### Option B: Deploy via Netlify CLI
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login to Netlify: `netlify login`
3. Initialize your site: `netlify init`
4. Set the environment variables:
   ```bash
   netlify env:set OPENROUTER_API_KEY your-primary-api-key-here
   netlify env:set OPENROUTER_API_KEY_BACKUP your-backup-api-key-here
   ```
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
- **Automatic API Key Fallback**: Seamlessly switches to backup key when primary runs out
- **Dynamic Status System**: Real-time online/offline status with blinking indicators
- **Smart Alert System**: One-time rate limit notifications with actual reset times
- **Chat History**: Persistent chat history using sessionStorage
- **Smart Error Handling**: Rate limit detection with friendly "tired" messages
- **Local Responses**: Common greetings handled locally to save API credits
- **Audio Feedback**: MP3 notification sounds with Web Audio API fallback
- **Reset Functionality**: Clear chat button to start fresh conversations
- **CORS Support**: Properly configured for web deployment
- **Health Monitoring**: Built-in debugging endpoints
- **Optimized Responses**: Concise responses (max 80 tokens) that fit perfectly
- **Real Reset Timers**: Shows actual API reset times from OpenRouter

## Dynamic Status System

### Visual Indicators
- **🟢 Online Status**: Green blinking dot + "Online" text (default state)
- **🟠 Offline Status**: Orange blinking dot + "Offline" text (when rate limited)
- **Always Interactive**: Continuous blinking animation for both states
- **Real-time Updates**: Status changes automatically based on API availability

### Status Management
- **Automatic Detection**: Detects rate limits and updates status accordingly
- **Persistent State**: Status persists across page refreshes using sessionStorage
- **Reset Integration**: Automatically comes back online when API limits reset
- **Manual Reset**: Reset button clears status and allows fresh start

## Smart Alert System

### Features
- **One-Time Display**: Shows rate limit alert only once per session
- **Real Reset Times**: Displays actual reset time from OpenRouter API headers
- **Elegant Animation**: Smooth slide-in/slide-out with backdrop blur effect
- **Auto-Dismiss**: Alert disappears after 5 seconds automatically
- **No Repeated Messages**: Prevents showing "tired" message multiple times

### Alert Content
- **Before**: "Melissa set the wake-up alarm for T-reset"
- **After**: "Melissa set the wake-up alarm for 12:00 AM Aug 3"

## File Structure
```
├── index.html          # Main chat interface with modern UI
├── jscript.js          # Frontend JavaScript with chat history
├── stylesheet.css      # Modern chat interface styling
├── chat.mp3           # Message notification sound
├── logo.png        # Melissa's avatar image
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
// Test health check (shows both API keys status)
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

// Test debug mode (tests both API keys independently)
// First, add DEBUG_MODE=true to your Netlify environment variables
fetch('/.netlify/functions/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'Debug test'})
})
.then(r => r.json())
.then(console.log)

// Check chat history
console.log(JSON.parse(sessionStorage.getItem('melissa_chat_history')))

// Clear chat history
sessionStorage.removeItem('melissa_chat_history')

// Test fallback system (send multiple messages to trigger rate limits)
// This will help you see the fallback in action
for(let i = 0; i < 10; i++) {
  setTimeout(() => {
    fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: `Test message ${i}`})
    })
    .then(r => r.json())
    .then(data => console.log(`Message ${i}:`, data))
  }, i * 1000);
}
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
   - Check both OpenRouter API keys in Netlify environment variables
   - Verify both API keys start with `sk-or-`
   - Check Netlify function logs for detailed error information
   - Test the health check endpoint to see key status
   - Ensure at least one key is properly configured

2. **"I'm feeling very tired tonight, will talk tomorrow xoxo 😴"**
   - Both API keys have hit their daily rate limits
   - Wait until the next day for free tier reset
   - Consider creating additional backup accounts
   - Check OpenRouter dashboards for usage statistics
   - Monitor function logs to see which keys are being used

3. **Audio not playing**
   - Ensure `chat.mp3` is committed to the repository (not in .gitignore)
   - Check browser console for audio loading errors
   - Verify the file is accessible at the deployed URL
   - Check that `*.mp3` is not ignored in `.gitignore`

4. **Function deployment fails**
   - Ensure `package-lock.json` is committed to the repository
   - Check that the build command in `netlify.toml` is correct
   - Verify Node.js version compatibility (18+)

5. **Rate limiting errors**
   - The app now shows a friendly "tired" message instead of generic errors
   - System automatically tries backup key when primary fails
   - Wait until the next day for free tier reset
   - Consider upgrading your OpenRouter plan for higher limits
   - Check function logs to see which key hit the limit

6. **Chat history not persisting**
   - Check if sessionStorage is enabled in your browser
   - Clear browser cache and try again
   - Check browser console for storage errors

7. **Responses too long or getting cut off**
   - The function is optimized for concise responses (max 80 tokens)
   - Responses are automatically trimmed to fit the chat interface
   - Check the system prompt for response length instructions

8. **Fallback system not working**
   - Verify both API keys are set in Netlify environment variables
   - Check that both keys are valid and start with `sk-or-`
   - Test debug mode to verify both keys work independently
   - Check function logs to see fallback attempts
   - Ensure backup key has sufficient credits

9. **Status stuck on offline**
   - Click the reset button (🔄) to force clear rate limit status
   - Run `resetMelissaRateLimit()` in browser console
   - Clear session storage manually in browser dev tools
   - Check if API keys are properly configured in Netlify
   - Verify both keys are valid and have credits

10. **Blinking indicators not working**
    - Check if CSS animations are enabled in browser
    - Verify stylesheet.css is loading properly
    - Clear browser cache and refresh page
    - Check browser console for CSS errors

### Debugging Steps

1. **Test the health check**: Visit `/.netlify/functions/chat` with a GET request
2. **Check function logs**: Review Netlify function logs for error details
3. **Verify API keys**: Ensure both `OPENROUTER_API_KEY` and `OPENROUTER_API_KEY_BACKUP` are set
4. **Enable test mode**: Add `TEST_MODE=true` to test without API calls
5. **Enable debug mode**: Add `DEBUG_MODE=true` to test both keys independently
6. **Check browser console**: Look for JavaScript errors or network issues
7. **Test audio**: Check if `chat.mp3` is accessible at your deployed URL
8. **Monitor key usage**: Check function logs to see which key is being used for each request
9. **Force reset status**: Use reset button or console command to clear rate limit status
10. **Test fallback system**: Send multiple messages to trigger rate limits and observe fallback

### Error Messages Explained

- **"I'm feeling very tired tonight, will talk tomorrow xoxo 😴"**: Both API keys have hit rate limits, try again tomorrow
- **"I'm having authentication issues"**: API keys are invalid or missing
- **"The AI service is having issues"**: Model is down, try later
- **"The AI is taking too long to respond"**: Request timed out, try again
- **"I'm having network connectivity issues"**: Network problem, check connection

## Fallback API Key System

### How It Works
1. **Primary Key Priority**: The system always tries the primary API key first
2. **Automatic Fallback**: If the primary key hits rate limits, it automatically switches to the backup key
3. **Seamless Transition**: Users won't notice any interruption in service
4. **Smart Detection**: Rate limit errors are detected and handled gracefully
5. **Logging**: All key switches are logged for monitoring

### Benefits
- **Continuous Service**: No downtime when one account runs out of credits
- **Cost Distribution**: Spread usage across multiple accounts
- **Automatic Recovery**: System recovers automatically when limits reset
- **Transparent Operation**: Users experience uninterrupted service

### Monitoring
- Check Netlify function logs to see which key is being used
- Health check endpoint shows status of both keys
- Debug mode tests both keys independently

## Cost Considerations
- OpenRouter offers free tier with limited requests per day
- Using two accounts doubles your daily free tier allowance
- Local responses for common greetings save API credits
- Mistral 7B is cost-effective and reliable
- Monitor your usage in both OpenRouter dashboards
- Consider upgrading if you expect high traffic

## Performance Optimization
- Responses are limited to 80 tokens for faster processing
- 25-second timeout prevents hanging requests
- Local responses for common greetings reduce API calls
- Concise responses reduce token usage and costs
- Automatic response trimming ensures chat interface compatibility
- Chat history limited to 50 messages to prevent memory issues
- Fallback system adds minimal overhead (only when primary fails)

## Security Notes
- API keys are stored securely in Netlify environment variables
- Function includes proper CORS headers for web deployment
- No sensitive data is logged or stored
- Health check endpoint doesn't expose full API keys
- Chat history is stored locally in sessionStorage
- Fallback system maintains security standards

## Audio Configuration
- `chat.mp3` provides notification sounds for new messages
- Web Audio API fallback generates pleasant beep if MP3 fails
- Audio volume set to 30% for pleasant experience
- `_headers` file ensures proper content type for audio files
- Graceful error handling for audio loading failures