import { BaseProvider } from './BaseProvider';

const OPENROUTER_API_KEY = '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';

const MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash-001',
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-flash-1.5',
];

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

    // Try each model until one works
    let lastError = null;
    for (const model of MODELS) {
      try {
        const result = await this._callModel(model, messages, options);
        this.model = model;
        return result;
      } catch (err) {
        lastError = err;
        const status = err.status || 0;
        // Auth error — no point trying other models
        if (status === 401 || status === 403) throw err;
        // Model not found — try next
        if (status === 404) {
          console.log(`[OpenRouter] Model "${model}" not found, trying next...`);
          continue;
        }
        // Other errors — throw
        throw err;
      }
    }
    throw lastError || new Error('ไม่สามารถเชื่อมต่อ AI ได้ — กรุณาลองใหม่');
  }

  async _callModel(model, messages, options) {
    const payload = { model, messages };
    if (options.requireJson) payload.response_format = { type: 'json_object' };

    return this.withRetry(async () => {
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
    });
  }
}
