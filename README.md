# Melissa AI - Friend.AI 🤖

A modern, intelligent chatbot powered by OpenRouter AI that provides conversational, engaging responses with robust error handling and multiple AI model fallbacks.

## ✨ Features

- **🤖 Intelligent AI**: Powered by multiple AI models via OpenRouter with automatic fallbacks
- **💬 Natural Conversations**: Dynamic responses with Melissa's unique personality
- **🎨 Modern UI**: Clean, responsive chat interface with typing indicators
- **🔊 Audio Feedback**: Sound effects for message notifications
- **📱 Mobile Optimized**: Responsive design that works on all devices
- **⚡ Fast & Reliable**: Serverless architecture with Netlify Functions
- **🛡️ Robust Error Handling**: Multiple fallback models and detailed error messages
- **🔍 Health Monitoring**: Built-in health check endpoint for debugging
- **⏱️ Request Timeouts**: Prevents hanging requests with 30-second timeouts

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
│   ├── chat.js            # Netlify function with fallback models
│   ├── package.json       # Function dependencies
│   └── package-lock.json  # Locked dependency versions
├── netlify.toml           # Netlify configuration with build commands
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

## 🎯 How It Works

1. **User Input**: User types a message in the chat interface
2. **API Call**: Frontend sends message to Netlify function
3. **Model Selection**: Function tries multiple AI models in sequence:
   - Primary: `anthropic/claude-3-haiku:free`
   - Fallback 1: `google/gemini-2.0-flash-exp:free`
   - Fallback 2: `meta-llama/llama-3.1-8b-instruct:free`
4. **AI Processing**: Selected model generates intelligent, contextual response
5. **Error Handling**: If one model fails, automatically tries the next
6. **Display**: Response appears in chat with typing animation and sound

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **Backend**: Netlify Functions (Node.js)
- **AI**: OpenRouter API with multiple model fallbacks
- **Deployment**: Netlify with automatic dependency installation
- **Styling**: Custom CSS with DM Sans font
- **Error Handling**: Comprehensive error detection and user-friendly messages

## 🛡️ Error Handling & Reliability

Melissa now includes robust error handling with specific messages for different failure types:

- **🔑 Authentication Issues**: "I'm having authentication issues. Please try again later."
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
  "hasApiKey": true
}
```

### Function Logs
Check Netlify function logs for detailed error information and debugging data.

## 💡 Customization

### Changing AI Models
Edit `functions/chat.js` and modify the `models` array:
```javascript
const models = ["your-preferred-model", "fallback-model-1", "fallback-model-2"];
```

### Modifying Melissa's Personality
Update the system prompt in `functions/chat.js`:
```javascript
content: "You are Melissa, a cool, nerdy cyber-girl inspired by KillJoy from Valorant..."
```

### Styling Changes
Modify `stylesheet.css` to change colors, fonts, or layout.

## 📊 Cost & Usage

- **Free Tier**: OpenRouter offers free requests per month
- **Multiple Models**: Automatic fallbacks ensure availability even if one model is down
- **Monitoring**: Track usage in your OpenRouter dashboard
- **Scaling**: Upgrade plan for higher traffic

## 🚨 Troubleshooting

### Common Issues

1. **"I'm having trouble connecting right now"**
   - Check your OpenRouter API key in Netlify environment variables
   - Verify the API key is valid and has sufficient credits
   - Check Netlify function logs for detailed error information

2. **Function deployment fails**
   - Ensure `package-lock.json` is committed to the repository
   - Check that the build command in `netlify.toml` is correct

3. **Rate limiting errors**
   - Wait a few minutes before trying again
   - Consider upgrading your OpenRouter plan for higher limits

### Debugging Steps

1. **Test the health check**: Visit `/.netlify/functions/chat` with a GET request
2. **Check function logs**: Review Netlify function logs for error details
3. **Verify API key**: Ensure `OPENROUTER_API_KEY` is set in Netlify environment variables
4. **Test with curl**: Use curl to test the function directly

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
- **Anthropic, Google, Meta** for the AI models
- **Thynkzone** for the original concept

## 📞 Support

If you encounter any issues:
1. Check the [SETUP.md](SETUP.md) troubleshooting section
2. Verify your OpenRouter API key is correctly set
3. Check Netlify function logs for detailed error information
4. Test the health check endpoint for function status

---

**Made with ❤️ by Thynkzone**
