/**
 * Text chunking module for splitting large texts into manageable chunks
 * with optional overlap to preserve context between chunks.
 */

export interface ChunkOptions {
    chunkSize: number;
    chunkOverlap: number;
}

/**
 * Splits text into chunks with optional overlap.
 * @param text - The text to split into chunks
 * @param options - Chunking options (size and overlap)
 * @returns Array of text chunks
 */
export function chunkText(text: string, options: ChunkOptions): string[] {
    const { chunkSize, chunkOverlap } = options;
    const chunks: string[] = [];

    // Handle empty or small text
    if (text.length <= chunkSize) {
        return [text];
    }

    let startIndex = 0;

    while (startIndex < text.length) {
        // Calculate the end index for this chunk
        let endIndex = startIndex + chunkSize;

        // If this is not the last chunk and we're not at the end of the text
        if (endIndex < text.length) {
            // Try to find a sentence boundary (period, question mark, exclamation)
            // Look within the last 20% of the chunk
            const searchStart = endIndex - Math.floor(chunkSize * 0.2);
            const sentenceEnd = findSentenceBoundary(text, searchStart, endIndex);

            if (sentenceEnd !== -1) {
                endIndex = sentenceEnd;
            } else {
                // If no sentence boundary, try to find a word boundary
                const wordBoundary = findWordBoundary(text, endIndex);
                if (wordBoundary !== -1) {
                    endIndex = wordBoundary;
                }
            }
        } else {
            // Last chunk - take everything remaining
            endIndex = text.length;
        }

        // Extract the chunk
        const chunk = text.slice(startIndex, endIndex).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        // Move to next chunk with overlap
        const nextStart = endIndex - chunkOverlap;

        // Ensure we're always moving forward to prevent infinite loops
        if (nextStart <= startIndex) {
            startIndex = endIndex;
        } else {
            startIndex = nextStart;
        }

        // Safety check: if we're not making progress, force move forward
        if (startIndex >= text.length) {
            break;
        }
    }

    return chunks;
}

/**
 * Finds the nearest sentence boundary (. ! ?) near the target index.
 * @param text - The text to search
 * @param searchStart - Start of search range
 * @param searchEnd - End of search range
 * @returns Index after the sentence boundary, or -1 if not found
 */
function findSentenceBoundary(text: string, searchStart: number, searchEnd: number): number {
    const searchText = text.slice(searchStart, searchEnd);
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];

    let bestIndex = -1;

    for (const ender of sentenceEnders) {
        const index = searchText.lastIndexOf(ender);
        if (index !== -1 && index > bestIndex) {
            bestIndex = index;
        }
    }

    if (bestIndex !== -1) {
        return searchStart + bestIndex + 1; // +1 to include the punctuation
    }

    return -1;
}

/**
 * Finds the nearest word boundary (space) near the target index.
 * @param text - The text to search
 * @param targetIndex - Target index to search near
 * @returns Index of the word boundary, or -1 if not found
 */
function findWordBoundary(text: string, targetIndex: number): number {
    // Look for a space within 50 characters before the target
    const searchStart = Math.max(0, targetIndex - 50);
    const searchText = text.slice(searchStart, targetIndex);
    const lastSpace = searchText.lastIndexOf(' ');

    if (lastSpace !== -1) {
        return searchStart + lastSpace + 1;
    }

    return -1;
}

/**
 * Estimates the number of tokens in a text (rough approximation).
 * This uses a simple heuristic: ~4 characters per token on average.
 * @param text - The text to estimate
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
}
