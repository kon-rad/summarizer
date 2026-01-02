# Pricing Implementation Guide

## Phase 1: Cost Tracking & Measurement ✅ COMPLETED

### What Was Implemented

1. **Token Tracking System**
   - Updated `SummarizationResult` interface to include `inputTokens`, `outputTokens`, and `totalTokens`
   - Modified `summarizeChunk()` to capture token usage from OpenRouter API responses
   - Implemented recursive token tracking throughout the summarization process

2. **Model Pricing Database** ([src/pricing.ts](src/pricing.ts))
   - Created comprehensive pricing database for 20+ popular models
   - Includes OpenAI, Anthropic, Meta, Google, and Mistral models
   - Pricing per 1M tokens (input and output separately)
   - Helper functions: `getModelPricing()`, `calculateCost()`, `calculatePaidTierCost()`

3. **Cost Calculation** ([src/main.ts](src/main.ts))
   - Automatic cost calculation after each summarization
   - Logs detailed cost breakdown to Apify logs
   - Stores cost data in output for analysis

4. **Enhanced Output Schema**
   - Added `costTracking` object to dataset output
   - Includes: `inputTokens`, `outputTokens`, `totalTokens`, `estimatedCost`, `pricingPerMillionTokens`
   - Updated dataset schema to display token usage and costs in Apify UI

5. **Required API Key**
   - Made `apiKey` required in input schema for Phase 1
   - Ensures all runs are tracked and measured

### Output Example

```json
{
  "summary": "...",
  "metadata": {
    "originalLength": 1500,
    "summaryLength": 250,
    "compressionRatio": 6.0,
    "chunksProcessed": 1,
    "recursionLevels": 1,
    "modelUsed": "openai/gpt-4o-mini",
    "summaryLengthSetting": "medium",
    "timestamp": "2025-01-11T..."
  },
  "costTracking": {
    "inputTokens": 450,
    "outputTokens": 75,
    "totalTokens": 525,
    "estimatedCost": 0.0001125,
    "pricingPerMillionTokens": {
      "input": 0.15,
      "output": 0.60
    },
    "currency": "USD"
  }
}
```

---

## Phase 2: Dual Pricing Model (FREE + PAID) - NEXT STEPS

### Implementation Plan

#### Overview
Offer both FREE tier (user's API key) and PAID tier (your API key with markup).

### Step 1: Add Pricing Tier Input

Update [.actor/input_schema.json](.actor/input_schema.json):

```json
{
  "pricingTier": {
    "title": "Pricing Tier",
    "type": "string",
    "description": "Choose your pricing tier",
    "editor": "select",
    "enum": ["free", "paid"],
    "default": "free",
    "enumTitles": [
      "Free - Bring your own OpenRouter API key",
      "Paid - Use our API key (1.5x markup + $0.02 base fee)"
    ]
  },
  "apiKey": {
    "title": "OpenRouter API Key (Free Tier Only)",
    "type": "string",
    "description": "Required for free tier. Leave empty for paid tier.",
    "editor": "textfield",
    "isSecret": true
  }
}
```

Update `required` fields:
```json
"required": ["text"]  // API key only required conditionally
```

### Step 2: Update main.ts Logic

Add tier-based API key handling:

```typescript
interface Input {
    text: string;
    pricingTier?: 'free' | 'paid';
    modelName?: string;
    summaryLength?: 'short' | 'medium' | 'long';
    systemPrompt?: string;
    apiKey?: string;
    chunkSize?: number;
    chunkOverlap?: number;
}

const {
    text,
    pricingTier = 'free',
    modelName = 'openai/gpt-4o-mini',
    summaryLength = 'medium',
    systemPrompt,
    apiKey: inputApiKey,
    chunkSize = 4000,
    chunkOverlap = 200,
} = input;

// Determine which API key to use
let apiKey: string;
if (pricingTier === 'free') {
    apiKey = inputApiKey || process.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('API key required for free tier. Provide in input or set OPEN_ROUTER_API_KEY env variable.');
    }
} else {
    // Paid tier: use Actor owner's API key
    apiKey = process.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('Paid tier unavailable. Actor owner must configure OPEN_ROUTER_API_KEY.');
    }
}

// After summarization, calculate pricing
const baseCost = calculateCost(result.inputTokens, result.outputTokens, modelName);
const userCost = pricingTier === 'paid'
    ? calculatePaidTierCost(result.inputTokens, result.outputTokens, modelName)
    : baseCost;

// Add to output
const outputData = {
    // ... existing fields ...
    costTracking: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        baseCost,  // Actual API cost
        userCost,  // What user pays (same as baseCost for free, marked up for paid)
        markup: pricingTier === 'paid' ? 1.5 : 1.0,
        pricingTier,
        currency: 'USD',
    },
};
```

### Step 3: Configure Actor Monetization in Apify

1. **Go to Apify Console** → Your Actor → Settings → Monetization
2. **Enable "Paid Actor"**
3. **Set pricing model**: Choose "Per Run" or "Per Compute Unit"

**Recommended Pricing Model:**

```
Dynamic pricing based on actual usage:
- Free tier: $0 (user pays OpenRouter directly)
- Paid tier: Charge actual cost with markup

Option A: Flat markup
  Price = (LLM cost × 1.5) + $0.02

Option B: Tiered pricing
  Small (< 5,000 tokens): $0.05
  Medium (5,000-20,000 tokens): $0.15
  Large (20,000-100,000 tokens): $0.50
  X-Large (> 100,000 tokens): $1.00+
```

### Step 4: Set Environment Variable

In Apify Console → Actor Settings → Environment Variables:

```
OPEN_ROUTER_API_KEY=sk-or-v1-your-key-here
```

Mark as **secret** ✓

### Step 5: Update README

Add pricing section:

```markdown
## Pricing

### Free Tier
- Bring your own OpenRouter API key
- Unlimited usage
- Pay OpenRouter directly
- Full feature access

### Paid Tier
- No API key needed
- Convenient usage
- 1.5x markup on API costs + $0.02 base fee
- Example: 10,000 token summary ≈ $0.04

Choose your tier in the input!
```

### Step 6: Update Input Schema Description

```json
{
  "title": "Text Summarization - Choose Your Pricing Tier",
  "description": "FREE tier: Bring your own API key. PAID tier: Use ours with markup."
}
```

---

## Cost Examples by Model

| Model | Input Tokens | Output Tokens | Free Tier Cost | Paid Tier Cost |
|-------|-------------|---------------|----------------|----------------|
| gpt-4o-mini | 10,000 | 1,000 | $0.0021 | $0.0232 |
| gpt-4o | 10,000 | 1,000 | $0.035 | $0.0725 |
| claude-3.5-sonnet | 10,000 | 1,000 | $0.045 | $0.0875 |
| llama-3.1-70b | 10,000 | 1,000 | $0.0127 | $0.0391 |

---

## Testing Phase 1

Run the Actor locally with:

```bash
export OPEN_ROUTER_API_KEY="your-key"
apify run
```

Check logs for:
- ✅ Token usage per chunk
- ✅ Total tokens (input + output)
- ✅ Estimated cost in USD
- ✅ Cost breakdown by model pricing

Check dataset output for:
- ✅ `costTracking` object present
- ✅ All token counts accurate
- ✅ Estimated cost matches manual calculation

---

## Next Steps

1. ✅ Phase 1 Complete - Test cost tracking
2. ⏳ Phase 2 - Implement dual pricing tier
3. ⏳ Deploy to Apify platform
4. ⏳ Enable monetization
5. ⏳ Monitor usage and adjust pricing

---

## Maintenance

### Update Pricing Regularly

Models change pricing frequently. Update [src/pricing.ts](src/pricing.ts):

1. Check OpenRouter pricing: https://openrouter.ai/models
2. Update `MODEL_PRICING` object
3. Add new models as they become available
4. Redeploy Actor

### Monitor Margins

For paid tier, track:
- Average markup earned per run
- Cost of providing the service
- Comparison to competitors
- User feedback on pricing

---

## Questions?

- Free tier: User pays OpenRouter directly
- Paid tier: You pay OpenRouter, charge user with markup
- Apify takes 20-30% platform fee on paid tier revenue
- You keep 70-80% of paid tier revenue minus your OpenRouter costs
