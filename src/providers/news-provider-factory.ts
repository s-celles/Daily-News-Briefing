import type { DailyNewsSettings } from '../types';
import { BaseNewsProvider } from './base-news-provider';
import { GoogleNewsProvider } from './google-news-provider';
import { PerplexityNewsProvider } from './perplexity-news-provider';

export class NewsProviderFactory {
    static createProvider(settings: DailyNewsSettings): BaseNewsProvider {
        switch (settings.apiProvider) {
            case 'google':
                return new GoogleNewsProvider(settings);
            case 'sonar':
                return new PerplexityNewsProvider(settings);
            default:
                throw new Error(`Unknown API provider: ${settings.apiProvider}`);
        }
    }

    static validateProviderConfig(settings: DailyNewsSettings): boolean {
        try {
            const provider = NewsProviderFactory.createProvider(settings);
            return provider.validateConfiguration();
        } catch (error) {
            console.error('Error validating provider configuration:', error);
            return false;
        }
    }

    static getProviderName(settings: DailyNewsSettings): string {
        try {
            const provider = NewsProviderFactory.createProvider(settings);
            return provider.getProviderName();
        } catch (error) {
            return 'Unknown Provider';
        }
    }
}