const fetch = require('node-fetch');

const CLOUDFLARE_WORKER_URL = "https://melissa-ai.anmone-gaming.workers.dev/api/chat";

exports.handler = async function(event, context) {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
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
        service: "Melissa AI Netlify Function Bridge",
        targetWorker: CLOUDFLARE_WORKER_URL,
        timestamp: new Date().toISOString()
      })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { message, history } = payload;

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

    // Forward request to Cloudflare Workers AI backend
    const cfResponse = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history,
        stream: false
      })
    });

    const data = await cfResponse.json();

    return {
      statusCode: cfResponse.status || 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Netlify function forwarding error:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Bridge error",
        response: "Oops! My connection had a quick hiccup. Mind sending that again? 😊"
      })
    };
  }
};
