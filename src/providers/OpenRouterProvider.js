import { BaseProvider } from './BaseProvider';

const OPENROUTER_API_KEY = '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';

export class OpenRouterProvider extends BaseProvider {
  constructor() {
    super(OPENROUTER_API_KEY);
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'google/gemini-2.5-flash';
  }

  static get displayName() { return 'OpenRouter'; }
  static get providerId() { return 'openrouter'; }
  static get apiKeyPlaceholder() { return ''; }
  static get apiKeyHelpUrl() { return ''; }
  static get apiKeyHelpText() { return ''; }

  async sendMessage(systemPrompt, contents = [], options = {}) {
    const messages = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Build user message with text + images/PDFs
    const userParts = [];

    for (const content of contents) {
      if (content.type === 'text') {
        userParts.push({ type: 'text', text: content.data });
      } else if (content.type === 'image') {
        const base64 = this.fileToBase64(content.data);
        const mimeType = content.mimeType || 'image/jpeg';
        userParts.push({
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${base64}` },
        });
      } else if (content.type === 'pdf') {
        const base64 = this.fileToBase64(content.data);
        userParts.push({
          type: 'image_url',
          image_url: { url: `data:application/pdf;base64,${base64}` },
        });
      } else if (content.type === 'word') {
        userParts.push({ type: 'text', text: `\n\n--- Document Content ---\n${content.data}` });
      }
    }

    if (userParts.length === 0) {
      userParts.push({ type: 'text', text: 'Please process the above instructions.' });
    }

    messages.push({ role: 'user', content: userParts });

    const payload = {
      model: this.model,
      messages,
    };

    if (options.requireJson) {
      payload.response_format = { type: 'json_object' };
    }

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

      if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('No response text from OpenRouter');
      return text;
    });
  }
}
