# Melissa AI - Friend.AI 🤖

A modern, intelligent chatbot powered by OpenRouter AI that provides conversational, engaging responses with a beautiful chat interface, **automatic API fallback system**, and robust error handling.

## ✨ Features

- **🤖 Intelligent AI**: Powered by Mistral 7B via OpenRouter with optimized response handling
- **🔄 Automatic API Fallback**: Seamlessly switches between primary and backup API keys
- **📊 Dynamic Status System**: Real-time online/offline status with blinking indicators
- **🚨 Smart Alert System**: One-time rate limit notifications with actual reset times
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
- **🕐 Real Reset Timers**: Shows actual API reset times from OpenRouter

## 🚀 Quick Start

### Prerequisites
- **Two OpenRouter API keys** ([Get them here](https://openrouter.ai/))
  - Primary key for main usage
  - Backup key for fallback when primary runs out
- Netlify account (free)

### Deployment Steps

1. **Fork/Clone this repository**
2. **Get your OpenRouter API keys** from [openrouter.ai](https://openrouter.ai/)
3. **Deploy to Netlify**:
   - Connect your repository to Netlify
   - Add environment variables:
     - `OPENROUTER_API_KEY` = your primary API key
     - `OPENROUTER_API_KEY_BACKUP` = your backup API key
   - Deploy!

For detailed setup instructions, see [SETUP.md](SETUP.md)

## 🏗️ Project Structure

```
melissa-ai/
├── index.html              # Main chat interface with modern UI
├── jscript.js              # Frontend logic with chat history & rate limit management
├── stylesheet.css          # Modern chat interface styling with dynamic status
├── chat.mp3                # Message notification sound
├── logo.png             # Melissa's avatar image
├── functions/
│   ├── chat.js            # Netlify function with AI integration & fallback system
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
4. **Fallback System**: Automatically tries backup API key if primary fails
5. **AI Processing**: Function calls OpenRouter API with Mistral 7B model
6. **Rate Limit Detection**: Smart detection with real reset times from API
7. **Dynamic Status**: Updates online/offline status based on API availability
8. **Smart Alerts**: Shows one-time notification with actual reset time
9. **Response Optimization**: AI generates concise, natural response (max 80 tokens)
10. **History Management**: Chat history saved to sessionStorage
11. **Display**: Response appears in chat with typing animation and sound

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **Backend**: Netlify Functions (Node.js)
- **AI**: OpenRouter API with Mistral 7B model
- **Fallback System**: Automatic API key switching
- **Deployment**: Netlify with automatic dependency installation
- **Styling**: Modern chat interface with DM Sans font
- **Storage**: sessionStorage for chat history persistence
- **Audio**: MP3 notification sounds with Web Audio API fallback
- **Status Management**: Real-time online/offline indicators

## 🛡️ Error Handling & Reliability

Melissa includes intelligent error handling with user-friendly messages:

- **🎯 Rate Limiting**: "I'm feeling very tired tonight, will talk tomorrow xoxo 😴"
- **🔄 Automatic Fallback**: Seamlessly switches to backup API key
- **📊 Status Updates**: Real-time online/offline status changes
- **🚨 Smart Alerts**: One-time notifications with actual reset times
- **🔑 Authentication Issues**: "I'm having authentication issues. Please check your API keys."
- **🌐 Service Unavailable**: "The AI service is having issues. Please try again later."
- **⏱️ Timeout**: "The AI is taking too long to respond. Please try again."
- **📡 Network Issues**: "I'm having network connectivity issues. Please check your connection."

## 🔄 Fallback API System

### How It Works
- **Primary Key Priority**: Always tries the primary API key first
- **Automatic Fallback**: Switches to backup key when primary hits rate limits
- **Seamless Transition**: Users don't notice any interruption
- **Smart Detection**: Rate limit errors detected and handled gracefully
- **Real Reset Times**: Shows actual reset times from OpenRouter API

### Benefits
- **Double Capacity**: 100 requests/day instead of 50 (with two accounts)
- **Zero Downtime**: Continuous service when one account runs out
- **Cost Distribution**: Spread usage across multiple accounts
- **Automatic Recovery**: System recovers when limits reset

## 📊 Dynamic Status System

### Visual Indicators
- **🟢 Online**: Green blinking dot + "Online" text
- **🟠 Offline**: Orange blinking dot + "Offline" text
- **Always Interactive**: Continuous blinking animation
- **Real-time Updates**: Status changes based on API availability

### Status Management
- **Automatic Detection**: Detects rate limits and updates status
- **Persistent State**: Status persists across page refreshes
- **Reset Integration**: Automatically comes back online when limits reset
- **Manual Reset**: Reset button clears status and allows fresh start

## 🚨 Smart Alert System

### Features
- **One-Time Display**: Shows rate limit alert only once
- **Real Reset Times**: Displays actual reset time from OpenRouter API
- **Elegant Animation**: Smooth slide-in/slide-out with backdrop blur
- **Auto-Dismiss**: Alert disappears after 5 seconds
- **No Repeated Messages**: Prevents showing "tired" message multiple times

### Alert Content
- **Before**: "Melissa set the wake-up alarm for T-reset"
- **After**: "Melissa set the wake-up alarm for 12:00 AM Aug 3"

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
- **Rate Limit Integration**: Clears rate limit status when reset

## 🔧 Troubleshooting

### Rate Limit Issues
- **Click Reset Button**: Clears rate limit status and allows fresh start
- **Console Command**: Run `resetMelissaRateLimit()` in browser console
- **Check API Keys**: Verify both primary and backup keys are set in Netlify
- **Monitor Logs**: Check Netlify function logs for detailed error information

### Status Issues
- **Force Reset**: Use reset button or console command to clear status
- **Check Environment**: Verify API keys are properly configured
- **Test Health**: Visit `/.netlify/functions/chat` to check API key status

## 📈 Performance & Cost Optimization

- **Local Responses**: Common greetings save API credits
- **Concise Responses**: Max 80 tokens reduce costs
- **Fallback System**: Distributes usage across multiple accounts
- **Smart Caching**: Efficient session storage management
- **Timeout Protection**: 25-second limits prevent hanging requests

## 🔒 Security & Privacy

- **Secure Storage**: API keys stored in Netlify environment variables
- **No Data Logging**: Sensitive information not logged or stored
- **Local History**: Chat history stored only in user's browser
- **CORS Protection**: Proper headers for web deployment
- **Input Validation**: All user inputs validated and sanitized
