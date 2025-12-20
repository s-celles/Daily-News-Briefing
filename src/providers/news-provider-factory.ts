import type { DailyNewsSettings } from '../types';
import { BaseNewsProvider } from './base-news-provider';
import { GoogleSearchRetriever } from './retrievers/google-search-retriever';
import { GeminiSummarizer } from './summarizers/gemini-summarizer';
import { GptSummarizer } from './summarizers/gpt-summarizer';
import { GptAgenticProvider } from './agentic/gpt-agentic-provider';
import { PerplexityNewsProvider } from './agentic/perplexity-provider';
import { SearchSummarizeCoordinator } from './coordinators/search-summarize-coordinator';

export class NewsProviderFactory {
    static createProvider(settings: DailyNewsSettings): BaseNewsProvider {
        switch (settings.apiProvider) {
            case 'google-gemini':
                return new SearchSummarizeCoordinator(
                    settings,
                    new GoogleSearchRetriever(settings),
                    new GeminiSummarizer(settings),
                    'Google Search + Gemini Summarizer'
                );
            case 'google-gpt':
                return new SearchSummarizeCoordinator(
                    settings,
                    new GoogleSearchRetriever(settings),
                    new GptSummarizer(settings),
                    'Google Search + GPT Summarizer'
                );
            case 'sonar':
                return new PerplexityNewsProvider(settings);
            case 'gpt':
                return new GptAgenticProvider(settings);
            default:
                throw new Error(`Unknown API provider: ${settings.apiProvider}`);
        }
    }

    static validateProviderConfig(settings: DailyNewsSettings): boolean {
        switch (settings.apiProvider) {
            case 'google-gemini':
                return !!(settings.googleSearchApiKey && settings.googleSearchEngineId && settings.geminiApiKey);
            case 'google-gpt':
                return !!(settings.googleSearchApiKey && settings.googleSearchEngineId && settings.openaiApiKey);
            case 'sonar':
                return !!settings.perplexityApiKey;
            case 'gpt':
                return !!settings.openaiApiKey;
            default:
                return false;
        }
    }

    static getProviderName(settings: DailyNewsSettings): string {
        switch (settings.apiProvider) {
            case 'google-gemini':
                return 'Google Search + Gemini Summarizer';
            case 'google-gpt':
                return 'Google Search + GPT Summarizer';
            case 'sonar':
                return 'Sonar by Perplexity';
            case 'gpt':
                return 'GPT (Agentic Search)';
            default:
                return 'Unknown Provider';
        }
    }
}