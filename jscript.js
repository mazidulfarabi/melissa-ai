// Melissa AI - Powered by Cloudflare Workers AI & Netlify Edge
// Fast, responsive, streaming chat client

// API endpoints
const API_ENDPOINT = '/api/chat';
const FALLBACK_WORKER_URL = 'https://melissa-ai.anmone-gaming.workers.dev/api/chat';

// Storage keys & limits
const CHAT_HISTORY_KEY = 'melissa_chat_history';
const MAX_HISTORY_LENGTH = 30;

// Fast instant local responses for common queries (delivers instant 0ms replies)
const localResponses = {
  'hello': [
    "Hey there! 😊 How's it going?",
    "Hi! Nice to see you! 👋",
    "Hello! How are you doing today? 😄"
  ],
  'hi': [
    "Hey! What's up? 😊",
    "Hi there! How's your day going? 👋",
    "Hello! Nice to chat with you! 😄"
  ],
  'hey': [
    "Hey! How are you? 😊",
    "Hi there! What's new? 👋",
    "Hey! Great to see you! 😄"
  ],
  'good morning': [
    "Good morning! Hope you're having a great start to your day! ☀️",
    "Morning! How's your day going so far? 🌅",
    "Good morning! Ready to chat? 😊"
  ],
  'good afternoon': [
    "Good afternoon! Hope your day is going well! 🌞",
    "Afternoon! How's everything? 😊"
  ],
  'good evening': [
    "Good evening! How was your day? 🌙",
    "Evening! Hope you had a great day! 😊"
  ],
  'good night': [
    "Good night! Sweet dreams! 😴",
    "Night! Sleep well! 🌙",
    "Good night! See you tomorrow! 😊"
  ],
  'how are you': [
    "I'm doing great! Thanks for asking! How about you? 😊",
    "I'm awesome! How are you doing? 😄",
    "I'm feeling good! How's your day going? 😊"
  ],
  'how r u': [
    "I'm good! How about you? 😊",
    "I'm great! How are you doing? 😄"
  ],
  'how are u': [
    "I'm good! How about you? 😊",
    "I'm great! How are you doing? 😄"
  ],
  'what is your name': [
    "I'm Melissa! Nice to meet you! 😊",
    "My name is Melissa! What's yours? 👋"
  ],
  'whats your name': [
    "I'm Melissa! Nice to meet you! 😊",
    "My name is Melissa! What's yours? 👋"
  ],
  "what's your name": [
    "I'm Melissa! Nice to meet you! 😊",
    "My name is Melissa! What's yours? 👋"
  ],
  'who are you': [
    "I'm Melissa, your AI friend powered by Cloudflare edge intelligence! 😊",
    "I'm Melissa! Ready to chat anytime! 👋"
  ],
  'what time is it': () => `It's ${new Date().toLocaleTimeString('en-US', { hour12: true, hour: "numeric", minute: "numeric" })}! ⏰`,
  'what day is it': () => `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}! 📅`,
  'bye': [
    "Bye! It was nice chatting with you! 👋",
    "See you later! Take care! 😊"
  ],
  'goodbye': [
    "Goodbye! It was great talking to you! 👋",
    "See you later! Have a great day! 😊"
  ],
  'ok': ["Ok! 😊", "Alright! 👍", "Got it! 😄"],
  'okay': ["Okay! 😊", "Alright! 👍", "Got it! 😄"],
  'thanks': ["You're welcome! 😊", "No problem! 👍", "Anytime! 😄"],
  'thank you': ["You're welcome! 😊", "No problem! 👍", "Anytime! 😄"]
};

function MelissaBot() {
  this.chatHistory = [];

  // Load chat history from sessionStorage
  this.loadHistory = function() {
    try {
      const saved = sessionStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.chatHistory = parsed.filter(m => m.content && m.content.trim().length > 0);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.chatHistory = [];
    }
  };

  // Save chat history to sessionStorage
  this.saveHistory = function() {
    try {
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
    this.chatHistory.push({ role, content: content.trim() });
    this.saveHistory();
  };

  // Clear chat history
  this.clearHistory = function() {
    this.chatHistory = [];
    sessionStorage.removeItem(CHAT_HISTORY_KEY);
  };

  // Update online/offline/loading status in UI
  this.updateStatus = function(status, label) {
    const $status = $('.contact-status');
    const $dot = $('.online-dot');
    const $text = $('.status-text');

    $status.removeClass('offline loading');
    $dot.removeClass('offline loading');

    if (status === 'loading') {
      $status.addClass('loading');
      $dot.addClass('loading');
      $text.text(label || 'Thinking...');
    } else if (status === 'offline') {
      $status.addClass('offline');
      $dot.addClass('offline');
      $text.text(label || 'Offline');
    } else {
      $text.text(label || 'Online');
    }
  };

  // Fast local match check
  this.checkFastMatch = function(input) {
    const cleanInput = input.toLowerCase().trim().replace(/[?!.,;:]+$/, "");
    if (localResponses[cleanInput]) {
      const match = localResponses[cleanInput];
      return typeof match === 'function' ? match() : match[Math.floor(Math.random() * match.length)];
    }
    return null;
  };

  // Send message and stream response tokens
  this.sendMessageStream = async function(input, onChunk) {
    // 1. Instant local fast path
    const fastReply = this.checkFastMatch(input);
    if (fastReply) {
      if (onChunk) onChunk(fastReply, true);
      return fastReply;
    }

    const payload = {
      message: input,
      history: this.chatHistory.slice(-6),
      stream: true
    };

    let response = null;
    let endpointUsed = API_ENDPOINT;

    // Try primary endpoint (/api/chat), fallback to direct Cloudflare Worker if needed
    try {
      response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Primary endpoint failed, attempting direct worker fallback:', err);
    }

    if (!response || !response.ok) {
      endpointUsed = FALLBACK_WORKER_URL;
      response = await fetch(FALLBACK_WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Server returned ${response.status}: ${errText || 'Connection error'}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // If server returned SSE stream
    if (contentType.includes('text/event-stream') && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete trailing line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.response || parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullText += delta;
                if (onChunk) onChunk(fullText, false);
              }
            } catch (e) {
              // Non-JSON SSE line
              if (dataStr && dataStr !== '[DONE]') {
                fullText += dataStr;
                if (onChunk) onChunk(fullText, false);
              }
            }
          }
        }
      }

      const finalTrimmed = fullText.trim();
      if (onChunk) onChunk(finalTrimmed, true);
      return finalTrimmed;
    }

    // Otherwise, parse as JSON
    const data = await response.json();
    const reply = data.response || "I couldn't generate a response. Mind trying again?";
    if (onChunk) onChunk(reply, true);
    return reply;
  };
}

$(function() {
  const bot = new MelissaBot();
  const $chat = $('.chat');
  const $input = $('.input-field');
  const $sendBtn = $('.send-btn');
  const $busy = $('.busy');
  const $resetBtn = $('.reset-btn');

  // Load chat history
  bot.loadHistory();
  bot.updateStatus('online', 'Online');

  // Helper to append message to chat window
  const updateChat = function(party, message, messageId = null) {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: "numeric", 
      minute: "numeric" 
    });
    
    const idAttr = messageId ? `id="${messageId}"` : '';
    const messageHtml = `
      <div class="${party}" ${idAttr}>
        <div class="party">${party === 'you' ? 'You' : 'Melissa'}</div>
        <div class="msg-bubble">
          <div class="text">${message}</div>
          <div class="time">${time}</div>
        </div>
      </div>
    `;
    
    $chat.append(messageHtml);
    $chat.scrollTop($chat[0].scrollHeight);
  };

  // Play audio notification
  const playNotificationSound = function() {
    try {
      const audio = new Audio('chat.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio autoplay prevented:', e));
    } catch (e) {
      // Audio playback failsafe
    }
  };

  // Helper to escape HTML inside streaming bubble
  function escapeHtml(string) {
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  let isGenerating = false;

  // Submit chat message
  const submitChat = async function() {
    if (isGenerating) return;
    const text = $input.val().trim();
    if (!text) return;

    $input.val('');
    $input.css('height', 'auto');
    isGenerating = true;
    $sendBtn.prop('disabled', true).addClass('disabled');

    // Render user message
    updateChat('you', text);
    bot.addToHistory('user', text);

    // Create streaming bubble
    const bubbleId = 'msg-' + Date.now();
    updateChat('other', '<span class="typing-cursor"></span>', bubbleId);
    const $bubble = $('#' + bubbleId);
    const $textElem = $bubble.find('.text');

    $busy.text("Melissa is typing...");
    $busy.show();

    try {
      let hasReceivedFirstChunk = false;

      const reply = await bot.sendMessageStream(text, (currentText, isDone) => {
        if (!hasReceivedFirstChunk && currentText) {
          hasReceivedFirstChunk = true;
          $busy.hide();
        }

        if (isDone) {
          $textElem.text(currentText);
        } else {
          $textElem.html(escapeHtml(currentText) + '<span class="typing-cursor"></span>');
        }
        $chat.scrollTop($chat[0].scrollHeight);
      });

      $busy.hide();
      $textElem.text(reply);
      bot.addToHistory('assistant', reply);
      playNotificationSound();

    } catch (err) {
      console.error('Chat error:', err);
      $busy.hide();
      const errorMsg = "Oops! My brain had a hiccup connecting to the servers. Mind trying again in a sec? 😊";
      $textElem.text(errorMsg);
    } finally {
      isGenerating = false;
      $sendBtn.prop('disabled', false).removeClass('disabled');
      $input.focus();
    }
  };

  // Send button click
  $sendBtn.on('click', submitChat);

  // Enter key press (without shift)
  $input.on('keypress', function(e) {
    if (e.which === 13 && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  });

  // Clear chat / Reset button
  $resetBtn.on('click', function() {
    bot.clearHistory();
    $chat.empty();
    const welcome = "Hi there, I'm Melissa! What's up? Ready to chat! 😄";
    updateChat('other', welcome);
    bot.addToHistory('assistant', welcome);
  });

  // Auto-resize input textarea
  $input.on('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // Initialize UI with existing chat history or welcoming greeting
  if (bot.chatHistory.length === 0) {
    const welcome = "Hi there, I'm Melissa! How can I help you today? Ready to chat! ✨";
    updateChat('other', welcome);
    bot.addToHistory('assistant', welcome);
  } else {
    bot.chatHistory.forEach(function(msg) {
      updateChat(msg.role === 'user' ? 'you' : 'other', msg.content);
    });
  }

  // Expose bot for debugging
  window.melissaBot = bot;
});
