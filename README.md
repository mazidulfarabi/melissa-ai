# Melissa AI - Friend.AI 🤖

A modern, intelligent chatbot powered by OpenRouter AI that provides conversational, engaging responses with robust error handling and optimized performance.

## ✨ Features

- **🤖 Intelligent AI**: Powered by Mistral 7B via OpenRouter with optimized response handling
- **💬 Natural Conversations**: Dynamic responses with Melissa's unique personality
- **🎨 Modern UI**: Clean, responsive chat interface with typing indicators
- **🔊 Audio Feedback**: Sound effects for message notifications
- **📱 Mobile Optimized**: Responsive design that works on all devices
- **⚡ Fast & Reliable**: Serverless architecture with Netlify Functions
- **🛡️ Robust Error Handling**: Multiple fallback models and detailed error messages
- **🔍 Health Monitoring**: Built-in health check endpoint for debugging
- **⏱️ Request Timeouts**: Prevents hanging requests with 15-second timeouts
- **📏 Optimized Responses**: Concise, natural responses that fit perfectly in chat interface

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
├── index.html              # Main chat interface
├── jscript.js              # Frontend logic (OpenRouter integration)
├── stylesheet.css          # Modern dark theme styling
├── chat.mp3                # Message notification sound
├── functions/
│   ├── chat.js            # Netlify function with optimized AI integration
│   ├── package.json       # Function dependencies
│   └── package-lock.json  # Locked dependency versions
├── netlify.toml           # Netlify configuration with build commands
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

## 🎯 How It Works

1. **User Input**: User types a message in the chat interface
2. **API Call**: Frontend sends message to Netlify function
3. **AI Processing**: Function calls OpenRouter API with Mistral 7B model
4. **Response Optimization**: AI generates concise, natural response (max 80 tokens)
5. **Error Handling**: If issues occur, provides specific error messages
6. **Display**: Response appears in chat with typing animation and sound

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **Backend**: Netlify Functions (Node.js)
- **AI**: OpenRouter API with Mistral 7B model
- **Deployment**: Netlify with automatic dependency installation
- **Styling**: Custom CSS with DM Sans font
- **Error Handling**: Comprehensive error detection and user-friendly messages

## 🛡️ Error Handling & Reliability

Melissa includes robust error handling with specific messages for different failure types:

- **🔑 Authentication Issues**: "I'm having authentication issues. Please check your API key."
- **⏰ Rate Limiting**: "I'm getting too many requests right now. Please wait a moment and try again."
- **🌐 Service Unavailable**: "The AI service is temporarily unavailable. Please try again in a few minutes."
- **⏱️ Timeout**: "The request took too long to process. Please try again."
- **📡 Network Issues**: "I'm having network connectivity issues. Please check your connection and try again."

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
- Error messages
- Network request status

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
content: "You are Melissa, a cool, nerdy cyber-girl inspired by KillJoy from Valorant..."
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
- **Optimized Usage**: Concise responses reduce token usage
- **Monitoring**: Track usage in your OpenRouter dashboard
- **Scaling**: Upgrade plan for higher traffic

## 🚨 Troubleshooting

### Common Issues

1. **"I'm having trouble connecting right now"**
   - Check your OpenRouter API key in Netlify environment variables
   - Verify the API key is valid and has sufficient credits
   - Check Netlify function logs for detailed error information
   - Test the health check endpoint

2. **Function deployment fails**
   - Ensure `package-lock.json` is committed to the repository
   - Check that the build command in `netlify.toml` is correct
   - Verify Node.js version compatibility

3. **Rate limiting errors**
   - Wait a few minutes before trying again
   - Consider upgrading your OpenRouter plan for higher limits
   - Check if the model is temporarily unavailable

4. **Responses too long or getting cut off**
   - The function is optimized for concise responses (max 80 tokens)
   - Responses are automatically trimmed to fit the chat interface
   - Check the system prompt for response length instructions

### Debugging Steps

1. **Test the health check**: Visit `/.netlify/functions/chat` with a GET request
2. **Check function logs**: Review Netlify function logs for error details
3. **Verify API key**: Ensure `OPENROUTER_API_KEY` is set in Netlify environment variables
4. **Enable test mode**: Add `TEST_MODE=true` to test without API calls
5. **Check browser console**: Look for JavaScript errors or network issues
6. **Test with curl**: Use curl to test the function directly

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

---

**Made with ❤️ by Thynkzone**
