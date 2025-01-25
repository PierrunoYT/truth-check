import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

type PerplexityModel = 'sonar' | 'sonar-pro';

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface PerplexityResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: 'stop' | 'length';
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

interface FactCheckOptions {
  model?: PerplexityModel;
  maxTokens?: number;
}

export async function checkFactWithPerplexity(
  statement: string, 
  options: FactCheckOptions = {}
): Promise<{ 
  isFactual: boolean;
  confidence: number;
  explanation: string;
  sources: string[];
}> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key is not configured');
  }

  const { 
    model = 'sonar', // Default to sonar if not specified
    maxTokens = model === 'sonar-pro' ? 8000 : 4000 // Higher limit for sonar-pro
  } = options;

  try {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: `You are a fact-checking assistant with web search capabilities. For the given statement:
                 1. Search the web for relevant, up-to-date information
                 2. Analyze multiple reliable sources to verify the claim
                 3. Provide a detailed explanation with specific evidence
                 4. Include direct citations to credible sources
                 
                 Your response must be valid JSON with this exact structure:
                 {
                   "isFactual": boolean indicating if the statement is accurate based on current evidence,
                   "confidence": number between 0 and 100 representing certainty level,
                   "explanation": detailed analysis with specific evidence from sources,
                   "sources": array of source URLs that were used to verify the claim
                 }`
      },
      {
        role: 'user',
        content: `Please fact check the following statement: "${statement}"`
      }
    ];

    console.log(`Sending request to Perplexity API using ${model}...`);
    const response = await axios.post<PerplexityResponse>(
      PERPLEXITY_API_URL,
      {
        model,
        messages,
        temperature: 0.2, // Default temperature for consistent responses
        max_tokens: maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Received response from Perplexity API');
    const content = response.data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Invalid response from Perplexity API: No content received');
    }

    try {
      // Clean the content by removing markdown code blocks if present
      const cleanContent = content.replace(/^```json\n|\n```$/g, '').trim();
      const result = JSON.parse(cleanContent);
      
      // Validate the response structure
      if (typeof result.isFactual !== 'boolean' ||
          typeof result.confidence !== 'number' ||
          typeof result.explanation !== 'string' ||
          !Array.isArray(result.sources)) {
        throw new Error('Invalid response format from Perplexity API');
      }

      // Include citations from the API response if available
      const sources = response.data.citations || result.sources;

      return {
        isFactual: result.isFactual,
        confidence: Math.min(Math.max(result.confidence, 0), 100), // Ensure confidence is between 0-100
        explanation: result.explanation,
        sources
      };
    } catch (parseError) {
      console.error('Failed to parse Perplexity API response:', content);
      throw new Error('Invalid JSON response from Perplexity API');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      
      console.error('Perplexity API Error:', {
        status,
        data: responseData,
        message: error.message,
        url: PERPLEXITY_API_URL
      });

      // Handle specific error cases
      if (status === 401) {
        throw new Error('Invalid or missing API key. Please check your configuration.');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (status === 502 || status === 503 || status === 504) {
        throw new Error('Perplexity API is temporarily unavailable. Please try again later.');
      }

      throw new Error(`Perplexity API error (${status}): ${responseData?.error || error.message}`);
    }
    
    // For non-Axios errors
    console.error('Unexpected error:', error);
    throw new Error('An unexpected error occurred while checking facts');
  }
} 