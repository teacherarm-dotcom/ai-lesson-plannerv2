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
    this.maxRetries = 5;
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

  /**
   * Retry with exponential backoff.
   * - 429 (rate limit): wait longer (10s, 20s, 30s, 45s, 60s) and always retry
   * - 5xx (server error): wait shorter (2s, 4s, 8s) and retry
   * - 4xx (client error, not 429): fail immediately (bad request, auth, etc.)
   */
  async withRetry(fn) {
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const status = err.status || 0;

        // Client errors (400, 401, 403, 404) — don't retry, fail fast
        if (status >= 400 && status < 500 && status !== 429) {
          throw err;
        }

        // No more retries left
        if (attempt >= this.maxRetries) {
          break;
        }

        // Rate limit (429) — wait longer with increasing delay
        if (status === 429) {
          const rateLimitDelays = [10000, 20000, 30000, 45000, 60000];
          const delay = rateLimitDelays[Math.min(attempt, rateLimitDelays.length - 1)];
          console.log(`[AI Provider] Rate limit (429) — waiting ${delay / 1000}s before retry ${attempt + 1}/${this.maxRetries}...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // Server errors (5xx) or network — shorter delay
        const serverDelays = [2000, 4000, 8000, 12000, 16000];
        const delay = serverDelays[Math.min(attempt, serverDelays.length - 1)];
        console.log(`[AI Provider] Error ${status || 'network'} — waiting ${delay / 1000}s before retry ${attempt + 1}/${this.maxRetries}...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError;
  }

  fileToBase64(dataUrl) {
    return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  }
}
