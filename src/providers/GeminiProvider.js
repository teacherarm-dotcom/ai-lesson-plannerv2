import { BaseProvider } from './BaseProvider';

export class GeminiProvider extends BaseProvider {
  constructor(apiKey) {
    super(apiKey);
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = 'gemini-2.5-flash';
  }

  static get displayName() { return 'Google Gemini'; }
  static get providerId() { return 'gemini'; }
  static get apiKeyPlaceholder() { return 'AIzaSy...'; }
  static get apiKeyHelpUrl() { return 'https://aistudio.google.com/app/apikey'; }
  static get apiKeyHelpText() { return 'ขอรับ API Key ฟรีได้จาก Google AI Studio'; }

  async sendMessage(systemPrompt, contents = [], options = {}) {
    const parts = [];
    if (systemPrompt) parts.push({ text: systemPrompt });

    for (const content of contents) {
      if (content.type === 'text') {
        parts.push({ text: content.data });
      } else if (content.type === 'image') {
        parts.push({ inlineData: { mimeType: content.mimeType || 'image/jpeg', data: this.fileToBase64(content.data) } });
      } else if (content.type === 'pdf') {
        parts.push({ inlineData: { mimeType: 'application/pdf', data: this.fileToBase64(content.data) } });
      } else if (content.type === 'word') {
        parts.push({ text: `\n\n--- Document Content ---\n${content.data}` });
      }
    }

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = { contents: [{ role: 'user', parts }] };
    if (options.requireJson) {
      payload.generationConfig = { responseMimeType: 'application/json' };
    }

    return this.withRetry(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw await this._parseErrorResponse(response);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('AI ไม่ส่งข้อมูลกลับมา กรุณาลองใหม่อีกครั้ง');
      return text;
    });
  }
}
