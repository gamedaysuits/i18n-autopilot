/**
 * Anthropic Translation Method — direct Anthropic Messages API.
 *
 * Extends DirectLLMMethod to provide Anthropic-specific:
 *   - API endpoint (https://api.anthropic.com/v1/messages)
 *   - Auth header format (x-api-key + anthropic-version)
 *   - Request body (messages, system param, max_tokens)
 *   - Response parsing (content[0].text)
 *   - Model listing via GET /v1/models
 *   - Pricing (claude-sonnet, claude-haiku, claude-opus)
 *
 * All shared logic (translate, translateContent, coaching, retry, validation)
 * lives in DirectLLMMethod.
 */

import { DirectLLMMethod } from './direct-llm.js';

class AnthropicMethod extends DirectLLMMethod {
  constructor(options = {}) {
    super(options);
    this.name = 'anthropic';
  }

  // ── Provider identity ────────────────────────────────────────────

  _getApiKeyEnvVar()     { return 'ANTHROPIC_API_KEY'; }
  _getApiKeyOptionsKey() { return 'anthropicApiKey'; }
  _getDefaultModel()     { return 'claude-sonnet-4-6'; }
  _getProviderLabel()    { return 'Anthropic'; }

  // ── API request/response shape ───────────────────────────────────

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    // Anthropic uses a separate 'system' field rather than a system message in
    // the messages array. This is important for prompt caching — the system
    // field is cached independently by Anthropic's infrastructure.
    const body = {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature,
    };

    if (systemMessage) {
      body.system = systemMessage;
    }

    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body,
    };
  }

  _extractResponseText(json) {
    return json.content?.[0]?.text || null;
  }

  // ── Runtime model listing ────────────────────────────────────────

  async _fetchModels(apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return (data.data || []).map(m => m.id);
    } catch {
      return null;
    }
  }

  // ── Model-aware quality tier ─────────────────────────────────────

  _getModelTier(model) {
    if (model.includes('haiku')) return 'budget';
    if (model.includes('opus')) return 'premium';
    return 'standard';  // sonnet
  }

  // ── Pricing ──────────────────────────────────────────────────────

  estimateCost(keyCount, pairConfig = {}) {
    const model = pairConfig.model || 'claude-sonnet-4-6';
    let inputRate = 3.00;
    let outputRate = 15.00;
    if (model.includes('haiku')) {
      inputRate = 0.80;
      outputRate = 4.00;
    } else if (model.includes('opus')) {
      inputRate = 15.00;
      outputRate = 75.00;
    }

    const inputTokens = keyCount * 60;
    const outputTokens = keyCount * 10;

    const estimatedCost = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
    return {
      estimatedCost: Math.round(estimatedCost * 10000) / 10000,
      currency: 'USD',
      source: 'anthropic-pricing',
      note: `Based on Anthropic ${model} pricing ($${inputRate}/1M input, $${outputRate}/1M output).`,
    };
  }

  // ── Provenance ───────────────────────────────────────────────────

  getProvenance() {
    return {
      resources: [
        {
          name: 'Anthropic Messages API',
          license: 'Proprietary (Anthropic ToS)',
          type: 'api',
        },
      ],
      commercialReady: true,
      flags: [],
    };
  }
}

export { AnthropicMethod };
