import { GeminiProvider } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { OpenRouterProvider } from './OpenRouterProvider';

const PROVIDERS = [OpenRouterProvider, GeminiProvider, OpenAIProvider, ClaudeProvider, DeepSeekProvider];

// Default provider is now OpenRouter (hardcoded key, no user input needed)
export const DEFAULT_PROVIDER = 'openrouter';

export function getAvailableProviders() {
  return PROVIDERS.map((P) => ({
    id: P.providerId,
    name: P.displayName,
    placeholder: P.apiKeyPlaceholder,
    helpUrl: P.apiKeyHelpUrl,
    helpText: P.apiKeyHelpText,
  }));
}

export function createProvider(providerId, apiKey) {
  const ProviderClass = PROVIDERS.find((P) => P.providerId === providerId);
  if (!ProviderClass) throw new Error(`Unknown AI provider: ${providerId}`);
  // OpenRouter uses hardcoded key, ignore apiKey param
  if (providerId === 'openrouter') return new ProviderClass();
  return new ProviderClass(apiKey);
}

export function getProviderMeta(providerId) {
  const ProviderClass = PROVIDERS.find((P) => P.providerId === providerId);
  if (!ProviderClass) return null;
  return {
    id: ProviderClass.providerId,
    name: ProviderClass.displayName,
    placeholder: ProviderClass.apiKeyPlaceholder,
    helpUrl: ProviderClass.apiKeyHelpUrl,
    helpText: ProviderClass.apiKeyHelpText,
  };
}
