// OpenRouter AI API endpoint - replace with your actual API endpoint
const API_ENDPOINT = '/api/chat'; // This will be handled by Netlify Functions

// Chat history management
const CHAT_HISTORY_KEY = 'melissa_chat_history';
const MAX_HISTORY_LENGTH = 50; // Maximum number of messages to store

// Rate limit management
const RATE_LIMIT_KEY = 'melissa_rate_limit';
let isRateLimited = false;
let rateLimitTimer = null;

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
    // Reset rate limit when clearing history
    this.resetRateLimit();
  };

  // Rate limit management
  this.setRateLimit = function() {
    isRateLimited = true;
    sessionStorage.setItem(RATE_LIMIT_KEY, 'true');
    this.updateStatus('offline');
    this.showRateLimitAlert();
    this.disableInput();
    this.scheduleAutoReset();
  };

  this.resetRateLimit = function() {
    isRateLimited = false;
    sessionStorage.removeItem(RATE_LIMIT_KEY);
    this.updateStatus('online');
    this.hideRateLimitAlert();
    this.enableInput();
    if (rateLimitTimer) {
      clearInterval(rateLimitTimer);
      rateLimitTimer = null;
    }
  };

  this.scheduleAutoReset = function() {
    // Set auto-reset after 24 hours (86400000 ms)
    // In production, you might want to get the actual reset time from the API response
    setTimeout(() => {
      this.resetRateLimit();
      // Trigger a custom event that the main script can listen to
      $(document).trigger('melissaBackOnline');
    }, 86400000); // 24 hours
  };

  this.checkRateLimit = function() {
    const rateLimited = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (rateLimited === 'true') {
      isRateLimited = true;
      this.updateStatus('offline');
      this.disableInput();
      return true;
    }
    return false;
  };

  this.updateStatus = function(status) {
    const statusElement = $('.contact-status');
    const dotElement = $('.online-dot');
    const statusText = $('.status-text');
    
    if (status === 'offline') {
      statusElement.addClass('offline');
      dotElement.addClass('offline');
      statusText.text('Offline');
    } else {
      statusElement.removeClass('offline');
      dotElement.removeClass('offline');
      statusText.text('Online');
    }
  };

  this.showRateLimitAlert = function() {
    // Remove existing alert if any
    $('.rate-limit-alert').remove();
    
    // Calculate reset time (24 hours from now)
    const now = new Date();
    const resetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Format the reset time
    const resetTimeString = resetTime.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
    
    const resetDateString = resetTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    const alertHtml = `
      <div class="rate-limit-alert">
        Melissa set the wake-up alarm for <span class="timer">${resetTimeString} ${resetDateString}</span>
      </div>
    `;
    
    $('body').append(alertHtml);
    
    // Show alert with animation
    setTimeout(() => {
      $('.rate-limit-alert').addClass('show');
    }, 100);
    
    // Hide alert after 5 seconds
    setTimeout(() => {
      $('.rate-limit-alert').removeClass('show');
      setTimeout(() => {
        $('.rate-limit-alert').remove();
      }, 300);
    }, 5000);
  };

  this.hideRateLimitAlert = function() {
    $('.rate-limit-alert').removeClass('show');
    setTimeout(() => {
      $('.rate-limit-alert').remove();
    }, 300);
  };

  this.disableInput = function() {
    $('.input-area').addClass('rate-limited');
  };

  this.enableInput = function() {
    $('.input-area').removeClass('rate-limited');
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
        // Check if it's a rate limit error
        if (response.status === 429 || 
            (data.response && data.response.includes("I'm feeling very tired"))) {
          this.setRateLimit();
          throw new Error(data.response || "I'm feeling very tired tonight, will talk tomorrow xoxo 😴");
        }
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
  
  // Check rate limit status on page load
  bot.checkRateLimit();

  // Listen for Melissa coming back online
  $(document).on('melissaBackOnline', function() {
    updateChat('other', "Good morning! I'm back online and ready to chat! 😊");
    bot.addToHistory('assistant', "Good morning! I'm back online and ready to chat! 😊");
  });

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

    // Check if rate limited
    if (isRateLimited) {
      return; // Don't send message if rate limited
    }

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
      
      // If it's a rate limit error, don't show it again
      if (error.message && error.message.includes("I'm feeling very tired")) {
        // The rate limit is already handled by setRateLimit()
        // Don't add this message to history to prevent showing it again
        return;
      }
      
      // Add other error messages to history
      bot.addToHistory('assistant', error.message);
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
    // Reset rate limit status
    bot.resetRateLimit();
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