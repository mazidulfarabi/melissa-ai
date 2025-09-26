const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  // Health check endpoint
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        hasPrimaryApiKey: !!process.env.OPENROUTER_API_KEY,
        hasBackupApiKey: !!process.env.OPENROUTER_API_KEY_BACKUP,
        primaryApiKeyLength: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0,
        backupApiKeyLength: process.env.OPENROUTER_API_KEY_BACKUP ? process.env.OPENROUTER_API_KEY_BACKUP.length : 0,
        primaryApiKeyPrefix: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 10) + '...' : 'none',
        backupApiKeyPrefix: process.env.OPENROUTER_API_KEY_BACKUP ? process.env.OPENROUTER_API_KEY_BACKUP.substring(0, 10) + '...' : 'none',
        environment: process.env.NODE_ENV || 'development'
      })
    };
  }

  try {
    // Check if at least one API key is available
    if (!process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY_BACKUP) {
      console.error('Missing both OPENROUTER_API_KEY and OPENROUTER_API_KEY_BACKUP environment variables');
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: "Configuration error",
          response: "আমি এখন সঠিকভাবে কনফিগার করা নেই। দয়া করে সাপোর্টে যোগাযোগ করুন।"
        })
      };
    }

    // Validate API key formats
    const primaryKeyValid = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-');
    const backupKeyValid = process.env.OPENROUTER_API_KEY_BACKUP && process.env.OPENROUTER_API_KEY_BACKUP.startsWith('sk-');
    
    if (!primaryKeyValid && !backupKeyValid) {
      console.error('Invalid API key format - both keys should start with sk-');
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: "Invalid API key format",
          response: "আমার API কীগুলি সঠিকভাবে কনফিগার করা নেই। দয়া করে সেটআপ চেক করুন।"
        })
      };
    }

    const { message, history, image } = JSON.parse(event.body || '{}');

    if (!message && !image) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Message or image is required" })
      };
    }

    console.log('Starting API request...');
    console.log('Primary API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('Backup API Key present:', !!process.env.OPENROUTER_API_KEY_BACKUP);
    console.log('User message:', message);
    console.log('Chat history length:', history ? history.length : 0);

    // Optimized local response system for common greetings and simple questions so resources are not wasted
    const localResponses = {
      // Greetings
      'hello': [
        "হ্যালো! 😊 কেমন আছেন?",
        "হাই! দেখে ভালো লাগছে! 👋",
        "হ্যালো! আজ কেমন কাটছে? 😄"
      ],
      'hi': [
        "হাই! কি অবস্থা? 😊",
        "হ্যালো! দিন কেমন যাচ্ছে? 👋",
        "হাই! কথা বলে ভালো লাগছে! 😄"
      ],
      'hey': [
        "হাই! কেমন আছেন? 😊",
        "হ্যালো! কি খবর? 👋",
        "হাই! দেখে ভালো লাগছে! 😄"
      ],
      'good morning': [
        "সুপ্রভাত! আশা করি দিনের শুরুটা ভালো যাচ্ছে! ☀️",
        "সকাল! এখন পর্যন্ত কেমন যাচ্ছে? 🌅",
        "সুপ্রভাত! কথা বলতে প্রস্তুত? 😊"
      ],
      'good afternoon': [
        "শুভ বিকাল! আশা করি দিনটা ভালো যাচ্ছে! 🌞",
        "বিকাল! সব কেমন? 😊",
        "শুভ বিকাল! দেখে ভালো লাগছে! 👋"
      ],
      'good evening': [
        "শুভ সন্ধ্যা! দিনটা কেমন ছিল? 🌙",
        "সন্ধ্যা! আশা করি ভালো দিন কাটিয়েছেন! 😊",
        "শুভ সন্ধ্যা! কথা বলতে প্রস্তুত? 👋"
      ],
      'good night': [
        "শুভ রাত্রি! মিষ্টি স্বপ্ন! 😴",
        "রাত! ভালো ঘুম! 🌙",
        "শুভ রাত্রি! আগামীকাল দেখা হবে! 😊"
      ],
      
      // How are you variations
      'how are you': [
        "আমি খুব ভালো! জিজ্ঞেস করার জন্য ধন্যবাদ! আপনি কেমন? 😊",
        "আমি দারুণ! আপনি কেমন আছেন? 😄",
        "আমি ভালো আছি! আপনার দিন কেমন যাচ্ছে? 😊"
      ],
      'how r u': [
        "আমি ভালো! আপনি কেমন? 😊",
        "আমি দারুণ! আপনি কেমন আছেন? 😄",
        "আমি ভালো আছি! কেমন যাচ্ছে? 😊"
      ],
      'how are u': [
        "আমি ভালো! আপনি কেমন? 😊",
        "আমি দারুণ! আপনি কেমন আছেন? 😄",
        "আমি ভালো আছি! কেমন যাচ্ছে? 😊"
      ],
      
      // Name questions
      'what is your name': [
        "আমি গাছের রোগ নির্ণয় AI! দেখা করে ভালো লাগছে! 😊",
        "আমার নাম গাছের রোগ নির্ণয় AI! আপনার নাম কি? 👋",
        "আমি গাছের রোগ নির্ণয় AI! আপনার নাম কি? 😄"
      ],
      'whats your name': [
        "আমি গাছের রোগ নির্ণয় AI! দেখা করে ভালো লাগছে! 😊",
        "আমার নাম গাছের রোগ নির্ণয় AI! আপনার নাম কি? 👋",
        "আমি গাছের রোগ নির্ণয় AI! আপনার নাম কি? 😄"
      ],
      'what\'s your name': [
        "আমি গাছের রোগ নির্ণয় AI! দেখা করে ভালো লাগছে! 😊",
        "আমার নাম গাছের রোগ নির্ণয় AI! আপনার নাম কি? 👋",
        "আমি গাছের রোগ নির্ণয় AI! আপনার নাম কি? 😄"
      ],
      'who are you': [
        "আমি গাছের রোগ নির্ণয় AI, আপনার সহায়ক! 😊",
        "আমি গাছের রোগ নির্ণয় AI! দেখা করে ভালো লাগছে! 👋",
        "আমি গাছের রোগ নির্ণয় AI, কথা বলতে প্রস্তুত! 😄"
      ],
      
      // Simple questions
      'what time is it': [
        `It's ${new Date().toLocaleTimeString('en-US', { hour12: true, hour: "numeric", minute: "numeric" })}! ⏰`,
        `The time is ${new Date().toLocaleTimeString('en-US', { hour12: true, hour: "numeric", minute: "numeric" })}! 🕐`,
        `Right now it's ${new Date().toLocaleTimeString('en-US', { hour12: true, hour: "numeric", minute: "numeric" })}! ⏰`
      ],
      'what day is it': [
        `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}! 📅`,
        `It's ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}! 📆`,
        `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}! 📅`
      ],
      
      // Weather (simple response)
      'how is the weather': [
        "I can't check the weather right now, but I hope it's nice where you are! 🌤️",
        "I don't have weather access, but I hope you're having good weather! ☀️",
        "I can't see the weather, but I hope it's beautiful outside! 🌈"
      ],
      'weather': [
        "I can't check the weather right now, but I hope it's nice where you are! 🌤️",
        "I don't have weather access, but I hope you're having good weather! ☀️",
        "I can't see the weather, but I hope it's beautiful outside! 🌈"
      ],
      'raining': [
        "Rainy days can be cozy! ☔ Perfect for staying in and chatting! 😊",
        "Rain is nature's way of watering the plants! 🌧️ Hope you're staying dry! ☂️",
        "Rainy weather is great for reading or watching movies! 📚☔ Stay cozy! 😊"
      ],
      'rain': [
        "Rainy days can be cozy! ☔ Perfect for staying in and chatting! 😊",
        "Rain is nature's way of watering the plants! 🌧️ Hope you're staying dry! ☂️",
        "Rainy weather is great for reading or watching movies! 📚☔ Stay cozy! 😊"
      ],
      'sunny': [
        "Sunny days are the best! ☀️ Perfect for going outside! 😊",
        "Beautiful sunny weather! 🌞 Hope you're enjoying it! 😄",
        "Sunshine makes everything better! ☀️ Have a great day! 😊"
      ],
      'cold': [
        "Brr! Cold weather calls for hot drinks and warm blankets! ☕🧣 Stay warm! 😊",
        "Cold days are perfect for staying cozy inside! 🏠 Hot chocolate time! ☕",
        "Bundle up and stay warm! 🧥 Winter vibes! ❄️😊"
      ],
      'hot': [
        "Hot weather! Stay hydrated and cool! 💧🌡️ Ice cream time! 🍦",
        "It's hot out there! Stay in the shade and drink lots of water! ☀️💧",
        "Hot days are perfect for swimming or staying in the AC! 🏊‍♀️❄️ Stay cool! 😊"
      ],
      
      // Goodbye
      'bye': [
        "Bye! It was nice chatting with you! 👋",
        "Goodbye! Hope to see you again soon! 😊",
        "Bye! Take care! 👋"
      ],
      'goodbye': [
        "Goodbye! It was great talking to you! 👋",
        "See you later! Have a great day! 😊",
        "Goodbye! Come back soon! 👋"
      ],
      'see you': [
        "See you! It was fun chatting! 👋",
        "See you later! Take care! 😊",
        "See you! Come back anytime! 👋"
      ],
      
      // Common responses
      'ok': [
        "Ok! 😊",
        "Alright! 👍",
        "Got it! 😄"
      ],
      'okay': [
        "Okay! 😊",
        "Alright! 👍",
        "Got it! 😄"
      ],
      'yes': [
        "Yes! 😊",
        "Yep! 👍",
        "Absolutely! 😄"
      ],
      'no': [
        "No worries! 😊",
        "That's ok! 👍",
        "No problem! 😄"
      ],
      'thanks': [
        "You're welcome! 😊",
        "No problem! 👍",
        "Anytime! 😄"
      ],
      'thank you': [
        "You're welcome! 😊",
        "No problem! 👍",
        "Anytime! 😄"
      ],
      'cool': [
        "Cool! 😎",
        "Awesome! 😊",
        "Nice! 👍"
      ],
      'nice': [
        "Nice! 😊",
        "Cool! 😎",
        "Awesome! 👍"
      ]
    };

    // Function to get a random response from an array
    const getRandomResponse = (responses) => {
      return responses[Math.floor(Math.random() * responses.length)];
    };

    // Function to handle long responses by splitting them appropriately
    const handleLongResponse = (response, maxLength = 600) => {
      if (response.length <= maxLength) {
        return response;
      }
      
      // Try to split at sentence boundaries
      const sentences = response.split(/[.!?]+/);
      let result = '';
      
      for (const sentence of sentences) {
        if ((result + sentence).length <= maxLength) {
          result += sentence + '.';
        } else {
          break;
        }
      }
      
      if (result.length < 100) {
        // If we couldn't get a meaningful response, just truncate at word boundary
        const words = response.split(' ');
        result = '';
        for (const word of words) {
          if ((result + word + ' ').length <= maxLength) {
            result += word + ' ';
          } else {
            break;
          }
        }
        result = result.trim() + '...';
      }
      
      return result + '\n\n(সম্পূর্ণ উত্তর পেতে "আরও বিস্তারিত বলুন" লিখুন)';
    };

    // Helper function to make API call with fallback
    const makeApiCallWithFallback = async (message, history) => {
      const apiKeys = [];
      
      // Add primary key if valid
      if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-')) {
        apiKeys.push({ key: process.env.OPENROUTER_API_KEY, name: 'primary' });
      }
      
      // Add backup key if valid
      if (process.env.OPENROUTER_API_KEY_BACKUP && process.env.OPENROUTER_API_KEY_BACKUP.startsWith('sk-')) {
        apiKeys.push({ key: process.env.OPENROUTER_API_KEY_BACKUP, name: 'backup' });
      }

      if (apiKeys.length === 0) {
        throw new Error('No valid API keys available');
      }

      let lastError = null;

      for (const { key, name } of apiKeys) {
        console.log(`Trying ${name} API key...`);
        
        // Try up to 2 times for each key with shorter timeouts to avoid function timeout
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const controller = new AbortController();
            // Increased timeouts for vision model: First attempt: 15 seconds, second attempt: 25 seconds
            // Vision models need more time to process images and generate detailed responses
            const timeout = attempt === 1 ? 15000 : 25000;
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            console.log(`${name} API attempt ${attempt} with ${timeout/1000}s timeout...`);

            // Prepare messages for vision model
            let messages = [
              { 
                role: "system", 
                content: "আপনি একজন গাছের রোগ বিশেষজ্ঞ। গাছের ছবি দেখে রোগ নির্ণয় করুন। রোগের নাম, লক্ষণ, কারণ এবং চিকিৎসা পদ্ধতি বলুন। সংক্ষেপে কিন্তু সম্পূর্ণ উত্তর দিন।" 
              },
              // Include recent chat history (last 6 messages to reduce token load further)
              ...(history && history.length > 0 ? history.slice(-6).map(msg => ({
                role: msg.role,
                content: msg.content
              })) : [])
            ];

            // Add user message with or without image
            if (image) {
              messages.push({
                role: "user",
                content: [
                  {
                    type: "text",
                    text: message || "এই গাছের ছবি বিশ্লেষণ করুন এবং রোগ নির্ণয় করুন"
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: image
                    }
                  }
                ]
              });
            } else {
              messages.push({
                role: "user",
                content: message
              });
            }

            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "meta-llama/llama-3.2-11b-vision-instruct",
                messages: messages,
                max_tokens: 800,
                temperature: 0.3
              }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log(`${name} API Response Status:`, res.status);

            if (!res.ok) {
              const errorText = await res.text();
              console.error(`${name} API Error:`, errorText);

              // Extract reset time from headers if available
              let resetTime = null;
              const resetHeader = res.headers.get('X-RateLimit-Reset');
              if (resetHeader) {
                try {
                  // Convert Unix timestamp to Date
                  resetTime = new Date(parseInt(resetHeader));
                  console.log(`${name} API Reset time from header:`, resetTime);
                } catch (e) {
                  console.log('Error parsing reset header:', e.message);
                }
              }

              // Check for rate limit errors
              const rawErrorText = errorText.toLowerCase();
              if (rawErrorText.includes('rate limit') || 
                  rawErrorText.includes('limit exceeded') || 
                  rawErrorText.includes('free-models-per-day') ||
                  rawErrorText.includes('429')) {
                console.log(`Rate limit detected for ${name} key, trying next key...`);
                lastError = { 
                  type: 'rate_limit', 
                  message: errorText, 
                  key: name,
                  resetTime: resetTime
                };
                break; // Try next key
              }

              // Check for timeout errors (408)
              if (res.status === 408 || rawErrorText.includes('timeout')) {
                console.log(`Timeout detected for ${name} key on attempt ${attempt}`);
                if (attempt < 2) {
                  console.log(`Retrying ${name} key with longer timeout...`);
                  continue; // Try again with longer timeout
                } else {
                  lastError = { 
                    type: 'timeout', 
                    message: 'Request timeout after retries', 
                    key: name 
                  };
                  break; // Try next key
                }
              }

              // Check for service unavailable (503) or other server errors
              if (res.status >= 500) {
                console.log(`Server error (${res.status}) detected for ${name} key`);
                lastError = { 
                  type: 'server_error', 
                  message: `Server error: ${res.status}`, 
                  key: name,
                  status: res.status
                };
                break; // Try next key
              }

              // Try to parse JSON error response
              try {
                const errorData = JSON.parse(errorText);
                if (errorData.error && errorData.error.message) {
                  const errorMessage = errorData.error.message.toLowerCase();
                  if (errorMessage.includes('free-models-per-day') || 
                      errorMessage.includes('rate limit') || 
                      errorMessage.includes('limit exceeded') ||
                      errorMessage.includes('429')) {
                    console.log(`Rate limit detected for ${name} key in parsed JSON, trying next key...`);
                    lastError = { 
                      type: 'rate_limit', 
                      message: errorText, 
                      key: name,
                      resetTime: resetTime
                    };
                    break; // Try next key
                  }
                  
                  if (errorMessage.includes('timeout') || res.status === 408) {
                    console.log(`Timeout detected for ${name} key in parsed JSON on attempt ${attempt}`);
                    if (attempt < 2) {
                      console.log(`Retrying ${name} key with longer timeout...`);
                      continue; // Try again with longer timeout
                    } else {
                      lastError = { 
                        type: 'timeout', 
                        message: 'Request timeout after retries', 
                        key: name 
                      };
                      break; // Try next key
                    }
                  }
                }
              } catch (parseError) {
                // Continue with original error message if parsing fails
              }

              // For other errors, try next key
              lastError = { 
                type: 'api_error', 
                message: errorText, 
                key: name,
                status: res.status
              };
              break; // Try next key
            }

            // Success! Parse the response
            const data = await res.json();
            console.log(`${name} API Success:`, JSON.stringify(data).substring(0, 200) + '...');

            // Success! Return the response
            let responseContent = data.choices[0].message.content || "";
            
            // Handle response length and truncation
            if (data.choices[0].finish_reason === 'length') {
              console.log('Response was truncated by model, adding completion note');
              responseContent = responseContent.trim();
              if (!responseContent.endsWith('.')) {
                responseContent += '.';
              }
              responseContent += '\n\n(উত্তরটি সম্পূর্ণ নয় - আরও বিস্তারিত জানতে আবার প্রশ্ন করুন)';
            } else {
              // Use our function to handle potentially long responses
              responseContent = handleLongResponse(responseContent);
            }
            
            // If response is very short and we have an image, suggest asking for more details
            if (image && responseContent.length < 100) {
              responseContent += '\n\nআরও বিস্তারিত বিশ্লেষণের জন্য "এই গাছের রোগের চিকিৎসা পদ্ধতি বলুন" বা "রোগের কারণ কী" এর মতো প্রশ্ন করুন।';
            }

            return { success: true, response: responseContent, key: name };

          } catch (error) {
            clearTimeout(timeoutId);
            console.error(`${name} API Error:`, error.message);
            
            // Check for timeout errors in the catch block
            if (error.name === 'AbortError') {
              console.log(`Timeout detected for ${name} key on attempt ${attempt}`);
              if (attempt < 2) {
                console.log(`Retrying ${name} key with longer timeout...`);
                continue; // Try again with longer timeout
              } else {
                lastError = { type: 'timeout', message: 'Request timeout after retries', key: name };
                break; // Try next key
              }
            }
            
            // Check for rate limit errors in the catch block
            let errorMessage = error.message.toLowerCase();
            
            try {
              if (error.message.includes('{') && error.message.includes('}')) {
                const parsedError = JSON.parse(error.message);
                if (parsedError.error && parsedError.error.message) {
                  errorMessage = parsedError.error.message.toLowerCase();
                }
              }
            } catch (parseError) {
              // Continue with original error message if parsing fails
            }
            
            if (errorMessage.includes('rate limit') || 
                errorMessage.includes('limit exceeded') || 
                errorMessage.includes('free-models-per-day') ||
                errorMessage.includes('429')) {
              console.log(`Rate limit detected for ${name} key in catch block, trying next key...`);
              lastError = { type: 'rate_limit', message: error.message, key: name };
              break; // Try next key
            }
            
            if (error.response && error.response.status === 429) {
              console.log(`Rate limit detected for ${name} key via response status, trying next key...`);
              lastError = { type: 'rate_limit', message: error.message, key: name };
              break; // Try next key
            }
            
            // Network errors might be rate limit related
            if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
              console.log(`Network error detected for ${name} key, might be rate limit related`);
              lastError = { type: 'rate_limit', message: error.message, key: name };
              break; // Try next key
            }
            
            lastError = { type: 'unknown', message: error.message, key: name };
            break; // Try next key
          }
        }
      }

      // If we get here, all keys failed
      throw lastError || new Error('All API keys failed');
    };

    // Check for local responses
    const normalizedMessage = message.toLowerCase().trim();
    
    console.log('Checking local responses for message:', normalizedMessage);
    console.log('Available local response keys:', Object.keys(localResponses));
    
    // Check exact matches first
    if (localResponses[normalizedMessage]) {
      console.log('Using local response for exact match:', normalizedMessage);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          response: getRandomResponse(localResponses[normalizedMessage])
        })
      };
    }
    
    // Check for partial matches (e.g., "hello there" should match "hello", "it's raining" should match "raining")
    for (const [key, responses] of Object.entries(localResponses)) {
      if (key.length > 2) { // Only match words longer than 2 chars
        // Check if the key appears as a whole word in the message
        const wordBoundaryRegex = new RegExp(`\\b${key}\\b`, 'i');
        if (wordBoundaryRegex.test(normalizedMessage)) {
          console.log('Using local response for word match:', key, 'in message:', normalizedMessage);
          return {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              response: getRandomResponse(responses)
            })
          };
        }
        
        // Also check for simple substring match as fallback
        if (normalizedMessage.includes(key)) {
          console.log('Using local response for substring match:', key, 'in message:', normalizedMessage);
          return {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              response: getRandomResponse(responses)
            })
          };
        }
      }
    }
    
    console.log('No local response found, proceeding to API call');

    // Test mode - return simple response without API call
    if (process.env.TEST_MODE === 'true') {
      console.log('Running in test mode - skipping API call');
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          response: `Test mode: I received your message "${message}". This is a test response without calling the API.`
        })
      };
    }

    // Debug mode - return detailed error information
    if (process.env.DEBUG_MODE === 'true') {
      console.log('Running in debug mode');
      try {
        const debugResults = [];
        
        // Test primary key if available
        if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-')) {
          try {
            const testRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct:free",
                messages: [
                  { role: "user", content: "Hi" }
                ],
                max_tokens: 20
              })
            });

            const errorText = await testRes.text();
            debugResults.push(`Primary Key: Status ${testRes.status}, Response: ${errorText.substring(0, 100)}`);
          } catch (error) {
            debugResults.push(`Primary Key: Error - ${error.message}`);
          }
        } else {
          debugResults.push('Primary Key: Not configured or invalid');
        }
        
        // Test backup key if available
        if (process.env.OPENROUTER_API_KEY_BACKUP && process.env.OPENROUTER_API_KEY_BACKUP.startsWith('sk-')) {
          try {
            const testRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY_BACKUP}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct:free",
                messages: [
                  { role: "user", content: "Hi" }
                ],
                max_tokens: 20
              })
            });

            const errorText = await testRes.text();
            debugResults.push(`Backup Key: Status ${testRes.status}, Response: ${errorText.substring(0, 100)}`);
          } catch (error) {
            debugResults.push(`Backup Key: Error - ${error.message}`);
          }
        } else {
          debugResults.push('Backup Key: Not configured or invalid');
        }
        
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            response: `DEBUG: ${debugResults.join(' | ')}`
          })
        };
      } catch (debugError) {
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            response: `DEBUG: Error: ${debugError.message}`
          })
        };
      }
    }

    // Make the API call with fallback
    console.log('Making API request with fallback...');
    
    try {
      const result = await makeApiCallWithFallback(message, history);
      
      console.log(`API call successful using ${result.key} key`);
      
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          response: result.response
        })
      };

    } catch (error) {
      console.error('All API keys failed:', error);
      
      // Check if it's a rate limit error from all keys
      if (error.type === 'rate_limit') {
        return {
          statusCode: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Daily limit exceeded",
            response: "আমি আজ রাতে খুব ক্লান্ত, আগামীকাল কথা হবে 😴",
            resetTime: error.resetTime ? error.resetTime.toISOString() : null
          })
        };
      }
      
      // Handle timeout errors with a more helpful response
      if (error.type === 'timeout') {
        // Try to provide a contextual response based on the message
        let fallbackResponse = "দুঃখিত, আমি স্বাভাবিকের চেয়ে বেশি সময় নিচ্ছি। কখনও কখনও AI সার্ভার ব্যস্ত থাকলে এমন হয়। কয়েক সেকেন্ড পরে আবার চেষ্টা করুন! 😊";
        
        // Check if we can provide a more specific response based on the message content
        const normalizedMessage = message ? message.toLowerCase().trim() : '';
        
        if (normalizedMessage.includes('rain') || normalizedMessage.includes('raining') || normalizedMessage.includes('বৃষ্টি')) {
          fallbackResponse = "বৃষ্টির দিনগুলো আরামদায়ক হতে পারে! ☔ গাছের ছবি আপলোড করে রোগ নির্ণয় করার জন্য উপযুক্ত! 😊 (নোট: আমার AI মস্তিষ্ক এখন একটু ধীর, কিন্তু আমি এখানে আছি!)";
        } else if (normalizedMessage.includes('weather') || normalizedMessage.includes('আবহাওয়া')) {
          fallbackResponse = "আমি এখন আবহাওয়া চেক করতে পারছি না, কিন্তু আশা করি আপনার জায়গায় ভালো! 🌤️ (আমার AI সার্ভার আজ একটু ধীর!)";
        } else if (normalizedMessage.includes('hello') || normalizedMessage.includes('hi') || normalizedMessage.includes('hey') || normalizedMessage.includes('হ্যালো')) {
          fallbackResponse = "হ্যালো! 😊 কেমন আছেন? (দুঃখিত আমি ধীরে উত্তর দিচ্ছি - আমার AI মস্তিষ্ক অতিরিক্ত ব্যস্ত!)";
        } else if (normalizedMessage.includes('how are you') || normalizedMessage.includes('কেমন আছেন')) {
          fallbackResponse = "আমি খুব ভালো! জিজ্ঞেস করার জন্য ধন্যবাদ! আপনি কেমন? 😊 (আমার উত্তর আজ সার্ভার লোডের কারণে একটু ধীর!)";
        }
        
        return {
          statusCode: 408,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Request timeout",
            response: fallbackResponse
          })
        };
      }
      
      // Handle server errors (5xx)
      if (error.type === 'server_error') {
        return {
          statusCode: 503,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Service temporarily unavailable",
            response: "AI সার্ভারগুলিতে এখন কিছু সমস্যা হচ্ছে। কিন্তু আমি এখনও এখানে আছি! 😊 কয়েক মিনিট পরে আবার চেষ্টা করুন!"
          })
        };
      }
      
      // Handle other errors with a friendly fallback
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: "API Error",
          response: "এখনই সংযোগ করতে সমস্যা হচ্ছে, কিন্তু আমি এখনও এখানে আছি! 😊 একটু পরে আবার চেষ্টা করুন অথবা অন্য কিছু নিয়ে কথা বলুন!"
        })
      };
    }

  } catch (error) {
    console.error('Unexpected error:', error.message, error.stack);
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        error: "Internal server error",
        response: "আমার দিকে কিছু সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।"
      })
    };
  }
}; 