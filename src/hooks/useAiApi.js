import { useState, useCallback, useMemo } from 'react';
import { createProvider, DEFAULT_PROVIDER } from '../providers/index';
import { cleanAndParseJSON } from '../utils/jsonParser';

const STORAGE_PREFIX = 'ai_apikey_';
const PROVIDER_KEY = 'ai_provider';

// --- localStorage helpers ---
export const getStoredProvider = () => localStorage.getItem(PROVIDER_KEY) || DEFAULT_PROVIDER;
export const setStoredProvider = (id) => localStorage.setItem(PROVIDER_KEY, id);
export const getStoredApiKey = (providerId) => localStorage.getItem(STORAGE_PREFIX + providerId) || '';
export const setStoredApiKey = (providerId, key) => localStorage.setItem(STORAGE_PREFIX + providerId, key);

/**
 * Convert Gemini-style "parts" array into the provider-agnostic "contents" format.
 */
function convertPartsToContents(parts) {
  const systemTexts = [];
  const contents = [];
  let isFirstText = true;

  for (const part of parts) {
    if (part.text) {
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
 */
export const useAiApi = (providerId, apiKey) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const provider = useMemo(() => {
    if (!providerId || !apiKey) return null;
    try { return createProvider(providerId, apiKey); } catch { return null; }
  }, [providerId, apiKey]);

  const callApi = useCallback(
    async (parts, { json = false, statusText = '' } = {}) => {
      if (!provider) {
        throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน — กดปุ่ม "ตั้งค่า AI" ด้านบนขวา');
      }

      setLoading(true);
      setLoadingText(statusText || 'กำลังประมวลผล...');

      try {
        const { systemPrompt, contents } = convertPartsToContents(parts);
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
