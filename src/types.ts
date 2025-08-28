export interface DailyNewsSettings {
    // API provider selection
    apiProvider: 'google' | 'sonar';

    // Google API settings
    googleSearchApiKey: string;
    googleSearchEngineId: string;
    geminiApiKey: string;

    // Perplexity API settings
    perplexityApiKey: string;
    
    // Core functionality
    topics: string[];
    scheduleTime: string;
    archiveFolder: string;
    
    // Language settings
    language: string; // ISO 639-1 language code (e.g., 'en', 'fr', 'de')
    
    // Content quality settings
    resultsPerTopic: number;
    maxSearchResults: number;
    
    // Output settings
    outputFormat: 'detailed' | 'concise';
    enableNotifications: boolean;
    enableAnalysisContext: boolean; // New: Enable or disable "Analysis & Context" feature
    
    // Advanced settings
    dateRange: string;
    useCustomPrompt: boolean;
    customPrompt: string;
    useAIForQueries: boolean; // New setting: whether to use AI to generate search queries
    useAIJudge: boolean; // Whether to use AI for judging content quality
    aiJudgePrompt: string; // Custom prompt for AI judge, empty by default
}

export const DEFAULT_SETTINGS: DailyNewsSettings = {
    // API provider selection
    apiProvider: 'google', // Default to Google for backward compatibility

    // Google API settings
    googleSearchApiKey: '',
    googleSearchEngineId: '',
    geminiApiKey: '',

    // Perplexity API settings
    perplexityApiKey: '',
    
    // Core functionality
    topics: ['Technology', 'World News'],
    scheduleTime: '08:00',
    archiveFolder: 'News Archive',
    
    // Language settings
    language: 'en', // Default to English
    
    // Content quality settings
    resultsPerTopic: 8,
    maxSearchResults: 30,
    
    // Output settings
    outputFormat: 'detailed',
    enableNotifications: true,
    enableAnalysisContext: true, // Enable "Analysis & Context" feature by default
    
    // Advanced settings
    dateRange: 'd3', // Changed from d2 to d3 for broader date range
    useCustomPrompt: false,
    customPrompt: '',
    useAIForQueries: true, // Enable AI query generation by default
    useAIJudge: true,
    aiJudgePrompt: '' // Custom prompt for AI judge, empty by default
}

export interface NewsItem {
    title: string;
    link: string;
    snippet: string;
    publishedTime?: string;
    source?: string;
}

export interface SearchItem {
    title: string;
    link: string;
    snippet: string;
    pagemap?: {
        metatags?: Array<{
            publishedTime?: string;
            og_site_name?: string;
        }>;
    };
}

export interface SearchResponse {
    items?: SearchItem[];
    error?: {
        message: string;
        status: string;
    };
}

export type TopicStatus = {
    topic: string;
    retrievalSuccess: boolean;
    summarizationSuccess: boolean;
    newsCount: number;
    error?: string;
};