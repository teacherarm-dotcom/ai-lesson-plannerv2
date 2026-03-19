import { GeminiProvider } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { DeepSeekProvider } from './DeepSeekProvider';

const PROVIDERS = [GeminiProvider, OpenAIProvider, ClaudeProvider, DeepSeekProvider];

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
