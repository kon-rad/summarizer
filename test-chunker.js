/**
 * Simple test to verify chunker doesn't cause infinite loops
 */

import { chunkText } from './src/chunker.js';

const testText = "This is a test. It has multiple sentences. We want to ensure it chunks correctly. And doesn't hang forever.";

console.log('Testing chunker with text length:', testText.length);
console.log('Text:', testText);

const options = {
    chunkSize: 50,
    chunkOverlap: 10
};

console.log('\nChunking with options:', options);

const chunks = chunkText(testText, options);

console.log('\nResult:', chunks.length, 'chunks');
chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1}:`, chunk);
});

console.log('\n✓ Test passed - no infinite loop!');
