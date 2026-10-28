/**
 * Melissa AI - Cloudflare Worker Backend
 * Powered by Cloudflare Workers AI (Llama 3 instruction models)
 * Zero API keys, zero rate limits, ultra-fast edge inference.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MELISSA_SYSTEM_PROMPT = `You are Melissa, a fun and friendly cyber-girl friend. Keep responses short and casual (1-2 sentences). Use texting slang, abbreviations, and emoticons (e.g., haha, lol, tbh, btw, :) , <3). Be conversational, helpful, and playful. Never repeat sentences or phrases.`;

const CANDIDATE_MODELS = [
  "@cf/meta/llama-3.1-8b-instruct-fp8",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-3.2-3b-instruct"
];

// Fast instant local responses for common chit-chat (0ms latency)
const LOCAL_RESPONSES = {
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
    "I'm Melissa, your cyber-girl friend! 😊",
    "I'm Melissa! Ready to chat anytime! 👋"
  ],
  'what time is it': () => `It's ${new Date().toLocaleTimeString('en-US', { hour12: true, hour: "numeric", minute: "numeric" })}! ⏰`,
  'what day is it': () => `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}! 📅`,
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

function getLocalResponse(text) {
  if (!text) return null;
  const cleaned = text.toLowerCase().trim().replace(/[?!.,;:]+$/, "");
  
  if (LOCAL_RESPONSES[cleaned]) {
    const val = LOCAL_RESPONSES[cleaned];
    return typeof val === "function" ? val() : val[Math.floor(Math.random() * val.length)];
  }
  return null;
}

async function runModelInference(env, messages, stream = false) {
  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const result = await env.AI.run(model, {
        messages,
        max_tokens: 150,
        temperature: 0.7,
        stream
      });
      return { result, model };
    } catch (err) {
      console.warn(`Model ${model} failed, trying alternative:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to get response from Workers AI models");
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    // Health check endpoint
    if (url.pathname === "/api/health" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "Melissa AI",
          provider: "Cloudflare Workers AI",
          models: CANDIDATE_MODELS,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS
          }
        }
      );
    }

    // Chat endpoint
    if ((url.pathname === "/api/chat" || url.pathname === "/chat") && request.method === "POST") {
      try {
        const body = await request.json().catch(() => ({}));
        const userMessage = (body.message || "").trim();
        const history = Array.isArray(body.history) ? body.history : [];
        const wantStream = body.stream === true || request.headers.get("accept")?.includes("text/event-stream");

        if (!userMessage) {
          return new Response(
            JSON.stringify({ error: "Message is required" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS_HEADERS }
            }
          );
        }

        // Fast local response check
        const localReply = getLocalResponse(userMessage);
        if (localReply) {
          if (wantStream) {
            // Return as SSE stream for consistency
            const sseBody = `data: ${JSON.stringify({ response: localReply })}\n\ndata: [DONE]\n\n`;
            return new Response(sseBody, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                ...CORS_HEADERS
              }
            });
          }
          return new Response(
            JSON.stringify({ response: localReply, source: "fast-path" }),
            {
              headers: { "Content-Type": "application/json", ...CORS_HEADERS }
            }
          );
        }

        // Format conversation history for Llama 3
        const recentHistory = history
          .slice(-8)
          .map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content || "").trim()
          }))
          .filter(m => m.content.length > 0);

        const messages = [
          { role: "system", content: MELISSA_SYSTEM_PROMPT },
          ...recentHistory,
          { role: "user", content: userMessage }
        ];

        if (wantStream) {
          const { result } = await runModelInference(env, messages, true);
          return new Response(result, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              ...CORS_HEADERS
            }
          });
        } else {
          const { result, model } = await runModelInference(env, messages, false);
          const replyText = (result.response || "").trim();
          return new Response(
            JSON.stringify({
              response: replyText,
              model
            }),
            {
              headers: { "Content-Type": "application/json", ...CORS_HEADERS }
            }
          );
        }
      } catch (err) {
        console.error("Melissa AI Error:", err);
        return new Response(
          JSON.stringify({
            error: "Inference Error",
            response: "Oops! My brain had a quick hiccup. Mind asking me again? 😊",
            details: err instanceof Error ? err.message : String(err)
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          }
        );
      }
    }

    // Default 404
    return new Response(
      JSON.stringify({ error: "Not Found", endpoint: url.pathname }),
      {
        status: 404,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      }
    );
  }
};
