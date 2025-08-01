# Melissa AI - Friend.AI 🤖

A modern, intelligent chatbot powered by OpenRouter AI that provides conversational, engaging responses with a beautiful chat interface and robust error handling.

## ✨ Features

- **🤖 Intelligent AI**: Powered by Mistral 7B via OpenRouter with optimized response handling
- **💬 Natural Conversations**: Dynamic responses with Melissa's unique personality
- **🎨 Modern Chat UI**: Clean, iOS-style chat interface with typing indicators
- **🔊 Audio Feedback**: Sound effects for message notifications (chat.mp3)
- **📱 Mobile Optimized**: Responsive design that works on all devices
- **⚡ Fast & Reliable**: Serverless architecture with Netlify Functions
- **🛡️ Robust Error Handling**: Smart rate limit detection with friendly messages
- **💾 Chat History**: Persistent chat history using sessionStorage
- **🔄 Reset Functionality**: Clear chat button to start fresh conversations
- **🎯 Local Responses**: Common greetings handled locally to save API credits
- **⏱️ Request Timeouts**: Prevents hanging requests with 25-second timeouts
- **📏 Optimized Responses**: Concise, natural responses (max 80 tokens)

## 🚀 Quick Start

### Prerequisites
- OpenRouter API key ([Get one here](https://openrouter.ai/))
- Netlify account (free)

### Deployment Steps

1. **Fork/Clone this repository**
2. **Get your OpenRouter API key** from [openrouter.ai](https://openrouter.ai/)
3. **Deploy to Netlify**:
   - Connect your repository to Netlify
   - Add environment variable: `OPENROUTER_API_KEY` = your API key
   - Deploy!

For detailed setup instructions, see [SETUP.md](SETUP.md)

## 🏗️ Project Structure

```
melissa-ai/
├── index.html              # Main chat interface with modern UI
├── jscript.js              # Frontend logic with chat history
├── stylesheet.css          # Modern chat interface styling
├── chat.mp3                # Message notification sound
├── melissa.jpg             # Melissa's avatar image
├── functions/
│   ├── chat.js            # Netlify function with AI integration
│   ├── package.json       # Function dependencies
│   └── package-lock.json  # Locked dependency versions
├── netlify.toml           # Netlify configuration
├── _headers               # Netlify headers for audio files
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

## 🎯 How It Works

1. **User Input**: User types a message in the modern chat interface
2. **Local Check**: Common greetings (hi, hello, how are you) handled locally
3. **API Call**: Complex messages sent to Netlify function
4. **AI Processing**: Function calls OpenRouter API with Mistral 7B model
5. **Rate Limit Detection**: Smart detection of daily limits with friendly "tired" message
6. **Response Optimization**: AI generates concise, natural response (max 80 tokens)
7. **History Management**: Chat history saved to sessionStorage
8. **Display**: Response appears in chat with typing animation and sound

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **Backend**: Netlify Functions (Node.js)
- **AI**: OpenRouter API with Mistral 7B model
- **Deployment**: Netlify with automatic dependency installation
- **Styling**: Modern chat interface with DM Sans font
- **Storage**: sessionStorage for chat history persistence
- **Audio**: MP3 notification sounds with Web Audio API fallback

## 🛡️ Error Handling & Reliability

Melissa includes intelligent error handling with user-friendly messages:

- **🎯 Rate Limiting**: "I'm feeling very tired tonight, will talk tomorrow xoxo 😴"
- **🔑 Authentication Issues**: "I'm having authentication issues. Please check your API key."
- **🌐 Service Unavailable**: "The AI service is having issues. Please try again later."
- **⏱️ Timeout**: "The AI is taking too long to respond. Please try again."
- **📡 Network Issues**: "I'm having network connectivity issues. Please check your connection."

## 🎵 Audio Features

- **Notification Sound**: `chat.mp3` plays when Melissa responds
- **Automatic Fallback**: Web Audio API generates pleasant beep if MP3 fails
- **Volume Control**: Audio set to 30% volume for pleasant experience
- **Error Handling**: Graceful handling of audio loading failures

## 💾 Chat History

- **Persistent Storage**: Chat history saved in sessionStorage
- **Session-Based**: History persists during browser session
- **Auto-Clear**: History cleared when browser is closed
- **Manual Reset**: Reset button clears history and starts fresh
- **Smart Limits**: Maximum 50 messages to prevent memory issues

## 🔍 Debugging & Monitoring

### Health Check Endpoint
Test your function's status by making a GET request to `/.netlify/functions/chat`:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "hasApiKey": true,
  "apiKeyLength": 73,
  "apiKeyPrefix": "sk-or-v1-3...",
  "environment": "development"
}
```

### Browser Console Logging
Open your browser's Developer Tools (F12) and check the Console tab for:
- API request/response details
- Audio loading status
- Chat history operations
- Error messages and debugging info

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

## 💡 Customization

### Changing AI Models
Edit `functions/chat.js` and modify the model parameter:
```javascript
model: "mistralai/mistral-7b-instruct:free" // Change to any OpenRouter model
```

### Modifying Melissa's Personality
Update the system prompt in `functions/chat.js`:
```javascript
content: "You are Melissa, a cool cyber-girl. Keep responses short and friendly."
```

### Adding Local Responses
Edit the `localResponses` object in `functions/chat.js` to add more local responses:
```javascript
const localResponses = {
  'hello': ["Hey there! 😊 How's it going?"],
  'hi': ["Hi! Nice to see you! 👋"],
  // Add more responses here
};
```

### Adjusting Response Length
Modify the `max_tokens` parameter in `functions/chat.js`:
```javascript
max_tokens: 80 // Increase for longer responses, decrease for shorter
```

### Styling Changes
Modify `stylesheet.css` to change colors, fonts, or layout.

## 📊 Cost & Usage

- **Free Tier**: OpenRouter offers free requests per month
- **Optimized Usage**: Local responses for common greetings save API credits
- **Concise Responses**: Short responses reduce token usage
- **Monitoring**: Track usage in your OpenRouter dashboard
- **Scaling**: Upgrade plan for higher traffic

## 🚨 Troubleshooting

### Common Issues

1. **"I'm having trouble connecting right now"**
   - Check your OpenRouter API key in Netlify environment variables
   - Verify the API key is valid and has sufficient credits
   - Check Netlify function logs for detailed error information
   - Test the health check endpoint

2. **Audio not playing**
   - Ensure `chat.mp3` is committed to the repository (not in .gitignore)
   - Check browser console for audio loading errors
   - Verify the file is accessible at the deployed URL
   - Check Netlify function logs for any issues

3. **Function deployment fails**
   - Ensure `package-lock.json` is committed to the repository
   - Check that the build command in `netlify.toml` is correct
   - Verify Node.js version compatibility

4. **Rate limiting errors**
   - The app now shows a friendly "tired" message instead of generic errors
   - Wait until the next day for free tier reset
   - Consider upgrading your OpenRouter plan for higher limits

5. **Chat history not persisting**
   - Check if sessionStorage is enabled in your browser
   - Clear browser cache and try again
   - Check browser console for storage errors

### Debugging Steps

1. **Test the health check**: Visit `/.netlify/functions/chat` with a GET request
2. **Check function logs**: Review Netlify function logs for error details
3. **Verify API key**: Ensure `OPENROUTER_API_KEY` is set in Netlify environment variables
4. **Enable test mode**: Add `TEST_MODE=true` to test without API calls
5. **Check browser console**: Look for JavaScript errors or network issues
6. **Test audio**: Check if `chat.mp3` is accessible at your deployed URL

### Browser Console Commands
```javascript
// Test the health check endpoint
fetch('/.netlify/functions/chat', {method: 'GET'}).then(r => r.json()).then(console.log)

// Test the chat function directly
fetch('/.netlify/functions/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'Hello'})
}).then(r => r.json()).then(console.log)

// Check chat history
console.log(JSON.parse(sessionStorage.getItem('melissa_chat_history')))

// Clear chat history
sessionStorage.removeItem('melissa_chat_history')
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **OpenRouter** for providing access to powerful AI models
- **Netlify** for serverless hosting and build automation
- **Mistral AI** for the reliable AI model
- **Thynkzone** for the original concept

## 📞 Support

If you encounter any issues:
1. Check the [SETUP.md](SETUP.md) troubleshooting section
2. Verify your OpenRouter API key is correctly set
3. Check Netlify function logs for detailed error information
4. Test the health check endpoint for function status
5. Enable test mode to isolate API issues
6. Check browser console for audio and storage issues

---

**Made with ❤️ by Thynkzone**
