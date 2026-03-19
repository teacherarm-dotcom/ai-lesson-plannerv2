import { useState, useCallback, useMemo } from 'react';
import { createProvider } from '../providers/index';
import { cleanAndParseJSON } from '../utils/jsonParser';

const STORAGE_PREFIX = 'ai_apikey_';
const PROVIDER_KEY = 'ai_provider';
const LEGACY_KEY = 'ai_apikey'; // old single-key format

// --- Migrate old key if present ---
(() => {
  const oldKey = localStorage.getItem(LEGACY_KEY);
  if (oldKey && !localStorage.getItem(STORAGE_PREFIX + 'gemini')) {
    localStorage.setItem(STORAGE_PREFIX + 'gemini', oldKey);
    localStorage.removeItem(LEGACY_KEY);
  }
})();

// --- localStorage helpers ---
export const getStoredProvider = () => localStorage.getItem(PROVIDER_KEY) || 'gemini';
export const setStoredProvider = (id) => localStorage.setItem(PROVIDER_KEY, id);
export const getStoredApiKey = (providerId) => localStorage.getItem(STORAGE_PREFIX + providerId) || '';
export const setStoredApiKey = (providerId, key) => localStorage.setItem(STORAGE_PREFIX + providerId, key);

/**
 * Convert Gemini-style "parts" array into the provider-agnostic "contents" format.
 *
 * Gemini parts: [{ text }, { inlineData: { mimeType, data } }]
 * Provider contents: [{ type: 'text'|'image'|'pdf'|'word', data, mimeType? }]
 */
function convertPartsToContents(parts) {
  const systemTexts = [];
  const contents = [];
  let isFirstText = true;

  for (const part of parts) {
    if (part.text) {
      // First text part is treated as the system prompt by convention
      if (isFirstText) {
        systemTexts.push(part.text);
        isFirstText = false;
      } else {
        contents.push({ type: 'text', data: part.text });
      }
    } else if (part.inlineData) {
      const { mimeType, data } = part.inlineData;
      if (mimeType === 'application/pdf') {
        contents.push({ type: 'pdf', data: `data:${mimeType};base64,${data}`, mimeType });
      } else {
        contents.push({ type: 'image', data: `data:${mimeType};base64,${data}`, mimeType });
      }
    }
  }

  return { systemPrompt: systemTexts.join('\n'), contents };
}

/**
 * Reusable hook for calling any AI provider.
 *
 * @param {string} providerId - 'gemini' | 'openai' | 'claude' | 'deepseek'
 * @param {string} apiKey
 */
export const useAiApi = (providerId, apiKey) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const provider = useMemo(() => {
    if (!providerId || !apiKey) return null;
    try {
      return createProvider(providerId, apiKey);
    } catch {
      return null;
    }
  }, [providerId, apiKey]);

  /**
   * callApi(parts, { json, statusText })
   * - `parts` uses the same Gemini-style format the modules already produce
   * - Internally converts to provider-agnostic format and delegates
   */
  const callApi = useCallback(
    async (parts, { json = false, statusText = '' } = {}) => {
      if (!provider) {
        throw new Error('API Key ยังไม่ได้ตั้งค่า กรุณากดปุ่ม "ตั้งค่า API Key" ก่อน');
      }

      setLoading(true);
      setLoadingText(statusText || 'กำลังประมวลผล...');

      try {
        const { systemPrompt, contents } = convertPartsToContents(parts);
        console.log(`[useAiApi] Calling ${providerId} with ${contents.length} content(s), json=${json}`);
        const text = await provider.sendMessage(systemPrompt, contents, { requireJson: json });

        if (!text) throw new Error('No data returned from AI');
        return json ? cleanAndParseJSON(text) : text;
      } catch (err) {
        console.error(`[useAiApi] ${providerId} error:`, err);
        throw err;
      } finally {
        setLoading(false);
        setLoadingText('');
      }
    },
    [provider]
  );

  return { callApi, loading, loadingText, setLoadingText };
};
