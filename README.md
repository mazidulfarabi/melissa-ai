# সবুজ সাথী (Green Companion) 🌱

A modern, intelligent plant care assistant powered by OpenRouter AI that helps you take care of your plants with disease detection, care advice, and a beautiful chat interface with **automatic API fallback system** and robust error handling.

## ✨ Features

- **🌱 Plant Care AI**: Powered by Mistral 7B via OpenRouter with specialized plant care knowledge
- **🔄 Automatic API Fallback**: Seamlessly switches between primary and backup API keys
- **📊 Dynamic Status System**: Real-time online/offline status with blinking indicators
- **🚨 Smart Alert System**: One-time rate limit notifications with actual reset times
- **💬 Plant Care Conversations**: Dynamic responses with সবুজ সাথী's plant care expertise
- **🎨 Modern Plant Care UI**: Clean, iOS-style chat interface with typing indicators and image upload
- **🔊 Audio Feedback**: Sound effects for message notifications (chat.mp3)
- **📱 Mobile Optimized**: Responsive design that works on all devices for plant care on the go
- **⚡ Fast & Reliable**: Serverless architecture with Netlify Functions
- **🛡️ Robust Error Handling**: Smart rate limit detection with friendly plant care messages
- **💾 Chat History**: Persistent chat history using sessionStorage
- **🔄 Reset Functionality**: Clear chat button to start fresh conversations
- **🎯 Local Responses**: Common plant care greetings handled locally to save API credits
- **⏱️ Request Timeouts**: Prevents hanging requests with 25-second timeouts
- **📏 Optimized Responses**: Concise, natural plant care responses (max 80 tokens)
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
sabuj-sathi/
├── index.html              # Main plant care chat interface with modern UI
├── jscript.js              # Frontend logic with chat history & rate limit management
├── stylesheet.css          # Modern plant care interface styling with dynamic status
├── chat.mp3                # Message notification sound
├── logo.jpg                # সবুজ সাথী's avatar image
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

1. **User Input**: User types plant care questions or uploads plant images
2. **Local Check**: Common plant care greetings handled locally
3. **API Call**: Complex plant care queries sent to Netlify function
4. **Fallback System**: Automatically tries backup API key if primary fails
5. **AI Processing**: Function calls OpenRouter API with Mistral 7B model for plant care advice
6. **Rate Limit Detection**: Smart detection with real reset times from API
7. **Dynamic Status**: Updates online/offline status based on API availability
8. **Smart Alerts**: Shows one-time notification with actual reset time
9. **Response Optimization**: AI generates concise, natural plant care responses (max 80 tokens)
10. **History Management**: Chat history saved to sessionStorage
11. **Display**: Response appears in chat with typing animation and sound

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **Backend**: Netlify Functions (Node.js)
- **AI**: OpenRouter API with Mistral 7B model for plant care
- **Fallback System**: Automatic API key switching
- **Deployment**: Netlify with automatic dependency installation
- **Styling**: Modern plant care interface with DM Sans font
- **Storage**: sessionStorage for chat history persistence
- **Audio**: MP3 notification sounds with Web Audio API fallback
- **Status Management**: Real-time online/offline indicators

## 🛡️ Error Handling & Reliability

সবুজ সাথী includes intelligent error handling with user-friendly plant care messages:

- **🎯 Rate Limiting**: "আমি আজ রাতে খুব ক্লান্ত, আগামীকাল গাছের যত্নে সাহায্য করব 😴"
- **🔄 Automatic Fallback**: Seamlessly switches to backup API key
- **📊 Status Updates**: Real-time online/offline status changes
- **🚨 Smart Alerts**: One-time notifications with actual reset times
- **🔑 Authentication Issues**: "API key সমস্যা হচ্ছে। দয়া করে API key চেক করুন।"
- **🌐 Service Unavailable**: "AI সেবা সমস্যায় আছে। একটু পরে আবার চেষ্টা করুন।"
- **⏱️ Timeout**: "AI উত্তর দিতে বেশি সময় নিচ্ছে। আবার চেষ্টা করুন।"
- **📡 Network Issues**: "নেটওয়ার্ক সংযোগ সমস্যা হচ্ছে। ইন্টারনেট চেক করুন।"

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
- **Before**: "সবুজ সাথী set the wake-up alarm for T-reset"
- **After**: "সবুজ সাথী set the wake-up alarm for 12:00 AM Aug 3"

## 🎵 Audio Features

- **Notification Sound**: `chat.mp3` plays when সবুজ সাথী responds
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
- **Console Command**: Run `resetGreenCompanionRateLimit()` in browser console
- **Check API Keys**: Verify both primary and backup keys are set in Netlify
- **Monitor Logs**: Check Netlify function logs for detailed error information

### Status Issues
- **Force Reset**: Use reset button or console command to clear status
- **Check Environment**: Verify API keys are properly configured
- **Test Health**: Visit `/.netlify/functions/chat` to check API key status

## 📈 Performance & Cost Optimization

- **Local Responses**: Common plant care greetings save API credits
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
