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
        console.log('Loaded chat history:', this.chatHistory.length, 'messages');
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
    this.chatHistory.push({
      role: role,
      content: content,
      timestamp: new Date().toISOString()
    });
    this.saveHistory();
  };
  
  // Clear chat history
  this.clearHistory = function() {
    this.chatHistory = [];
    sessionStorage.removeItem(CHAT_HISTORY_KEY);
    console.log('Chat history cleared');
  };
  
  this.respondTo = async function (input) {
    this.input = input.toLowerCase();
    
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: this.chatHistory // Send chat history for context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || "I'm sorry, I couldn't process that request.";
      
    } catch (error) {
      console.error('Error calling API:', error);
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }
  };

  this.match = function (regex) {
    return new RegExp(regex).test(this.input);
  };
}

$(function () {
  var you = 'You';
  var robot = 'Melissa';

  var delayStart = 400;
  var delayEnd = 800;

  var bot = new chatBot();
  var chat = $('.chat');
  var waiting = 0;
  $('.busy').text(robot + ' is typing...');

  // Load chat history on startup
  bot.loadHistory();

  var submitChat = async function () {
    var input = $('.input textarea').val();
    if (input == '') return;

    $('.input textarea').val('');
    updateChat(you, input);
    
    // Add user message to history
    bot.addToHistory('user', input);

    $('.busy').css('display', 'block');
    waiting++;

    try {
      var reply = await bot.respondTo(input);
      
      setTimeout(function () {
        if (typeof reply === 'string') {
          updateChat(robot, reply);
          // Add bot response to history
          bot.addToHistory('assistant', reply);
          playNotificationSound();
        } else {
          for (var r in reply) {
            updateChat(robot, reply[r]);
            // Add bot response to history
            bot.addToHistory('assistant', reply[r]);
            playNotificationSound();
          }
        }
        if (--waiting == 0) $('.busy').css('display', 'none');
      }, Math.floor(Math.random() * (delayEnd - delayStart) + delayStart));
      
    } catch (error) {
      console.error('Error in submitChat:', error);
      setTimeout(function () {
        updateChat(robot, "I'm sorry, something went wrong. Please try again.");
        if (--waiting == 0) $('.busy').css('display', 'none');
      }, delayStart);
    }
  };

  var updateChat = function (party, text) {
    var style = 'you';
    if (party != you) {
      style = 'other';
    }

    var line = $('<div class="msg-bubble"><span class="party"></span> <span class="text"></span> <span class="time"></span></div>');
    line.find('.party').addClass(style).text(party + ':');
    line.find('.text').text(text);
    line.find('.time').text(new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric"}));
    
    chat.append(line);
    chat.stop().animate({ scrollTop: chat.prop("scrollHeight") });
  };

  // Audio notification function with error handling
  var playNotificationSound = function() {
    try {
      // Try to load the chat.mp3 file first
      var audio = new Audio('chat.mp3');
      audio.volume = 0.3; // Reduce volume to 30%
      
      // Handle audio loading errors
      audio.addEventListener('error', function(e) {
        console.log('Audio file not available, trying fallback beep sound');
        // Fallback to a simple beep sound using Web Audio API
        playFallbackBeep();
      });
      
      // Play audio with error handling
      var playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(function(error) {
          console.log('Audio playback failed, trying fallback beep sound:', error);
          playFallbackBeep();
        });
      }
    } catch (error) {
      console.log('Audio notification failed, trying fallback beep sound:', error);
      playFallbackBeep();
    }
  };

  // Fallback beep sound using Web Audio API
  var playFallbackBeep = function() {
    try {
      var audioContext = new (window.AudioContext || window.webkitAudioContext)();
      var oscillator = audioContext.createOscillator();
      var gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800 Hz beep
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Fallback beep sound failed:', error);
    }
  };

  $('.input button').bind('click', submitChat);
  
  // Handle Enter key press
  $('.input textarea').bind('keypress', function(e) {
    if (e.which == 13 && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  });

  // Add clear chat button functionality (optional)
  // You can add a button to the HTML and bind it like this:
  // $('.clear-chat').bind('click', function() {
  //   bot.clearHistory();
  //   chat.empty();
  //   updateChat(robot, "Hi there, I'm Melissa! How can I help you today?");
  // });

  // Clear chat button functionality
  $('.clear-chat-btn').bind('click', function() {
    if (confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
      bot.clearHistory();
      chat.empty();
      updateChat(robot, "Hi there, I'm Melissa! How can I help you today?");
      // Add initial greeting to history
      bot.addToHistory('assistant', "Hi there, I'm Melissa! How can I help you today?");
    }
  });

  // Initial greeting (only if no history exists)
  if (bot.chatHistory.length === 0) {
    updateChat(robot, "Hi there, I'm Melissa! How can I help you today?");
    // Add initial greeting to history
    bot.addToHistory('assistant', "Hi there, I'm Melissa! How can I help you today?");
  } else {
    // Restore chat history to UI
    console.log('Restoring chat history to UI...');
    bot.chatHistory.forEach(function(msg) {
      var party = msg.role === 'user' ? you : robot;
      var time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric"});
      
      var style = msg.role === 'user' ? 'you' : 'other';
      var line = $('<div class="msg-bubble"><span class="party"></span> <span class="text"></span> <span class="time"></span></div>');
      line.find('.party').addClass(style).text(party + ':');
      line.find('.text').text(msg.content);
      line.find('.time').text(time);
      
      chat.append(line);
    });
    chat.stop().animate({ scrollTop: chat.prop("scrollHeight") });
  }
});