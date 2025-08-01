// OpenRouter AI API endpoint - replace with your actual API endpoint
const API_ENDPOINT = '/api/chat'; // This will be handled by Netlify Functions

// Chat history management
const CHAT_HISTORY_KEY = 'melissa_chat_history';
const MAX_HISTORY_LENGTH = 50; // Maximum number of messages to store

function chatBot() {
  this.input;
  this.chatHistory = [];
  
  // Load chat history from sessionStorage
  this.loadHistory = function() {
    try {
      const saved = sessionStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        this.chatHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.chatHistory = [];
    }
  };
  
  // Save chat history to sessionStorage
  this.saveHistory = function() {
    try {
      // Keep only the last MAX_HISTORY_LENGTH messages
      if (this.chatHistory.length > MAX_HISTORY_LENGTH) {
        this.chatHistory = this.chatHistory.slice(-MAX_HISTORY_LENGTH);
      }
      sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(this.chatHistory));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };
  
  // Add message to history
  this.addToHistory = function(role, content) {
    this.chatHistory.push({ role, content });
    if (this.chatHistory.length > MAX_HISTORY_LENGTH) {
      this.chatHistory = this.chatHistory.slice(-MAX_HISTORY_LENGTH);
    }
    this.saveHistory();
  };
  
  // Clear chat history
  this.clearHistory = function() {
    this.chatHistory = [];
    this.saveHistory();
  };
  
  this.respondTo = async function (input) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input, 
          history: this.chatHistory 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Return the actual error message from the backend
        throw new Error(data.response || "I'm having trouble connecting right now. Please try again in a moment.");
      }

      return data.response || "I'm sorry, I didn't get that.";
    } catch (error) {
      console.error('Error calling API:', error);
      // If it's our custom error message, throw it as is
      if (error.message && (error.message.includes("I'm feeling very tired") || 
                           error.message.includes("I'm having trouble connecting"))) {
        throw error;
      }
      // Otherwise throw a generic error
      throw new Error("I'm having trouble connecting right now. Please try again in a moment.");
    }
  };

  this.match = function (regex) {
    return new RegExp(regex).test(this.input);
  };
}

$(function () {
  var bot = new chatBot();
  var chat = $('.chat');
  var input = $('.input-field');
  var sendBtn = $('.send-btn');
  var busy = $('.busy');
  var resetBtn = $('.reset-btn');
  
  // Load chat history
  bot.loadHistory();

  var updateChat = function(party, message) {
    var time = new Date().toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: "numeric", 
      minute: "numeric" 
    });
    
    var messageHtml = `
      <div class="${party}">
        <div class="party">${party === 'you' ? 'You' : 'Melissa'}</div>
        <div class="msg-bubble">
          <div class="text">${message}</div>
          <div class="time">${time}</div>
        </div>
      </div>
    `;
    
    chat.append(messageHtml);
    chat.scrollTop(chat[0].scrollHeight);
  };

  var submitChat = async function () {
    var inputText = input.val().trim();
    if (!inputText) return;

    // Clear input
    input.val('');
    
    // Update UI with user message
    updateChat('you', inputText);
    bot.addToHistory('user', inputText);
    
    // Show "Melissa is typing" indicator
    busy.text("Melissa is typing...");
    busy.show();
    
    try {
      // Get bot response
      var reply = await bot.respondTo(inputText);
      
      // Hide typing indicator
      busy.hide();
      
      // Update UI with bot response
      updateChat('other', reply);
      bot.addToHistory('assistant', reply);
      
      // Play notification sound
      playNotificationSound();
      
    } catch (error) {
      console.error('Error in submitChat:', error);
      busy.hide();
      
      // Show the actual error message from the backend
      updateChat('other', error.message);
    }
  };

  var playNotificationSound = function() {
    try {
      console.log('Attempting to play chat.mp3...');
      var audio = new Audio('chat.mp3');
      audio.volume = 0.3; // Set volume to 30%
      
      // Add event listeners for debugging
      audio.addEventListener('loadstart', function() {
        console.log('Audio load started');
      });
      
      audio.addEventListener('canplay', function() {
        console.log('Audio can play');
      });
      
      audio.addEventListener('error', function(e) {
        console.log('Audio error:', e);
        console.log('Audio error details:', e.target.error);
        console.log('Audio src:', e.target.src);
      });
      
      // Simple play with error handling
      audio.play().catch(function(error) {
        console.log('Audio play failed:', error);
        // No fallback - just log the error
      });
    } catch (error) {
      console.log('Audio creation failed:', error);
      // No fallback - just log the error
    }
  };

  // Handle send button click
  sendBtn.on('click', submitChat);

  // Handle enter key press
  input.on('keypress', function(e) {
    if (e.which === 13 && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  });

  // Handle reset button click
  resetBtn.on('click', function() {
    bot.clearHistory();
    chat.empty();
    updateChat('other', "Hi there, I'm Melissa! How can I help you today?");
    bot.addToHistory('assistant', "Hi there, I'm Melissa! How can I help you today?");
  });

  // Auto-resize textarea
  input.on('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // Initialize chat
  if (bot.chatHistory.length === 0) {
    updateChat('other', "Hi there, I'm Melissa! How can I help you today?");
    bot.addToHistory('assistant', "Hi there, I'm Melissa! How can I help you today?");
  } else {
    // Restore chat history to UI
    bot.chatHistory.forEach(function(msg) {
      updateChat(msg.role === 'user' ? 'you' : 'other', msg.content);
    });
  }
});