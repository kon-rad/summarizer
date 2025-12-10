// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/).
import { Actor, log } from 'apify';
import { summarizeText, type SummarizerOptions } from './summarizer.js';

// This is an ESM project, and as such, it requires you to specify extensions in your relative imports
// Read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// Note that we need to use `.js` even when inside TS files

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

interface Input {
    text: string;
    modelName?: string;
    summaryLength?: 'short' | 'medium' | 'long';
    systemPrompt?: string;
    apiKey: string;
    chunkSize?: number;
    chunkOverlap?: number;
}

// Structure of input is defined in input_schema.json
const input = await Actor.getInput<Input>();
if (!input) throw new Error('Input is missing!');

const {
    text,
    modelName = 'gpt-4o-mini',
    summaryLength = 'medium',
    systemPrompt,
    apiKey,
    chunkSize = 4000,
    chunkOverlap = 200,
} = input;

// Validate required inputs
if (!text || text.trim().length === 0) {
    throw new Error('Input text is required and cannot be empty');
}

if (!apiKey) {
    throw new Error('API key is required');
}

log.info('Starting summarization job', {
    textLength: text.length,
    modelName,
    summaryLength,
    chunkSize,
    chunkOverlap,
    hasCustomSystemPrompt: !!systemPrompt,
});

try {
    // Prepare summarizer options
    const options: SummarizerOptions = {
        modelName,
        apiKey,
        summaryLength,
        systemPrompt,
        chunkSize,
        chunkOverlap,
    };

    // Perform summarization
    const result = await summarizeText(text, options);

    log.info('Summarization completed successfully', {
        originalLength: result.originalLength,
        summaryLength: result.summaryLength,
        compressionRatio: (result.originalLength / result.summaryLength).toFixed(2),
        chunksProcessed: result.chunksProcessed,
        recursionLevels: result.recursionLevels,
    });

    // Prepare output data
    const outputData = {
        summary: result.summary,
        metadata: {
            originalLength: result.originalLength,
            summaryLength: result.summaryLength,
            compressionRatio: parseFloat((result.originalLength / result.summaryLength).toFixed(2)),
            chunksProcessed: result.chunksProcessed,
            recursionLevels: result.recursionLevels,
            modelUsed: modelName,
            summaryLengthSetting: summaryLength,
            timestamp: new Date().toISOString(),
        },
    };

    // Save results to Dataset - a table-like storage.
    await Actor.pushData(outputData);

    // Also save to key-value store for easy access
    await Actor.setValue('OUTPUT', outputData);

    log.info('Results saved to dataset and key-value store');
} catch (error) {
    log.error('Summarization failed', { error });
    throw error;
}

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
