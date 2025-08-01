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

    const { message } = JSON.parse(event.body || '{}');

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

    // Simple request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // Try multiple models in case one fails
    const models = [
      "anthropic/claude-3-haiku:free",
      "google/gemini-2.0-flash-exp:free", 
      "meta-llama/llama-3.1-8b-instruct:free"
    ];

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { 
                role: "system", 
                content: "You are Melissa, a cool, nerdy cyber-girl -inspired by KillJoy from Valorant. Be conversational, warm, and engaging. Keep responses concise but informative. You can share interesting facts, tell jokes, and have casual conversations. Always maintain a positive and supportive tone." 
              },
              { role: "user", content: message }
            ],
            max_tokens: 150,
            temperature: 0.7
          }),
          signal: controller.signal
        });

        console.log(`API Response Status for ${model}:`, res.status);
        console.log('API Response Headers:', JSON.stringify(Object.fromEntries(res.headers.entries())));

        if (res.ok) {
          clearTimeout(timeoutId);
          const data = await res.json();
          console.log('API Response received:', JSON.stringify(data).substring(0, 200) + '...');

          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid API response format:', JSON.stringify(data));
            continue; // Try next model
          }

          return {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              response: data.choices[0].message.content
            })
          };
        } else {
          const errorText = await res.text();
          console.error(`API Error Response for ${model}:`, errorText);
          console.error('Full error details:', {
            model: model,
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            body: errorText
          });
          
          // If it's a 401 or 429, don't try other models
          if (res.status === 401 || res.status === 429) {
            break;
          }
          // Continue to next model for other errors
        }
      } catch (modelError) {
        console.error(`Error with model ${model}:`, modelError.message);
        // Continue to next model
      }
    }

    // If we get here, all models failed
    clearTimeout(timeoutId);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        error: "All models failed",
        response: "I'm having trouble connecting to the AI service. Please try again later."
      })
    };

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