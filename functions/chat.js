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
        apiKeyLength: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0
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

    console.log('Starting API request...');
    console.log('API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('API Key length:', process.env.OPENROUTER_API_KEY.length);
    console.log('User message:', message);

    // Simple request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
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
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('API Response Status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', errorText);
        
        if (res.status === 401) {
          return {
            statusCode: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
              error: "Authentication error",
              response: "I'm having authentication issues. Please check your API key."
            })
          };
        } else if (res.status === 429) {
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
        } else {
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
      }

      const data = await res.json();
      console.log('API Response received:', JSON.stringify(data).substring(0, 200) + '...');

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

    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError.message);
      
      if (fetchError.name === 'AbortError') {
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
      } else if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
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
        throw fetchError; // Re-throw to be caught by outer catch
      }
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