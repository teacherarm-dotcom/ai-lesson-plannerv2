import { useState, useCallback } from 'react';
import { cleanAndParseJSON } from '../utils/jsonParser';

const API_KEY = ''; // injected by environment
const MODEL = 'gemini-2.5-flash-preview-09-2025';

const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

/**
 * Reusable hook for calling the Gemini API.
 *
 * Returns { callApi, loading, loadingText }
 *
 * callApi(parts, { json: true }) → parsed JSON or raw text
 */
export const useGeminiApi = () => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const callApi = useCallback(async (parts, { json = false, statusText = '' } = {}) => {
    setLoading(true);
    setLoadingText(statusText || 'กำลังประมวลผล...');

    try {
      const body = {
        contents: [{ role: 'user', parts }],
      };
      if (json) {
        body.generationConfig = { responseMimeType: 'application/json' };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('API Connection Failed');

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No data returned from AI');

      return json ? cleanAndParseJSON(text) : text;
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  }, []);

  return { callApi, loading, loadingText, setLoadingText };
};

export { API_KEY };
