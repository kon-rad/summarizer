/**
 * Recursive summarization module using OpenRouter API
 */

import { log } from 'apify';
import OpenAI from 'openai';
import { chunkText, estimateTokenCount, type ChunkOptions } from './chunker.js';

export interface SummarizerOptions {
    modelName: string;
    apiKey: string;
    summaryLength: 'short' | 'medium' | 'long';
    systemPrompt?: string;
    chunkSize: number;
    chunkOverlap: number;
}

export interface SummarizationResult {
    summary: string;
    originalLength: number;
    summaryLength: number;
    chunksProcessed: number;
    recursionLevels: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

/**
 * Gets the default system prompt based on summary length
 */
function getDefaultSystemPrompt(summaryLength: 'short' | 'medium' | 'long'): string {
    const lengthGuidance = {
        short: 'Provide a concise summary in 2-3 sentences, capturing only the most essential points.',
        medium: 'Provide a comprehensive summary in 1-2 paragraphs, covering the main ideas and key supporting details.',
        long: 'Provide a detailed summary that captures all important points, key arguments, and significant details. Aim for 3-4 paragraphs.',
    };

    return `You are a helpful assistant that summarizes text accurately and concisely. ${lengthGuidance[summaryLength]} Maintain the original meaning and important context. Do not add information that wasn't in the original text.`;
}

/**
 * Calls the LLM API to summarize a single piece of text
 */
async function summarizeChunk(
    text: string,
    client: OpenAI,
    modelName: string,
    systemPrompt: string,
): Promise<{ summary: string; inputTokens: number; outputTokens: number }> {
    try {
        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Please summarize the following text:\n\n${text}` },
            ],
            temperature: 0.3, // Lower temperature for more consistent summaries
        });

        const summary = response.choices[0]?.message?.content?.trim();

        if (!summary) {
            throw new Error('Empty response from LLM');
        }

        // Extract token usage from response
        const inputTokens = response.usage?.prompt_tokens || 0;
        const outputTokens = response.usage?.completion_tokens || 0;

        log.info('Chunk summarized', {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
        });

        return { summary, inputTokens, outputTokens };
    } catch (error) {
        log.error('Error calling LLM API', { error });
        throw new Error(`Failed to summarize chunk: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Recursively summarizes text by chunking and combining summaries
 */
async function recursiveSummarize(
    text: string,
    client: OpenAI,
    options: SummarizerOptions,
    level: number = 1,
): Promise<{ summary: string; levels: number; chunks: number; inputTokens: number; outputTokens: number }> {
    const { modelName, systemPrompt, chunkSize, chunkOverlap, summaryLength } = options;

    const finalSystemPrompt = systemPrompt || getDefaultSystemPrompt(summaryLength);

    // Base case: if text is small enough, summarize directly
    const estimatedTokens = estimateTokenCount(text);
    const maxTokens = chunkSize / 4; // Convert characters to approximate tokens

    if (estimatedTokens <= maxTokens) {
        log.info(`Level ${level}: Summarizing directly (${estimatedTokens} estimated tokens)`);
        const result = await summarizeChunk(text, client, modelName, finalSystemPrompt);
        return {
            summary: result.summary,
            levels: level,
            chunks: 1,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
        };
    }

    // Recursive case: split into chunks, summarize each, then combine
    log.info(`Level ${level}: Splitting text into chunks (${text.length} characters)`);

    const chunkOptions: ChunkOptions = { chunkSize, chunkOverlap };
    const chunks = chunkText(text, chunkOptions);

    log.info(`Level ${level}: Created ${chunks.length} chunks`);

    // Summarize each chunk in batches to avoid memory overflow
    const BATCH_SIZE = 10; // Process 10 chunks at a time
    const chunkSummaries: string[] = [];
    let levelInputTokens = 0;
    let levelOutputTokens = 0;

    for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, chunks.length);
        const batch = chunks.slice(batchStart, batchEnd);

        log.info(`Level ${level}: Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (chunks ${batchStart + 1}-${batchEnd}/${chunks.length})`);

        // Process batch chunks sequentially
        for (let i = 0; i < batch.length; i++) {
            const chunkIndex = batchStart + i;
            log.info(`Level ${level}: Summarizing chunk ${chunkIndex + 1}/${chunks.length}`);
            const result = await summarizeChunk(batch[i], client, modelName, finalSystemPrompt);
            chunkSummaries.push(result.summary);
            levelInputTokens += result.inputTokens;
            levelOutputTokens += result.outputTokens;

            // Help garbage collection by clearing chunk reference
            batch[i] = '';
        }
    }

    // Clear chunks array to free memory
    chunks.length = 0;

    // Combine all chunk summaries
    const combinedSummaries = chunkSummaries.join('\n\n');

    log.info(`Level ${level}: Combined summaries length: ${combinedSummaries.length} characters`);

    // If combined summaries are still too long, recurse
    const combinedTokens = estimateTokenCount(combinedSummaries);

    if (combinedTokens > maxTokens && chunks.length > 1) {
        log.info(`Level ${level}: Combined summaries still too long, recursing...`);
        const result = await recursiveSummarize(combinedSummaries, client, options, level + 1);
        return {
            summary: result.summary,
            levels: result.levels,
            chunks: chunks.length + result.chunks,
            inputTokens: levelInputTokens + result.inputTokens,
            outputTokens: levelOutputTokens + result.outputTokens,
        };
    }

    // Final summarization of combined summaries
    log.info(`Level ${level}: Creating final summary`);
    const finalResult = await summarizeChunk(combinedSummaries, client, modelName, finalSystemPrompt);

    // Clear summaries to free memory
    chunkSummaries.length = 0;

    return {
        summary: finalResult.summary,
        levels: level,
        chunks: chunks.length,
        inputTokens: levelInputTokens + finalResult.inputTokens,
        outputTokens: levelOutputTokens + finalResult.outputTokens,
    };
}

/**
 * Main entry point for text summarization
 */
export async function summarizeText(text: string, options: SummarizerOptions): Promise<SummarizationResult> {
    log.info('Starting text summarization', {
        textLength: text.length,
        modelName: options.modelName,
        summaryLength: options.summaryLength,
        chunkSize: options.chunkSize,
        chunkOverlap: options.chunkOverlap,
    });

    // Initialize OpenAI-compatible client for OpenRouter
    const client = new OpenAI({
        apiKey: options.apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
            'HTTP-Referer': 'https://apify.com',
            'X-Title': 'Apify Text Summarizer',
        },
    });

    const originalLength = text.length;

    // Perform recursive summarization
    const result = await recursiveSummarize(text, client, options);

    const summaryLength = result.summary.length;
    const totalTokens = result.inputTokens + result.outputTokens;

    log.info('Summarization complete', {
        originalLength,
        summaryLength,
        compressionRatio: (originalLength / summaryLength).toFixed(2),
        chunksProcessed: result.chunks,
        recursionLevels: result.levels,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens,
    });

    return {
        summary: result.summary,
        originalLength,
        summaryLength,
        chunksProcessed: result.chunks,
        recursionLevels: result.levels,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens,
    };
}
