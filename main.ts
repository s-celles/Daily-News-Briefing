import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, requestUrl } from 'obsidian';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface DailyNewsSettings {
    // Essential API settings
    googleApiKey: string;
    searchEngineId: string;
    geminiApiKey: string;
    
    // Core functionality
    topics: string[];
    scheduleTime: string;
    archiveFolder: string;
    
    // Content quality settings
    resultsPerTopic: number;
    maxSearchResults: number;
    preferredDomains: string[];
    excludedDomains: string[];
    
    // Output settings
    outputFormat: 'detailed' | 'concise';
    enableNotifications: boolean;
    
    // Advanced settings
    dateRange: string;
    minContentLength: number;
    useCustomPrompt: boolean;
    customPrompt: string;
    strictQualityFiltering: boolean;
    qualityThreshold: number; // New setting for fine-tuning filtering
}

const DEFAULT_SETTINGS: DailyNewsSettings = {
    // Essential API settings
    googleApiKey: '',
    searchEngineId: '',
    geminiApiKey: '',
    
    // Core functionality
    topics: ['Technology', 'World News'],
    scheduleTime: '08:00',
    archiveFolder: 'News Archive',
    
    // Content quality settings
    resultsPerTopic: 8,
    maxSearchResults: 30,
    preferredDomains: ['nytimes.com', 'bbc.com', 'reuters.com', 'apnews.com'],
    excludedDomains: ['pinterest.com', 'facebook.com', 'instagram.com'],
    
    // Output settings
    outputFormat: 'detailed',
    enableNotifications: true,
    
    // Advanced settings
    dateRange: 'd2',
    minContentLength: 80, // Reduced from 120 to be less strict
    useCustomPrompt: false,
    customPrompt: '',
    strictQualityFiltering: false, // Changed default to false for less strictness
    qualityThreshold: 3 // Default lower threshold for quality
}

// List of high-quality news sources
const QUALITY_NEWS_SOURCES = [
    // Major global news organizations
    'nytimes.com', 'bbc.com', 'reuters.com', 'apnews.com', 'economist.com',
    'wsj.com', 'ft.com', 'bloomberg.com', 'theguardian.com', 'npr.org',
    'washingtonpost.com', 'aljazeera.com', 'time.com', 'latimes.com',
    
    // Tech news
    'wired.com', 'techcrunch.com', 'arstechnica.com', 'theverge.com', 'cnet.com',
    'zdnet.com', 'engadget.com', 'venturebeat.com', 'protocol.com',
    
    // Science & Academic
    'nature.com', 'scientificamerican.com', 'science.org', 'newscientist.com',
    'pnas.org', 'sciencedaily.com', 'livescience.com', 'popsci.com', 
    
    // Business & Finance
    'cnbc.com', 'forbes.com', 'fortune.com', 'marketwatch.com', 'businessinsider.com',
    'hbr.org', 'barrons.com', 'morningstar.com', 'fastcompany.com',
    
    // Analysis & Long form
    'theatlantic.com', 'newyorker.com', 'politico.com', 'foreignpolicy.com',
    'foreignaffairs.com', 'project-syndicate.org', 'brookings.edu', 'axios.com',
    
    // Public & International news
    'france24.com', 'dw.com', 'abc.net.au', 'cbc.ca', 'japantimes.co.jp',
    'independent.co.uk', 'thehindu.com', 'straitstimes.com', 'themoscowtimes.com',
    'scmp.com'
];

// Common patterns that indicate ads or low-quality content
const AD_PATTERNS = [
    'Subscribe to read', 'Sign up now', 'Advertisement', 'Click here to',
    'Special offer', 'newsletters?\\b', '\\[\\d+\\]', '©\\s*\\d{4}',
    'cookie', 'subscribe', 'sign up', 'privacy policy', 'terms of service'
];

interface NewsItem {
    title: string;
    link: string;
    snippet: string;
    publishedTime?: string;
    source?: string;
    qualityScore?: number;
}

interface SearchItem {
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

interface SearchResponse {
    items?: SearchItem[];
    error?: {
        message: string;
        status: string;
    };
}

class DailyNewsSettingTab extends PluginSettingTab {
    plugin: DailyNewsPlugin;
    showAdvanced: boolean = false;

    constructor(app: App, plugin: DailyNewsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        // API Configuration section
        containerEl.createEl('h2', {text: 'API Configuration'});
        containerEl.createEl('p', {text: 'API keys are required for fetching and summarizing news.'});

        new Setting(containerEl)
            .setName('Google Search API key')
            .setDesc('Your Google Custom Search API key')
            .addText(text => text
                .setPlaceholder('Enter API key')
                .setValue(this.plugin.settings.googleApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.googleApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Google Search engine ID')
            .setDesc('Your Google Custom Search Engine ID')
            .addText(text => text
                .setPlaceholder('Enter search engine ID')
                .setValue(this.plugin.settings.searchEngineId)
                .onChange(async (value) => {
                    this.plugin.settings.searchEngineId = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Gemini API key')
            .setDesc('Your Google Gemini API key for news summarization')
            .addText(text => text
                .setPlaceholder('Enter Gemini API key')
                .setValue(this.plugin.settings.geminiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.geminiApiKey = value;
                    await this.plugin.saveSettings();
                }));

        // News Configuration section
        containerEl.createEl('h2', {text: 'News Configuration'});
        
        new Setting(containerEl)
            .setName('Topics')
            .setDesc('News topics to follow (comma-separated)')
            .addText(text => text
                .setPlaceholder('Technology, World News, Science')
                .setValue(this.plugin.settings.topics.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.topics = value.split(',').map(t => t.trim());
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Schedule time')
            .setDesc('When to generate daily news (24-hour format)')
            .addText(text => text
                .setPlaceholder('HH:MM')
                .setValue(this.plugin.settings.scheduleTime)
                .onChange(async (value) => {
                    this.plugin.settings.scheduleTime = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(containerEl)
            .setName('Archive folder')
            .setDesc('Folder to store daily news notes')
            .addText(text => text
                .setPlaceholder('News Archive')
                .setValue(this.plugin.settings.archiveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.archiveFolder = value;
                    await this.plugin.saveSettings();
                }));

        // Content Quality section
        containerEl.createEl('h2', {text: 'Content Quality'});
        
        new Setting(containerEl)
            .setName('News items per topic')
            .setDesc('Maximum number of news items to include per topic')
            .addSlider(slider => slider
                .setLimits(3, 15, 1)
                .setValue(this.plugin.settings.resultsPerTopic)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.resultsPerTopic = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(containerEl)
            .setName('Maximum search results')
            .setDesc('Total search results to fetch (higher values give more options but use more API quota)')
            .addSlider(slider => slider
                .setLimits(10, 50, 5)
                .setValue(this.plugin.settings.maxSearchResults)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxSearchResults = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(containerEl)
            .setName('Quality filtering')
            .setDesc('Enable stricter quality filters (may reduce number of results)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.strictQualityFiltering)
                .onChange(async (value) => {
                    this.plugin.settings.strictQualityFiltering = value;
                    await this.plugin.saveSettings();
                }));

        // Output Settings section
        containerEl.createEl('h2', {text: 'Output Configuration'});
        
        new Setting(containerEl)
            .setName('Output style')
            .setDesc('Choose level of detail for news summaries')
            .addDropdown(dropdown => dropdown
                .addOption('detailed', 'Detailed - with analysis')
                .addOption('concise', 'Concise - just facts')
                .setValue(this.plugin.settings.outputFormat)
                .onChange(async (value: 'detailed' | 'concise') => {
                    this.plugin.settings.outputFormat = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(containerEl)
            .setName('Enable notifications')
            .setDesc('Show notifications when news is generated')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableNotifications)
                .onChange(async (value) => {
                    this.plugin.settings.enableNotifications = value;
                    await this.plugin.saveSettings();
                }));

        // Advanced toggle
        new Setting(containerEl)
            .setName('Show advanced configuration')
            .addToggle(toggle => toggle
                .setValue(this.showAdvanced)
                .onChange(value => {
                    this.showAdvanced = value;
                    this.display();
                }));

        // Advanced Settings
        if (this.showAdvanced) {
            containerEl.createEl('h2', {text: 'Advanced Configuration'});
            
            new Setting(containerEl)
                .setName('Search date range')
                .setDesc('How far back to search (d1 = 1 day, d2 = 2 days, w1 = 1 week)')
                .addText(text => text
                    .setPlaceholder('d2')
                    .setValue(this.plugin.settings.dateRange)
                    .onChange(async (value) => {
                        this.plugin.settings.dateRange = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Minimum content length')
                .setDesc('Minimum length for news snippets to be considered')
                .addText(text => text
                    .setPlaceholder('80')
                    .setValue(this.plugin.settings.minContentLength.toString())
                    .onChange(async (value) => {
                        const parsedValue = parseInt(value);
                        this.plugin.settings.minContentLength = isNaN(parsedValue) ? 80 : parsedValue;
                        await this.plugin.saveSettings();
                    }));
                    
            new Setting(containerEl)
                .setName('Quality threshold')
                .setDesc('Minimum quality score for articles (1-10, lower = more results)')
                .addSlider(slider => slider
                    .setLimits(1, 8, 1)
                    .setValue(this.plugin.settings.qualityThreshold)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.qualityThreshold = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Use custom AI prompt')
                .setDesc('Enable to use your own custom AI prompt for summarization')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.useCustomPrompt)
                    .onChange(async (value) => {
                        this.plugin.settings.useCustomPrompt = value;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh to show/hide custom prompt area
                    }));
                    
            if (this.plugin.settings.useCustomPrompt) {
                new Setting(containerEl)
                    .setName('Custom AI prompt')
                    .setDesc('Your custom prompt for the AI summarization (use {{NEWS_TEXT}} as placeholder for the news content)')
                    .addTextArea(text => text
                        .setPlaceholder('You are a professional news analyst...\n\n{{NEWS_TEXT}}\n\nPlease summarize...')
                        .setValue(this.plugin.settings.customPrompt)
                        .onChange(async (value) => {
                            this.plugin.settings.customPrompt = value;
                            await this.plugin.saveSettings();
                        }));
            }

            new Setting(containerEl)
                .setName('Preferred domains')
                .setDesc('Comma-separated list of preferred news sources')
                .addTextArea(text => text
                    .setPlaceholder('nytimes.com, bbc.com, reuters.com')
                    .setValue(this.plugin.settings.preferredDomains.join(', '))
                    .onChange(async (value) => {
                        this.plugin.settings.preferredDomains = value.split(',').map(d => d.trim());
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Excluded domains')
                .setDesc('Comma-separated list of domains to exclude')
                .addTextArea(text => text
                    .setPlaceholder('pinterest.com, facebook.com')
                    .setValue(this.plugin.settings.excludedDomains.join(', '))
                    .onChange(async (value) => {
                        this.plugin.settings.excludedDomains = value.split(',').map(d => d.trim());
                        await this.plugin.saveSettings();
                    }));
                    
            // Manual trigger button
            new Setting(containerEl)
                .setName('Generate news now')
                .setDesc('Manually trigger news generation')
                .addButton(button => button
                    .setButtonText('Generate')
                    .onClick(async () => {
                        new Notice('Generating news...');
                        await this.plugin.generateDailyNews();
                    }));
        }
    }
}

export default class DailyNewsPlugin extends Plugin {
    settings: DailyNewsSettings;

    async onload() {
        await this.loadSettings();
        
        // Add settings tab
        this.addSettingTab(new DailyNewsSettingTab(this.app, this));

        // Add sidebar button
        this.addRibbonIcon('newspaper', 'Daily News Briefing', async () => {
            await this.openOrCreateDailyNews();
        });

        // Schedule daily news generation
        this.registerInterval(
            window.setInterval(() => this.checkAndGenerateNews(), 60000)
        );

        // Add manual trigger command
        this.addCommand({
            id: 'generate-news-now',
            name: 'Generate news now',
            callback: async () => {
                new Notice('Generating news...');
                await this.generateDailyNews();
            }
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async fetchNews(topic: string): Promise<NewsItem[]> {
        const startTime = Date.now();
        // console.log(`Starting news fetch for ${topic}`);
        
        // Get appropriate date range parameter
        const dateRangeParam = this.settings.dateRange.match(/^[dw]\d+$/) ? 
            this.settings.dateRange : 'd2';
            
        // Simplified search strategy - fetch in a single batch with multiple query variations
        const allNews: NewsItem[] = [];
        const searchResults: { [key: string]: NewsItem[] } = {};
        
        // Define search queries with descriptive names
        const queries = {
            standard: this.buildOptimizedQuery(topic),
            specific: this.createSpecificQuery(topic),
            broad: `${topic} news recent important developments`,
            general: `${topic} latest significant news`
        };
        
        // Maximum results per query to avoid excessive API usage
        const maxResultsPerQuery = Math.min(20, this.settings.maxSearchResults / 2);
        
        // Fetch results for each query type in parallel
        await Promise.all(Object.entries(queries).map(async ([queryType, queryString]) => {
            try {
                // console.log(`Fetching ${queryType} news for ${topic} with query: ${queryString}`);
                const results = await this.fetchNewsFromGoogle(
                    queryString, 
                    dateRangeParam, 
                    queryType === 'standard', // Prioritize quality for standard query
                    Math.ceil(maxResultsPerQuery)
                );
                searchResults[queryType] = results;
                // console.log(`Found ${results.length} results for ${queryType} query`);
            } catch (error) {
                console.error(`Error fetching ${queryType} news:`, error);
                searchResults[queryType] = [];
            }
        }));
        
        // Combine results while avoiding duplicates
        for (const [queryType, results] of Object.entries(searchResults)) {
            for (const item of results) {
                if (!allNews.some(existing => existing.link === item.link)) {
                    allNews.push(item);
                }
            }
        }
        
        // console.log(`Total collected news items: ${allNews.length}`);
        
        // Try adaptive filtering with gradually decreasing strictness
        let filteredNews: NewsItem[] = [];
        let attemptCount = 0;
        const maxAttempts = 4;
        let qualityThreshold = this.settings.strictQualityFiltering ? 
                              this.settings.qualityThreshold + 1 : 
                              this.settings.qualityThreshold;
        let minContentLength = this.settings.minContentLength;
        
        while (filteredNews.length < 3 && attemptCount < maxAttempts) {
            // console.log(`Filtering attempt ${attemptCount+1} with threshold ${qualityThreshold} and min length ${minContentLength}`);
            
            filteredNews = this.applyQualityFilters(allNews, qualityThreshold, minContentLength);
            
            // If we don't have enough results, try more lenient filtering
            if (filteredNews.length < 3) {
                qualityThreshold = Math.max(1, qualityThreshold - 1);
                minContentLength = Math.max(30, minContentLength - 20);
                attemptCount++;
            }
        }
        
        // Last resort: if we still have no results, just take the highest scored items
        if (filteredNews.length === 0 && allNews.length > 0) {
            // console.log("No results after filtering attempts, using top-scored items as fallback");
            allNews.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
            filteredNews = allNews.slice(0, this.settings.resultsPerTopic);
        }
        
        // Sort by quality score
        filteredNews.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
        
        // Limit to the configured number of results
        const finalResults = filteredNews.slice(0, this.settings.resultsPerTopic);
        
        const elapsedTime = (Date.now() - startTime) / 1000;
        // console.log(`Fetch completed for ${topic}: ${finalResults.length} items in ${elapsedTime.toFixed(1)}s`);
        
        return finalResults;
    }
    
    // Simplified query builder with fewer special cases
    private buildOptimizedQuery(topic: string): string {
        // Base query with the topic
        let query = `${topic} news`;
        
        // Add topic-specific terms - simplified approach
        const lowercaseTopic = topic.toLowerCase();
        
        if (lowercaseTopic.includes('tech')) {
            query += ' "latest developments" OR innovation OR launch OR release';
        } else if (lowercaseTopic.includes('world') || lowercaseTopic.includes('global')) {
            query += ' international OR diplomatic OR policy OR relations';
        } else if (lowercaseTopic.includes('business') || lowercaseTopic.includes('finance')) {
            query += ' earnings OR markets OR economy OR financial';
        } else if (lowercaseTopic.includes('science')) {
            query += ' research OR discovery OR study OR breakthrough';
        } else if (lowercaseTopic.includes('health')) {
            query += ' medical OR treatment OR research OR study';
        } else {
            // Generic improvements for other topics
            query += ' recent OR latest OR update OR significant';
        }
        
        // Add date context but keep it simpler
        query += ' "this week" OR recent OR latest';
        
        // Add negative terms to filter out obvious low-quality content
        query += ' -subscription -outdated';
        
        return query;
    }
    
    // Create a more specific query targeting real news articles
    private createSpecificQuery(topic: string): string {
        return `${topic} "news article" OR "published" OR "reports" OR "announced"`;
    }
    
    private async fetchNewsFromGoogle(
        query: string, 
        dateRestrict: string, 
        prioritizeQuality: boolean,
        maxResults: number = 10
    ): Promise<NewsItem[]> {
        // Calculate how many API requests we need (Google API max is 10 per request)
        const requestsNeeded = Math.ceil(maxResults / 10);
        const actualRequests = Math.min(requestsNeeded, 2); // Cap at 2 requests to avoid API overuse
        
        let allResults: NewsItem[] = [];
        
        for (let i = 0; i < actualRequests; i++) {
            if (allResults.length >= maxResults) break;
            
            const startIndex = (i * 10) + 1; // Google API starts at 1
            
            const params = new URLSearchParams({
                key: this.settings.googleApiKey,
                cx: this.settings.searchEngineId,
                q: query,
                num: '10',
                dateRestrict: dateRestrict,
                fields: 'items(title,link,snippet,pagemap/metatags/publishedTime,pagemap/metatags/og_site_name)',
                sort: i === 0 ? 'date' : 'relevance', // First page by date for freshness
                start: startIndex.toString()
            });
            
            // Add site restrictions for higher quality sources if prioritizing quality
            if (prioritizeQuality) {
                // Combine user preferred domains and quality sources
                let qualitySources = [...this.settings.preferredDomains];
                
                // Add some quality sources if user hasn't specified enough
                if (qualitySources.length < 5) {
                    // Use a rotating subset of quality sources for variety
                    const startIdx = (i * 5) % QUALITY_NEWS_SOURCES.length;
                    const sourcesToAdd = QUALITY_NEWS_SOURCES.slice(startIdx, startIdx + 10);
                    qualitySources = [...qualitySources, ...sourcesToAdd];
                }
                
                // Take a subset to avoid overly long queries
                const siteSubset = qualitySources.slice(0, 10);
                if (siteSubset.length > 0) {
                    const sitesQuery = siteSubset.map(domain => `site:${domain}`).join(' OR ');
                    params.set('q', `${params.get('q')} (${sitesQuery})`);
                }
            }
            
            try {
                const response = await requestUrl({
                    url: `https://www.googleapis.com/customsearch/v1?${params.toString()}`
                });
                
                const data: SearchResponse = JSON.parse(response.text);
                
                if (!data || !data.items || data.items.length === 0) {
                    continue; // Skip to next page if no results
                }
                
                // Process results into NewsItems with quality scoring
                const pageResults = data.items.map(item => {
                    const url = new URL(item.link);
                    const domain = url.hostname.replace('www.', '');
                    const source = item.pagemap?.metatags?.[0]?.og_site_name || domain;
                    
                    return {
                        title: item.title,
                        link: item.link,
                        snippet: this.cleanNewsContent(item.snippet),
                        publishedTime: item.pagemap?.metatags?.[0]?.publishedTime,
                        source: source,
                        qualityScore: this.calculateQualityScore(item, domain)
                    };
                });
                
                // Add only non-duplicate results
                for (const item of pageResults) {
                    if (!allResults.some(existing => existing.link === item.link)) {
                        allResults.push(item);
                    }
                }
                
                // Small delay between requests to be nice to the API
                if (i < actualRequests - 1) {
                    await new Promise(r => setTimeout(r, 200));
                }
                
            } catch (error) {
                console.error(`Search API error on page ${i+1}:`, error);
                // Continue to next page despite errors
            }
        }
        
        return allResults;
    }
    
    // Simplified quality scoring with fewer special cases
    private calculateQualityScore(item: SearchItem, domain: string): number {
        let score = 5; // Base score
        
        // Domain quality checks
        if (QUALITY_NEWS_SOURCES.some(source => domain.includes(source))) {
            score += 2; // Boost for known quality sources
        }
        
        if (this.settings.preferredDomains.some(source => domain.includes(source))) {
            score += 2; // Boost for user's preferred domains
        }
        
        // URL quality checks - simplified
        const url = new URL(item.link);
        
        // Boost for article-like URLs
        if (/\/article\/|\/story\/|\/news\/|\/\d{4}\/\d{2}\//.test(url.pathname)) {
            score += 1.5;
        }
        
        // Penalize obvious non-article pages
        if (url.pathname === "/" || url.pathname.length < 3) {
            score -= 3; // Penalize homepages but less severely
        }
        
        // Content quality indicators - simplified checks
        if (item.snippet) {
            // Contains concrete data indicators
            if (/\d+%|\d+ percent|\$\d+|\d+ million|\d+ billion/.test(item.snippet)) {
                score += 1;
            }
            
            // Contains quotes or reporting indicators
            if (/"[^"]{8,}"/.test(item.snippet) || 
                /'[^']{8,}'/.test(item.snippet) ||
                /reported|announced|revealed|published|according to/.test(item.snippet)) {
                score += 1;
            }
            
            // Longer snippets are usually better
            if (item.snippet.length > 120) {
                score += 0.5;
            }
        }
        
        // Penalize excluded domains
        if (this.settings.excludedDomains.some(excluded => domain.includes(excluded))) {
            score -= 3;
        }
        
        // Clamp the score between 1-10
        return Math.max(1, Math.min(10, score));
    }
    
    // Simplified filtering with adaptive thresholds
    private applyQualityFilters(
        newsItems: NewsItem[], 
        qualityThreshold: number = 3,
        minContentLength: number = 80
    ): NewsItem[] {
        return newsItems.filter(item => {
            try {
                // Skip items without essential data
                if (!item.title || !item.snippet || !item.link) {
                    return false;
                }
                
                // Apply domain filters
                const url = new URL(item.link);
                const domain = url.hostname.replace('www.', '');
                
                // Explicit domain exclusions
                if (this.settings.excludedDomains.some(excluded => domain.includes(excluded))) {
                    return false;
                }
                
                // Minimum content length check
                if (item.snippet.length < minContentLength) {
                    return false;
                }
                
                // Relaxed URL checks - only reject obvious non-articles
                if (url.pathname === "/" && url.search === "") {
                    return false; // Reject root domain with no query
                }
                
                // Basic content quality - reject obvious website descriptions
                if (/is a website|is the official|official site of/.test(item.snippet) && 
                    item.snippet.length < 100) {
                    return false;
                }
                
                // Basic quality threshold check is the main filter now
                return (item.qualityScore || 0) >= qualityThreshold;
                
            } catch (error) {
                // console.error("Error in quality filtering:", error);
                return false; // Reject any item that causes errors
            }
        });
    }
    
    // Simplified content cleaning
    private cleanNewsContent(text: string): string {
        if (!text) return '';
        
        // Simple regex pattern for cleaning - combined for better performance
        return text
            .replace(/https?:\/\/\S+/g, '') // Remove URLs
            .replace(/\S+@\S+\.\S+/g, '')   // Remove emails
            .replace(/\s+/g, ' ')           // Normalize whitespace
            .trim();                         // Trim excess whitespace
    }

    async generateSummary(newsItems: NewsItem[], topic: string): Promise<string> {
        if (!newsItems.length) {
            return `No recent news found for ${topic}.`;
        }

        // Enhance news items with quality indicators
        const enhancedNewsText = newsItems.map(item => {
            // Extract domain for credibility info
            const domain = new URL(item.link).hostname.replace('www.', '');
            const isQualitySource = QUALITY_NEWS_SOURCES.some(source => domain.includes(source));
            
            // Format with additional quality metadata
            return `=== NEWS ITEM ===\n` +
                `Title: ${item.title}\n` +
                `Source: ${item.source || domain}\n` +
                `URL: ${item.link}\n` +
                `Published: ${item.publishedTime || 'Unknown'}\n` +
                `Source Quality: ${isQualitySource ? 'High-quality established source' : 'Standard source'}\n` +
                `Content: ${item.snippet}\n`;
        }).join('\n\n');

        // Get appropriate prompt
        const prompt = this.getAIPrompt(enhancedNewsText, topic, this.settings.outputFormat);

        try {
            // Initialize the Gemini API
            const genAI = new GoogleGenerativeAI(this.settings.geminiApiKey);
            
            // Use the model "gemini-2.0-flash" for better performance
            const modelName = "gemini-2.0-flash";
                
            // console.log(`Using model ${modelName} for summarization`);
            
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    temperature: 0.2, // Lower temperature for more factual output
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 4096
                }
            });
            
            // Set a timeout for the API call
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AI summary timed out')), 30000)
            );
            
            // Run the content generation with timeout
            const resultPromise = model.generateContent(prompt);
            const result = await Promise.race([resultPromise, timeoutPromise]) as any;
            
            // Return the summary text
            return result.response.text();
        } catch (error) {
            console.error('Failed to generate summary:', error);
            
            // Create a fallback summary with raw data
            return this.createFallbackSummary(newsItems, topic);
        }
    }

    // Fallback summary when AI fails
    private createFallbackSummary(newsItems: NewsItem[], topic: string): string {
        return `**Summary for ${topic}**\n\n${
            newsItems.slice(0, 5).map(item => 
                `- **${item.title}** - ${item.snippet?.substring(0, 150)}... [${item.source || new URL(item.link).hostname}](${item.link})`
            ).join('\n\n')
        }`;
    }

    private getAIPrompt(newsText: string, topic: string, format: 'detailed' | 'concise'): string {
        // If user has custom prompt enabled and provided one, use it
        if (this.settings.useCustomPrompt && this.settings.customPrompt) {
            return this.settings.customPrompt.replace('{{NEWS_TEXT}}', newsText);
        }
        
        // Otherwise use simplified prompt
        const basePrompt = `Analyze these news articles about ${topic} and provide a substantive summary:

${newsText}

KEY REQUIREMENTS:
1. Focus on concrete developments, facts, and data
2. For each news item include the SOURCE in markdown format: [Source](URL)
3. Use specific dates rather than relative time references
4. Prioritize news with specific details (numbers, names, quotes)
5. If content lacks substance, state "Limited substantive news found on ${topic}"`;

        // Add format-specific instructions
        if (format === 'detailed') {
            return basePrompt + `

Format your summary with these sections:

### Key Developments
- **[Clear headline with key detail]**: Concrete facts with specific details. [Source](URL)
- **[Clear headline with key detail]**: Concrete facts with specific details. [Source](URL)

### Analysis & Context
[Provide context, implications, or background for the most significant developments]`;
        } else {
            return basePrompt + `

Format your summary as bullet points with concrete facts:

- **[Clear headline with key detail]**: Concrete facts with specific details. [Source](URL)
- **[Clear headline with key detail]**: Concrete facts with specific details. [Source](URL)
- **[Clear headline with key detail]**: Concrete facts with specific details. [Source](URL)`;
        }
    }

    async checkAndGenerateNews() {
        const now = new Date();
        const scheduledTime = this.settings.scheduleTime.split(':');
        const targetHour = parseInt(scheduledTime[0]);
        const targetMinute = parseInt(scheduledTime[1]);

        if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {
            await this.generateDailyNews();
        }
    }

    async generateDailyNews() {
        const date = new Date().toISOString().split('T')[0];
        
        try {
            new Notice('Generating daily news...');
            
            // Normalize the path
            const archiveFolder = this.normalizePath(this.settings.archiveFolder);
            const fileName = `${archiveFolder}/Daily News - ${date}.md`;

            // Check if the file already exists
            if (await this.app.vault.adapter.exists(fileName)) {
                new Notice('Daily news already generated for today.', 5000);
                return fileName; // Return the path even when file exists
            }
            
            // Basic header content
            let content = `*Generated at ${new Date().toLocaleTimeString()}*\n\n`;
            content += `---\n\n`;

            // Add table of contents
            content += `## Table of Contents\n\n`;
            this.settings.topics.forEach(topic => {
                content += `- [${topic}](#${topic.toLowerCase().replace(/\s+/g, '%20')})\n`;
            });

            // Process each topic
            for (const topic of this.settings.topics) {
                try {
                    content += `\n---\n\n`;
                    content += `## ${topic}\n\n`;
                    
                    new Notice(`Fetching news for ${topic}...`);
                    const newsItems = await this.fetchNews(topic);
                    
                    if (newsItems.length) {
                        new Notice(`Summarizing ${newsItems.length} news items for ${topic}...`);
                        const summary = await this.generateSummary(newsItems, topic);
                        content += summary + '\n';
                    } else {
                        content += `No recent news found for ${topic}.\n\n`;
                    }

                } catch (topicError) {
                    console.error(`Error processing topic ${topic}:`, topicError);
                    content += `Error retrieving news for ${topic}. Please try again later.\n\n`;
                }
            }

            // Create folder if it doesn't exist
            try {
                if (!(await this.app.vault.adapter.exists(archiveFolder))) {
                    await this.app.vault.createFolder(archiveFolder);
                }
            } catch (folderError) {
                console.error("Failed to create folder:", folderError);
            }

            await this.app.vault.create(fileName, content);
            
            if (this.settings.enableNotifications) {
                new Notice('Daily news generated successfully', 3000);
            }
            
            console.log(`Created news file at: ${fileName}`);
            return fileName;
            
        } catch (error) {
            console.error('Failed to generate news:', error);
            new Notice('Failed to generate news. Check console for details.', 5000);
            return null;
        }
    }

    // Improved method to open or create daily news
    async openOrCreateDailyNews() {
        const date = new Date().toISOString().split('T')[0];
        const filePath = this.normalizePath(`${this.settings.archiveFolder}/Daily News - ${date}.md`);
        
        try {
            // Check if file exists
            const fileExists = await this.app.vault.adapter.exists(filePath);
            
            if (fileExists) {
                // If exists, open the file with more reliable method
                this.openNewsFile(filePath);
            } else {
                // If not exists, generate new one
                new Notice('Generating today\'s news briefing...');
                const createdPath = await this.generateDailyNews();
                
                if (createdPath) {
                    // Increased timeout for file system operations to complete
                    setTimeout(() => {
                        this.openNewsFile(createdPath);
                    }, 1000); // Increased delay to ensure file is created and indexed
                }
            }
        } catch (error) {
            console.error('Error opening or creating daily news:', error);
            new Notice('Unable to open or create daily news');
        }
    }

    // Helper method to normalize paths for Obsidian's file system
    private normalizePath(path: string): string {
        // Ensure path doesn't start with a slash
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        
        // Replace any double slashes with single slashes
        path = path.replace(/\/+/g, '/');
        
        return path;
    }

    // Helper method to open news file with multiple fallback approaches
    private openNewsFile(filePath: string) {
        try {
            // Normalize the path for consistent handling
            filePath = this.normalizePath(filePath);
            console.log(`Trying to open file at path: ${filePath}`);
            
            // Try to get the file from the vault
            const file = this.app.vault.getAbstractFileByPath(filePath);
            
            if (file instanceof TFile) {
                console.log(`File found, opening: ${file.path}`);
                // Try to open the file using workspace API
                this.app.workspace.openLinkText(file.path, '', false)
                    .then(() => {
                        new Notice('Opened today\'s news briefing');
                    })
                    .catch(error => {
                        console.error('Failed to open file with openLinkText:', error);
                        // Fallback: Try to actively focus the leaf after opening
                        this.app.workspace.getLeaf(false).openFile(file)
                            .then(() => {
                                new Notice('Opened today\'s news briefing (fallback method)');
                            })
                            .catch(e => {
                                console.error('Both file opening methods failed:', e);
                                new Notice('Unable to open news file. Try opening it manually.');
                            });
                    });
            } else {
                console.error(`File not found in vault at: ${filePath}`);
                new Notice(`Unable to find news file. Please check path: ${filePath}`);
            }
        } catch (error) {
            console.error('Error in openNewsFile:', error);
            new Notice('Error opening news file');
        }
    }
}