/**
 * BaseProvider — Abstract AI Provider Interface
 * All AI providers must implement this interface.
 */
export class BaseProvider {
  constructor(apiKey) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is abstract and cannot be instantiated directly.');
    }
    this.apiKey = apiKey;
    this.maxRetries = 3;
    this.retryDelays = [2000, 4000, 8000];
  }

  static get displayName() { throw new Error('Not implemented'); }
  static get providerId() { throw new Error('Not implemented'); }
  static get apiKeyPlaceholder() { return 'Enter your API key...'; }
  static get apiKeyHelpUrl() { return '#'; }
  static get apiKeyHelpText() { return 'Get your API key from the provider\'s website'; }

  /**
   * Send a message with optional file attachments.
   * @param {string} systemPrompt
   * @param {Array} contents - [{ type: 'text'|'image'|'pdf'|'word', data: string, mimeType?: string }]
   * @param {Object} options - { requireJson: boolean }
   * @returns {Promise<string>}
   */
  async sendMessage(systemPrompt, contents = [], options = {}) {
    throw new Error('sendMessage() must be implemented by subclass');
  }

  async withRetry(fn) {
    let lastError;
    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
          throw err;
        }
        if (i < this.retryDelays.length) {
          await new Promise((r) => setTimeout(r, this.retryDelays[i]));
        }
      }
    }
    throw lastError;
  }

  fileToBase64(dataUrl) {
    return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  }
}
