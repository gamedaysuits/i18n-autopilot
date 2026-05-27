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
import { EST_INPUT_TOKENS_PER_KEY, EST_OUTPUT_TOKENS_PER_KEY } from '../config.js';
import { fetchAvailableModels } from '../models.js';

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
    // Delegate to the shared models.js module — single source of truth for
    // model listing used by init wizard, `rosetta models`, and validation.
    return fetchAvailableModels('gemini', apiKey);
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

    const inputTokens = keyCount * EST_INPUT_TOKENS_PER_KEY;
    const outputTokens = keyCount * EST_OUTPUT_TOKENS_PER_KEY;

    const estimatedCost = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
    return {
      estimatedCost: Math.round(estimatedCost * 10000) / 10000,
      currency: 'USD',
      source: 'gemini-pricing',
      note: `Based on Gemini ${model} pricing ($${inputRate}/1M input, $${outputRate}/1M output). Free tier may apply.`,
    };
  }

  // ── Provenance ───────────────────────────────────────────────────

  checkReadiness(_context) {
    if (!process.env.GEMINI_API_KEY) {
      return { ready: false, reason: 'No Gemini API key (GEMINI_API_KEY).' };
    }
    return { ready: true };
  }

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

  getSetupHelp() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ The Gemini method requires a Google AI API key.                 │',
        '  │                                                                │',
        '  │ 1. Get a key at https://aistudio.google.com/apikey              │',
        '  │ 2. Run: export GEMINI_API_KEY=...                              │',
        '  │ 3. Or add to .env.local: GEMINI_API_KEY=...                    │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Google AI Studio for quota/billing.'];
  }
}

export { GeminiMethod };
