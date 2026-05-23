/**
 * Gemini Translation Method — direct Google Gemini API.
 *
 * Extends DirectLLMMethod to provide Gemini-specific:
 *   - API endpoint (generativelanguage.googleapis.com, key in query string)
 *   - Request body (contents/parts, systemInstruction, responseMimeType)
 *   - Response parsing (candidates[0].content.parts[0].text)
 *   - Model listing via GET /v1beta/models
 *   - Pricing (gemini-2.5-flash, gemini-2.5-pro)
 *
 * All shared logic (translate, translateContent, coaching, retry, validation)
 * lives in DirectLLMMethod.
 */

import { DirectLLMMethod } from './direct-llm.js';

class GeminiMethod extends DirectLLMMethod {
  constructor(options = {}) {
    super(options);
    this.name = 'gemini';
  }

  // ── Provider identity ────────────────────────────────────────────

  _getApiKeyEnvVar()     { return 'GEMINI_API_KEY'; }
  _getApiKeyOptionsKey() { return 'geminiApiKey'; }
  _getDefaultModel()     { return 'gemini-2.5-flash'; }
  _getProviderLabel()    { return 'Gemini'; }

  // ── API request/response shape ───────────────────────────────────

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature, isJsonMode }) {
    // Gemini puts the API key in the query string (not a header).
    // System messages use the separate systemInstruction field.
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
      },
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage }],
      };
    }

    if (isJsonMode) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    };
  }

  _extractResponseText(json) {
    return json.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  // ── Runtime model listing ────────────────────────────────────────

  async _fetchModels(apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      // Models come as "models/gemini-2.5-flash" — strip the "models/" prefix.
      // Only include models that support generateContent (not embeddings-only).
      return (data.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));
    } catch {
      return null;
    }
  }

  // ── Model-aware quality tier ─────────────────────────────────────

  _getModelTier(model) {
    if (model.includes('pro')) return 'premium';
    return 'standard';  // flash
  }

  // ── Pricing ──────────────────────────────────────────────────────

  estimateCost(keyCount, pairConfig = {}) {
    const model = pairConfig.model || 'gemini-2.5-flash';
    const isPro = model.includes('pro');
    const inputRate = isPro ? 1.25 : 0.15;
    const outputRate = isPro ? 10.00 : 0.60;

    const inputTokens = keyCount * 60;
    const outputTokens = keyCount * 10;

    const estimatedCost = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
    return {
      estimatedCost: Math.round(estimatedCost * 10000) / 10000,
      currency: 'USD',
      source: 'gemini-pricing',
      note: `Based on Gemini ${model} pricing ($${inputRate}/1M input, $${outputRate}/1M output). Free tier may apply.`,
    };
  }

  // ── Provenance ───────────────────────────────────────────────────

  getProvenance() {
    return {
      resources: [
        {
          name: 'Google Gemini API',
          license: 'Proprietary (Google ToS)',
          type: 'api',
        },
      ],
      commercialReady: true,
      flags: [],
    };
  }
}

export { GeminiMethod };
