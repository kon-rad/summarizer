# AI Text Summarizer with Recursive Chunking

An Apify Actor that summarizes long text documents using AI (OpenAI GPT models) with intelligent recursive chunking. This Actor can handle documents of any length by breaking them into manageable chunks, summarizing each chunk, and recursively combining summaries until a final concise summary is produced.

## Features

- **Recursive Summarization**: Handles documents of unlimited length by recursively chunking and summarizing
- **Intelligent Chunking**: Splits text at sentence and word boundaries to preserve context
- **Configurable Summary Length**: Choose from short, medium, or long summaries
- **Custom System Prompts**: Optional custom prompts to guide the summarization style
- **Multiple Model Support**: Works with any OpenAI model (GPT-4o, GPT-4o-mini, etc.)
- **Detailed Metadata**: Tracks compression ratios, chunks processed, and recursion levels
- **Chunk Overlap**: Maintains context between chunks with configurable overlap

## Included Features

- **[Apify SDK](https://docs.apify.com/sdk/js/)** - toolkit for building [Actors](https://apify.com/actors)
- **[Input Schema](https://docs.apify.com/platform/actors/development/input-schema)** - validated input parameters
- **[Dataset](https://docs.apify.com/sdk/js/docs/guides/result-storage#dataset)** - structured storage for results
- **[OpenAI API](https://platform.openai.com/docs/api-reference)** - GPT models for summarization

## How It Works

1. **Input Processing**: `Actor.getInput()` retrieves text and configuration parameters
2. **Text Chunking**: Large text is split into chunks with smart boundary detection
3. **Chunk Summarization**: Each chunk is summarized using the specified LLM
4. **Recursive Combination**: If combined summaries are still too long, the process repeats
5. **Final Output**: The final summary is saved to both Dataset and Key-Value Store

### Recursive Summarization Algorithm

```typescript
function recursiveSummarize(text):
    if text is small enough:
        return summarize(text)
    else:
        chunks = splitIntoChunks(text)
        summaries = [summarize(chunk) for chunk in chunks]
        combined = joinSummaries(summaries)
        return recursiveSummarize(combined)  // Recurse if needed
```

## Input Parameters

- **text** (required): The text content to summarize
- **apiKey** (required): Your OpenAI API key
- **modelName**: The model to use (default: "gpt-4o-mini")
- **summaryLength**: Desired length - "short", "medium", or "long" (default: "medium")
- **systemPrompt**: Optional custom system prompt for summarization
- **chunkSize**: Maximum characters per chunk (default: 4000)
- **chunkOverlap**: Character overlap between chunks (default: 200)

## Output

The Actor produces:

1. **Summary**: The final summarized text
2. **Metadata**:
   - Original text length
   - Summary length
   - Compression ratio
   - Number of chunks processed
   - Recursion levels used
   - Model used
   - Timestamp

## Example Usage

```json
{
  "text": "Your long text here...",
  "modelName": "gpt-4o-mini",
  "summaryLength": "medium",
  "apiKey": "sk-...",
  "chunkSize": 4000,
  "chunkOverlap": 200
}
```

## Getting Started

### Prerequisites

- Node.js 16 or higher
- Apify CLI installed (`npm install -g apify-cli`)
- OpenAI API key

### Local Development

1. Clone or navigate to the project directory:

```bash
cd summarizer
```

2. Install dependencies:

```bash
npm install
```

3. Edit the INPUT.json file in `storage/key_value_stores/default/INPUT.json`:

```json
{
  "text": "Your text to summarize...",
  "modelName": "gpt-4o-mini",
  "summaryLength": "medium",
  "apiKey": "YOUR_OPENAI_API_KEY",
  "chunkSize": 4000,
  "chunkOverlap": 200
}
```

4. Run the Actor locally:

```bash
apify run
```

## Deploy to Apify

### Connect Git Repository to Apify

If you've created a Git repository for the project, you can easily connect to Apify:

1. Go to [Actor creation page](https://console.apify.com/actors/new)
2. Click on **Link Git Repository** button

### Push Project from Local Machine to Apify

You can also deploy the project on your local machine to Apify without the need for a Git repository.

1. Log in to Apify. You will need to provide your [Apify API Token](https://console.apify.com/account/integrations):

```bash
apify login
```

2. Deploy your Actor. This command will deploy and build the Actor on the Apify Platform:

```bash
apify push
```

You can find your newly created Actor under [Actors -> My Actors](https://console.apify.com/actors?tab=my).

## Architecture

### Modules

- **[src/main.ts](src/main.ts)**: Main Actor entry point, handles input/output
- **[src/summarizer.ts](src/summarizer.ts)**: Core recursive summarization logic
- **[src/chunker.ts](src/chunker.ts)**: Text chunking with intelligent boundary detection

### How Chunking Works

The chunker splits text intelligently:

1. Tries to split at sentence boundaries (. ! ?)
2. Falls back to word boundaries (spaces)
3. Maintains configurable overlap between chunks to preserve context
4. Estimates token counts for optimal API usage

### How Recursive Summarization Works

For large documents:

1. Text is split into chunks
2. Each chunk is summarized individually
3. Summaries are combined
4. If the combined text is still too large, steps 1-3 repeat
5. Process continues until a final manageable summary is achieved

## Use Cases

- Summarizing long research papers
- Creating executive summaries of reports
- Processing meeting transcripts
- Condensing news articles
- Analyzing customer feedback
- Creating TL;DR versions of documentation

## API Key Security

**Important**: Never commit your API key to version control. The Actor's input schema marks the API key as secret (`"isSecret": true`), which ensures it's encrypted when stored on the Apify platform.

For local development, you can:
- Use environment variables
- Store the key in INPUT.json (make sure it's in .gitignore)
- Use Apify's secret storage when deployed

## Limitations

- Requires an OpenAI API key (costs apply based on usage)
- Processing time increases with document length
- Very large documents will require multiple API calls

## Documentation Reference

- [Apify SDK for JavaScript documentation](https://docs.apify.com/sdk/js)
- [Apify Platform documentation](https://docs.apify.com/platform)
- [OpenAI API documentation](https://platform.openai.com/docs/api-reference)
- [Join our developer community on Discord](https://discord.com/invite/jyEM2PRvMU)

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC
