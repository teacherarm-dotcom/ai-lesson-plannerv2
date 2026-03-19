import { BaseProvider } from './BaseProvider';

export class OpenAIProvider extends BaseProvider {
  constructor(apiKey) {
    super(apiKey);
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-4o-mini';
  }

  static get displayName() { return 'OpenAI (GPT-4o)'; }
  static get providerId() { return 'openai'; }
  static get apiKeyPlaceholder() { return 'sk-...'; }
  static get apiKeyHelpUrl() { return 'https://platform.openai.com/api-keys'; }
  static get apiKeyHelpText() { return 'ขอรับ API Key จาก OpenAI Platform'; }

  async sendMessage(systemPrompt, contents = [], options = {}) {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

    const userParts = [];
    for (const content of contents) {
      if (content.type === 'text') {
        userParts.push({ type: 'text', text: content.data });
      } else if (content.type === 'image') {
        userParts.push({ type: 'image_url', image_url: { url: content.data, detail: 'high' } });
      } else if (content.type === 'pdf') {
        userParts.push({ type: 'text', text: '[PDF Document Attached]' });
        if (content.extractedText) userParts.push({ type: 'text', text: content.extractedText });
      } else if (content.type === 'word') {
        userParts.push({ type: 'text', text: content.data });
      }
    }
    if (userParts.length === 0) userParts.push({ type: 'text', text: 'Please process the instruction above.' });

    messages.push({ role: 'user', content: userParts });

    const payload = { model: this.model, messages, max_tokens: 16000 };
    if (options.requireJson) payload.response_format = { type: 'json_object' };

    return this.withRetry(async () => {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('No response text from OpenAI');
      return text;
    });
  }
}
