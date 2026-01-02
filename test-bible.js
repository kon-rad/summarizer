/**
 * Test script for Bible summarization
 * Run with: bun run test-bible.js
 */

import { readFile } from 'fs/promises';
import { Actor } from 'apify';

// Mock Actor for local testing
const mockActor = {
    init: async () => {},
    getInput: async () => {
        // Read the Bible test file (use tiny version for safety)
        const text = await readFile('./data/bible-tiny.txt', 'utf-8');

        console.log(`\n📖 Testing with ${text.length} characters from the Bible\n`);

        return {
            text,
            modelName: 'openai/gpt-4o-mini',
            summaryLength: 'short', // Use short to reduce API costs
            apiKey: process.env.OPEN_ROUTER_API_KEY,
            chunkSize: 2000, // Smaller chunks for safer processing
            chunkOverlap: 100,
        };
    },
    pushData: async (data) => {
        console.log('\n=== SUMMARIZATION RESULT ===');
        console.log('Summary:', data.summary);
        console.log('\n=== METADATA ===');
        console.log(JSON.stringify(data.metadata, null, 2));
        console.log('\n=== COST TRACKING ===');
        console.log(JSON.stringify(data.costTracking, null, 2));
    },
    setValue: async (key, value) => {
        console.log(`\n✓ Saved ${key} to key-value store`);
    },
    exit: async () => {
        console.log('\n✓ Test completed successfully!');
    }
};

// Replace Actor with mock
Object.assign(Actor, mockActor);

// Import and run the main script
import('./src/main.js').catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
});
