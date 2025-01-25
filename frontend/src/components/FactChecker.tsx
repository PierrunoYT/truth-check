import React, { useState, useEffect } from 'react';
import { checkFact, FactCheckResponse, PerplexityModel } from '../api/perplexityApi';

export const FactChecker: React.FC = () => {
  const [statement, setStatement] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<PerplexityModel>('sonar');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await checkFact(statement, { model });
      setResult(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(message);
      console.error('Error checking fact:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-full w-full flex ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-4 right-4 p-2 rounded-full bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Left Panel */}
      <div className={`w-[500px] ${isDarkMode ? 'bg-gray-800' : 'bg-white'} h-full flex flex-col`}>
        <div className="p-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            AI Fact Checker
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Enter any statement and our AI will verify its accuracy using multiple reliable sources
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-8 pt-0">
          {/* Model Selection */}
          <div className="mb-4">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
              Model
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-500"
                  name="model"
                  value="sonar"
                  checked={model === 'sonar'}
                  onChange={(e) => setModel(e.target.value as PerplexityModel)}
                />
                <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sonar</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-500"
                  name="model"
                  value="sonar-pro"
                  checked={model === 'sonar-pro'}
                  onChange={(e) => setModel(e.target.value as PerplexityModel)}
                />
                <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sonar Pro</span>
              </label>
            </div>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {model === 'sonar-pro' ? 
                'Sonar Pro has a larger context window (200k tokens) and higher output limit (8k tokens)' :
                'Standard model with 127k token context window'
              }
            </p>
          </div>

          <div className="relative flex-1 mb-4">
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className={`w-full h-full p-4 border rounded-lg text-base
                       ${isDarkMode ? 
                         'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 
                         'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                       } 
                       focus:ring-2 focus:ring-blue-400 focus:border-transparent
                       transition-all duration-200 resize-none scrollbar`}
              placeholder="Enter a statement to fact check..."
              disabled={loading}
            />
            {loading && (
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} rounded-lg flex items-center justify-center backdrop-blur-sm`}>
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent"></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>Analyzing...</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !statement.trim()}
            className={`w-full bg-blue-500 text-white py-3 rounded-lg text-base font-medium
                     hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200`}
          >
            {loading ? 'Analyzing...' : 'Check Fact'}
          </button>
        </form>
      </div>

      {/* Right Panel */}
      <div className={`flex-1 h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-y-auto`}>
        <div className="p-8">
          {error && (
            <div className={`${isDarkMode ? 'bg-red-900/50' : 'bg-red-50'} border-l-4 border-red-500 rounded p-4 mb-6 animate-fade-in`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="animate-fade-in">
              {/* Result Header */}
              <div className="flex items-center space-x-3 mb-6">
                {result.isFactual ? (
                  <div className={`${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'} p-2 rounded-full`}>
                    <svg className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className={`${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'} p-2 rounded-full`}>
                    <svg className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className={`text-xl font-bold ${
                    result.isFactual ? 
                      (isDarkMode ? 'text-green-400' : 'text-green-700') : 
                      (isDarkMode ? 'text-red-400' : 'text-red-700')
                  }`}>
                    {result.isFactual ? 'Factual Statement' : 'Not Factual'}
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Confidence: <span className="font-medium">{result.confidence.toFixed(1)}%</span>
                  </p>
                </div>
              </div>

              {/* Analysis */}
              <div className="mb-8">
                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-3`}>Analysis</h3>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? 
                    'bg-gray-800 text-gray-300 border-gray-700' : 
                    'bg-white text-gray-700 border-gray-100'
                } p-4 rounded-lg border`}>
                  {result.explanation}
                </p>
              </div>

              {/* Sources */}
              <div>
                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-3`}>Sources</h3>
                <ul className="space-y-2">
                  {result.sources.map((source, index) => (
                    <li key={index}>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center p-3 rounded-lg border transition-colors duration-200 group ${
                          isDarkMode ?
                            'bg-gray-800 border-gray-700 hover:bg-gray-700' :
                            'bg-white border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <svg className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                          isDarkMode ?
                            'text-gray-500 group-hover:text-blue-400' :
                            'text-gray-400 group-hover:text-blue-500'
                        }`} 
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className={`ml-2 text-sm truncate transition-colors duration-200 ${
                          isDarkMode ?
                            'text-gray-300 group-hover:text-blue-400' :
                            'text-gray-600 group-hover:text-blue-600'
                        }`}>
                          {new URL(source).hostname}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 