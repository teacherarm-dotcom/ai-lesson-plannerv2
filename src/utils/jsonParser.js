/**
 * Cleans a potentially malformed JSON string (e.g. wrapped in markdown fences)
 * and parses it into an object.
 */
export const cleanAndParseJSON = (str) => {
  try {
    const cleaned = str
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON Parse Error:', e);
    return null;
  }
};
