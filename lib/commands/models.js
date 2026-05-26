/**
 * Command: models
 *
 * Lists available models for a translation provider by querying
 * the provider's real API. Read-only — shows what models the user's
 * API key has access to, without modifying any config.
 *
 * WHY THIS EXISTS:
 *   When providers release new models, users need to discover the exact
 *   slug to put in their config. This command bridges that gap —
 *   instead of guessing or checking provider docs, run
 *   `rosetta models --method gemini` and see the real list.
 *
 * USAGE:
 *   rosetta models --method gemini      # List Gemini models
 *   rosetta models --method openai      # List OpenAI models
 *   rosetta models --method anthropic   # List Anthropic models
 */

import { resolveConfig } from '../config.js';
import { fetchAvailableModels, resolveProviderApiKey, getProviderLabel, isListableProvider, getListableProviders } from '../models.js';
import { output } from '../output.js';

/**
 * @param {import('../types.js').CLIArgs} args - Parsed CLI arguments
 * @param {string} cwd - Working directory
 * @returns {Promise<number>} Exit code (0 = success, 1 = error)
 */
async function run(args, cwd) {
  if (args.help) {
    showHelp();
    return 0;
  }

  const method = args.method;
  if (!method) {
    output.raw('\n  Usage: rosetta models --method <provider>\n');
    output.raw('  Available providers with model listing:');
    for (const provider of getListableProviders()) {
      output.raw(`    - ${provider} (${getProviderLabel(provider)})`);
    }
    output.raw('');
    output.raw('  Example: rosetta models --method gemini\n');
    return 0;
  }

  if (!isListableProvider(method)) {
    output.warn(`Provider "${method}" does not support model listing.`);
    output.raw('');
    output.raw('  Providers with model listing support:');
    for (const provider of getListableProviders()) {
      output.raw(`    - ${provider} (${getProviderLabel(provider)})`);
    }
    output.raw('');
    return 1;
  }

  // Resolve API key from environment or .env files
  const apiKey = resolveProviderApiKey(method, cwd);
  if (!apiKey) {
    const label = getProviderLabel(method);
    output.warn(`No API key found for ${label}.`);
    output.raw('');
    output.raw(`  Set the environment variable or add it to .env.local.`);
    output.raw(`  Then re-run: rosetta models --method ${method}`);
    output.raw('');
    return 1;
  }

  // Fetch available models from the provider's real API
  output.raw(`\n  Fetching models from ${getProviderLabel(method)}...\n`);
  const models = await fetchAvailableModels(method, apiKey);

  if (!models || models.length === 0) {
    output.warn('Could not fetch model list. Check your API key and network connection.');
    return 1;
  }

  // Display models as a numbered list
  output.raw(`  Available models (${models.length}):\n`);
  for (let i = 0; i < models.length; i++) {
    output.raw(`    ${String(i + 1).padStart(3)}.  ${models[i]}`);
  }

  // Show current config model if a config exists
  try {
    const config = resolveConfig(args, cwd);
    if (config.model) {
      output.raw('');
      output.raw(`  Current config model: ${config.model}`);
    }
  } catch {
    // No config file — that's fine, just don't show current model
  }

  output.raw('');
  output.raw('  To use a model, set "model" in your i18n-rosetta.config.json');
  output.raw('  or pass --model <id> to sync.\n');

  return 0;
}

function showHelp() {
  console.log(`
  i18n-rosetta models — List available models for a provider

  USAGE
    i18n-rosetta models --method <provider>

  DESCRIPTION
    Queries the provider's real API to show which models your API key
    has access to. Read-only — does not modify any config files.

  OPTIONS
    --method <provider>   Provider to query: gemini, openai, anthropic

  EXAMPLES
    i18n-rosetta models --method gemini      # List Gemini models
    i18n-rosetta models --method openai      # List OpenAI models
    i18n-rosetta models --method anthropic   # List Anthropic models
  `);
}

export { run };
