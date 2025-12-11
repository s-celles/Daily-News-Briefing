import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, requestUrl } from 'obsidian';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    GEMINI_MODEL_NAME,
    GOOGLE_API_URL,
    PERPLEXITY_API_URL,
    QUALITY_NEWS_SOURCES,
} from './src/constants';
import { DailyNewsSettingTab } from './src/settings-tab';
import { DailyNewsSettings, DEFAULT_SETTINGS } from './src/types';

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
                key: this.settings.googleSearchApiKey,
                cx: this.settings.googleSearchEngineId,
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
                    url: `${GOOGLE_API_URL}?${params.toString()}`
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
        if (QUALITY_NEWS_SOURCES.some((source: string) => domain.includes(source))) {
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
            const isQualitySource = QUALITY_NEWS_SOURCES.some((source: string) => domain.includes(source));
            
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
            
            // Use the model from constants
            const modelName = GEMINI_MODEL_NAME;
                
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
        if (this.settings.useCustomPrompt && this.settings.customPrompt && newsText) {
            return this.settings.customPrompt.replace('{{NEWS_TEXT}}', newsText);
        }
        
        // If no custom prompt, use default based on provider
        let basePrompt = ``;
        if (this.settings.apiProvider === 'google') {
            basePrompt = `Analyze these news articles about ${topic} and provide a substantive summary:

                ${newsText}

                KEY REQUIREMENTS:
                1. Focus on concrete developments, facts, and data
                2. For each news item include the SOURCE in markdown format: [Source](URL)
                3. Use specific dates rather than relative time references
                4. Prioritize news with specific details (numbers, names, quotes)
                5. If content lacks substance, state "Limited substantive news found on ${topic}"`;
        } else {
            // For Sonar API, use a different prompt structure
            basePrompt = `You are a helpful AI assistant. Please answer in the required format.

                KEY REQUIREMENTS:
                1. Focus on concrete developments, facts, and data
                2. For each news item include the SOURCE in markdown format: [Source](URL)
                3. Use specific dates rather than relative time references
                4. Prioritize news with specific details (numbers, names, quotes)
                5. Only return the news - do not include any meta-narratives, explanations, or instructions. 
                6. If content lacks substance, state "Limited substantive news found on ${topic}"`;

            return basePrompt;
        }

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

    async fetchAndSummarizeWithSonar(topic: string): Promise<string> {
        try {
            // Build system message based on output format
            let systemMessage = this.getAIPrompt('', topic, this.settings.outputFormat);
            
            // Prepare request body
            const requestBody = {
                model: "sonar",
                messages: [
                    {
                        role: "system",
                        content: systemMessage
                    },
                    {
                        role: "user",
                        content: `What are the latest significant news about "${topic}"?`
                    }
                ],
            };
            
            // console.log("Sonar API request:", JSON.stringify(requestBody, null, 2));
            
            // Make API request to Sonar
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.perplexityApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            };
            
            const response = await requestUrl({
                url: PERPLEXITY_API_URL,
                ...options
            });
            
            if (response.status >= 200 && response.status < 300) {
                const data = JSON.parse(response.text);
                return data.choices[0].message.content;
            } else {
                // console.error(`Sonar API returned status ${response.status}: ${response.text}`);
                throw new Error(`Sonar API returned status ${response.status}: ${response.text}`);
            }
        } catch (error) {
            console.error('Sonar API error:', error);
            return `Error fetching news about ${topic} from Sonar API. Please check your API key and settings.\n\nError details: ${error.message}\n\nCheck the developer console for more information.`;
        }
    }

    private validateApiConfig(): boolean {
        if (this.settings.apiProvider === 'google') {
            // Check Google API settings
            if (!this.settings.googleSearchApiKey || !this.settings.googleSearchEngineId || !this.settings.geminiApiKey) {
                new Notice('Missing Google API configuration. Please check settings.', 5000);
                return false;
            }
        } else if (this.settings.apiProvider === 'sonar') {
            // Check Sonar API settings
            if (!this.settings.perplexityApiKey) {
                new Notice('Missing Sonar API key. Please add your Perplexity API key in settings.', 5000);
                return false;
            }
        } else if (this.settings.apiProvider === 'gpt') {
            // Check GPT API settings
            if (!this.settings.openaiApiKey) {
                new Notice('Missing OpenAI API key. Please add your OpenAI API key in settings.', 5000);
                return false;
            }
        }
        return true;
    }

    async generateDailyNews() {
        // Validate API configuration first
        if (!this.validateApiConfig()) {
            return null;
        }

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

                    if (this.settings.apiProvider === 'google') {
                        const newsItems = await this.fetchNews(topic);
                        
                        if (newsItems.length) {
                            new Notice(`Summarizing ${newsItems.length} news items for ${topic}...`);
                            const summary = await this.generateSummary(newsItems, topic);
                            content += summary + '\n';
                        } else {
                            content += `No recent news found for ${topic}.\n\n`;
                        }
                    } else if (this.settings.apiProvider === 'sonar') {
                        const summary = await this.fetchAndSummarizeWithSonar(topic);
                        content += summary + '\n';
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
            
            // console.log(`Created news file at: ${fileName}`);
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
            // console.error('Error opening or creating daily news:', error);
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
            // console.log(`Trying to open file at path: ${filePath}`);
            
            // Try to get the file from the vault
            const file = this.app.vault.getAbstractFileByPath(filePath);
            
            if (file instanceof TFile) {
                // console.log(`File found, opening: ${file.path}`);
                // Try to open the file using workspace API
                this.app.workspace.openLinkText(file.path, '', false)
                    .then(() => {
                        new Notice('Opened today\'s news briefing');
                    })
                    .catch(error => {
                        // console.error('Failed to open file with openLinkText:', error);
                        // Fallback: Try to actively focus the leaf after opening
                        this.app.workspace.getLeaf(false).openFile(file)
                            .then(() => {
                                new Notice('Opened today\'s news briefing (fallback method)');
                            })
                            .catch(e => {
                                // console.error('Both file opening methods failed:', e);
                                new Notice('Unable to open news file. Try opening it manually.');
                            });
                    });
            } else {
                // console.error(`File not found in vault at: ${filePath}`);
                new Notice(`Unable to find news file. Please check path: ${filePath}`);
            }
        } catch (error) {
            // console.error('Error in openNewsFile:', error);
            new Notice('Error opening news file');
        }
    }
}