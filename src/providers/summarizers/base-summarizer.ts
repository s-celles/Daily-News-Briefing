import type { NewsItem, DailyNewsSettings } from '../../types';

export interface AISummarizer {
    summarize(newsItems: NewsItem[], topic: string): Promise<string>;
}
