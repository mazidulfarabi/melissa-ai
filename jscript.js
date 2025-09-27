// OpenRouter AI API endpoint - replace with your actual API endpoint
const API_ENDPOINT = '/api/chat'; // This will be handled by Netlify Functions

// Chat history management
const CHAT_HISTORY_KEY = 'plant_disease_chat_history';
const MAX_HISTORY_LENGTH = 50; // Maximum number of messages to store

// Rate limit management
const RATE_LIMIT_KEY = 'plant_disease_rate_limit';
let isRateLimited = false;
let rateLimitTimer = null;

// Image management
let selectedImage = null;

// Camera management
let currentStream = null;
let currentCameraIndex = 0;
let availableCameras = [];
let isScanMode = false;

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

  // Force reset rate limit (for when API keys are changed)
  this.forceResetRateLimit = function() {
    console.log('Force resetting rate limit status...');
    this.resetRateLimit();
    // Also clear any stored reset time
    sessionStorage.removeItem('melissa_reset_time');
    console.log('Rate limit status cleared. Ready for new API keys.');
  };

  // Rate limit management
  this.setRateLimit = function(resetTime = null) {
    isRateLimited = true;
    sessionStorage.setItem(RATE_LIMIT_KEY, 'true');
    
    // Store the reset time if provided
    if (resetTime) {
      sessionStorage.setItem('melissa_reset_time', resetTime);
    }
    
    this.updateStatus('offline');
    this.showRateLimitAlert(resetTime);
    this.disableInput();
    this.scheduleAutoReset(resetTime);
  };

  this.resetRateLimit = function() {
    isRateLimited = false;
    sessionStorage.removeItem(RATE_LIMIT_KEY);
    sessionStorage.removeItem('melissa_reset_time');
    this.updateStatus('online');
    this.hideRateLimitAlert();
    this.enableInput();
    if (rateLimitTimer) {
      clearInterval(rateLimitTimer);
      rateLimitTimer = null;
    }
  };

  this.scheduleAutoReset = function(resetTime = null) {
    let resetDate;
    
    if (resetTime) {
      // Use the actual reset time from API
      resetDate = new Date(resetTime);
    } else {
      // Fallback to 24 hours from now
      resetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    
    const timeUntilReset = resetDate.getTime() - Date.now();
    
    // Only schedule if the reset time is in the future
    if (timeUntilReset > 0) {
      setTimeout(() => {
        this.resetRateLimit();
        // Trigger a custom event that the main script can listen to
        $(document).trigger('melissaBackOnline');
      }, timeUntilReset);
    }
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

  this.showRateLimitAlert = function(resetTime = null) {
    // Remove existing alert if any
    $('.rate-limit-alert').remove();
    
    let resetTimeString, resetDateString;

    if (resetTime) {
      const now = new Date();
      const resetDate = new Date(resetTime);
      const timeDiff = resetDate.getTime() - now.getTime();

      if (timeDiff < 0) {
        resetTimeString = 'now';
        resetDateString = '';
      } else {
        resetTimeString = resetDate.toLocaleTimeString('en-US', {
          hour12: true,
          hour: 'numeric',
          minute: '2-digit'
        });
        resetDateString = resetDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    } else {
      // Fallback to 24 hours from now
      const now = new Date();
      const resetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      resetTimeString = resetDate.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit'
      });
      resetDateString = resetDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    
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
  
  this.respondTo = async function (input, imageData = null) {
    try {
      const requestBody = { 
        message: input, 
        history: this.chatHistory 
      };
      
      // Add image data if available
      if (imageData) {
        requestBody.image = imageData;
      }

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Check if it's a rate limit error
        if (response.status === 429 || 
            (data.response && data.response.includes("আমি খুব ক্লান্ত"))) {
          this.setRateLimit(data.resetTime); // Pass resetTime from API
          throw new Error(data.response || "আমি আজ রাতে খুব ক্লান্ত, আগামীকাল কথা হবে 😴");
        }
        // Return the actual error message from the backend
        throw new Error(data.response || "এখনই সংযোগ করতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।");
      }

      return data.response || "দুঃখিত, আমি বুঝতে পারিনি।";
    } catch (error) {
      console.error('Error calling API:', error);
      // If it's our custom error message, throw it as is
      if (error.message && (error.message.includes("আমি খুব ক্লান্ত") || 
                           error.message.includes("সংযোগ করতে সমস্যা"))) {
        throw error;
      }
      // Otherwise throw a generic error
      throw new Error("এখনই সংযোগ করতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।");
    }
  };

  this.match = function (regex) {
    return new RegExp(regex).test(this.input);
  };
}

// Image processing functions
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      resolve(e.target.result);
    };
    reader.onerror = function(error) {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

function showImagePreview(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    $('#preview-img').attr('src', e.target.result);
    $('#image-preview').show();
  };
  reader.readAsDataURL(file);
}

function hideImagePreview() {
  $('#image-preview').hide();
  $('#preview-img').attr('src', '');
  selectedImage = null;
}

// Camera functions
async function getAvailableCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error getting cameras:', error);
    return [];
  }
}

async function startCamera(cameraIndex = 0) {
  try {
    // Stop existing stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: cameraIndex === 0 ? 'environment' : 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById('camera-preview');
    video.srcObject = currentStream;
    
    return true;
  } catch (error) {
    console.error('Error starting camera:', error);
    alert('ক্যামেরা অ্যাক্সেস করতে সমস্যা হয়েছে। দয়া করে ক্যামেরা অনুমতি দিন।');
    return false;
  }
}

function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
}

function capturePhoto() {
  const video = document.getElementById('camera-preview');
  const canvas = document.getElementById('camera-canvas');
  const context = canvas.getContext('2d');
  
  // Set canvas dimensions to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw video frame to canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Convert canvas to blob
  canvas.toBlob(function(blob) {
    if (blob) {
      // Create a File object from the blob
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      selectedImage = file;
      showImagePreview(file);
      closeCameraModal();
    }
  }, 'image/jpeg', 0.8);
}

function switchCamera() {
  currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
  startCamera(currentCameraIndex);
}

function openCameraModal(mode = 'camera') {
  isScanMode = mode === 'scan';
  const modal = document.getElementById('camera-modal');
  const title = document.getElementById('camera-title');
  const overlayGrid = document.getElementById('camera-overlay-grid');
  
  if (isScanMode) {
    title.textContent = 'গাছ/পাতা স্ক্যান করুন';
    overlayGrid.classList.add('scan-mode');
  } else {
    title.textContent = 'ক্যামেরা';
    overlayGrid.classList.remove('scan-mode');
  }
  
  modal.style.display = 'flex';
  
  // Get available cameras and start camera
  getAvailableCameras().then(cameras => {
    availableCameras = cameras;
    if (cameras.length > 1) {
      document.getElementById('switch-camera-btn').style.display = 'flex';
    }
    startCamera();
  });
}

function closeCameraModal() {
  const modal = document.getElementById('camera-modal');
  modal.style.display = 'none';
  stopCamera();
  isScanMode = false;
  document.getElementById('camera-overlay-grid').classList.remove('scan-mode');
}

$(function () {
  var bot = new chatBot();
  var chat = $('.chat');
  var input = $('.input-field');
  var sendBtn = $('.send-btn');
  var imageBtn = $('.image-btn');
  var imageUpload = $('#image-upload');
  var imagePreview = $('#image-preview');
  var removeImageBtn = $('.remove-image-btn');
  var busy = $('.busy');
  var resetBtn = $('.reset-btn');
  
  // Load chat history
  bot.loadHistory();
  
  // Check rate limit status on page load
  bot.checkRateLimit();

  // Listen for AI coming back online
  $(document).on('plantDiseaseBackOnline', function() {
    updateChat('other', "সুপ্রভাত! আমি আবার অনলাইনে এসেছি এবং গাছের রোগ নির্ণয়ে সাহায্য করতে প্রস্তুত! 😊");
    bot.addToHistory('assistant', "সুপ্রভাত! আমি আবার অনলাইনে এসেছি এবং গাছের রোগ নির্ণয়ে সাহায্য করতে প্রস্তুত! 😊");
  });

  // Image upload handlers
  imageBtn.on('click', function() {
    imageUpload.click();
  });

  imageUpload.on('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        selectedImage = file;
        showImagePreview(file);
      } else {
        alert('দয়া করে একটি বৈধ ছবি ফাইল নির্বাচন করুন।');
      }
    }
  });

  removeImageBtn.on('click', function() {
    hideImagePreview();
    imageUpload.val('');
  });

  // Camera button handlers
  $('.camera-btn').on('click', function() {
    openCameraModal('camera');
  });

  $('.scan-btn').on('click', function() {
    openCameraModal('scan');
  });

  // Camera modal handlers
  $('#capture-btn').on('click', function() {
    capturePhoto();
  });

  $('#switch-camera-btn').on('click', function() {
    switchCamera();
  });

  $('.close-camera-btn').on('click', function() {
    closeCameraModal();
  });

  // Close camera modal when clicking outside
  $('.camera-overlay').on('click', function(e) {
    if (e.target === this) {
      closeCameraModal();
    }
  });

  var updateChat = function(party, message, imageUrl = null) {
    var time = new Date().toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: "numeric", 
      minute: "numeric" 
    });
    
    var imageHtml = imageUrl ? `<div class="chat-image"><img src="${imageUrl}" alt="Uploaded image"></div>` : '';
    
    var messageHtml = `
      <div class="message-container ${party}">
        <div class="message-avatar">
          ${party === 'you' ? 
            '<div class="user-avatar">আ</div>' : 
            '<img src="logo.jpg" alt="AI" class="ai-avatar">'
          }
        </div>
        <div class="message-content">
          <div class="message-bubble">
            ${imageHtml}
            <div class="message-text">${message}</div>
            <div class="message-time">${time}</div>
          </div>
        </div>
      </div>
    `;
    
    chat.append(messageHtml);
    chat.scrollTop(chat[0].scrollHeight);
  };

  var submitChat = async function () {
    var inputText = input.val().trim();
    if (!inputText && !selectedImage) return;

    // Check if rate limited
    if (isRateLimited) {
      return; // Don't send message if rate limited
    }

    // Prepare image data if available
    var imageData = null;
    var imageUrl = null;
    if (selectedImage) {
      try {
        imageData = await convertImageToBase64(selectedImage);
        imageUrl = imageData; // For display in chat
      } catch (error) {
        console.error('Error converting image:', error);
        alert('ছবি প্রক্রিয়াকরণে সমস্যা হয়েছে।');
        return;
      }
    }

    // Clear input and image
    input.val('');
    hideImagePreview();
    
    // Update UI with user message
    updateChat('you', inputText || 'ছবি আপলোড করা হয়েছে', imageUrl);
    bot.addToHistory('user', inputText || 'ছবি আপলোড করা হয়েছে');
    
    // Show typing indicator
    busy.text("গাছের রোগ নির্ণয় AI টাইপ করছে...");
    busy.show();
    
    try {
      // Get bot response
      var reply = await bot.respondTo(inputText || 'এই গাছের ছবি বিশ্লেষণ করুন', imageData);
      
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
      if (error.message && error.message.includes("আমি খুব ক্লান্ত")) {
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
      audio.volume = 1; // Set volume to 100%
      
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
    hideImagePreview();
    // Force reset rate limit status (for when API keys are changed)
    bot.forceResetRateLimit();
    updateChat('other', "হ্যালো! আমি গাছের রোগ নির্ণয় AI। আপনার গাছের ছবি আপলোড করুন, ক্যামেরা দিয়ে তুলুন, পাতা স্ক্যান করুন অথবা প্রশ্ন করুন।");
    bot.addToHistory('assistant', "হ্যালো! আমি গাছের রোগ নির্ণয় AI। আপনার গাছের ছবি আপলোড করুন, ক্যামেরা দিয়ে তুলুন, পাতা স্ক্যান করুন অথবা প্রশ্ন করুন।");
  });

  // Auto-resize textarea
  input.on('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // Initialize chat
  if (bot.chatHistory.length === 0) {
    updateChat('other', "হ্যালো! আমি গাছের রোগ নির্ণয় AI। আপনার গাছের ছবি আপলোড করুন, ক্যামেরা দিয়ে তুলুন, পাতা স্ক্যান করুন অথবা প্রশ্ন করুন।");
    bot.addToHistory('assistant', "হ্যালো! আমি গাছের রোগ নির্ণয় AI। আপনার গাছের ছবি আপলোড করুন, ক্যামেরা দিয়ে তুলুন, পাতা স্ক্যান করুন অথবা প্রশ্ন করুন।");
  } else {
    // Restore chat history to UI
    bot.chatHistory.forEach(function(msg) {
      updateChat(msg.role === 'user' ? 'you' : 'other', msg.content);
    });
  }

  // Global function for debugging - users can call this from console
  window.resetPlantDiseaseRateLimit = function() {
    console.log('Force resetting Plant Disease AI rate limit...');
    bot.forceResetRateLimit();
    console.log('Rate limit reset complete. You can now test with new API keys.');
  };
});