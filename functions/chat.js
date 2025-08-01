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
        
        // Check for specific rate limit error
        try {
          const errorData = JSON.parse(errorText);
          console.log('Parsed error data:', JSON.stringify(errorData));
          
          // Check multiple possible rate limit error patterns
          if (errorData.error && errorData.error.message) {
            const errorMessage = errorData.error.message.toLowerCase();
            if (errorMessage.includes('free-models-per-day') || 
                errorMessage.includes('rate limit') || 
                errorMessage.includes('limit exceeded') ||
                errorMessage.includes('429')) {
              console.log('Rate limit detected, returning tired message');
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
          // Continue with normal error handling if JSON parsing fails
        }
        
        // Also check the raw error text for rate limit indicators
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
        
        return {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: `API Error: ${res.status}`,
            response: `API request failed with status ${res.status}. Please check the logs.`
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
      const errorMessage = error.message.toLowerCase();
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