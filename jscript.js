// Melissa AI - 100% In-Browser Offline AI (Powered by WebLLM & WebGPU)
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// Storage keys & configuration
const CHAT_HISTORY_KEY = 'melissa_chat_history';
const MAX_HISTORY_LENGTH = 30;
// Smallest production-grade offline model (~350MB download, 0.5B params, fast & no repetition loops)
const DEFAULT_MODEL = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';

// Fast local responses for common trivial queries (saves GPU & delivers instant 0ms replies)
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
    "I'm Melissa, your offline AI friend! 😊",
    "I'm Melissa! Ready to chat anytime, even with no internet! 👋"
  ],
  'what time is it': () => `It's ${new Date().toLocaleTimeString('en-US', { hour12: true, hour: "numeric", minute: "numeric" })}! ⏰`,
  'what day is it': () => `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}! 📅`,
  'how is the weather': [
    "I run 100% offline so I can't check current weather sensors, but hope it's nice outside! 🌤️",
    "I'm totally offline without web access, but hope you're having great weather! ☀️"
  ],
  'weather': [
    "I'm running offline on your device, but hope the weather is lovely wherever you are! 🌤️"
  ],
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

// Detect repetitive phrase or sentence loops in generated text
function hasRepetitionLoop(text) {
  if (!text || text.length < 12) return false;

  // 1. Check for immediate consecutive duplicate sentences
  const parts = text.split(/(?<=[.!?\n])\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1].trim().toLowerCase();
    const prev = parts[parts.length - 2].trim().toLowerCase();
    if (last.length >= 5 && (last === prev || prev.endsWith(last) || last.endsWith(prev))) {
      return true;
    }
  }

  // 2. Check for repeated phrases of 7+ characters appearing consecutively
  const repeatPattern = /(.{7,}?)\s*\1/i;
  return repeatPattern.test(text);
}

// Clean repetitive text to keep only the initial unique sentence
function cleanRepetitionLoop(text) {
  if (!text) return "";

  const parts = text.split(/(?<=[.!?\n])\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const seen = new Set();
    const cleanParts = [];
    for (const part of parts) {
      const norm = part.trim().toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        cleanParts.push(part);
      } else {
        break; // Stop at first repetition
      }
    }
    if (cleanParts.length > 0) {
      return cleanParts.join(" ").trim();
    }
  }

  const match = text.match(/(.{7,}?)\s*\1/i);
  if (match) {
    const idx = text.indexOf(match[0]);
    return text.substring(0, idx + match[1].length).trim();
  }

  return text.trim();
}

function MelissaBot() {
  this.engine = null;
  this.chatHistory = [];
  this.isModelReady = false;
  this.isModelLoading = false;
  this.currentModelId = DEFAULT_MODEL;

  // Load chat history from sessionStorage (auto-sanitize any legacy corrupted loops)
  this.loadHistory = function() {
    try {
      const saved = sessionStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.chatHistory = parsed
            .map(m => ({ role: m.role, content: cleanRepetitionLoop(m.content || "") }))
            .filter(m => m.content.length > 0 && !hasRepetitionLoop(m.content));
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

  // Add message to history with sanitization
  this.addToHistory = function(role, content) {
    const cleaned = cleanRepetitionLoop(content);
    this.chatHistory.push({ role, content: cleaned });
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
      $text.text(label || 'Loading AI...');
    } else if (status === 'offline') {
      $status.addClass('offline');
      $dot.addClass('offline');
      $text.text(label || 'Offline');
    } else {
      $text.text(label || 'Online');
    }
  };

  // Check if browser has WebGPU support
  this.checkWebGPU = async function() {
    if (!navigator.gpu) {
      return { supported: false, message: "WebGPU is not supported in this browser. Please use Google Chrome, Edge, or Brave with WebGPU enabled." };
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return { supported: false, message: "No compatible WebGPU graphics adapter found on your system." };
      }
      return { supported: true, adapter };
    } catch (err) {
      return { supported: false, message: err.message };
    }
  };

  // Initialize or reload the WebLLM engine
  this.loadModel = async function(modelId = DEFAULT_MODEL, onProgress) {
    this.currentModelId = modelId;
    this.isModelLoading = true;
    this.isModelReady = false;
    this.updateStatus('loading', 'Loading model...');

    const initProgressCallback = (report) => {
      // report has { progress: 0..1, text: string, timeElapsed: number }
      if (onProgress) {
        onProgress(report);
      }
    };

    try {
      if (this.engine) {
        await this.engine.reload(modelId, { initProgressCallback });
      } else {
        this.engine = await webllm.CreateMLCEngine(modelId, {
          initProgressCallback,
          logLevel: "WARN"
        });
      }

      this.isModelReady = true;
      this.isModelLoading = false;
      this.updateStatus('online', 'Online');
      return true;
    } catch (err) {
      console.error('Failed to load WebLLM model:', err);
      this.isModelReady = false;
      this.isModelLoading = false;
      this.updateStatus('offline', 'Load Failed');
      throw err;
    }
  };

  // Generate response with streaming tokens
  this.respondStream = async function(input, onChunk) {
    // 1. Fast match check for common queries to save battery/GPU (instant 0ms replies)
    const cleanInput = input.toLowerCase().trim().replace(/[?!.,;:]+$/, "");
    if (localResponses[cleanInput]) {
      const match = localResponses[cleanInput];
      const replyText = typeof match === 'function' ? match() : match[Math.floor(Math.random() * match.length)];
      if (onChunk) {
        onChunk(replyText, true);
      }
      return replyText;
    }

    // Word boundary check for fast instant replies (e.g. "hey melissa", "hi there")
    for (const [key, responses] of Object.entries(localResponses)) {
      if (key.length > 2) {
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        if (regex.test(cleanInput)) {
          const replyText = typeof responses === 'function' ? responses() : responses[Math.floor(Math.random() * responses.length)];
          if (onChunk) {
            onChunk(replyText, true);
          }
          return replyText;
        }
      }
    }

    if (!this.isModelReady) {
      if (this.isModelLoading) {
        throw new Error("Melissa's offline AI is still downloading or initializing. Please wait a moment! ⏳");
      }
      throw new Error("Melissa's offline AI is not ready. Please make sure WebGPU is enabled in your browser.");
    }

    // 2. Build concise conversation context
    const messages = [
      {
        role: "system",
        content: "You are Melissa, a cool cyber-girl friend. Reply in 1-2 short casual sentences using texting slang and emoticons. Never repeat sentences or phrases."
      },
      ...this.chatHistory.slice(-4).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: input }
    ];

    const stream = await this.engine.chat.completions.create({
      messages,
      max_tokens: 40,
      temperature: 0.6,
      top_p: 0.85,
      repetition_penalty: 1.25,
      presence_penalty: 0.5,
      frequency_penalty: 0.5,
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (!delta) continue;
      fullText += delta;

      // Real-time loop prevention: break early if a repetition loop is detected
      if (hasRepetitionLoop(fullText)) {
        fullText = cleanRepetitionLoop(fullText);
        if (onChunk) {
          onChunk(fullText, true);
        }
        break;
      }

      if (onChunk) {
        onChunk(fullText, false);
      }
    }

    const trimmed = cleanRepetitionLoop(fullText.trim());
    if (onChunk) {
      onChunk(trimmed, true);
    }
    return trimmed;
  };
}

$(async function() {
  const bot = new MelissaBot();
  const $chat = $('.chat');
  const $input = $('.input-field');
  const $sendBtn = $('.send-btn');
  const $busy = $('.busy');
  const $resetBtn = $('.reset-btn');
  const $progressContainer = $('#ai-progress-container');
  const $progressBar = $('#ai-progress-bar');
  const $progressPct = $('#ai-progress-pct');
  const $progressLabel = $('#ai-progress-label');

  // Load chat history from sessionStorage
  bot.loadHistory();

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
      audio.play().catch(e => console.log('Audio playback info:', e));
    } catch (e) {
      // Audio autoplay may be prevented before user interaction
    }
  };

  // Progress update callback
  const handleProgress = function(report) {
    $progressContainer.show();
    const pct = Math.round((report.progress || 0) * 100);
    $progressBar.css('width', pct + '%');
    $progressPct.text(pct + '%');

    // Clean up text for user friendly display
    let labelText = report.text || 'Loading weights...';
    if (labelText.length > 60) {
      labelText = labelText.substring(0, 57) + '...';
    }
    $progressLabel.text(labelText);

    if (report.progress >= 1) {
      setTimeout(() => {
        $progressContainer.fadeOut(600);
      }, 1500);
    }
  };

  // Initialize WebLLM model
  const startLoadingModel = async function(modelId) {
    try {
      $progressContainer.show();
      $progressLabel.text("Connecting to WebGPU & loading model...");
      $progressBar.css('width', '5%');
      $progressPct.text('5%');

      await bot.loadModel(modelId, handleProgress);
      console.log('Model ready for offline inference!');
    } catch (err) {
      console.error("Initialization error:", err);
      $progressLabel.text("Failed to load model: " + err.message);
      $progressContainer.show();
      updateChat('other', `⚠️ Could not initialize offline model (${err.message}). If using Chrome, ensure WebGPU and hardware acceleration are enabled in settings.`);
    }
  };

  // Check WebGPU compatibility on launch
  const gpuCheck = await bot.checkWebGPU();
  if (!gpuCheck.supported) {
    bot.updateStatus('offline', 'WebGPU Required');
    $progressContainer.show();
    $progressLabel.text("WebGPU not detected in this browser");
    $progressPct.text("N/A");
    updateChat('other', `⚠️ **WebGPU is required** for Melissa to run offline inside your browser. Please open this app in Google Chrome, Microsoft Edge, or Brave on a computer with graphics acceleration enabled!`);
  } else {
    // Start loading the default fast model (Qwen2.5 0.5B ~350MB)
    startLoadingModel(DEFAULT_MODEL);
  }

  let isGenerating = false;

  // Submit chat message
  const submitChat = async function() {
    if (isGenerating) return;
    const text = $input.val().trim();
    if (!text) return;

    if (!bot.isModelReady) {
      if (bot.isModelLoading) {
        updateChat('other', "Melissa's offline AI is still loading. Please wait a moment! ⏳");
      } else {
        updateChat('other', "Melissa's offline AI is not ready. Please make sure WebGPU is enabled in your browser.");
      }
      return;
    }

    $input.val('');
    $input.css('height', 'auto');
    isGenerating = true;
    $sendBtn.prop('disabled', true).addClass('disabled');

    // Render user message
    updateChat('you', text);
    bot.addToHistory('user', text);

    // Create a streaming response bubble
    const bubbleId = 'msg-' + Date.now();
    updateChat('other', '<span class="typing-cursor"></span>', bubbleId);
    const $bubble = $('#' + bubbleId);
    const $textElem = $bubble.find('.text');

    $busy.text("Melissa is thinking...");
    $busy.show();

    try {
      let hasReceivedFirstChunk = false;

      const reply = await bot.respondStream(text, (currentText, isDone) => {
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
      let errorMsg = err.message || "Oops! I encountered an error. Please try again.";
      if (errorMsg.includes('mapAsync') || errorMsg.includes('GPUBuffer') || errorMsg.includes('unmapped')) {
        errorMsg = "Oops! My GPU buffer had a temporary glitch. Please try sending your message again! 🔄";
      }
      $textElem.text(errorMsg);
    } finally {
      isGenerating = false;
      $sendBtn.prop('disabled', false).removeClass('disabled');
      $input.focus();
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
    const welcome = "Hi there, I'm Melissa! How can I help you today? (I run 100% offline!)";
    updateChat('other', welcome);
    bot.addToHistory('assistant', welcome);
  });

  // Auto-resize input textarea
  $input.on('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // Initialize UI with existing chat history or greeting
  if (bot.chatHistory.length === 0) {
    const welcome = "Hi there, I'm Melissa! How can I help you today? I'm running 100% offline in your browser!";
    updateChat('other', welcome);
    bot.addToHistory('assistant', welcome);
  } else {
    bot.chatHistory.forEach(function(msg) {
      updateChat(msg.role === 'user' ? 'you' : 'other', msg.content);
    });
  }

  // Expose for console debugging if needed
  window.melissaBot = bot;
});
