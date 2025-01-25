import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkFactWithPerplexity } from './services/perplexityApi';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface FactCheckRequest {
  statement: string;
  model?: 'sonar' | 'sonar-pro';
}

interface FactCheckResponse {
  isFactual: boolean;
  confidence: number;
  explanation: string;
  sources: string[];
}

// Routes
app.post('/api/check-fact', async (req, res) => {
  try {
    const { statement, model } = req.body as FactCheckRequest;
    
    if (!statement || typeof statement !== 'string') {
      return res.status(400).json({ 
        error: 'Statement is required and must be a string' 
      });
    }

    if (model && !['sonar', 'sonar-pro'].includes(model)) {
      return res.status(400).json({ 
        error: 'Invalid model specified. Must be either "sonar" or "sonar-pro"' 
      });
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error: Perplexity API key is not configured',
        details: 'Please contact the administrator to resolve this issue.'
      });
    }

    console.log('Processing fact check request:', { statement, model });
    const result = await checkFactWithPerplexity(statement, { model });
    console.log('Fact check completed successfully');
    
    res.json(result);
  } catch (error) {
    console.error('Error processing fact check:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(500).json({ 
          error: 'Server configuration error',
          details: error.message
        });
      }
      
      if (error.message.includes('Invalid response') || 
          error.message.includes('Invalid JSON')) {
        return res.status(502).json({ 
          error: 'Received invalid response from fact-checking service',
          details: error.message
        });
      }

      if (error.message.includes('temporarily unavailable')) {
        return res.status(502).json({ 
          error: 'Fact-checking service is temporarily unavailable',
          details: 'Please try again later'
        });
      }
    }

    // Generic error response
    res.status(500).json({ 
      error: 'Failed to check fact',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    apiConfigured: !!process.env.PERPLEXITY_API_KEY,
    models: ['sonar', 'sonar-pro']
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API key configured: ${!!process.env.PERPLEXITY_API_KEY}`);
}); 