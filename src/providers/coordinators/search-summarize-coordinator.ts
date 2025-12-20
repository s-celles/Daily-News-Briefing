import { BaseNewsProvider } from '../base-news-provider';
import type { NewsRetriever } from '../retrievers/base-retriever';
import type { AISummarizer } from '../summarizers/base-summarizer';
import { LanguageUtils } from '../../utils';
import type { DailyNewsSettings } from '../../types';

export class SearchSummarizeCoordinator extends BaseNewsProvider {
    private retriever: NewsRetriever;
    private summarizer: AISummarizer;
    private providerName: string;

    constructor(settings: DailyNewsSettings, retriever: NewsRetriever, summarizer: AISummarizer, providerName: string) {
        super(settings);
        this.retriever = retriever;
        this.summarizer = summarizer;
        this.providerName = providerName;
    }

    getProviderName(): string {
        return this.providerName;
    }

    validateConfiguration(): boolean {
        // This coordinator is dynamically created, so validation should be handled
        // in the factory based on the selected pipeline.
        // For simplicity, we assume if it's created, the config is valid.
        return true;
    }

    async fetchAndSummarizeNews(topic: string): Promise<string> {
        try {
            const newsItems = await this.retriever.fetchNews(topic);
            
            if (newsItems.length === 0) {
                return `${LanguageUtils.getTranslation('noRecentNews', this.settings.language)} ${topic}.`;
            }

            return await this.summarizer.summarize(newsItems, topic);
        } catch (error) {
            console.error(`${this.getProviderName()} provider error for ${topic}:`, error);
            return `Error retrieving news for ${topic}. ${error.message}`;
        }
    }
}
