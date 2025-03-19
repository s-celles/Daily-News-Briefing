import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, requestUrl } from 'obsidian';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface DailyNewsSettings {
    googleApiKey: string;
    searchEngineId: string;
    geminiApiKey: string;
    topics: string[];
    scheduleTime: string;
    archiveFolder: string;
    news_number: number;
    templatePath: string;
    maxRetries: number;
    enableNotifications: boolean;
    sortByDate: boolean;
    includeMetadata: boolean;
    maxRetryDelay: number;
    outputFormat: 'detailed' | 'concise';
    removeAds: boolean;
    maxNewsPerTopic: number;
    highlightKeywords: boolean;
    commonAdPatterns: string[];
    minSnippetLength: number;
    excludedDomains: string[];
    preferredDomains: string[];
    searchDateRange: string;
    contentRelevanceScore: number;
    enableSourceRanking: boolean;
    searchExactPhrases: string[];
    searchExcludeTerms: string[];
    useAdvancedFiltering: boolean;
    conserveApiCalls: boolean; // Option to conserve API calls
    apiCallsPerDay: number; // Setting to limit API calls per day
    useEnhancedSearchQueries: boolean; // New option for better search queries
    apiCallsToday: number; // 添加以保存API调用次数
    lastApiCallDate: string; // 添加以保存最后调用日期
    sortingMethod: 'relevance' | 'date' | 'none'; // 替换单独的排序设置
}

interface NewsItem {
    title: string;
    link: string;
    snippet: string;
    publishedTime?: string;
    source?: string;
    relevanceScore?: number;
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

interface CustomSearchResponse {
    items?: SearchItem[];
    error?: {
        message: string;
        status: string;
    };
}

const DEFAULT_SETTINGS: DailyNewsSettings = {
    googleApiKey: '',
    searchEngineId: '',
    geminiApiKey: '',
    topics: ['Technology', 'World News'],
    scheduleTime: '08:00',
    archiveFolder: 'News Archive',
    news_number: 10, // Reduced to stay within API limits
    templatePath: '',
    maxRetries: 3,
    enableNotifications: true,
    sortByDate: true,
    includeMetadata: true,
    maxRetryDelay: 30000,
    outputFormat: 'detailed',
    removeAds: true,
    maxNewsPerTopic: 10,
    highlightKeywords: true,
    commonAdPatterns: [
        'Subscribe to read',
        'Sign up now',
        'Advertisement',
        'Click here to',
        'Special offer',
        'newsletters?\\b',
        '\\[\\d+\\]',
        '©\\s*\\d{4}',
        'cookie',
        'subscribe',
        'sign up',
        'for more information',
        'privacy policy',
        'terms of service',
        'all rights reserved'
    ],
    minSnippetLength: 100,
    excludedDomains: [],
    preferredDomains: [],
    searchDateRange: 'd2',
    contentRelevanceScore: 6,
    enableSourceRanking: true,
    searchExactPhrases: [],
    searchExcludeTerms: [],
    useAdvancedFiltering: true,
    conserveApiCalls: true, // Default to conserving API calls
    apiCallsPerDay: 100, // Default limit
    useEnhancedSearchQueries: true, // Default to using enhanced queries
    apiCallsToday: 0,
    lastApiCallDate: '',
    sortingMethod: 'relevance' // 默认使用相关性排序
}

// Top news sources by quality/reliability
const QUALITY_NEWS_SOURCES = [
    'nytimes.com', 'bbc.com', 'reuters.com', 'apnews.com', 'economist.com',
    'wsj.com', 'ft.com', 'bloomberg.com', 'theguardian.com', 'npr.org',
    'washingtonpost.com', 'aljazeera.com', 'nature.com', 'time.com', 'wired.com',
    'theatlantic.com', 'newyorker.com', 'scientificamerican.com', 'cnbc.com',
    'fortune.com', 'techcrunch.com', 'thenextweb.com', 'arstechnica.com'
];

// Define the DailyNewsSettingTab class before it's used
class DailyNewsSettingTab extends PluginSettingTab {
    plugin: DailyNewsPlugin;

    constructor(app: App, plugin: DailyNewsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        // API configuration section
        new Setting(containerEl)
            .setName('API configuration')
            .setHeading();

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
            .setDesc('Your Google Gemini API key')
            .addText(text => text
                .setPlaceholder('Enter Gemini API key')
                .setValue(this.plugin.settings.geminiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.geminiApiKey = value;
                    await this.plugin.saveSettings();
                }));

        // API Usage Management section
        new Setting(containerEl)
            .setName('API usage management')
            .setHeading();
        
        // API usage info moved here
        if (this.plugin.settings.conserveApiCalls) {
            const apiInfo = containerEl.createEl('div', {
                cls: 'api-usage-info',
            });
            apiInfo.createEl('p', {
                text: `API usage today: ${this.plugin.settings.apiCallsToday}/${this.plugin.settings.apiCallsPerDay} calls`
            });
        }
        
        new Setting(containerEl)
            .setName('Conserve API calls')
            .setDesc('Enable to limit API calls and prevent quota exhaustion')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.conserveApiCalls)
                .onChange(async (value) => {
                    this.plugin.settings.conserveApiCalls = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide the API calls setting
                }));
                
        if (this.plugin.settings.conserveApiCalls) {
            new Setting(containerEl)
                .setName('Daily API call limit')
                .setDesc('Maximum number of API calls to make per day')
                .addText(text => text
                    .setPlaceholder('100')
                    .setValue(this.plugin.settings.apiCallsPerDay.toString())
                    .onChange(async (value) => {
                        const parsedValue = parseInt(value);
                        this.plugin.settings.apiCallsPerDay = isNaN(parsedValue) ? 100 : parsedValue;
                        await this.plugin.saveSettings();
                    }));
                    
            new Setting(containerEl)
                .setName('Reset API counter')
                .setDesc('Reset today\'s API call counter')
                .addButton(button => button
                    .setButtonText('Reset counter')
                    .onClick(async () => {
                        this.plugin.settings.apiCallsToday = 0;
                        await this.plugin.saveSettings();
                        this.plugin.updateStatusBar();
                        this.display();
                        new Notice('API call counter reset to 0');
                    }));
        }

        // Basic news preferences section
        new Setting(containerEl)
            .setName('Basic news preferences')
            .setHeading();

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

        new Setting(containerEl)
            .setName('Topics')
            .setDesc('News topics to follow (comma-separated)')
            .addText(text => text
                .setPlaceholder('Technology, World News')
                .setValue(this.plugin.settings.topics.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.topics = value.split(',').map(t => t.trim());
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Template file')
            .setDesc('Custom template file path (optional)')
            .addText(text => text
                .setPlaceholder('templates/news-template.md')
                .setValue(this.plugin.settings.templatePath)
                .onChange(async (value) => {
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                }));

        // Search Quality section
        new Setting(containerEl)
            .setName('Search quality')
            .setHeading();

        new Setting(containerEl)
            .setName('Use enhanced search queries')
            .setDesc('Use topic-specific optimized search queries to find better news articles')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useEnhancedSearchQueries)
                .onChange(async (value) => {
                    this.plugin.settings.useEnhancedSearchQueries = value;
                    await this.plugin.saveSettings();
                }));
        
        // Advanced search
        new Setting(containerEl)
            .setName('Advanced search')
            .setHeading();

        new Setting(containerEl)
            .setName('Search date range')
            .setDesc('How far back to search (d1 = 1 day, d2 = 2 days, w1 = 1 week)')
            .addText(text => text
                .setPlaceholder('d2')
                .setValue(this.plugin.settings.searchDateRange)
                .onChange(async (value) => {
                    this.plugin.settings.searchDateRange = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('News results per topic')
            .setDesc('Maximum number of news results to retrieve per topic (via pagination)')
            .addText(text => text
                .setPlaceholder('20')
                .setValue(this.plugin.settings.news_number.toString())
                .onChange(async (value) => {
                    const parsedValue = parseInt(value);
                    this.plugin.settings.news_number = isNaN(parsedValue) ? 20 : parsedValue;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max news items per summary')
            .setDesc('Maximum number of news items to include in the summary')
            .addText(text => text
                .setPlaceholder('8')
                .setValue(this.plugin.settings.maxNewsPerTopic.toString())
                .onChange(async (value) => {
                    const parsedValue = parseInt(value);
                    this.plugin.settings.maxNewsPerTopic = isNaN(parsedValue) ? 10 : parsedValue;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Minimum content length')
            .setDesc('Minimum length for news snippets to be considered')
            .addText(text => text
                .setPlaceholder('100')
                .setValue(this.plugin.settings.minSnippetLength.toString())
                .onChange(async (value) => {
                    const parsedValue = parseInt(value);
                    this.plugin.settings.minSnippetLength = isNaN(parsedValue) ? 100 : parsedValue;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Preferred domains')
            .setDesc('Comma-separated list of preferred domains (e.g., nytimes.com, bbc.com)')
            .addText(text => text
                .setPlaceholder('nytimes.com, bbc.com')
                .setValue(this.plugin.settings.preferredDomains.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.preferredDomains = value.split(',').map(d => d.trim());
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Excluded domains')
            .setDesc('Comma-separated list of domains to exclude')
            .addText(text => text
                .setPlaceholder('pinterest.com, facebook.com')
                .setValue(this.plugin.settings.excludedDomains.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.excludedDomains = value.split(',').map(d => d.trim());
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Exact phrases to include')
            .setDesc('Comma-separated list of exact phrases to include in search')
            .addText(text => text
                .setPlaceholder('latest developments, new research')
                .setValue(this.plugin.settings.searchExactPhrases.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.searchExactPhrases = value.split(',').map(p => p.trim());
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Terms to exclude')
            .setDesc('Comma-separated list of terms to exclude from search')
            .addText(text => text
                .setPlaceholder('clickbait, rumor, opinion')
                .setValue(this.plugin.settings.searchExcludeTerms.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.searchExcludeTerms = value.split(',').map(t => t.trim());
                    await this.plugin.saveSettings();
                }));

        // Content quality
        new Setting(containerEl)
            .setName('Content quality')
            .setHeading();

        new Setting(containerEl)
            .setName('Enable advanced filtering')
            .setDesc('Apply advanced filtering to improve news quality')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useAdvancedFiltering)
                .onChange(async (value) => {
                    this.plugin.settings.useAdvancedFiltering = value;
                    await this.plugin.saveSettings();
                }));

        // 合并排序选项为一个dropdown
        new Setting(containerEl)
            .setName('Results sorting method')
            .setDesc('How to sort the news results')
            .addDropdown(dropdown => dropdown
                .addOption('relevance', 'Sort by relevance score')
                .addOption('date', 'Sort by published date')
                .addOption('none', 'No sorting')
                .setValue(this.plugin.settings.sortingMethod)
                .onChange(async (value: 'relevance' | 'date' | 'none') => {
                    this.plugin.settings.sortingMethod = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Minimum relevance score')
            .setDesc('Minimum relevance score for news (1-10)')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.contentRelevanceScore)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.contentRelevanceScore = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Remove ads and promotions')
            .setDesc('Clean promotional content from news')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.removeAds)
                .onChange(async (value) => {
                    this.plugin.settings.removeAds = value;
                    await this.plugin.saveSettings();
                }));

        // Format section
        new Setting(containerEl)
            .setName('Output format')
            .setHeading();

        new Setting(containerEl)
            .setName('Output style')
            .setDesc('Choose between detailed or concise news format')
            .addDropdown(dropdown => dropdown
                .addOption('detailed', 'Detailed')
                .addOption('concise', 'Concise')
                .setValue(this.plugin.settings.outputFormat)
                .onChange(async (value: 'detailed' | 'concise') => {
                    this.plugin.settings.outputFormat = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Highlight keywords')
            .setDesc('Highlight important terms in the summary')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.highlightKeywords)
                .onChange(async (value) => {
                    this.plugin.settings.highlightKeywords = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Include metadata')
            .setDesc('Include metadata in the generated news')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.includeMetadata)
                .onChange(async (value) => {
                    this.plugin.settings.includeMetadata = value;
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
    }
}

export default class DailyNewsPlugin extends Plugin {
    settings: DailyNewsSettings;
    statusBarItem: HTMLElement | null = null;
    
    async onunload() {
        // 移除不必要的日志
    }
    
    async onload() {
        await this.loadSettings();
        
        // 修改API调用计数器逻辑，现在使用持久化的设置
        this.loadApiCallCount();
        
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

        // Add status bar item
        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar();
    }

    // API call tracking methods - 修改为使用持久化设置
    private loadApiCallCount() {
        const today = new Date().toISOString().split('T')[0];
        
        // Reset counter if it's a new day
        if (this.settings.lastApiCallDate !== today) {
            this.settings.apiCallsToday = 0;
            this.settings.lastApiCallDate = today;
            this.saveSettings();
        }
    }
    
    private incrementApiCallCount() {
        const today = new Date().toISOString().split('T')[0];
        
        // Reset counter if it's a new day
        if (this.settings.lastApiCallDate !== today) {
            this.settings.apiCallsToday = 0;
            this.settings.lastApiCallDate = today;
        }
        
        this.settings.apiCallsToday++;
        this.saveSettings();
        this.updateStatusBar();
    }
    
    // 改为public，可从设置选项卡访问
    public updateStatusBar() {
        if (this.statusBarItem) {
            const apiStatus = this.settings.conserveApiCalls ? 
                ` | API: ${this.settings.apiCallsToday}/${this.settings.apiCallsPerDay}` : '';
            this.statusBarItem.setText(`📰 Daily news ready${apiStatus}`);
        }
    }
    
    private canMakeApiCall(): boolean {
        if (!this.settings.conserveApiCalls) {
            return true;
        }
        
        return this.settings.apiCallsToday < this.settings.apiCallsPerDay;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async fetchNews(topic: string): Promise<NewsItem[]> {
        // Check if we can make API calls
        if (!this.canMakeApiCall()) {
            // console.log('API call limit reached for today. Skipping search for:', topic);
            new Notice(`API call limit reached (${this.settings.apiCallsPerDay}/day). Try again tomorrow.`);
            return [];
        }
        
        // Build a more specific search query with better keywords
        let searchQuery = '';
        
        // Choose between enhanced or basic queries
        if (this.settings.useEnhancedSearchQueries) {
            // Enhanced topic-specific search queries
            switch(topic.toLowerCase()) {
                case 'technology':
                    searchQuery = `${topic} news "latest developments" OR "new research" OR "breakthrough" OR "innovation" OR "launch" -old -outdated`;
                    break;
                case 'world news':
                    searchQuery = `${topic} "international relations" OR "global affairs" OR "foreign policy" OR "diplomatic" OR "geopolitical" -speculation -rumor`;
                    break;
                case 'business':
                    searchQuery = `${topic} news "financial results" OR "market trends" OR "earnings" OR "economic data" OR "merger" -speculative`;
                    break;
                case 'science':
                    searchQuery = `${topic} news "discovery" OR "research findings" OR "study results" OR "scientific breakthrough" -preliminary -unconfirmed`;
                    break;
                case 'health':
                    searchQuery = `${topic} news "medical research" OR "health study" OR "clinical trial" OR "treatment breakthrough" -unverified`;
                    break;
                default:
                    searchQuery = `${topic} news "latest developments" OR "recent events" OR "significant developments" OR "important update"`;
            }
        } else {
            // Basic search query
            searchQuery = `${topic} news`;
        }
        
        // Add exact phrases if specified
        if (this.settings.searchExactPhrases && this.settings.searchExactPhrases.length > 0) {
            for (const phrase of this.settings.searchExactPhrases) {
                if (phrase.trim()) {
                    searchQuery += ` "${phrase.trim()}"`;
                }
            }
        }
        
        // Add excluded terms if specified
        if (this.settings.searchExcludeTerms && this.settings.searchExcludeTerms.length > 0) {
            for (const term of this.settings.searchExcludeTerms) {
                if (term.trim()) {
                    searchQuery += ` -${term.trim()}`;
                }
            }
        }

        // console.log(`Using search query for ${topic}: ${searchQuery}`);

        // Get date range parameter
        const dateRangeParam = this.getOptimizedDateRange();

        // Build search parameters
        const maxResultsPerRequest = 10; // Google API 每次最多返回10条
        
        // 1. 修改这里：移除保守模式判断，直接使用用户设置的数量
        const totalResultsToFetch = Math.min(100, this.settings.news_number); // 最多获取100条
        
        // 2. 计算需要请求的次数
        const numRequests = Math.ceil(totalResultsToFetch / maxResultsPerRequest);
        
        // console.log(`Will fetch up to ${totalResultsToFetch} results in ${numRequests} requests for ${topic}`);

        let allNewsItems: SearchItem[] = [];
        
        // 3. 先获取优质来源的结果
        if (this.settings.preferredDomains && this.settings.preferredDomains.length > 0) {
            // Make a targeted request for high-quality sources first
            const highQualityNewsItems = await this.makeSearchRequest(
                searchQuery, 
                1, 
                dateRangeParam, 
                true, // prioritize preferred domains
                maxResultsPerRequest
            );
            
            if (highQualityNewsItems && highQualityNewsItems.length > 0) {
                allNewsItems = [...highQualityNewsItems];
                // console.log(`Found ${highQualityNewsItems.length} high-quality items for ${topic}`);
            }
        }
        
        // 4. 如果还需要更多结果，继续分页获取
        if (allNewsItems.length < totalResultsToFetch) {
            for (let i = 0; i < numRequests; i++) {
                if (!this.canMakeApiCall()) {
                    // console.log(`API call limit reached. Stopping after ${i} requests for topic:`, topic);
                    break;
                }
                
                const startIndex = i * maxResultsPerRequest + 1;
                // console.log(`Making request ${i + 1}/${numRequests} for ${topic}, starting at index ${startIndex}`);
                
                const newItems = await this.makeSearchRequest(
                    searchQuery,
                    startIndex,
                    dateRangeParam,
                    false,
                    maxResultsPerRequest
                );
                
                // 5. 修改这里：只有当完全没有结果时才中断
                if (!newItems || !Array.isArray(newItems)) {
                    // console.log(`No valid items returned for request ${i + 1}`);
                    break;
                }
                
                // console.log(`Request ${i + 1} returned ${newItems.length} items`);
                
                // 6. 添加新结果时去重
                for (const item of newItems) {
                    if (!allNewsItems.some(existingItem => existingItem.link === item.link)) {
                        allNewsItems.push(item);
                        // console.log(`Added new item: ${item.title}`);
                    }
                }
                
                // 7. 修改这里：使用实际目标数量判断
                if (allNewsItems.length >= totalResultsToFetch) {
                    // console.log(`Reached target number of items (${totalResultsToFetch}) for ${topic}`);
                    break;
                }
                
                // 在请求之间添加延迟
                if (i < numRequests - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        // console.log(`Found total of ${allNewsItems.length} items for ${topic}`);

        // Map search items to news items with rich metadata
        let newsItems = allNewsItems.map((item: SearchItem): NewsItem => {
            // Extract domain from URL
            const url = new URL(item.link);
            const domain = url.hostname.replace('www.', '');
            
            // Extract source name from metadata or URL
            const source = item.pagemap?.metatags?.[0]?.og_site_name || domain;
            
            return {
                title: item.title,
                link: item.link,
                snippet: item.snippet,
                publishedTime: item.pagemap?.metatags?.[0]?.publishedTime,
                source: source,
                relevanceScore: this.calculateRelevanceScore(item, topic)
            };
        });

        // Apply enhanced filtering
        if (this.settings.useAdvancedFiltering) {
            newsItems = this.applyAdvancedFiltering(newsItems);
        }

        // If no items after filtering, try a broader search
        if (newsItems.length === 0 && this.canMakeApiCall()) {
            // console.log(`No items after filtering for ${topic}. Trying broader search...`);
            
            // Broader search with fewer constraints
            const broaderQuery = `${topic} news latest`;
            const broaderItems = await this.makeSearchRequest(
                broaderQuery,
                1,
                'w1', // Expand to a week to get more results
                false,
                maxResultsPerRequest
            );
            
            if (broaderItems && broaderItems.length > 0) {
                // console.log(`Found ${broaderItems.length} items with broader search for ${topic}`);
                
                newsItems = broaderItems.map((item: SearchItem): NewsItem => {
                    const url = new URL(item.link);
                    const domain = url.hostname.replace('www.', '');
                    const source = item.pagemap?.metatags?.[0]?.og_site_name || domain;
                    
                    return {
                        title: item.title,
                        link: item.link,
                        snippet: item.snippet,
                        publishedTime: item.pagemap?.metatags?.[0]?.publishedTime,
                        source: source,
                        relevanceScore: this.calculateRelevanceScore(item, topic) * 0.8 // Reduce score slightly for broader results
                    };
                });
                
                // Less aggressive filtering for broader search
                newsItems = newsItems.filter(item => {
                    // Only filter out very low relevance items
                    return (item.relevanceScore || 0) >= Math.max(3, this.settings.contentRelevanceScore - 2);
                });
            }
        }

        // Sort by relevance or date
        if (this.settings.enableSourceRanking) {
            // Sort by relevance score first
            newsItems.sort((a: NewsItem, b: NewsItem) => 
                (b.relevanceScore || 0) - (a.relevanceScore || 0)
            );
        } else if (this.settings.sortByDate) {
            // Sort by published date
            newsItems.sort((a: NewsItem, b: NewsItem) => {
                if (!a.publishedTime) return 1;
                if (!b.publishedTime) return -1;
                return new Date(b.publishedTime).getTime() - new Date(a.publishedTime).getTime();
            });
        }

        return newsItems;
    }

    // Helper methods for news fetching
    // 修正makeSearchRequest方法中的请求方式，使用requestUrl替代app.request
    private async makeSearchRequest(
        query: string, 
        startIndex: number, 
        dateRestrict: string,
        prioritizePreferredDomains: boolean,
        numResults: number
    ): Promise<SearchItem[]> {
        // Base parameters for the search request
        const params = new URLSearchParams({
            key: this.settings.googleApiKey,
            cx: this.settings.searchEngineId,
            q: query,
            num: numResults.toString(),
            dateRestrict: dateRestrict,
            fields: 'items(title,link,snippet,pagemap/metatags/publishedTime,pagemap/metatags/og_site_name)',
            sort: 'date',
            start: startIndex.toString()
        });
        
        // Add site: operator for preferred domains if specified
        if (prioritizePreferredDomains && this.settings.preferredDomains && this.settings.preferredDomains.length > 0) {
            const sitesQuery = this.settings.preferredDomains.map(domain => `site:${domain}`).join(' OR ');
            params.set('q', `${params.get('q')} (${sitesQuery})`);
        }
        
        // 使用 requestUrl 而不是 fetch 或 app.request
        this.incrementApiCallCount();
        
        const response = await this.retryOperation(async () => {
            const res = await requestUrl({
                url: `https://www.googleapis.com/customsearch/v1?${params.toString()}`
            });
            return res.text;
        });

        try {
            const data: CustomSearchResponse = JSON.parse(response);
            
            if (!data || !data.items || data.items.length === 0) {
                return [];
            }
            
            return data.items;
        } catch (e) {
            console.error("Failed to parse search response:", e);
            return [];
        }
    }

    private getOptimizedDateRange(): string {
        // Start with the user-configured date range
        let dateRange = this.settings.searchDateRange;
        
        // If no valid date range is specified, default to the past 2 days
        if (!dateRange.match(/^[dw]\d+$/)) {
            dateRange = 'd2';
        }
        
        return dateRange;
    }

    // Enhanced relevance scoring
    private calculateRelevanceScore(item: SearchItem, topic: string): number {
        let score = 5; // Base score
        
        // Extract domain and check if it's a quality source
        const url = new URL(item.link);
        const domain = url.hostname.replace('www.', '');
        
        // Major boost for high-quality sources
        if (QUALITY_NEWS_SOURCES.some(source => domain.includes(source))) {
            score += 3;
        }
        
        // Check for article-like URL patterns (higher quality than index/category pages)
        if (/\/article\/|\/story\/|\/news\/|\/\d{4}\/\d{2}\/|[-]\d+\.html$/.test(item.link)) {
            score += 2;
        }
        
        // Check if the URL pattern suggests it's an actual article and not a homepage
        if (url.pathname.length > 1 && url.pathname !== "/" && !url.pathname.endsWith("/")) {
            score += 1;
        }
        
        // Strongly penalize non-article URLs
        if (url.pathname === "/" || url.pathname === "" || url.pathname.length < 3) {
            score -= 4; // Homepage or very short URL - likely not an article
        }
        
        // Penalize category pages
        if (/\/category\/|\/categories\/|\/topics\/|\/sections\/|\/tag\/|\/tags\//.test(item.link)) {
            score -= 3;
        }
        
        // Snippet length (longer often means more substantial)
        if (item.snippet && item.snippet.length > 200) {
            score += 1;
        }
        
        // Title contains topic keywords
        if (item.title && item.title.toLowerCase().includes(topic.toLowerCase())) {
            score += 1;
        }
        
        // Check for meaningful content indicators - data, quotes, specificity
        if (item.snippet) {
            // Contains concrete data points (numbers often indicate substance)
            if (/\d+%|\d+ percent|\$\d+|\d+ million|\d+ billion/.test(item.snippet)) {
                score += 2;
            }
            
            // Contains specific dates (often indicates real news)
            if (/January|February|March|April|May|June|July|August|September|October|November|December \d{1,2}(st|nd|rd|th)?/.test(item.snippet)) {
                score += 1.5;
            }
            
            // Contains quotes (often indicates actual reporting)
            if (/"[^"]{10,}"/.test(item.snippet) || /'[^']{10,}'/.test(item.snippet)) {
                score += 1.5;
            }
            
            // Contains reporting verbs indicating original content
            if (/reported|announced|revealed|published|released|stated|confirmed|said|according to/i.test(item.snippet)) {
                score += 1;
            }
            
            // Contains very general descriptions (likely site descriptions, not articles)
            if (/provides news|latest news|breaking news|news and information|coverage of|news from|headlines from/i.test(item.snippet) && item.snippet.length < 120) {
                score -= 3;
            }
            
            // Detects website descriptions rather than actual news
            if (/is a website|is the official|is an online|website of|homepage of|official site/i.test(item.snippet)) {
                score -= 4;
            }
        }
        
        // Title indicators
        if (item.title) {
            // Title seems clickbaity
            if (/you won't believe|shocking|amazing|mind-blowing|incredible|top \d+ ways/i.test(item.title)) {
                score -= 2;
            }
            
            // Title indicates it's just a website description
            if (/official website|homepage|welcome to/i.test(item.title)) {
                score -= 3;
            }
        }
        
        // Very short snippet
        if (!item.snippet || item.snippet.length < this.settings.minSnippetLength) {
            score -= 3;
        }
        
        // Is from preferred domains list (additional boost)
        if (this.settings.preferredDomains && 
            this.settings.preferredDomains.some(preferredDomain => domain.includes(preferredDomain))) {
            score += 2;
        }
        
        // Is from explicitly excluded domains
        if (this.settings.excludedDomains && 
            this.settings.excludedDomains.some(excludedDomain => domain.includes(excludedDomain))) {
            score -= 4;
        }
        
        // Clamp score between 1-10
        return Math.max(1, Math.min(10, score));
    }

    // Enhanced filtering
    private applyAdvancedFiltering(newsItems: NewsItem[]): NewsItem[] {
        return newsItems.filter(item => {
            // Get URL for path analysis
            const url = new URL(item.link);
            const domain = url.hostname.replace('www.', '');
            
            // 1. Check for excluded domains
            if (this.settings.excludedDomains && this.settings.excludedDomains.length > 0) {
                if (this.settings.excludedDomains.some(excluded => domain.includes(excluded))) {
                    return false;
                }
            }
            
            // 2. Check for minimum snippet length
            if (!item.snippet || item.snippet.length < this.settings.minSnippetLength) {
                return false;
            }
            
            // 3. Check for minimum relevance score
            if ((item.relevanceScore || 0) < this.settings.contentRelevanceScore) {
                return false;
            }
            
            // 4. Filter out obvious list articles, product roundups, etc.
            if (item.title && /top \d+|best \d+|\d+ ways|\d+ things|best of|roundup/i.test(item.title)) {
                return false;
            }
            
            // 5. Reject homepage URLs that are likely not specific articles
            if (url.pathname === "/" || url.pathname === "" || url.pathname.length < 3) {
                // console.log(`Filtering out homepage URL: ${item.link}`);
                return false;
            }
            
            // 6. Reject category/tag pages
            if (/\/category\/|\/categories\/|\/topics\/|\/sections\/|\/tag\/|\/tags\//.test(item.link)) {
                // console.log(`Filtering out category/tag page: ${item.link}`);
                return false;
            }
            
            // 7. Reject content that looks like website descriptions
            if (item.snippet && /is a website|is the official|is an online|official site of|homepage of/i.test(item.snippet)) {
                // console.log(`Filtering out website description: ${item.title}`);
                return false;
            }
            
            return true;
        });
    }

    private cleanNewsContent(text: string): string {
        if (!this.settings.removeAds) return text;
        
        let cleaned = text;
        
        // Remove ad patterns
        this.settings.commonAdPatterns.forEach(pattern => {
            cleaned = cleaned.replace(new RegExp(pattern, 'gi'), '');
        });
        
        // Remove URLs in the middle of text
        cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
        
        // Remove email addresses
        cleaned = cleaned.replace(/\S+@\S+\.\S+/g, '');
        
        // Remove common filler phrases
        const fillerPhrases = [
            'click here', 'read more', 'learn more', 'find out more',
            'sign up', 'subscribe', 'follow us', 'share this',
            'according to reports', 'sources say'
        ];
        
        fillerPhrases.forEach(phrase => {
            cleaned = cleaned.replace(new RegExp(phrase, 'gi'), '');
        });
        
        // Remove excess whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        cleaned = cleaned.replace(/(\n\s*){3,}/g, '\n\n');
        
        return cleaned;
    }

    // Fallback method for low-quality content
    private getFallbackSummary(topic: string, newsItems: NewsItem[]): string {
        // Get just a brief snippet of what we found to help the user understand the issue
        const sampleUrls = newsItems.slice(0, 3).map(item => {
            const domain = new URL(item.link).hostname.replace('www.', '');
            return `${domain} (${item.title ? item.title.substring(0, 30) + '...' : 'No title'})`;
        }).join(', ');
        
        return `### No Substantial News Content Found

Unfortunately, the search didn't find substantive news articles for "${topic}" today. 

**What was found instead:**
- Generic website listings or landing pages
- Sites that describe themselves rather than providing specific news
- Content that lacks concrete details, quotes, or developments
${sampleUrls ? `- Sample sites checked: ${sampleUrls}` : ''}

**Recommendations to improve results:**
- Try again later when more recent news may be available
- Add specific keywords to your "${topic}" topic, like "${topic} breakthrough" or "${topic} latest research"
- Add high-quality news sources to your Preferred Domains settings
- Adjust the Search Date Range to look back further (e.g., "w1" for one week)

This plugin works best with specific, substantive news rather than general website directories or landing pages.
`;
    }

    // Enhanced prompts for AI summary generation
    private getDetailedPrompt(newsText: string): string {
        return `You are a professional news analyst creating a high-quality news briefing. Analyze and summarize these news articles:

${newsText}

CRITICAL GUIDELINES - READ CAREFULLY:
1. Focus ONLY on substantive news with concrete developments
2. Completely IGNORE any generic website listings, simple link compilations, or shallow content
3. EXCLUDE any content that merely mentions a website without actual news (e.g., "News from Site X")
4. NEVER include entries like "RIT highlights news from Rochester Institute of Technology" or "CNET provides product reviews"
5. PRIORITIZE news with specific data, quotes, figures, and developments
6. AVOID vague summaries and instead focus on specific facts and details
7. ANALYZE the implications and context of each significant story
8. INCLUDE only ONE verified, significant news item per bullet point
9. For each news item, include the SOURCE NAME and link in markdown format: [Source Name](URL)
10. Use exact dates rather than relative time references
11. Make each bullet point specific, concrete and informative - avoid generic placeholders
12. Exclude ANY item that only describes what a website does rather than actual news content

IMPORTANT: If the provided articles lack substantive content or are mostly website landing pages, DO NOT create placeholder entries.

WHEN CONTENT IS LIMITED:
1. If ANY substantive article exists with real news, focus entirely on that, even if it's just one item.
2. If only one topic has quality news, it's better to provide in-depth coverage of that topic than to force content for all topics.
3. Look for concrete facts, dates, statistics, and direct quotes - these indicate genuine news rather than website descriptions.

EXAMPLES OF BAD CONTENT TO EXCLUDE:
- "University News: [RIT](https://www.rit.edu/news) highlights news from Rochester Institute of Technology (RIT)."
- "Product Reviews & Tech Coverage: [CNET](https://www.cnet.com/) provides product reviews, tech news, and daily deals."
- "Breaking News: [CNN](https://www.cnn.com/) covers the latest news and headlines."
- "Daily Updates: [BBC](https://www.bbc.com/) delivers international news coverage."

EXAMPLES OF GOOD CONTENT TO INCLUDE:
- "**Quantum Computing Breakthrough**: Researchers at MIT demonstrated a 128-qubit quantum processor achieving quantum advantage in simulating complex molecules on February 25, 2025. [Nature](https://www.nature.com/articles/s41586-025-05742-z)"
- "**Global Trade Impact**: The EU-China trade deficit widened to €291 billion in 2024, a 24% increase from 2023, according to data released yesterday. [Financial Times](https://www.ft.com/content/3a7b5e9c)"

### Key Developments
[For each significant story - ONLY include items with actual news, NOT descriptions of websites]
- **Title with specific detail**: Concrete fact or development. Include exact figures, data points, and expert quotes when available. [Source](URL)

### Analysis & Context
[Provide context, implications, or background for the most significant story]

### Notable Quotes or Data
[Include a specific quote, statistic, or data point from the news, if available]
`;
    }

    private getConcisePrompt(newsText: string): string {
        return `You are a professional news editor creating a concise, high-quality news briefing. Analyze and summarize these news articles:

${newsText}

CRITICAL GUIDELINES - READ CAREFULLY:
1. Focus ONLY on substantive news with concrete developments
2. Completely IGNORE any generic website listings, simple link compilations, or shallow content
3. EXCLUDE any content that merely mentions a website without actual news (e.g., "News from Site X")
4. NEVER include entries like "RIT highlights news from Rochester Institute of Technology" or "CNET provides product reviews"
5. PRIORITIZE news with specific data, quotes, figures, and developments
6. AVOID vague summaries and instead focus on specific facts and details
7. For each news item, include the SOURCE NAME and link in markdown format: [Source Name](URL)
8. Use exact dates rather than relative time references
9. Make each bullet point specific, concrete and informative - avoid generic placeholders
10. Exclude ANY item that only describes what a website does rather than actual news content

IMPORTANT: If the provided articles lack substantive content or are mostly website landing pages, DO NOT create placeholder entries.

WHEN CONTENT IS LIMITED:
1. If ANY substantive article exists with real news, focus entirely on that, even if it's just one item.
2. It's better to provide one genuine news item than multiple generic placeholders.
3. For articles that look like landing pages (no real news content), completely exclude them.

EXAMPLES OF BAD CONTENT TO EXCLUDE:
- "University News: [RIT](https://www.rit.edu/news) highlights news from Rochester Institute of Technology (RIT)."
- "Product Reviews & Tech Coverage: [CNET](https://www.cnet.com/) provides product reviews, tech news, and daily deals."
- "Breaking News: [CNN](https://www.cnn.com/) covers the latest news and headlines."
- "Daily Updates: [BBC](https://www.bbc.com/) delivers international news coverage."

EXAMPLES OF GOOD CONTENT TO INCLUDE:
- "**Apple's AI Integration**: Apple announced integration of GPT-4o across iOS 19 starting next month, impacting 850M devices worldwide. [TechCrunch](https://techcrunch.com/article/apple-gpt4)"
- "**Climate Policy Shift**: The EU Parliament voted 402-157 to increase carbon reduction targets to 65% by 2035, up from the previous 55% goal. [Reuters](https://www.reuters.com/article/eu-climate-vote)"

### Key Updates
- **Specific Development 1**: Concrete details with data points [Source](URL)
- **Specific Development 2**: Concrete details with data points [Source](URL)
- **Specific Development 3**: Concrete details with data points [Source](URL)

### Noteworthy Quote or Data Point
[Most significant quote, metric or statistic with source and context]
`;
    }

    // Enhanced summary generation
    async generateSummary(newsItems: NewsItem[]): Promise<string> {
        if (!newsItems.length) {
            return "No recent news found for this topic.";
        }

        // Process news items
        const processedItems = newsItems
            .slice(0, this.settings.maxNewsPerTopic)
            .map(item => ({
                ...item,
                snippet: this.cleanNewsContent(item.snippet)
            }));
            
        // Check for quality content
        const hasQualityContent = processedItems.some(item => 
            (item.relevanceScore || 0) >= 7 &&
            item.snippet && 
            item.snippet.length > 120 &&
            !/is a website|is the official|homepage|official site/i.test(item.snippet)
        );
        
        // If no quality content found, use the fallback summary
        if (!hasQualityContent && processedItems.length < 3) {
            // console.log("No quality content found, using fallback summary");
            
            // Extract the topic from the first item
            const topicMatch = processedItems[0]?.link.match(/[?&]q=([^&]+)/);
            const topic = topicMatch ? 
                decodeURIComponent(topicMatch[1]).replace(/\+news.*$/, '') : 
                "this topic";
                
            return this.getFallbackSummary(topic, processedItems);
        }

        // Format news items for AI processing
        const newsText = processedItems.map(item => 
            `Title: ${item.title}\n` +
            `Source: ${item.source || 'Unknown'}\n` +
            `Published: ${item.publishedTime || 'Unknown'}\n` +
            `URL: ${item.link}\n` +
            `Content: ${item.snippet}\n` +
            `Relevance Score: ${item.relevanceScore}/10`
        ).join('\n\n');

        // Select prompt template
        const promptTemplate = this.settings.outputFormat === 'detailed' ? 
            this.getDetailedPrompt(newsText) :
            this.getConcisePrompt(newsText);

        try {
            const genAI = new GoogleGenerativeAI(this.settings.geminiApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await this.retryOperation(() => 
                model.generateContent(promptTemplate)
            );
            let summary = result.response.text();
            
            // Apply highlighting
            if (this.settings.highlightKeywords) {
                summary = this.highlightKeywords(summary);
            }
            
            return summary;
        } catch (error) {
            console.error('Failed to generate summary:', error);
            // Fallback to a simple message with the error
            return `Failed to generate summary due to an error: ${error}

Raw news data:
${newsItems.slice(0, 3).map(item => `- ${item.title} (${item.link})`).join('\n')}`;
        }
    }

    private highlightKeywords(text: string): string {
        // Enhanced keyword set for better highlighting
        const keywords = {
            positive: ['launch', 'grow', 'success', 'improve', 'increase', 'breakthrough', 'advance', 
                      'discovery', 'achievement', 'progress', 'development', 'innovation'],
            negative: ['decline', 'risk', 'fail', 'loss', 'crisis', 'downturn', 'challenge', 
                      'threat', 'deficit', 'recession', 'setback', 'conflict'],
            neutral: ['announce', 'report', 'state', 'plan', 'develop', 'analyze', 'release', 
                     'study', 'research', 'investigate', 'examine', 'evaluate'],
            data: ['percent', 'billion', 'million', 'trillion', 'increase', 'decrease', 'growth', 
                  'reduction', 'doubled', 'tripled', 'halved', 'statistics']
        };

        let highlighted = text;
        Object.entries(keywords).forEach(([type, words]) => {
            words.forEach(word => {
                const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
                highlighted = highlighted.replace(regex, `**$&**`);
            });
        });

        // Also highlight numbers with % or $ symbols
        highlighted = highlighted.replace(/(\$\d+[\d,.]*)|((\d+[\d,.]*%)|(\d+[\d,.]* percent))/gi, '**$&**');

        return highlighted;
    }

    private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = this.settings.maxRetries): Promise<T> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                // console.error(`Retry attempt ${i+1}/${maxRetries} failed:`, error);
                
                if (i === maxRetries - 1) {
                    console.error(`All ${maxRetries} retry attempts failed`);
                    throw error;
                }
                
                const delay = Math.min(1000 * Math.pow(2, i), this.settings.maxRetryDelay);
                // console.log(`Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error('Max retries exceeded');
    }

    async checkAndGenerateNews() {
        // Reset API counter at the start of each day
        this.loadApiCallCount();
        
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
        
        if (this.statusBarItem) {
            this.statusBarItem.setText('📰 Generating news...');
        }

        try {
            let content = await this.getTemplate() || 
                         `*Generated at ${new Date().toLocaleTimeString()}*\n\n` +
                         `---\n\n`;

            // Add API usage information
            if (this.settings.conserveApiCalls) {
                content += `*API Usage: ${this.settings.apiCallsToday}/${this.settings.apiCallsPerDay} calls today*\n\n`;
            }

            // Add table of contents
            if (this.settings.outputFormat === 'detailed') {
                content += `## Table of Contents\n\n`;
                this.settings.topics.forEach(topic => {
                    content += `- [${topic}](#${topic.toLowerCase().replace(/\s+/g, '%20')})\n`;
                });
                content += `\n---\n\n`;
            }

            // Smart topic prioritization when API calls are limited
            const availableApiCalls = this.settings.apiCallsPerDay - this.settings.apiCallsToday;
            let topicsToProcess = [...this.settings.topics];
            
            // If we're running low on API calls, prioritize the most important topics
            if (this.settings.conserveApiCalls && availableApiCalls < this.settings.topics.length) {
                // Only process top N topics based on available API calls
                topicsToProcess = topicsToProcess.slice(0, availableApiCalls);
                content += `> **Note:** Due to API limits, only processing ${topicsToProcess.length} of ${this.settings.topics.length} topics today.\n\n`;
            }

            for (const topic of topicsToProcess) {
                content += `## ${topic}\n\n`;
                
                // Skip if we've hit the API limit
                if (!this.canMakeApiCall()) {
                    content += `*API call limit reached. Skipping this topic.*\n\n`;
                    continue;
                }
                
                const newsItems = await this.fetchNews(topic);
                if (newsItems.length) {
                    const summary = await this.generateSummary(newsItems);
                    content += summary + '\n\n';
                } else {
                    content += `No recent news found for ${topic}\n\n`;
                }
            }

            // Add note for omitted topics
            if (topicsToProcess.length < this.settings.topics.length) {
                content += `## Omitted Topics\n\n`;
                content += `The following topics were omitted due to API call limits:\n\n`;
                
                const omittedTopics = this.settings.topics.filter(topic => !topicsToProcess.includes(topic));
                omittedTopics.forEach(topic => {
                    content += `- ${topic}\n`;
                });
                content += `\n`;
            }

            const fileName = `${this.settings.archiveFolder}/Daily News - ${date}.md`;
            await this.app.vault.create(fileName, content);
            
            if (this.settings.enableNotifications) {
                new Notice('Daily news generated successfully');
            }
            
            if (this.statusBarItem) {
                this.updateStatusBar();
            }
        } catch (error) {
            console.error('Failed to generate news:', error);
            if (this.settings.enableNotifications) {
                new Notice('Failed to generate news. Check console for details.');
            }
            
            if (this.statusBarItem) {
                this.statusBarItem.setText('📰 News error!');
            }
        }
    }

    private async getTemplate(): Promise<string | null> {
        if (!this.settings.templatePath) return null;
        
        try {
            const templateFile = this.app.vault.getAbstractFileByPath(this.settings.templatePath);
            if (templateFile instanceof TFile) {
                // 使用cachedRead而不是read
                return await this.app.vault.cachedRead(templateFile);
            }
        } catch (error) {
            console.error('Failed to read template:', error);
        }
        return null;
    }
}
