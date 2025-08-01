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
        hasApiKey: !!process.env.OPENROUTER_API_KEY
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

    console.log('Making API request to OpenRouter...');
    console.log('Request payload:', JSON.stringify({
      model: "anthropic/claude-3-haiku:free",
      messages: [
        { 
          role: "system", 
          content: "You are Melissa, a cool, nerdy cyber-girl -inspired by KillJoy from Valorant. Be conversational, warm, and engaging. Keep responses concise but informative. You can share interesting facts, tell jokes, and have casual conversations. Always maintain a positive and supportive tone." 
        },
        { role: "user", content: message }
      ],
      max_tokens: 150,
      temperature: 0.7
    }));
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Try primary model first, then fallback
    const models = ["anthropic/claude-3-haiku:free", "google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.1-8b-instruct:free"];
    let lastError = null;

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

        console.log(`API response status for ${model}: ${res.status}`);

        if (res.ok) {
          clearTimeout(timeoutId);
          const data = await res.json();
          console.log('API response received successfully');

          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Unexpected API response format:', JSON.stringify(data));
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
          console.error(`OpenRouter API error for ${model}: ${res.status} - ${errorText}`);
          lastError = { status: res.status, text: errorText };
          
          // If it's a 401 or 429, don't try other models
          if (res.status === 401 || res.status === 429) {
            break;
          }
          // Continue to next model for other errors
        }
      } catch (error) {
        console.error(`Error with model ${model}:`, error.message);
        lastError = error;
        // Continue to next model
      }
    }

    clearTimeout(timeoutId);

    // If we get here, all models failed
    if (lastError && lastError.status) {
      // Handle specific error cases from the last attempt
      if (lastError.status === 401) {
        return {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Authentication error",
            response: "I'm having authentication issues. Please try again later."
          })
        };
      } else if (lastError.status === 429) {
        return {
          statusCode: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Rate limited",
            response: "I'm getting too many requests right now. Please wait a moment and try again."
          })
        };
      } else if (lastError.status >= 500) {
        return {
          statusCode: 503,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            error: "Service unavailable",
            response: "The AI service is temporarily unavailable. Please try again in a few minutes."
          })
        };
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All models failed');
  } catch (error) {
    console.error('Error details:', error.message, error.stack);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return {
        statusCode: 408,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: "Request timeout",
          response: "The request took too long to process. Please try again."
        })
      };
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        statusCode: 503,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: "Network error",
          response: "I'm having network connectivity issues. Please check your connection and try again."
        })
      };
    } else {
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
  }
}; 