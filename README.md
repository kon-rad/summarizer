# AI Text Summarizer with Recursive Chunking

An Apify Actor that summarizes long text documents using AI via OpenRouter with intelligent recursive chunking. This Actor can handle documents of any length by breaking them into manageable chunks, summarizing each chunk, and recursively combining summaries until a final concise summary is produced. Supports multiple LLM providers through OpenRouter including OpenAI, Anthropic, Meta, Google, and more.

## Features

- **Recursive Summarization**: Handles documents of unlimited length by recursively chunking and summarizing
- **Intelligent Chunking**: Splits text at sentence and word boundaries to preserve context
- **Configurable Summary Length**: Choose from short, medium, or long summaries
- **Custom System Prompts**: Optional custom prompts to guide the summarization style
- **Multiple Model Support**: Access to 100+ models via OpenRouter:
  - OpenAI (GPT-4o, GPT-4o-mini, GPT-3.5)
  - Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
  - Meta (Llama 3.1, Llama 3.2)
  - Google (Gemini Pro, Gemini Flash)
  - And many more!
- **Detailed Metadata**: Tracks compression ratios, chunks processed, and recursion levels
- **Chunk Overlap**: Maintains context between chunks with configurable overlap
- **Environment Variable Support**: Use `OPEN_ROUTER_API_KEY` for seamless deployment

## Included Features

- **[Apify SDK](https://docs.apify.com/sdk/js/)** - toolkit for building [Actors](https://apify.com/actors)
- **[Input Schema](https://docs.apify.com/platform/actors/development/input-schema)** - validated input parameters
- **[Dataset](https://docs.apify.com/sdk/js/docs/guides/result-storage#dataset)** - structured storage for results
- **[OpenRouter](https://openrouter.ai/)** - unified API for 100+ LLM models

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
- **apiKey** (optional): Your OpenRouter API key. Can also be set via `OPEN_ROUTER_API_KEY` environment variable
- **modelName**: The model to use in OpenRouter format (default: "openai/gpt-4o-mini")
  - Examples: `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.1-70b-instruct`
  - See [OpenRouter Models](https://openrouter.ai/models) for full list
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
  "modelName": "openai/gpt-4o-mini",
  "summaryLength": "medium",
  "apiKey": "sk-or-v1-...",
  "chunkSize": 4000,
  "chunkOverlap": 200
}
```

Or using environment variable:

```json
{
  "text": "Your long text here...",
  "modelName": "anthropic/claude-3.5-sonnet",
  "summaryLength": "long"
}
```

With `OPEN_ROUTER_API_KEY` set in your environment.

## Getting Started

### Prerequisites

- Node.js 16 or higher
- Apify CLI installed (`npm install -g apify-cli`)
- OpenRouter API key (get one free at [openrouter.ai/keys](https://openrouter.ai/keys))

### Local Development

1. Clone or navigate to the project directory:

```bash
cd summarizer
```

2. Install dependencies:

```bash
npm install
```

3. Set your OpenRouter API key as an environment variable:

```bash
export OPEN_ROUTER_API_KEY="sk-or-v1-..."
```

Or edit the INPUT.json file in `storage/key_value_stores/default/INPUT.json`:

```json
{
  "text": "Your text to summarize...",
  "modelName": "openai/gpt-4o-mini",
  "summaryLength": "medium",
  "apiKey": "sk-or-v1-...",
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

### Recommended Approach: Environment Variables

The best practice is to use the `OPEN_ROUTER_API_KEY` environment variable:

**Local development:**
```bash
export OPEN_ROUTER_API_KEY="sk-or-v1-..."
apify run
```

**Apify platform:**
Set the environment variable in your Actor settings under the "Environment variables" section.

### Alternative Approaches:
- Store the key in INPUT.json for testing (make sure it's in .gitignore)
- Use Apify's secret storage when deployed

## Limitations

- Requires an OpenRouter API key (costs vary by model - see [OpenRouter pricing](https://openrouter.ai/models))
- Processing time increases with document length
- Very large documents will require multiple API calls
- Rate limits depend on your OpenRouter account tier

## Documentation Reference

- [Apify SDK for JavaScript documentation](https://docs.apify.com/sdk/js)
- [Apify Platform documentation](https://docs.apify.com/platform)
- [OpenRouter documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [Join Apify developer community on Discord](https://discord.com/invite/jyEM2PRvMU)

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC
