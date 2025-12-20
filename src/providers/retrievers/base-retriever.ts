import type { NewsItem, DailyNewsSettings } from '../../types';

export interface NewsRetriever {
    fetchNews(topic: string): Promise<NewsItem[]>;
}
