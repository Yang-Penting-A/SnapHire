/**
 * Robust JSON sanitizer for handling malformed Gemini API responses
 * Handles:
 * - Markdown code blocks (```json ...```)
 * - Trailing commas
 * - Duplicate keys (keeps last)
 * - BOM characters
 * - Extra whitespace
 */

export function sanitizeGeminiJsonResponse(responseText: string): string {
  if (!responseText || typeof responseText !== 'string') {
    throw new Error('Invalid response text');
  }

  let sanitized = responseText.trim();

  // Remove BOM if present
  if (sanitized.charCodeAt(0) === 0xFEFF) {
    sanitized = sanitized.slice(1);
  }

  // Step 1: Remove markdown code blocks (```json ... ``` or ``` ... ```)
  sanitized = sanitized.replace(/^```(?:json)?\s*\n?/i, '');  // Remove opening marker
  sanitized = sanitized.replace(/\n?```\s*$/i, '');             // Remove closing marker

  // Step 2: Remove trailing commas before closing brackets/braces
  // This regex handles:
  // - trailing commas before } or ]
  // - handles nested structures
  sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');

  // Step 3: Trim whitespace
  sanitized = sanitized.trim();

  // Step 4: Validate JSON structure is complete
  if (!sanitized.startsWith('{') && !sanitized.startsWith('[')) {
    throw new Error('Response does not start with valid JSON structure');
  }

  // Step 5: Try to fix incomplete JSON (shouldn't happen with Gemini, but just in case)
  if (!sanitized.endsWith('}') && !sanitized.endsWith(']')) {
    // Try to close with appropriate bracket
    const openBraces = (sanitized.match(/{/g) || []).length;
    const closeBraces = (sanitized.match(/}/g) || []).length;
    const openBrackets = (sanitized.match(/\[/g) || []).length;
    const closeBrackets = (sanitized.match(/\]/g) || []).length;

    for (let i = 0; i < closeBraces - openBraces; i++) {
      sanitized += '}';
    }
    for (let i = 0; i < closeBrackets - openBrackets; i++) {
      sanitized += ']';
    }
  }

  return sanitized;
}

/**
 * Parse Gemini JSON response with comprehensive error handling
 */
export function parseGeminiJson(responseText: string): any {
  try {
    const sanitized = sanitizeGeminiJsonResponse(responseText);
    const parsed = JSON.parse(sanitized);
    return parsed;
  } catch (error: any) {
    console.error(`[JSON-Parse] Error: ${error.message}`);
    throw new Error(`JSON parsing failed: ${error.message}`);
  }
}
