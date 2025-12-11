export interface DailyNewsSettings {
    // API provider selection
    apiProvider: 'google' | 'sonar' | 'gpt';

    // Google API settings
    googleSearchApiKey: string;
    googleSearchEngineId: string;
    geminiApiKey: string;

    // Perplexity API settings
    perplexityApiKey: string;

    // OpenAI API settings
    openaiApiKey: string;
    
    // Core functionality
    topics: string[];
    scheduleTime: string;
    archiveFolder: string;
    
    // Language settings
    language: string; // ISO 639-1 language code (e.g., 'en', 'fr', 'de')
    
    // Content quality settings
    resultsPerTopic: number;
    maxSearchResults: number;
    preferredDomains: string[];
    excludedDomains: string[];
    
    // Output settings
    outputFormat: 'detailed' | 'concise';
    enableNotifications: boolean;
    enableAnalysisContext: boolean; // New: Enable or disable "Analysis & Context" feature
    
    // Metadata settings
    enableMetadata: boolean;
    includeDate: boolean;
    includeTime: boolean;
    includeTopics: boolean;
    includeTags: boolean;
    includeLanguage: boolean;
    includeApiProvider: boolean;
    includeProcessingTime: boolean;
    includeSource: boolean;
    includeOutputFormat: boolean;
    
    // Advanced settings
    dateRange: string;
    minContentLength: number;
    useCustomPrompt: boolean;
    customPrompt: string;
    strictQualityFiltering: boolean;
    qualityThreshold: number; // New setting for fine-tuning filtering
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

    // OpenAI API settings
    openaiApiKey: '',
    
    // Core functionality
    topics: ['Technology', 'World News'],
    scheduleTime: '08:00',
    archiveFolder: 'News Archive',
    
    // Language settings
    language: 'en', // Default to English
    
    // Content quality settings
    resultsPerTopic: 8,
    maxSearchResults: 30,
    preferredDomains: ['nytimes.com', 'bbc.com', 'reuters.com', 'apnews.com'],
    excludedDomains: ['pinterest.com', 'facebook.com', 'instagram.com'],
    
    // Output settings
    outputFormat: 'detailed',
    enableNotifications: true,
    enableAnalysisContext: true, // Enable "Analysis & Context" feature by default
    
    // Metadata settings
    enableMetadata: false, // Disabled by default to maintain backward compatibility
    includeDate: true,
    includeTime: true,
    includeTopics: true,
    includeTags: true,
    includeLanguage: false,
    includeApiProvider: false,
    includeProcessingTime: false,
    includeSource: false,
    includeOutputFormat: false,
    
    // Advanced settings
    dateRange: 'd3', // Changed from d2 to d3 for broader date range
    minContentLength: 80,
    useCustomPrompt: false,
    customPrompt: '',
    useAIForQueries: true, // Enable AI query generation by default
    useAIJudge: true,
    aiJudgePrompt: '', // Custom prompt for AI judge, empty by default
    strictQualityFiltering: false,
    qualityThreshold: 3
}
export interface NewsItem {
    title: string;
    link: string;
    snippet: string;
    publishedTime?: string;
    source?: string;
    qualityScore?: number;
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

export interface NewsMetadata {
    date?: string;
    time?: string;
    topics?: string[];
    tags?: string[];
    language?: string;
    apiProvider?: string;
    processingTime?: string;
    source?: string;
    outputFormat?: string;
}