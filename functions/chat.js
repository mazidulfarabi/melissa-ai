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
        hasApiKey: !!process.env.OPENROUTER_API_KEY,
        apiKeyLength: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0,
        apiKeyPrefix: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 10) + '...' : 'none',
        environment: process.env.NODE_ENV || 'development'
      })
    };
  }

  try {
    // Check if API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('Missing OPENROUTER_API_KEY environment variable');
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: "Configuration error",
          response: "I'm not properly configured right now. Please contact support."
        })
      };
    }

    // Validate API key format
    if (!process.env.OPENROUTER_API_KEY.startsWith('sk-')) {
      console.error('Invalid API key format - should start with sk-');
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: "Invalid API key format",
          response: "My API key is not properly configured. Please check the setup."
        })
      };
    }

    const { message, history } = JSON.parse(event.body || '{}');

    if (!message) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Message is required" })
      };
    }

    console.log('Starting API request...');
    console.log('API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('API Key length:', process.env.OPENROUTER_API_KEY.length);
    console.log('User message:', message);
    console.log('Chat history length:', history ? history.length : 0);

    // Optimized local response system for common greetings and simple questions so resources are not wasted
    const localResponses = {
      // Greetings
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
        "Afternoon! How's everything? 😊",
        "Good afternoon! Nice to see you! 👋"
      ],
      'good evening': [
        "Good evening! How was your day? 🌙",
        "Evening! Hope you had a great day! 😊",
        "Good evening! Ready to chat? 👋"
      ],
      'good night': [
        "Good night! Sweet dreams! 😴",
        "Night! Sleep well! 🌙",
        "Good night! See you tomorrow! 😊"
      ],
      
      // How are you variations
      'how are you': [
        "I'm doing great! Thanks for asking! How about you? 😊",
        "I'm awesome! How are you doing? 😄",
        "I'm feeling good! How's your day going? 😊"
      ],
      'how r u': [
        "I'm good! How about you? 😊",
        "I'm great! How are you doing? 😄",
        "I'm doing well! How's it going? 😊"
      ],
      'how are u': [
        "I'm good! How about you? 😊",
        "I'm great! How are you doing? 😄",
        "I'm doing well! How's it going? 😊"
      ],
      
      // Name questions
      'what is your name': [
        "I'm Melissa! Nice to meet you! 😊",
        "My name is Melissa! What's yours? 👋",
        "I'm Melissa! How about you? 😄"
      ],
      'whats your name': [
        "I'm Melissa! Nice to meet you! 😊",
        "My name is Melissa! What's yours? 👋",
        "I'm Melissa! How about you? 😄"
      ],
      'what\'s your name': [
        "I'm Melissa! Nice to meet you! 😊",
        "My name is Melissa! What's yours? 👋",
        "I'm Melissa! How about you? 😄"
      ],
      'who are you': [
        "I'm Melissa, your AI friend! 😊",
        "I'm Melissa! Nice to meet you! 👋",
        "I'm Melissa, ready to chat! 😄"
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
      ]
    };

    // Function to get a random response from an array
    const getRandomResponse = (responses) => {
      return responses[Math.floor(Math.random() * responses.length)];
    };

    // Check for local responses
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check exact matches first
    if (localResponses[normalizedMessage]) {
      console.log('Using local response for:', normalizedMessage);
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
    
    // Check for partial matches (e.g., "hello there" should match "hello")
    for (const [key, responses] of Object.entries(localResponses)) {
      if (normalizedMessage.includes(key) && key.length > 2) { // Only match words longer than 2 chars
        console.log('Using local response for partial match:', key);
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
        
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            response: `DEBUG: API Status: ${testRes.status}, Response: ${errorText.substring(0, 200)}`
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

    // Simple request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    // Make the actual request directly
    console.log('Making API request...');
    
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free",
          messages: [
            { 
              role: "system", 
              content: "You are Melissa, a cool cyber-girl. Keep responses short and friendly." 
            },
            // Include recent chat history (last 10 messages to avoid token limits)
            ...(history && history.length > 0 ? history.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            })) : []),
            { role: "user", content: message }
          ],
          max_tokens: 80,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('API Response Status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);

        // Check for rate limit errors first
        const rawErrorText = errorText.toLowerCase();
        if (rawErrorText.includes('rate limit') || 
            rawErrorText.includes('limit exceeded') || 
            rawErrorText.includes('free-models-per-day') ||
            rawErrorText.includes('429')) {
          console.log('Rate limit detected in raw text, returning tired message');
          return {
            statusCode: 429,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
              error: "Daily limit exceeded",
              response: "I'm feeling very tired tonight, will talk tomorrow xoxo 😴"
            })
          };
        }

        // Try to parse JSON error response
        try {
          const errorData = JSON.parse(errorText);
          console.log('Parsed error data:', JSON.stringify(errorData));
          if (errorData.error && errorData.error.message) {
            const errorMessage = errorData.error.message.toLowerCase();
            if (errorMessage.includes('free-models-per-day') || 
                errorMessage.includes('rate limit') || 
                errorMessage.includes('limit exceeded') ||
                errorMessage.includes('429')) {
              console.log('Rate limit detected in parsed JSON, returning tired message');
              return {
                statusCode: 429,
                headers: {
                  "Access-Control-Allow-Origin": "*",
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                  error: "Daily limit exceeded",
                  response: "I'm feeling very tired tonight, will talk tomorrow xoxo 😴"
                })
              };
            }
          }
        } catch (parseError) {
          console.log('Error parsing JSON:', parseError.message);
        }
        
        // If we get here, it's not a rate limit error
        return {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: `API Error: ${res.status}`,
            response: "The AI service is having issues. Please try again later."
          })
        };
      }

      const data = await res.json();
      console.log('API Success:', JSON.stringify(data).substring(0, 200) + '...');

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid API response format:', JSON.stringify(data));
        return {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Invalid response format",
            response: "I received an unexpected response from the AI service."
          })
        };
      }

      // Get the response content and ensure it's complete
      let responseContent = data.choices[0].message.content || "";
      
      // If response was truncated (indicated by finish_reason), add a note
      if (data.choices[0].finish_reason === 'length') {
        console.log('Response was truncated, adding completion note');
        responseContent = responseContent.trim();
        if (!responseContent.endsWith('.')) {
          responseContent += '.';
        }
      }

      // Ensure response is not too long for the chat interface
      if (responseContent.length > 200) {
        responseContent = responseContent.substring(0, 200).trim();
        if (!responseContent.endsWith('.')) {
          responseContent += '...';
        }
      }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          response: responseContent
        })
      };

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('API Error:', error.message);
      
      // Check for rate limit errors in the catch block too
      let errorMessage = error.message.toLowerCase();
      
      // Try to parse JSON error messages
      try {
        if (error.message.startsWith('{')) {
          const parsedError = JSON.parse(error.message);
          if (parsedError.error && parsedError.error.message) {
            errorMessage = parsedError.error.message.toLowerCase();
            console.log('Parsed JSON error message:', errorMessage);
          }
        }
      } catch (parseError) {
        // Continue with original error message if parsing fails
      }
      
      if (errorMessage.includes('rate limit') || 
          errorMessage.includes('limit exceeded') || 
          errorMessage.includes('free-models-per-day') ||
          errorMessage.includes('429')) {
        console.log('Rate limit detected in catch block, returning tired message');
        return {
          statusCode: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Daily limit exceeded",
            response: "I'm feeling very tired tonight, will talk tomorrow xoxo 😴"
          })
        };
      }
      
      // Check if the error object has additional properties that might contain rate limit info
      if (error.response && error.response.status === 429) {
        console.log('Rate limit detected via response status, returning tired message');
        return {
          statusCode: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Daily limit exceeded",
            response: "I'm feeling very tired tonight, will talk tomorrow xoxo 😴"
          })
        };
      }
      
      if (error.name === 'AbortError') {
        return {
          statusCode: 408,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Request timeout",
            response: "The AI is taking too long to respond. Please try again."
          })
        };
      }
      
      // If we get here, it's an unknown error, but let's check if it's a network error that might be rate limit related
      if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
        console.log('Network error detected, might be rate limit related');
        return {
          statusCode: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Daily limit exceeded",
            response: "I'm feeling very tired tonight, will talk tomorrow xoxo 😴"
          })
        };
      }
      
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: "API Error",
          response: `API request failed: ${error.message}`
        })
      };
    }

  } catch (error) {
    console.error('Unexpected error:', error.message, error.stack);
    
    // Check for rate limit errors in the outer catch block too
    let errorMessage = error.message.toLowerCase();
    
    // Try to parse JSON error messages
    try {
      if (error.message.startsWith('{')) {
        const parsedError = JSON.parse(error.message);
        if (parsedError.error && parsedError.error.message) {
          errorMessage = parsedError.error.message.toLowerCase();
          console.log('Parsed JSON error message in outer catch:', errorMessage);
        }
      }
    } catch (parseError) {
      // Continue with original error message if parsing fails
    }
    
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('limit exceeded') || 
        errorMessage.includes('free-models-per-day') ||
        errorMessage.includes('429')) {
      console.log('Rate limit detected in outer catch block, returning tired message');
      return {
        statusCode: 429,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: "Daily limit exceeded",
          response: "I'm feeling very tired tonight, will talk tomorrow xoxo 😴"
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        error: "Internal server error",
        response: "Something went wrong on my end. Please try again in a moment."
      })
    };
  }
}; 