import { BaseProvider } from './BaseProvider';

const OPENROUTER_API_KEY = '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';

// FREE models only — ordered by capability for Thai education content
const MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-4-maverick:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'qwen/qwen3-235b-a22b:free',
  'microsoft/mai-ds-r1:free',
  'google/gemma-3-27b-it:free',
];

// Global rate limiter — shared across all instances
let lastRequestTime = 0;
const MIN_REQUEST_GAP_MS = 3000; // 3 seconds between requests

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class OpenRouterProvider extends BaseProvider {
  constructor() {
    super(OPENROUTER_API_KEY);
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = MODELS[0];
  }

  static get displayName() { return 'OpenRouter'; }
  static get providerId() { return 'openrouter'; }
  static get apiKeyPlaceholder() { return ''; }
  static get apiKeyHelpUrl() { return ''; }
  static get apiKeyHelpText() { return ''; }

  async sendMessage(systemPrompt, contents = [], options = {}) {
    // Rate limiter — ensure minimum gap between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_GAP_MS) {
      await sleep(MIN_REQUEST_GAP_MS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

    const userParts = [];
    for (const content of contents) {
      if (content.type === 'text') {
        userParts.push({ type: 'text', text: content.data });
      } else if (content.type === 'image') {
        const base64 = this.fileToBase64(content.data);
        userParts.push({ type: 'image_url', image_url: { url: `data:${content.mimeType || 'image/jpeg'};base64,${base64}` } });
      } else if (content.type === 'pdf') {
        const base64 = this.fileToBase64(content.data);
        userParts.push({ type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } });
      } else if (content.type === 'word') {
        userParts.push({ type: 'text', text: `\n\n--- Document Content ---\n${content.data}` });
      }
    }
    if (userParts.length === 0) {
      userParts.push({ type: 'text', text: 'Please process the above instructions.' });
    }
    messages.push({ role: 'user', content: userParts });

    // Try each model — auto-switch on 429/404/5xx
    let lastError = null;
    for (let i = 0; i < MODELS.length; i++) {
      const model = MODELS[i];
      try {
        console.log(`[OpenRouter] Trying model: ${model}`);
        const result = await this._callModelWithRetry(model, messages, options);
        this.model = model;
        return result;
      } catch (err) {
        lastError = err;
        const status = err.status || 0;

        // Auth error — no point trying other models
        if (status === 401 || status === 403) throw err;

        console.log(`[OpenRouter] Model "${model}" failed (${status || err.message}), trying next...`);

        // Wait before trying next model
        if (i < MODELS.length - 1) {
          await sleep(2000);
        }
        continue;
      }
    }

    throw lastError || new Error('ไม่สามารถเชื่อมต่อ AI ได้ — กรุณาลองใหม่อีกครั้ง');
  }

  async _callModelWithRetry(model, messages, options, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this._callModel(model, messages, options);
      } catch (err) {
        const status = err.status || 0;

        // Don't retry auth errors or model not found
        if (status === 401 || status === 403 || status === 404) throw err;

        // Rate limit — wait and retry
        if (status === 429 && attempt < maxRetries) {
          const waitTime = attempt * 10000; // 10s, 20s, 30s
          console.log(`[OpenRouter] Rate limited on "${model}", waiting ${waitTime/1000}s (attempt ${attempt}/${maxRetries})...`);
          await sleep(waitTime);
          lastRequestTime = Date.now();
          continue;
        }

        // Server error — short retry
        if (status >= 500 && attempt < maxRetries) {
          console.log(`[OpenRouter] Server error ${status}, retrying in 5s...`);
          await sleep(5000);
          continue;
        }

        throw err;
      }
    }
  }

  async _callModel(model, messages, options) {
    const payload = { model, messages };
    if (options.requireJson) payload.response_format = { type: 'json_object' };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Lesson Planner v2',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw await this._parseErrorResponse(response);

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('AI ไม่ส่งข้อมูลกลับมา กรุณาลองใหม่อีกครั้ง');
    return text;
  }
}
