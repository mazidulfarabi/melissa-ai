// OpenRouter AI API endpoint - replace with your actual API endpoint
const API_ENDPOINT = '/api/chat'; // This will be handled by Netlify Functions

// Chat history management
const CHAT_HISTORY_KEY = 'green_companion_chat_history';
const MAX_HISTORY_LENGTH = 50; // Maximum number of messages to store

// Rate limit management
const RATE_LIMIT_KEY = 'green_companion_rate_limit';
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
      
      // Log request details for debugging
      console.log('Making API request with body size:', JSON.stringify(requestBody).length, 'characters');

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        console.error('API Response not OK:', response.status, response.statusText);
      }

      // Get response text first to handle potential JSON parsing errors
      const responseText = await response.text();
      console.log('API Response Text (first 200 chars):', responseText.substring(0, 200));
      
      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Empty response from server');
        throw new Error(`সার্ভার থেকে খালি উত্তর পেয়েছি। সার্ভার সমস্যা হতে পারে। (Status: ${response.status})`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('API Response Data:', data);
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);
        console.error('Response text that failed to parse:', responseText);
        
        // Check if it's an HTML error page (common with server errors)
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          throw new Error(`সার্ভার একটি HTML পেজ ফেরত দিয়েছে। সার্ভার সমস্যা হতে পারে। (Status: ${response.status})`);
        }
        
        throw new Error(`সার্ভার থেকে অপ্রত্যাশিত উত্তর পেয়েছি। সার্ভার সমস্যা হতে পারে। (Status: ${response.status})`);
      }
      
      if (!response.ok) {
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: API_ENDPOINT
        });
        
        // Check if it's a rate limit error
        if (response.status === 429 || 
            (data.response && data.response.includes("আমি খুব ক্লান্ত"))) {
          this.setRateLimit(data.resetTime); // Pass resetTime from API
          throw new Error(data.response || "আমি আজ রাতে খুব ক্লান্ত, আগামীকাল কথা হবে 😴");
        }
        
        // Provide more specific error messages based on status code
        let errorMessage = data.response;
        if (!errorMessage) {
          switch (response.status) {
            case 500:
              errorMessage = "সার্ভারে সমস্যা হচ্ছে। দয়া করে একটু পরে আবার চেষ্টা করুন।";
              break;
            case 503:
              errorMessage = "সেবা অস্থায়ীভাবে বন্ধ। একটু পরে আবার চেষ্টা করুন।";
              break;
            case 400:
              errorMessage = "অনুরোধে সমস্যা। দয়া করে আবার চেষ্টা করুন।";
              break;
            case 401:
              errorMessage = "API কী সমস্যা। সেটিংস চেক করুন।";
              break;
            default:
              errorMessage = `সংযোগ সমস্যা (${response.status})। একটু পরে আবার চেষ্টা করুন।`;
          }
        }
        
        throw new Error(errorMessage);
      }

      return data.response || "দুঃখিত, আমি বুঝতে পারিনি।";
    } catch (error) {
      console.error('API Call Error Details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        type: typeof error,
        endpoint: API_ENDPOINT,
        timestamp: new Date().toISOString()
      });
      
      // If it's our custom error message, throw it as is
      if (error.message && (error.message.includes("আমি খুব ক্লান্ত") || 
                           error.message.includes("সংযোগ করতে সমস্যা") ||
                           error.message.includes("সার্ভারে সমস্যা") ||
                           error.message.includes("সেবা অস্থায়ীভাবে") ||
                           error.message.includes("অনুরোধে সমস্যা") ||
                           error.message.includes("API কী সমস্যা"))) {
        throw error;
      }
      
      // Provide specific error messages based on error type
      let errorMessage;
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "নেটওয়ার্ক সংযোগ সমস্যা। ইন্টারনেট চেক করুন।";
      } else if (error.name === 'AbortError') {
        errorMessage = "অনুরোধ সময় শেষ (৬০ সেকেন্ড)। সার্ভার ধীরে উত্তর দিচ্ছে। আবার চেষ্টা করুন।";
      } else if (error.message.includes('JSON')) {
        errorMessage = "সার্ভার থেকে উত্তর পেতে সমস্যা। আবার চেষ্টা করুন।";
      } else if (error.message.includes('সার্ভার থেকে অপ্রত্যাশিত উত্তর') || 
                 error.message.includes('সার্ভার থেকে খালি উত্তর') ||
                 error.message.includes('সার্ভার একটি HTML পেজ')) {
        errorMessage = error.message; // Use the specific error message we created
      } else {
        errorMessage = `সংযোগ সমস্যা: ${error.message}`;
      }
      
      throw new Error(errorMessage);
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
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 }
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
  
  // Convert canvas to blob with higher quality for better AI analysis
  canvas.toBlob(function(blob) {
    if (blob) {
      // Create a File object from the blob
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      selectedImage = file;
      showImagePreview(file);
      closeCameraModal();
    }
  }, 'image/jpeg', 0.95); // Increased quality from 0.8 to 0.95 for better AI analysis
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
  // Show loading screen for 2 seconds at 2x speed
  function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingGif = document.querySelector('.loading-gif');
    
    console.log('Loading screen element:', loadingScreen);
    console.log('Loading gif element:', loadingGif);
    
    // Ensure loading screen is visible
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
      loadingScreen.style.display = 'flex';
      loadingScreen.style.opacity = '1';
      loadingScreen.style.visibility = 'visible';
    }
    
    // Let the GIF animate naturally without adding rotation
    if (loadingGif) {
      // Remove any CSS rotation animations
      loadingGif.style.animation = 'none';
      console.log('GIF set to animate naturally');
    }
    
    // Hide loading screen after 2 seconds
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        
        // Remove loading screen from DOM after transition completes
        setTimeout(() => {
          if (loadingScreen.parentNode) {
            loadingScreen.parentNode.removeChild(loadingScreen);
          }
        }, 500); // Wait for CSS transition to complete
      }
    }, 2000);
  }
  
  // Show loading screen on page load or refresh
  // Add a small delay to ensure DOM is fully loaded
  setTimeout(() => {
    showLoadingScreen();
  }, 100);
  
  // Handle page refresh - show loading screen again
  window.addEventListener('beforeunload', function() {
    // This ensures loading screen shows on refresh
    sessionStorage.setItem('pageRefreshed', 'true');
  });
  
  // Check if page was refreshed and show loading screen
  if (sessionStorage.getItem('pageRefreshed')) {
    sessionStorage.removeItem('pageRefreshed');
    setTimeout(() => {
      showLoadingScreen();
    }, 100);
  }
  
  // Fix mobile viewport height for Chrome's dynamic URL bar
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  // Set initial viewport height
  setViewportHeight();
  
  // Update viewport height on resize and orientation change
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', function() {
    setTimeout(setViewportHeight, 100); // Small delay for orientation change
  });

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
  $(document).on('greenCompanionBackOnline', function() {
    updateChat('other', "সুপ্রভাত! আমি সবুজ সাথী আবার অনলাইনে এসেছি এবং আপনার গাছের যত্নে সাহায্য করতে প্রস্তুত! 😊");
    bot.addToHistory('assistant', "সুপ্রভাত! আমি সবুজ সাথী আবার অনলাইনে এসেছি এবং আপনার গাছের যত্নে সাহায্য করতে প্রস্তুত! 😊");
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
            '<div class="user-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg></div>' : 
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
        console.log('Converting image to base64...', {
          fileName: selectedImage.name,
          fileSize: selectedImage.size,
          fileType: selectedImage.type
        });
        imageData = await convertImageToBase64(selectedImage);
        imageUrl = imageData; // For display in chat
        console.log('Image converted successfully, base64 length:', imageData.length);
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
    busy.text("সবুজ সাথী টাইপ করছে...");
    busy.show();
    
    try {
      // Get bot response
      console.log('Sending request to API...', {
        hasImage: !!imageData,
        imageSize: imageData ? imageData.length : 0,
        message: inputText || 'এই গাছের ছবি বিশ্লেষণ করুন এবং যত্নের পরামর্শ দিন',
        endpoint: API_ENDPOINT,
        timestamp: new Date().toISOString()
      });
      
      // Use different message for scanned vs uploaded images
      var analysisMessage = inputText || (selectedImage && selectedImage.name === 'camera-capture.jpg' 
        ? 'এই স্ক্যান করা গাছের ছবি বিশ্লেষণ করুন। গাছের রোগ, পাতার সমস্যা, এবং যত্নের পরামর্শ দিন।' 
        : 'এই গাছের ছবি বিশ্লেষণ করুন এবং যত্নের পরামর্শ দিন');
      
      var reply = await bot.respondTo(analysisMessage, imageData);
      
      // Hide typing indicator
      busy.hide();
      
      console.log('API response received:', {
        responseLength: reply.length,
        responsePreview: reply.substring(0, 100) + '...'
      });
      
      // Update UI with bot response
      updateChat('other', reply);
      bot.addToHistory('assistant', reply);
      
      // Play notification sound
      playNotificationSound();
      
    } catch (error) {
      console.error('Error in submitChat:', error);
      busy.hide();
      
      // Enhanced error logging for debugging
      console.error('Detailed error info:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        hasImage: !!imageData,
        imageSize: imageData ? imageData.length : 0
      });
      
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
    updateChat('other', "হ্যালো! আমি সবুজ সাথী, আপনার গাছের যত্নের জন্য AI সহায়ক। আপনার গাছের ছবি আপলোড করুন, ক্যামেরা দিয়ে তুলুন, পাতা স্ক্যান করুন অথবা গাছের যত্ন সম্পর্কে প্রশ্ন করুন।");
    bot.addToHistory('assistant', "হ্যালো! আমি সবুজ সাথী, আপনার গাছের যত্নের জন্য AI সহায়ক। আপনার গাছের ছবি আপলোড করুন, ক্যামেরা দিয়ে তুলুন, পাতা স্ক্যান করুন অথবা গাছের যত্ন সম্পর্কে প্রশ্ন করুন।");
  });

  // Auto-resize textarea
  input.on('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // Initialize chat
  if (bot.chatHistory.length === 0) {
    updateChat('other', "হ্যালো! আমি সবুজ সাথী, আপনার গাছের যত্নের জন্য AI সহায়ক। আপনার গাছের ছবি আপলোড করুন, ক্যামেরা দিয়ে তুলুন, পাতা স্ক্যান করুন অথবা গাছের যত্ন সম্পর্কে প্রশ্ন করুন।");
    bot.addToHistory('assistant', "হ্যালো! আমি সবুজ সাথী, আপনার গাছের যত্নের জন্য AI সহায়ক। আপনার গাছের ছবি আপলোড করুন, ক্যামেরা দিয়ে তুলুন, পাতা স্ক্যান করুন অথবা গাছের যত্ন সম্পর্কে প্রশ্ন করুন।");
  } else {
    // Restore chat history to UI
    bot.chatHistory.forEach(function(msg) {
      updateChat(msg.role === 'user' ? 'you' : 'other', msg.content);
    });
  }

  // Global function for debugging - users can call this from console
  window.resetGreenCompanionRateLimit = function() {
    console.log('Force resetting Green Companion AI rate limit...');
    bot.forceResetRateLimit();
    console.log('Rate limit reset complete. You can now test with new API keys.');
  };
});