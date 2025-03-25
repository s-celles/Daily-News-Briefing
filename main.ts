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
    maxSearchResults: number; // New setting for controlling search depth
    preferredDomains: string[];
    excludedDomains: string[];
    
    // Output settings
    outputFormat: 'detailed' | 'concise';
    enableNotifications: boolean;
    
    // Advanced settings (hidden by default)
    dateRange: string;
    minContentLength: number;
    useCustomPrompt: boolean;
    customPrompt: string; // Custom AI prompt for advanced users
    strictQualityFiltering: boolean; // New setting for strict filtering
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
    maxSearchResults: 30, // Default to 30 results for deeper search
    preferredDomains: ['nytimes.com', 'bbc.com', 'reuters.com', 'apnews.com'],
    excludedDomains: ['pinterest.com', 'facebook.com', 'instagram.com'],
    
    // Output settings
    outputFormat: 'detailed',
    enableNotifications: true,
    
    // Advanced settings
    dateRange: 'd2',
    minContentLength: 120, // Increased minimum length
    useCustomPrompt: false,
    customPrompt: '', // Empty by default
    strictQualityFiltering: true // Enable strict filtering by default
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
            .setName('Google API key')
            .setDesc('Your Google Custom Search API key')
            .addText(text => text
                .setPlaceholder('Enter API key')
                .setValue(this.plugin.settings.googleApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.googleApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Search engine ID')
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
            .setName('Strict quality filtering')
            .setDesc('Enforce stricter quality filters (removes more low-quality content)')
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
            .setName('Show advanced settings')
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
                    .setPlaceholder('120')
                    .setValue(this.plugin.settings.minContentLength.toString())
                    .onChange(async (value) => {
                        const parsedValue = parseInt(value);
                        this.plugin.settings.minContentLength = isNaN(parsedValue) ? 120 : parsedValue;
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
        // Build an optimized search query for quality results
        let searchQuery = this.buildOptimizedQuery(topic);
        
        // Get appropriate date range parameter
        const dateRangeParam = this.settings.dateRange.match(/^[dw]\d+$/) ? 
            this.settings.dateRange : 'd2';
            
        // Multi-phase search strategy for maximum quality
        let allNews: NewsItem[] = [];
        const maxResults = this.settings.maxSearchResults;
        
        // Phase 1: Search high-quality sources first
        console.log(`Fetching prioritized news for ${topic}`);
        const highQualityNews = await this.fetchPrioritizedNews(searchQuery, dateRangeParam, true, 10);
        allNews = [...highQualityNews];
        console.log(`Found ${highQualityNews.length} high-quality results`);
        
        // Phase 2: Try specific search terms variant if we need more results
        if (allNews.length < maxResults / 2) {
            // Create a more specific query to target real news articles
            const specificQuery = this.createSpecificQuery(topic);
            console.log(`Using specific query: ${specificQuery}`);
            
            const specificNews = await this.fetchPrioritizedNews(specificQuery, dateRangeParam, false, 10);
            
            // Add non-duplicate specific news
            for (const item of specificNews) {
                if (!allNews.some(existing => existing.link === item.link)) {
                    allNews.push(item);
                }
            }
            console.log(`Added ${specificNews.length} results from specific query`);
        }
        
        // Phase 3: General search if we still need more
        if (allNews.length < maxResults) {
            const remainingCount = maxResults - allNews.length;
            console.log(`Fetching up to ${remainingCount} more general results`);
            
            const regularNews = await this.fetchPrioritizedNews(searchQuery, dateRangeParam, false, remainingCount);
            
            // Add non-duplicate regular news
            for (const item of regularNews) {
                if (!allNews.some(existing => existing.link === item.link)) {
                    allNews.push(item);
                }
            }
            console.log(`Added ${regularNews.length} results from general search`);
        }
        
        console.log(`Total collected news items before filtering: ${allNews.length}`);
        
        // Apply quality filtering - stricter if enabled
        let filteredNews = this.applyQualityFilters(allNews);
        console.log(`After filtering: ${filteredNews.length} items remain`);
        
        // If we have too few results after filtering, try a broader search strategy
        if (filteredNews.length < 3) {
            console.log(`Too few results after filtering, trying broader search...`);
            
            // Try different date ranges and broader terms
            const broaderQueries = [
                { query: `${topic} latest developments important news`, dateRange: 'w1' },
                { query: `${topic} significant news recent`, dateRange: 'w1' },
                { query: `${topic} major news developments`, dateRange: 'w2' }
            ];
            
            for (const {query, dateRange} of broaderQueries) {
                if (filteredNews.length >= 3) break;
                
                console.log(`Trying broader query: ${query} with range ${dateRange}`);
                const broaderNews = await this.fetchPrioritizedNews(query, dateRange, false, 10);
                
                if (broaderNews.length > 0) {
                    // Use less restrictive filtering
                    const lessStrictFiltering = this.settings.strictQualityFiltering;
                    this.settings.strictQualityFiltering = false;
                    
                    const broaderFiltered = this.applyQualityFilters(broaderNews);
                    
                    // Restore original setting
                    this.settings.strictQualityFiltering = lessStrictFiltering;
                    
                    // Add non-duplicate broader news
                    for (const item of broaderFiltered) {
                        if (!filteredNews.some(existing => existing.link === item.link)) {
                            filteredNews.push(item);
                        }
                    }
                    
                    console.log(`Added ${broaderFiltered.length} items from broader search`);
                }
            }
        }
        
        // Sort by quality score
        filteredNews.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
        
        // Limit to the configured number of results
        const finalResults = filteredNews.slice(0, this.settings.resultsPerTopic);
        console.log(`Final results for ${topic}: ${finalResults.length} items`);
        
        return finalResults;
    }
    
    // Create a more specific query targeting real news articles
    private createSpecificQuery(topic: string): string {
        const lowercaseTopic = topic.toLowerCase();
        let specificTerms = '"news article" OR "published" OR "reports" OR "announced"';
        
        // Add topic-specific terms
        if (lowercaseTopic.includes('tech')) {
            specificTerms += ' OR "launched" OR "released" OR "unveiled" OR "introduced"';
        } else if (lowercaseTopic.includes('business') || lowercaseTopic.includes('finance')) {
            specificTerms += ' OR "reported earnings" OR "financial results" OR "quarterly" OR "fiscal"';
        } else if (lowercaseTopic.includes('science')) {
            specificTerms += ' OR "study finds" OR "researchers" OR "scientists" OR "published in"';
        } else if (lowercaseTopic.includes('health')) {
            specificTerms += ' OR "study shows" OR "clinical trial" OR "medical journal" OR "health officials"';
        } else if (lowercaseTopic.includes('world') || lowercaseTopic.includes('polit')) {
            specificTerms += ' OR "officials said" OR "announced today" OR "government" OR "administration"';
        }
        
        return `${topic} ${specificTerms} -"subscribe" -"sign up" -"advertisement"`;
    }
    
    private buildOptimizedQuery(topic: string): string {
        // Base query with the topic
        let query = `${topic} news`;
        
        // Add topic-specific enhancements
        const lowercaseTopic = topic.toLowerCase();
        
        if (lowercaseTopic.includes('tech')) {
            query += ' "latest developments" OR "new research" OR "breakthrough" OR "innovation"';
        } else if (lowercaseTopic.includes('world') || lowercaseTopic.includes('global')) {
            query += ' "international relations" OR "global affairs" OR "diplomatic" OR "policy"';
        } else if (lowercaseTopic.includes('business') || lowercaseTopic.includes('finance')) {
            query += ' "financial results" OR "market trends" OR "earnings" OR "economic data"';
        } else if (lowercaseTopic.includes('science')) {
            query += ' "discovery" OR "research findings" OR "study results" OR "breakthrough"';
        } else if (lowercaseTopic.includes('health')) {
            query += ' "medical research" OR "health study" OR "clinical trial" OR "treatment"';
        } else {
            // Generic improvements for other topics
            query += ' "latest developments" OR "recent events" OR "significant" OR "important"';
        }
        
        // Add date context to get fresh news
        query += ' "this week" OR "recent" OR "latest" OR "new" OR "update"';
        
        // Add negative terms to filter out low-quality content
        query += ' -old -outdated -speculation -rumor';
        
        return query;
    }
    
    private async fetchPrioritizedNews(
        query: string, 
        dateRestrict: string, 
        prioritizeQuality: boolean,
        maxResults: number = 10
    ): Promise<NewsItem[]> {
        // Calculate how many API requests we need to make
        const requestsNeeded = Math.ceil(maxResults / 10); // Google API max is 10 per request
        const actualRequests = Math.min(requestsNeeded, 3); // Cap at 3 requests to avoid excessive API usage
        
        let allResults: NewsItem[] = [];
        
        for (let i = 0; i < actualRequests; i++) {
            // Skip further requests if we've already collected enough results
            if (allResults.length >= maxResults) break;
            
            const startIndex = (i * 10) + 1; // Google API starts at 1
            
            const params = new URLSearchParams({
                key: this.settings.googleApiKey,
                cx: this.settings.searchEngineId,
                q: query,
                num: '10', // Google API max per request
                dateRestrict: dateRestrict,
                fields: 'items(title,link,snippet,pagemap/metatags/publishedTime,pagemap/metatags/og_site_name)',
                sort: i === 0 ? 'date' : 'relevance', // First page by date, others by relevance for variety
                start: startIndex.toString()
            });
            
            // Add site restrictions for higher quality sources if prioritizing quality
            if (prioritizeQuality) {
                let qualitySources = [...this.settings.preferredDomains];
                
                // If user hasn't specified enough preferred domains, add high-quality defaults
                if (qualitySources.length < 5) {
                    // Use a rotating subset of quality sources to get more variety
                    const startIdx = (i * 10) % QUALITY_NEWS_SOURCES.length;
                    const sourcesToAdd = QUALITY_NEWS_SOURCES.slice(startIdx, startIdx + 15);
                    qualitySources = [...qualitySources, ...sourcesToAdd];
                }
                
                if (qualitySources.length > 0) {
                    // Take a subset of sources to avoid overly long queries
                    const siteSubset = qualitySources.slice(0, 15);
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
                    await new Promise(r => setTimeout(r, 300));
                }
                
            } catch (error) {
                console.error(`Search API error on page ${i+1}:`, error);
                // Continue to next page despite errors
            }
        }
        
        return allResults;
    }
    
    private calculateQualityScore(item: SearchItem, domain: string): number {
        let score = 5; // Base score
        
        // Boost for high-quality sources
        if (QUALITY_NEWS_SOURCES.some(source => domain.includes(source))) {
            score += 2;
        }
        
        // Boost for preferred domains
        if (this.settings.preferredDomains.some(source => domain.includes(source))) {
            score += 3;
        }
        
        // Boost for article-like URLs
        if (/\/article\/|\/story\/|\/news\/|\/\d{4}\/\d{2}\//.test(item.link)) {
            score += 2;
        }
        
        // Penalize obvious non-article pages
        if (new URL(item.link).pathname === "/" || new URL(item.link).pathname.length < 3) {
            score -= 4; // Likely homepage
        }
        
        // Penalize category/tag pages
        if (/\/category\/|\/categories\/|\/topics\/|\/tag\//.test(item.link)) {
            score -= 3;
        }
        
        // Check for content quality indicators
        if (item.snippet) {
            // Contains concrete data like numbers, dates
            if (/\d+%|\d+ percent|\$\d+|\d+ million|\d+ billion/.test(item.snippet)) {
                score += 1.5;
            }
            
            // Contains quotes (suggests actual reporting)
            if (/"[^"]{10,}"/.test(item.snippet) || /'[^']{10,}'/.test(item.snippet)) {
                score += 1.5;
            }
            
            // Contains reporting verbs
            if (/reported|announced|revealed|published|confirmed|according to/.test(item.snippet)) {
                score += 1;
            }
            
            // Longer snippets are usually better
            if (item.snippet.length > 150) {
                score += 1;
            }
            
            // Penalize obvious website descriptions
            if (/is a website|is the official|official site/.test(item.snippet) && item.snippet.length < 120) {
                score -= 3;
            }
        }
        
        // Penalize excluded domains
        if (this.settings.excludedDomains.some(excluded => domain.includes(excluded))) {
            score -= 4;
        }
        
        // Clamp the score between 1-10
        return Math.max(1, Math.min(10, score));
    }
    
    private applyQualityFilters(newsItems: NewsItem[]): NewsItem[] {
        // Determine quality threshold based on settings
        const qualityThreshold = this.settings.strictQualityFiltering ? 5 : 4;
        
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
                if (item.snippet.length < this.settings.minContentLength) {
                    return false;
                }
                
                // URL quality checks
                // Reject homepages and very short paths
                if (url.pathname === "/" || url.pathname === "" || url.pathname.length < 3) {
                    return false;
                }
                
                // Reject category pages, tag pages, search results
                if (/\/category\/|\/categories\/|\/topics\/|\/tag\/|\/tags\/|\/search\//.test(url.pathname)) {
                    return false;
                }
                
                // Check for signs of actual article URLs
                const hasArticlePattern = /\/article\/|\/story\/|\/news\/|\/\d{4}\/\d{2}\/|[-]\d+\.html/.test(url.pathname);
                
                // Content quality checks
                
                // Filter out obvious website descriptions
                if (/is a website|is the official|official site of|homepage of/.test(item.snippet)) {
                    return false;
                }
                
                // Filter out content that's just a website description
                if (/provides news|latest news and|breaking news from|news and information|coverage of|news from around/.test(item.snippet) && 
                    item.snippet.length < 150) {
                    return false;
                }
                
                // Filter out obvious list articles if strict filtering is on
                if (this.settings.strictQualityFiltering && 
                    /top \d+|best \d+|\d+ ways|\d+ things|list of/.test(item.title)) {
                    return false;
                }
                
                // Title quality checks - reject obviously low-quality content
                if (/click here|you won't believe|shocking|amazing|must see|unbelievable|mind-blowing/.test(item.title)) {
                    return false;
                }
                
                // Special case: If strict filtering is enabled, require article patterns or high quality
                if (this.settings.strictQualityFiltering) {
                    // Either must be from preferred domain, have article pattern, or high quality
                    const isPreferredDomain = this.settings.preferredDomains.some(
                        preferred => domain.includes(preferred)
                    );
                    
                    const isQualitySource = QUALITY_NEWS_SOURCES.some(
                        source => domain.includes(source)
                    );
                    
                    // If it's not from a preferred domain and doesn't have article pattern
                    // and isn't from a known quality source, require higher quality
                    if (!isPreferredDomain && !hasArticlePattern && !isQualitySource) {
                        // Must have better than average quality score
                        return (item.qualityScore || 0) >= 6;
                    }
                }
                
                // Base quality threshold check
                return (item.qualityScore || 0) >= qualityThreshold;
                
            } catch (error) {
                console.error("Error in quality filtering:", error);
                return false; // Reject any item that causes errors
            }
        });
    }
    
    private cleanNewsContent(text: string): string {
        if (!text) return '';
        
        let cleaned = text;
        
        // Remove common ad patterns
        AD_PATTERNS.forEach(pattern => {
            cleaned = cleaned.replace(new RegExp(pattern, 'gi'), '');
        });
        
        // Remove URLs in the middle of text
        cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
        
        // Remove email addresses
        cleaned = cleaned.replace(/\S+@\S+\.\S+/g, '');
        
        // Remove excess whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        return cleaned;
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
            return `=== NEWS ITEM (Quality Score: ${item.qualityScore}/10) ===\n` +
                `Title: ${item.title}\n` +
                `Source: ${item.source || domain}\n` +
                `URL: ${item.link}\n` +
                `Published: ${item.publishedTime || 'Unknown'}\n` +
                `Source Quality: ${isQualitySource ? 'High-quality established source' : 'Standard source'}\n` +
                `Content: ${item.snippet}\n`;
        }).join('\n\n');

        // Get appropriate prompt
        const prompt = this.getAIPrompt(enhancedNewsText, this.settings.outputFormat);

        try {
            // Initialize the Gemini API
            const genAI = new GoogleGenerativeAI(this.settings.geminiApiKey);
            
            // Use the model "gemini-2.0-flash"
            const modelName ="gemini-2.0-flash";
                
            console.log(`Using model ${modelName} for summarization`);
            
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    temperature: 0.2, // Lower temperature for more factual, focused output
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 4096 // Ensure we have enough tokens for detailed output
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
            return `**Summary Generation Error**\n\nUnable to generate an AI summary for ${topic}. Here are the top news items:\n\n${
                newsItems.slice(0, 5).map(item => 
                    `- **${item.title}** - ${item.snippet?.substring(0, 150)}... [${item.source || new URL(item.link).hostname}](${item.link})`
                ).join('\n\n')
            }`;
        }
    }

    private getAIPrompt(newsText: string, format: 'detailed' | 'concise'): string {
        // If user has custom prompt enabled and provided one, use it
        if (this.settings.useCustomPrompt && this.settings.customPrompt) {
            return this.settings.customPrompt.replace('{{NEWS_TEXT}}', newsText);
        }
        
        // Otherwise use our enhanced prompt
        const basePrompt = `You are a professional news editor creating a high-quality news briefing. Analyze these news articles and provide a substantive summary:

${newsText}

CRITICAL GUIDELINES - READ CAREFULLY:
1. Focus EXCLUSIVELY on real, substantial news with concrete developments, facts, and data points
2. IGNORE any content that:
   - Simply describes what a website or source does rather than actual news
   - Contains vague generalities without specific facts
   - Is obviously a website description or landing page
   - Is too short, lacks concrete information, or is primarily promotional
3. For EACH news item include the SOURCE and link in markdown format: [Source Name](URL)
4. Use specific dates rather than relative time references like "yesterday" or "last week"
5. PRIORITIZE news with:
   - Specific details (numbers, names, locations, dates)
   - Direct quotes from relevant figures
   - Statistical evidence or research results
   - Substantive developments or announcements
6. If the content lacks sufficient substance, state "No substantive news found on this topic" rather than creating low-quality summaries

IMPORTANT QUALITY CRITERIA - Each news item MUST contain:
- At least one specific fact, figure, statistic, or direct quote
- Attribution to a specific source or organization
- Clear relevance to the topic
- Substantial, concrete information (not just vague statements)

EXAMPLES OF LOW-QUALITY CONTENT TO EXCLUDE:
- "BBC offers the latest news and information from around the world."
- "TechCrunch provides technology news, analysis and startup information."
- "New York Times covers national and international news and opinion."
- Any content that merely lists headlines without substantive information

EXAMPLES OF HIGH-QUALITY CONTENT TO INCLUDE:
- "Intel announced a 15% increase in chip production capacity with a $20 billion investment in Arizona facilities, creating 3,000 jobs by 2025, according to CEO Pat Gelsinger."
- "Climate scientists reported a 1.2°C increase in global average temperatures since pre-industrial times, with 2024 on track to be the warmest year on record according to data from NOAA."`;

        // Add format-specific instructions
        if (format === 'detailed') {
            return basePrompt + `

Please format your summary as follows (using SPECIFIC facts, data, and details for each point - no general statements):

### Key Developments
- **[Specific clear headline with key detail]**: Concrete facts including specific details (names, numbers, dates, locations). Each bullet MUST include at least one specific statistic, percentage, or direct quote. [Source](URL)
- **[Specific clear headline with key detail]**: Concrete facts including specific details (names, numbers, dates, locations). Each bullet MUST include at least one specific statistic, percentage, or direct quote. [Source](URL)

### Analysis & Context
[Provide context, implications, or background for the most significant developments. Include relevant history, expert perspectives, or trend analysis using specific details.]

### Notable Data Points or Quotes
• "[Include a DIRECT, verbatim quote from the news that provides substantial insight]" — [Named Source, Title/Organization]
• [Include a specific, significant data point, statistic, percentage or numerical fact that illustrates the news importance]`;
        } else {
            return basePrompt + `

Please format your summary EXCLUSIVELY with bullets containing CONCRETE, SPECIFIC facts (not generalizations):

- **[Specific clear headline with key detail]**: Concrete facts including specific numbers, statistics, percentages, or direct quotes. [Source](URL)
- **[Specific clear headline with key detail]**: Concrete facts including specific numbers, statistics, percentages, or direct quotes. [Source](URL)
- **[Specific clear headline with key detail]**: Concrete facts including specific numbers, statistics, percentages, or direct quotes. [Source](URL)

If there's an important direct quote from a key figure or a significant data point worth highlighting, include it at the end, clearly attributed to its source with exact citation.

IMPORTANT: If the news lacks substantial, specific content with concrete facts, simply state "No substantive news with concrete details found on this topic" rather than creating vague summaries.`;
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
                        content += summary + '\n\n';
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
                if (!(await this.app.vault.adapter.exists(this.settings.archiveFolder))) {
                    await this.app.vault.createFolder(this.settings.archiveFolder);
                }
            } catch (folderError) {
                console.error("Failed to create folder:", folderError);
            }

            const fileName = `${this.settings.archiveFolder}/Daily News - ${date}.md`;
            await this.app.vault.create(fileName, content);
            
            if (this.settings.enableNotifications) {
                new Notice('Daily news generated successfully', 3000);
            }
        } catch (error) {
            console.error('Failed to generate news:', error);
            new Notice('Failed to generate news. Check console for details.', 5000);
        }
    }
}
