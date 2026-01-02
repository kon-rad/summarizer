
import express from 'express';
import cors from 'cors';
import { paymentMiddleware } from '@x402/express';
import { summarizeText } from './summarizer.js';

const app = express();
const PORT = process.env.PORT || 4021;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Check for required environment variables
if (!process.env.OPEN_ROUTER_API_KEY) {
    console.warn('Warning: OPEN_ROUTER_API_KEY is not set. Summarization will fail unless provided in the request body (which is not standard for this protected endpoint).');
}

// X402 Payment Configuration
// Replace with your actual wallet address
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || '0xYourWalletAddress';

app.use(
    paymentMiddleware(
        {
            // Protect the summarize endpoint
            'POST /api/summarize': {
                accepts: [
                    {
                        scheme: 'exact',
                        price: '0.10',
                        network: 'eip155:84532',
                        payTo: WALLET_ADDRESS,
                    },
                ],
            },
        },
        'https://x402.org/facilitator' // Testnet facilitator
    )
);

app.post('/api/summarize', async (req, res) => {
    try {
        const {
            text,
            modelName = 'openai/gpt-4o-mini',
            summaryLength = 'medium',
            systemPrompt,
            chunkSize = 4000,
            chunkOverlap = 200,
        } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Use server-side API key if not provided (clients shouldn't send their own if they are paying x402)
        const apiKey = process.env.OPEN_ROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Service configuration error: Missing API Key' });
        }

        const options = {
            modelName,
            apiKey,
            summaryLength,
            systemPrompt,
            chunkSize,
            chunkOverlap,
        };

        const result = await summarizeText(text, options);

        return res.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Summarization error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

app.get('/', (_req, res) => {
    res.send('Summarizer AI Agent Service with x402 Payments is running. Use POST /api/summarize to use the service.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`x402 Payment Middleware active`);
});
