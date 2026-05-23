/**
 * OpenAI Translation Method — direct OpenAI Chat Completions API.
 *
 * Extends DirectLLMMethod to provide OpenAI-specific:
 *   - API endpoint (https://api.openai.com/v1/chat/completions)
 *   - Auth header format (Bearer token)
 *   - Request body (messages array, response_format for JSON mode)
 *   - Response parsing (choices[0].message.content)
 *   - Model listing via GET /v1/models
 *   - Pricing (gpt-4o, gpt-4o-mini)
 *
 * All shared logic (translate, translateContent, coaching, retry, validation)
 * lives in DirectLLMMethod.
 */

import { DirectLLMMethod } from './direct-llm.js';
import { EST_INPUT_TOKENS_PER_KEY, EST_OUTPUT_TOKENS_PER_KEY } from '../config.js';

class OpenAIMethod extends DirectLLMMethod {
  constructor(options = {}) {
    super(options);
    this.name = 'openai';
  }

  // ── Provider identity ────────────────────────────────────────────

  _getApiKeyEnvVar()     { return 'OPENAI_API_KEY'; }
  _getApiKeyOptionsKey() { return 'openaiApiKey'; }
  _getDefaultModel()     { return 'gpt-4o'; }
  _getProviderLabel()    { return 'OpenAI'; }

  // ── API request/response shape ───────────────────────────────────

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature, isJsonMode }) {
    const messages = systemMessage
      ? [{ role: 'system', content: systemMessage }, { role: 'user', content: prompt }]
      : [{ role: 'user', content: prompt }];

    const body = { model, messages, temperature };
    if (isJsonMode) {
      body.response_format = { type: 'json_object' };
    }

    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content || null;
  }

  // ── Runtime model listing ────────────────────────────────────────

  async _fetchModels(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!response.ok) return null;
      const data = await response.json();
      // Filter to chat-capable models (skip embeddings, whisper, dall-e, etc.)
      return (data.data || [])
        .map(m => m.id)
        .filter(id => id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4') || id.startsWith('chatgpt-'));
    } catch {
      return null;
    }
  }

  // ── Model-aware quality tier ─────────────────────────────────────

  _getModelTier(model) {
    if (model.includes('mini')) return 'budget';
    if (model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')) return 'premium';
    return 'standard';  // gpt-4o and similar
  }

  // ── Pricing ──────────────────────────────────────────────────────

  estimateCost(keyCount, pairConfig = {}) {
    const model = pairConfig.model || 'gpt-4o';
    const isMini = model.includes('mini');
    const inputRate = isMini ? 0.15 : 5.00;
    const outputRate = isMini ? 0.60 : 15.00;

    const inputTokens = keyCount * EST_INPUT_TOKENS_PER_KEY;
    const outputTokens = keyCount * EST_OUTPUT_TOKENS_PER_KEY;

    const estimatedCost = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
    return {
      estimatedCost: Math.round(estimatedCost * 10000) / 10000,
      currency: 'USD',
      source: 'openai-pricing',
      note: `Based on OpenAI ${model} pricing ($${inputRate}/1M input, $${outputRate}/1M output).`,
    };
  }

  // ── Provenance ───────────────────────────────────────────────────

  getProvenance() {
    return {
      resources: [
        {
          name: 'OpenAI Developer API',
          license: 'Proprietary (OpenAI ToS)',
          type: 'api',
        },
      ],
      commercialReady: true,
      flags: [],
    };
  }

  getSetupHelp() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ The OpenAI method requires an OpenAI API key.                  │',
        '  │                                                                │',
        '  │ 1. Sign up at https://platform.openai.com                      │',
        '  │ 2. Run: export OPENAI_API_KEY=sk-...                           │',
        '  │ 3. Or add to .env.local: OPENAI_API_KEY=sk-...                 │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your OpenAI dashboard for quota/billing.'];
  }
}

export { OpenAIMethod };
