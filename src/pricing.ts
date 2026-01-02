/**
 * Model pricing configuration for OpenRouter
 * Prices are per 1 million tokens (input and output)
 *
 * Update these regularly from: https://openrouter.ai/models
 * Last updated: 2025-01-11
 */

export interface ModelPricing {
    input: number;   // Price per 1M input tokens in USD
    output: number;  // Price per 1M output tokens in USD
}

/**
 * Pricing for popular models available through OpenRouter
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
    // OpenAI Models
    'openai/gpt-4o': { input: 2.50, output: 10.00 },
    'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
    'openai/gpt-4-turbo': { input: 10.00, output: 30.00 },
    'openai/gpt-3.5-turbo': { input: 0.50, output: 1.50 },

    // Anthropic Models
    'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
    'anthropic/claude-3-opus': { input: 15.00, output: 75.00 },
    'anthropic/claude-3-sonnet': { input: 3.00, output: 15.00 },
    'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },

    // Meta Models
    'meta-llama/llama-3.1-405b-instruct': { input: 2.70, output: 2.70 },
    'meta-llama/llama-3.1-70b-instruct': { input: 0.52, output: 0.75 },
    'meta-llama/llama-3.1-8b-instruct': { input: 0.06, output: 0.06 },
    'meta-llama/llama-3.2-90b-vision-instruct': { input: 0.90, output: 0.90 },

    // Google Models
    'google/gemini-pro-1.5': { input: 1.25, output: 5.00 },
    'google/gemini-flash-1.5': { input: 0.075, output: 0.30 },
    'google/gemini-flash-1.5-8b': { input: 0.0375, output: 0.15 },

    // Mistral Models
    'mistralai/mistral-large': { input: 2.00, output: 6.00 },
    'mistralai/mistral-medium': { input: 2.70, output: 8.10 },
    'mistralai/mistral-small': { input: 0.20, output: 0.60 },

    // Add more models as needed...
};

/**
 * Default pricing for unknown models (conservative estimate)
 */
export const DEFAULT_PRICING: ModelPricing = {
    input: 1.00,
    output: 3.00,
};

/**
 * Get pricing for a specific model
 * @param modelName - The model name in OpenRouter format
 * @returns ModelPricing object with input and output prices per 1M tokens
 */
export function getModelPricing(modelName: string): ModelPricing {
    return MODEL_PRICING[modelName] || DEFAULT_PRICING;
}

/**
 * Calculate the cost for a given token usage
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens used
 * @param modelName - The model name in OpenRouter format
 * @returns Estimated cost in USD
 */
export function calculateCost(inputTokens: number, outputTokens: number, modelName: string): number {
    const pricing = getModelPricing(modelName);
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
}

/**
 * Calculate cost with markup for paid tier
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens used
 * @param modelName - The model name in OpenRouter format
 * @param markup - Markup multiplier (e.g., 1.5 for 50% markup)
 * @param baseFee - Base fee to add (in USD)
 * @returns Total cost including markup and base fee
 */
export function calculatePaidTierCost(
    inputTokens: number,
    outputTokens: number,
    modelName: string,
    markup: number = 1.5,
    baseFee: number = 0.02,
): number {
    const baseCost = calculateCost(inputTokens, outputTokens, modelName);
    return baseCost * markup + baseFee;
}
