# Melissa AI - Friend.AI 🤖

A modern, intelligent chatbot powered by OpenRouter AI that provides conversational, engaging responses using Google Gemini 2.0 Flash.

## ✨ Features

- **🤖 Intelligent AI**: Powered by Google Gemini 2.0 Flash via OpenRouter
- **💬 Natural Conversations**: Dynamic responses instead of predefined answers
- **🎨 Modern UI**: Clean, responsive chat interface with typing indicators
- **🔊 Audio Feedback**: Sound effects for message notifications
- **📱 Mobile Optimized**: Responsive design that works on all devices
- **⚡ Fast & Reliable**: Serverless architecture with Netlify Functions
- **🛡️ Error Handling**: Graceful fallbacks and user-friendly error messages

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
│   ├── chat.js            # Netlify function for API calls
│   └── package.json       # Function dependencies
├── netlify.toml           # Netlify configuration
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

## 🎯 How It Works

1. **User Input**: User types a message in the chat interface
2. **API Call**: Frontend sends message to Netlify function
3. **AI Processing**: Function calls OpenRouter API with Google Gemini 2.0 Flash
4. **Response**: AI generates intelligent, contextual response
5. **Display**: Response appears in chat with typing animation and sound

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **Backend**: Netlify Functions (Node.js)
- **AI**: OpenRouter API + Google Gemini 2.0 Flash
- **Deployment**: Netlify
- **Styling**: Custom CSS with DM Sans font

## 💡 Customization

### Changing the AI Model
Edit `functions/chat.js` and modify the `model` parameter:
```javascript
model: "google/gemini-2.0-flash-exp:free" // Change to any OpenRouter model
```

### Modifying the Personality
Update the system prompt in `functions/chat.js`:
```javascript
content: "You are Melissa, a friendly and helpful AI assistant..."
```

### Styling Changes
Modify `stylesheet.css` to change colors, fonts, or layout.

## 📊 Cost & Usage

- **Free Tier**: OpenRouter offers free requests per month
- **Monitoring**: Track usage in your OpenRouter dashboard
- **Scaling**: Upgrade plan for higher traffic

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
- **Netlify** for serverless hosting
- **Google** for the Gemini AI model
- **Thynkzone** for the original concept

## 📞 Support

If you encounter any issues:
1. Check the [SETUP.md](SETUP.md) troubleshooting section
2. Verify your OpenRouter API key is correctly set
3. Check Netlify function logs for errors

---

**Made with ❤️ by Thynkzone**
