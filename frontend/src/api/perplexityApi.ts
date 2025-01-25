import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export type PerplexityModel = 'sonar' | 'sonar-pro';

// This is a mock API client - replace with actual Perplexity API implementation
export interface FactCheckResponse {
  isFactual: boolean;
  confidence: number;
  explanation: string;
  sources: string[];
}

export interface FactCheckOptions {
  model?: PerplexityModel;
}

// This is a placeholder implementation that simulates fact-checking behavior
export async function checkFact(
  statement: string, 
  options: FactCheckOptions = {}
): Promise<FactCheckResponse> {
  try {
    const response = await axios.post(`${API_URL}/check-fact`, { 
      statement,
      model: options.model
    });
    return response.data;
  } catch (error) {
    console.error('Error checking fact:', error);
    if (axios.isAxiosError(error)) {
      // Extract the error message from the backend response
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.details ||
                         error.message;
      
      // Handle specific status codes
      if (error.response?.status === 500) {
        throw new Error('Internal server error. Please try again later.');
      } else if (error.response?.status === 502) {
        throw new Error('Fact-checking service is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(errorMessage);
    }
    throw new Error('Failed to check fact. Please try again.');
  }
}

function generateExplanation(statement: string, isFactual: boolean): string {
  const baseExplanations = isFactual ? [
    "Based on available data, this statement appears to be accurate.",
    "Multiple reliable sources confirm this information.",
    "This claim is supported by current evidence."
  ] : [
    "This statement contains inaccuracies or misrepresentations.",
    "Available evidence does not support this claim.",
    "This information appears to be incorrect based on current data."
  ];
  
  return `${baseExplanations[Math.floor(Math.random() * baseExplanations.length)]} The statement "${statement}" has been analyzed using multiple verification methods and cross-referenced with reliable sources.`;
}

function generateSources(statement: string): string[] {
  const domains = [
    'wikipedia.org',
    'reuters.com',
    'apnews.com',
    'sciencedirect.com',
    'nature.com',
    'who.int'
  ];
  
  // Generate 2-3 relevant-looking sources
  const numSources = 2 + Math.floor(Math.random() * 2);
  const sources = [];
  
  for (let i = 0; i < numSources; i++) {
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const path = statement
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);
    sources.push(`https://www.${domain}/article/${path}-${Math.floor(Math.random() * 1000)}`);
  }
  
  return sources;
} 