import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, requestUrl } from 'obsidian';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

interface DailyNewsSettings {
    // API provider selection
    apiProvider: 'google' | 'sonar' | 'claude' | 'openai';

    // Google API settings
    googleSearchApiKey: string;
    googleSearchEngineId: string;
    geminiApiKey: string;

    // Perplexity API settings
    perplexityApiKey: string;
    
    // Claude API settings
    claudeApiKey: string;
    claudeModel: string;
    
    // OpenAI API settings
    openaiApiKey: string;
    openaiModel: string;
    
    // Core functionality
    topics: string[];
    scheduleTime: string;
    archiveFolder: string;
    
    // Language settings
    language: string; // ISO 639-1 language code (e.g., 'en', 'fr', 'de')
    
    // Content quality settings
    resultsPerTopic: number;
    maxSearchResults: number;
    
    // Output settings
    outputFormat: 'detailed' | 'concise';
    enableNotifications: boolean;
    enableAnalysisContext: boolean; // New: Enable or disable "Analysis & Context" feature
    
    // Advanced settings
    dateRange: string;
    useCustomPrompt: boolean;
    customPrompt: string;
    useAIForQueries: boolean; // New setting: whether to use AI to generate search queries
    useAIJudge: boolean; // Whether to use AI for judging content quality
    aiJudgePrompt: string; // Custom prompt for AI judge, empty by default
}

const DEFAULT_SETTINGS: DailyNewsSettings = {
    // API provider selection
    apiProvider: 'google', // Default to Google for backward compatibility

    // Google API settings
    googleSearchApiKey: '',
    googleSearchEngineId: '',
    geminiApiKey: '',

    // Perplexity API settings
    perplexityApiKey: '',
    
    // Claude API settings
    claudeApiKey: '',
    claudeModel: 'claude-opus-4-20250514',
    
    // OpenAI API settings
    openaiApiKey: '',
    openaiModel: 'gpt-4o',
    
    // Core functionality
    topics: ['Technology', 'World News'],
    scheduleTime: '08:00',
    archiveFolder: 'News Archive',
    
    // Language settings
    language: 'en', // Default to English
    
    // Content quality settings
    resultsPerTopic: 8,
    maxSearchResults: 30,
    
    // Output settings
    outputFormat: 'detailed',
    enableNotifications: true,
    enableAnalysisContext: true, // Enable "Analysis & Context" feature by default
    
    // Advanced settings
    dateRange: 'd3', // Changed from d2 to d3 for broader date range
    useCustomPrompt: false,
    customPrompt: '',
    useAIForQueries: true, // Enable AI query generation by default
    useAIJudge: true,
    aiJudgePrompt: '' // Custom prompt for AI judge, empty by default
}

interface NewsItem {
    title: string;
    link: string;
    snippet: string;
    publishedTime?: string;
    source?: string;
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

        // API Provider Configuration section
        containerEl.createEl('h2', {text: 'API Provider'});
        containerEl.createEl('p', {text: 'Choose which API provider to use for fetching news.'});

        new Setting(containerEl)
            .setName('API Provider')
            .setDesc('Select your preferred AI provider')
            .addDropdown(dropdown => dropdown
                .addOption('google', 'Google (Search + Gemini)')
                .addOption('sonar', 'Sonar by Perplexity')
                .addOption('claude', 'Claude (Anthropic)')
                .addOption('openai', 'OpenAI (GPT-4)')
                .setValue(this.plugin.settings.apiProvider)
                .onChange(async (value: 'google' | 'sonar' | 'claude' | 'openai') => {
                    this.plugin.settings.apiProvider = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide appropriate fields
                }));

        // API Configuration section - show appropriate fields based on provider
        containerEl.createEl('h2', {text: 'API Configuration'});
        containerEl.createEl('p', {text: 'API keys are required for fetching and summarizing news.'});

        if (this.plugin.settings.apiProvider === 'google') {
            // Google API settings
            new Setting(containerEl)
                .setName('Google Search API key')
                .setDesc('Your Google Custom Search API key')
                .addText(text => text
                    .setPlaceholder('Enter API key')
                    .setValue(this.plugin.settings.googleSearchApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.googleSearchApiKey = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Google Search engine ID')
                .setDesc('Your Google Custom Search Engine ID')
                .addText(text => text
                    .setPlaceholder('Enter search engine ID')
                    .setValue(this.plugin.settings.googleSearchEngineId)
                    .onChange(async (value) => {
                        this.plugin.settings.googleSearchEngineId = value;
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
        } else if (this.plugin.settings.apiProvider === 'sonar') {
            // Sonar API settings
            new Setting(containerEl)
                .setName('Sonar API key')
                .setDesc('Your Perplexity Sonar API key (combines search and summarization)')
                .addText(text => text
                    .setPlaceholder('Enter Sonar API key')
                    .setValue(this.plugin.settings.perplexityApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.perplexityApiKey = value;
                        await this.plugin.saveSettings();
                    }));
            
            // Add message about Sonar API advantages
            containerEl.createEl('div', {
                text: 'Sonar API combines search and summarization in one step, providing a simpler setup with only one API key.',
                cls: 'setting-item-description'
            });
        } else if (this.plugin.settings.apiProvider === 'claude') {
            // Claude API settings
            new Setting(containerEl)
                .setName('Claude API key')
                .setDesc('Your Anthropic Claude API key')
                .addText(text => text
                    .setPlaceholder('Enter Claude API key')
                    .setValue(this.plugin.settings.claudeApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.claudeApiKey = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Claude Model')
                .setDesc('Enter Claude model name (e.g., claude-opus-4-20250514, claude-3-5-sonnet-20241022, claude-3-haiku-20240307). See Anthropic documentation for available models.')
                .addText(text => text
                    .setPlaceholder('claude-opus-4-20250514')
                    .setValue(this.plugin.settings.claudeModel)
                    .onChange(async (value) => {
                        this.plugin.settings.claudeModel = value;
                        await this.plugin.saveSettings();
                    }));
                    
            // Add message about Claude advantages with documentation link
            const claudeHelpDiv = containerEl.createEl('div', {
                cls: 'setting-item-description'
            });
            claudeHelpDiv.innerHTML = 'Claude excels at analysis and reasoning. Uses free RSS feeds from major news sources like BBC, CNN, and Reuters for news fetching.<br><strong>Available models:</strong> <a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank">View Anthropic model documentation</a>';
            
            // Add API test button for Claude
            new Setting(containerEl)
                .setName('Test Claude API connection')
                .setDesc('Test if your Claude API key and model are working correctly')
                .addButton(button => button
                    .setButtonText('Test Connection')
                    .onClick(async () => {
                        button.setButtonText('Testing...');
                        button.setDisabled(true);
                        
                        try {
                            const success = await this.plugin.testClaudeConnection();
                            if (success) {
                                new Notice('✅ Claude API connection successful!', 3000);
                                button.setButtonText('Test Passed ✅');
                            } else {
                                new Notice('❌ Claude API connection failed. Check console for details.', 5000);
                                button.setButtonText('Test Failed ❌');
                            }
                        } catch (error) {
                            new Notice(`❌ Test error: ${error.message}`, 5000);
                            button.setButtonText('Test Failed ❌');
                        }
                        
                        setTimeout(() => {
                            button.setButtonText('Test Connection');
                            button.setDisabled(false);
                        }, 3000);
                    }));
        } else if (this.plugin.settings.apiProvider === 'openai') {
            // OpenAI API settings
            new Setting(containerEl)
                .setName('OpenAI API key')
                .setDesc('Your OpenAI API key')
                .addText(text => text
                    .setPlaceholder('Enter OpenAI API key')
                    .setValue(this.plugin.settings.openaiApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.openaiApiKey = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('OpenAI Model')
                .setDesc('Enter OpenAI model name (e.g., gpt-4o, gpt-4o-mini, gpt-4-turbo). See OpenAI documentation for available models.')
                .addText(text => text
                    .setPlaceholder('gpt-4o')
                    .setValue(this.plugin.settings.openaiModel)
                    .onChange(async (value) => {
                        this.plugin.settings.openaiModel = value;
                        await this.plugin.saveSettings();
                    }));
                    
            // Add message about OpenAI advantages with documentation link
            const openaiHelpDiv = containerEl.createEl('div', {
                cls: 'setting-item-description'
            });
            openaiHelpDiv.innerHTML = 'OpenAI GPT-4 provides excellent news summarization. Uses free RSS feeds from major news sources like BBC, CNN, and Reuters for news fetching.<br><strong>Available models:</strong> <a href="https://platform.openai.com/docs/models" target="_blank">View OpenAI model documentation</a>';
            
            // Add API test button for OpenAI
            new Setting(containerEl)
                .setName('Test OpenAI API connection')
                .setDesc('Test if your OpenAI API key and model are working correctly')
                .addButton(button => button
                    .setButtonText('Test Connection')
                    .onClick(async () => {
                        button.setButtonText('Testing...');
                        button.setDisabled(true);
                        
                        try {
                            const success = await this.plugin.testOpenAIConnection();
                            if (success) {
                                new Notice('✅ OpenAI API connection successful!', 3000);
                                button.setButtonText('Test Passed ✅');
                            } else {
                                new Notice('❌ OpenAI API connection failed. Check console for details.', 5000);
                                button.setButtonText('Test Failed ❌');
                            }
                        } catch (error) {
                            new Notice(`❌ Test error: ${error.message}`, 5000);
                            button.setButtonText('Test Failed ❌');
                        }
                        
                        setTimeout(() => {
                            button.setButtonText('Test Connection');
                            button.setDisabled(false);
                        }, 3000);
                    }));
        }

        // News Configuration section
        containerEl.createEl('h2', {text: 'News Configuration'});
        
        new Setting(containerEl)
            .setName('Language')
            .setDesc('Language for news content (ISO 639-1 code: en, fr, de, es, etc.)')
            .addText(text => text
                .setPlaceholder('en')
                .setValue(this.plugin.settings.language)
                .onChange(async (value) => {
                    this.plugin.settings.language = value;
                    await this.plugin.saveSettings();
                }));
        
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

        if (this.plugin.settings.apiProvider === 'google') {
            // Search Configuration section (applies to Google provider only)
            containerEl.createEl('h2', {text: 'Search Configuration'});
            
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
        } else if (this.plugin.settings.apiProvider === 'claude' || this.plugin.settings.apiProvider === 'openai') {
            // Simplified configuration for RSS-based providers
            containerEl.createEl('h2', {text: 'News Configuration'});
            
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
        }

        // Output Settings section
        containerEl.createEl('h2', {text: 'Output Configuration'});
        
        if (this.plugin.settings.apiProvider === 'google' || this.plugin.settings.apiProvider === 'claude' || this.plugin.settings.apiProvider === 'openai') {
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
                    
            // Add option to enable analysis & context
            new Setting(containerEl)
                .setName('Enable analysis & context')
                .setDesc('Include analytical section in detailed news summaries')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableAnalysisContext)
                    .onChange(async (value) => {
                        this.plugin.settings.enableAnalysisContext = value;
                        await this.plugin.saveSettings();
                    }));
        }
                
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

            // Add AI Query Generation setting in advanced section
            new Setting(containerEl)
                .setName('Use AI for search queries')
                .setDesc('Use AI to generate optimized search queries (uses Gemini API)')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.useAIForQueries)
                    .onChange(async (value) => {
                        this.plugin.settings.useAIForQueries = value;
                        await this.plugin.saveSettings();
                    }));

            // Additional advanced settings for API-specific settings
            if (this.plugin.settings.apiProvider === 'google') {
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
                    .setName('Use AI news judgment')
                    .setDesc('Let AI evaluate and select the most relevant news items')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.useAIJudge)
                        .onChange(async (value) => {
                            this.plugin.settings.useAIJudge = value;
                            await this.plugin.saveSettings();
                            this.display(); // Refresh to show/hide custom prompt
                        }));
                
                if (this.plugin.settings.useAIJudge) {
                    new Setting(containerEl)
                        .setName('Custom AI judge prompt')
                        .setDesc('Optional: Custom prompt for AI news evaluation (use {{NEWS_TEXT}} and {{TOPIC}} as placeholders)')
                        .addTextArea(text => text
                            .setPlaceholder('Leave empty to use default prompt...')
                            .setValue(this.plugin.settings.aiJudgePrompt || '')
                            .onChange(async (value) => {
                                this.plugin.settings.aiJudgePrompt = value;
                                await this.plugin.saveSettings();
                            }));
                }
            } else if (this.plugin.settings.apiProvider === 'claude' || this.plugin.settings.apiProvider === 'openai') {
                new Setting(containerEl)
                    .setName('Use AI news judgment')
                    .setDesc('Let AI evaluate and select the most relevant news items')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.useAIJudge)
                        .onChange(async (value) => {
                            this.plugin.settings.useAIJudge = value;
                            await this.plugin.saveSettings();
                            this.display(); // Refresh to show/hide custom prompt
                        }));
                
                if (this.plugin.settings.useAIJudge) {
                    new Setting(containerEl)
                        .setName('Custom AI judge prompt')
                        .setDesc('Optional: Custom prompt for AI news evaluation (use {{NEWS_TEXT}} and {{TOPIC}} as placeholders)')
                        .addTextArea(text => text
                            .setPlaceholder('Leave empty to use default prompt...')
                            .setValue(this.plugin.settings.aiJudgePrompt || '')
                            .onChange(async (value) => {
                                this.plugin.settings.aiJudgePrompt = value;
                                await this.plugin.saveSettings();
                            }));
                }
            }
            
            // Custom prompt setting - available for both providers
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
                const customPromptDesc = this.plugin.settings.apiProvider === 'google' 
                    ? 'Your custom prompt for the AI summarization (use {{NEWS_TEXT}} as placeholder for the news content)'
                    : 'Your custom prompt for the Sonar API (use {{NEWS_TEXT}} as placeholder for the topic search instruction)';
                
                new Setting(containerEl)
                    .setName('Custom AI prompt')
                    .setDesc(customPromptDesc)
                    .addTextArea(text => text
                        .setPlaceholder('You are a professional news analyst...\n\n{{NEWS_TEXT}}\n\nPlease summarize...')
                        .setValue(this.plugin.settings.customPrompt)
                        .onChange(async (value) => {
                            this.plugin.settings.customPrompt = value;
                            await this.plugin.saveSettings();
                        }));
            }
                    
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

// Language translations for different UI elements
const LANGUAGE_TRANSLATIONS = {
    'en': {
        keyDevelopments: 'Key Developments',
        analysisContext: 'Analysis & Context',
        processingStatus: 'Processing Status',
        generatedAt: 'Generated at',
        tableOfContents: 'Table of Contents',
        noRecentNews: 'No recent news found for',
        errorRetrieving: 'Error retrieving news for',
        limitedNews: 'Limited substantive news found on'
    },
    'fr': {
        keyDevelopments: 'Développements Clés',
        analysisContext: 'Analyse et Contexte',
        processingStatus: 'Statut du Traitement',
        generatedAt: 'Généré à',
        tableOfContents: 'Table des Matières',
        noRecentNews: 'Aucune actualité récente trouvée pour',
        errorRetrieving: 'Erreur lors de la récupération des actualités pour',
        limitedNews: 'Actualités substantielles limitées trouvées sur'
    },
    'de': {
        keyDevelopments: 'Wichtige Entwicklungen',
        analysisContext: 'Analyse & Kontext',
        processingStatus: 'Verarbeitungsstatus',
        generatedAt: 'Erstellt am',
        tableOfContents: 'Inhaltsverzeichnis',
        noRecentNews: 'Keine aktuellen Nachrichten gefunden für',
        errorRetrieving: 'Fehler beim Abrufen von Nachrichten für',
        limitedNews: 'Begrenzte substanzielle Nachrichten gefunden zu'
    },
    'es': {
        keyDevelopments: 'Desarrollos Clave',
        analysisContext: 'Análisis y Contexto',
        processingStatus: 'Estado del Procesamiento',
        generatedAt: 'Generado a las',
        tableOfContents: 'Tabla de Contenidos',
        noRecentNews: 'No se encontraron noticias recientes para',
        errorRetrieving: 'Error al recuperar noticias para',
        limitedNews: 'Noticias sustanciales limitadas encontradas sobre'
    },
    'it': {
        keyDevelopments: 'Sviluppi Chiave',
        analysisContext: 'Analisi e Contesto',
        processingStatus: 'Stato di Elaborazione',
        generatedAt: 'Generato alle',
        tableOfContents: 'Sommario',
        noRecentNews: 'Nessuna notizia recente trovata per',
        errorRetrieving: 'Errore nel recuperare notizie per',
        limitedNews: 'Notizie sostanziali limitate trovate su'
    }
};

export default class DailyNewsPlugin extends Plugin {
    settings: DailyNewsSettings;
    
    // Shared custom fetch function to bypass CORS for AI SDK
    private createCustomFetch() {
        return async (url: string, options: any): Promise<Response> => {
            console.log(`Custom fetch called for: ${url}`);
            
            const response = await requestUrl({
                url: url,
                method: options.method || 'GET',
                headers: options.headers || {},
                body: options.body
            });

            // Convert Obsidian's response to match fetch Response interface
            return new Response(response.text, {
                status: response.status,
                statusText: response.status.toString(),
                headers: response.headers || {}
            }) as Response;
        };
    }

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
        
        // Get appropriate date range parameter
        const dateRangeParam = this.settings.dateRange.match(/^[dw]\d+$/) ? 
            this.settings.dateRange : 'd3';
            
        const allNews: NewsItem[] = [];
        
        // Define search queries
        let queries: {[key: string]: string} = {};
        
        // Use AI to generate the primary query if enabled
        if (this.settings.useAIForQueries) {
            const hasApiKey = (this.settings.apiProvider === 'claude' && this.settings.claudeApiKey) ||
                             (this.settings.apiProvider === 'openai' && this.settings.openaiApiKey) ||
                             (this.settings.apiProvider === 'google' && this.settings.geminiApiKey);
            
            if (hasApiKey) {
                try {
                    const aiQuery = await this.generateAISearchQuery(topic);
                    if (aiQuery) {
                        queries.aiGenerated = aiQuery;
                    }
                } catch (error) {
                    console.error("Error generating AI query:", error);
                }
            }
        }
        
        // Always include multiple query variations
        queries = {
            ...queries,
            standard: this.buildOptimizedQuery(topic),
            specific: this.createSpecificQuery(topic),
            broad: this.createBroadQuery(topic),
            recent: this.createRecentQuery(topic),
            simple: `${topic} news`
        };
        
        // Maximum results per query
        const maxResultsPerQuery = Math.min(10, this.settings.maxSearchResults / Object.keys(queries).length);
        
        // Track API call successes and failures
        let successfulQueries = 0;
        let failedQueries = 0;
        
        // Choose fetching method based on provider
        if (this.settings.apiProvider === 'google') {
            // Use Google Search for Google provider
            await Promise.all(Object.entries(queries).map(async ([queryType, queryString]) => {
                try {
                    const results = await this.fetchNewsFromGoogle(
                        queryString, 
                        dateRangeParam, 
                        Math.ceil(maxResultsPerQuery)
                    );
                    
                    // Add results while avoiding duplicates
                    for (const item of results) {
                        if (!allNews.some(existing => existing.link === item.link)) {
                            allNews.push(item);
                        }
                    }
                    
                    if (results.length > 0) {
                        successfulQueries++;
                    }
                } catch (error) {
                    console.error(`Error fetching ${queryType} news:`, error);
                    failedQueries++;
                }
            }));
        } else {
            // Use free news sources for Claude and OpenAI
            try {
                const results = await this.fetchNewsFromFreeSources(topic);
                
                // Add results while avoiding duplicates
                for (const item of results) {
                    if (!allNews.some(existing => existing.link === item.link)) {
                        allNews.push(item);
                    }
                }
                
                if (results.length > 0) {
                    successfulQueries = 1;
                } else {
                    failedQueries = 1;
                }
            } catch (error) {
                console.error(`Error fetching news from free sources:`, error);
                failedQueries = 1;
            }
        }
        
        // If all queries failed or no news items were found, throw an error
        if (failedQueries > 0 && successfulQueries === 0) {
            throw new Error(`Failed to fetch news for ${topic}. All sources failed.`);
        }
        
        // Use AI to judge and filter news items
        let judgedNews = allNews;
        try {
            if (allNews.length > 0) {
                judgedNews = await this.judgeNewsWithAI(allNews, topic);
            }
        } catch (error) {
            console.error(`Error while judging news with AI: ${error.message}`);
            // Use original list if AI judging fails, limited to the requested number of results
            judgedNews = allNews.slice(0, this.settings.resultsPerTopic);
        }
        
        const elapsedTime = (Date.now() - startTime) / 1000;
        console.log(`Fetched ${allNews.length} total items, AI selected ${judgedNews.length} items for ${topic} in ${elapsedTime}s`);
        
        return judgedNews;
    }
    
    // Update AI query generator to create broader queries
    async generateAISearchQuery(topic: string): Promise<string | null> {
        try {
            const prompt = `You are a search optimization expert. Create a Google search query for the topic "${topic}" that will find recent news articles.
The generated query should:
1. Be broad enough to catch a variety of news on this topic
2. Focus primarily on recent news articles
3. Include relevant synonyms and related terms
4. Avoid overuse of restrictive operators
5. Be no more than 150 characters
6. Be in English regardless of the topic language

Only return the search query string itself, without any explanations or additional text.`;

            let query: string;
            
            if (this.settings.apiProvider === 'claude' && this.settings.claudeApiKey) {
                const anthropic = createAnthropic({
                    apiKey: this.settings.claudeApiKey,
                    fetch: this.createCustomFetch()
                });
                const { text } = await generateText({
                    model: anthropic(this.settings.claudeModel),
                    prompt: prompt,
                    temperature: 0.3,
                });
                query = text.trim();
            } else if (this.settings.apiProvider === 'openai' && this.settings.openaiApiKey) {
                const openai = createOpenAI({
                    apiKey: this.settings.openaiApiKey,
                    fetch: this.createCustomFetch()
                });
                const { text } = await generateText({
                    model: openai(this.settings.openaiModel),
                    prompt: prompt,
                    temperature: 0.3,
                });
                query = text.trim();
            } else if (this.settings.apiProvider === 'google' && this.settings.geminiApiKey) {
                const genAI = new GoogleGenerativeAI(this.settings.geminiApiKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        maxOutputTokens: 100
                    }
                });
                
                const result = await model.generateContent(prompt);
                query = result.response.text().trim();
            } else {
                return null;
            }
            
            // Verify that the query is a short and meaningful string
            if (query && query.length > 0 && query.length < 200) {
                return query;
            }
            return null;
        } catch (error) {
            console.error("Error generating AI search query:", error);
            return null;
        }
    }

    async judgeNewsWithAI(newsItems: NewsItem[], topic: string): Promise<NewsItem[]> {
        if (!this.settings.useAIJudge) {
            return newsItems; // If AI judgment is not used, return all news items
        }

        // Check if we have the required API key for the current provider
        const hasApiKey = (this.settings.apiProvider === 'claude' && this.settings.claudeApiKey) ||
                          (this.settings.apiProvider === 'openai' && this.settings.openaiApiKey) ||
                          (this.settings.apiProvider === 'google' && this.settings.geminiApiKey);
        
        if (!hasApiKey) {
            return newsItems.slice(0, this.settings.resultsPerTopic);
        }

        try {
            // Build judge prompt
            const judgePrompt = this.getAIJudgePrompt(newsItems, topic);
            let response: string;
            
            if (this.settings.apiProvider === 'claude') {
                const anthropic = createAnthropic({
                    apiKey: this.settings.claudeApiKey,
                    fetch: this.createCustomFetch()
                });
                const { text } = await generateText({
                    model: anthropic(this.settings.claudeModel),
                    prompt: judgePrompt,
                    temperature: 0.1,
                });
                response = text;
            } else if (this.settings.apiProvider === 'openai') {
                const openai = createOpenAI({
                    apiKey: this.settings.openaiApiKey,
                    fetch: this.createCustomFetch()
                });
                const { text } = await generateText({
                    model: openai(this.settings.openaiModel),
                    prompt: judgePrompt,
                    temperature: 0.1,
                });
                response = text;
            } else if (this.settings.apiProvider === 'google') {
                const genAI = new GoogleGenerativeAI(this.settings.geminiApiKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    generationConfig: {
                        temperature: 0.1,
                        topK: 40,
                        maxOutputTokens: 2048
                    }
                });
                
                const result = await model.generateContent(judgePrompt);
                response = result.response.text();
            } else {
                return newsItems.slice(0, this.settings.resultsPerTopic);
            }
            
            // Parse AI judgment results
            return this.parseAIJudgeResponse(response, newsItems);
            
        } catch (error) {
            console.error('AI judge error:', error);
            // If AI judgment fails, return the first N items from the original list
            return newsItems.slice(0, this.settings.resultsPerTopic);
        }
    }

    private getAIJudgePrompt(newsItems: NewsItem[], topic: string): string {
        // If user has custom judge prompt, use it
        if (this.settings.aiJudgePrompt && this.settings.aiJudgePrompt.trim()) {
            const newsText = this.formatNewsForJudge(newsItems);
            return this.settings.aiJudgePrompt.replace('{{NEWS_TEXT}}', newsText).replace('{{TOPIC}}', topic);
        }

        // Language instruction
        const languageInstruction = this.settings.language !== 'en' ? 
            ` Respond entirely in the language with ISO 639-1 code "${this.settings.language}".` : '';

        // Default judge prompt
        const newsText = this.formatNewsForJudge(newsItems);
        
        return `You are a professional news editor evaluating news articles for a daily briefing about "${topic}".${languageInstruction}

    Please evaluate each news item and decide whether to KEEP or SKIP it based on these criteria:

    KEEP if the news item:
    - Contains specific, factual information relevant to ${topic}
    - Reports on recent developments, announcements, or events
    - Includes concrete details (numbers, dates, names, quotes)
    - Comes from a recognizable news source
    - Provides substantive information beyond headlines

    SKIP if the news item:
    - Is too vague or lacks specific details
    - Appears to be promotional content or advertisements
    - Is outdated or not recent
    - Duplicates information from other items
    - Contains mainly opinion without factual basis

    NEWS ITEMS TO EVALUATE:
    ${newsText}

    INSTRUCTIONS:
    1. For each news item, respond with either "KEEP" or "SKIP" followed by the item number
    2. If KEEP, provide a brief reason (max 20 words)
    3. Select maximum ${this.settings.resultsPerTopic} items to KEEP
    4. Format your response exactly as shown below:

    ITEM_1: KEEP - [brief reason]
    ITEM_2: SKIP - [brief reason]
    ITEM_3: KEEP - [brief reason]
    ...

    Focus on selecting the most newsworthy and informative items for the daily briefing.`;
    }

    private formatNewsForJudge(newsItems: NewsItem[]): string {
        return newsItems.map((item, index) => {
            const url = new URL(item.link);
            const domain = url.hostname.replace('www.', '');
            
            return `ITEM_${index + 1}:
    Title: ${item.title}
    Source: ${item.source || domain}
    Published: ${item.publishedTime || 'Unknown'}
    Content: ${item.snippet}
    URL: ${item.link}
    ---`;
        }).join('\n\n');
    }

    private parseAIJudgeResponse(response: string, originalItems: NewsItem[]): NewsItem[] {
        const selectedItems: NewsItem[] = [];
        const lines = response.split('\n');
        
        for (const line of lines) {
            const match = line.match(/ITEM_(\d+):\s*KEEP/i);
            if (match) {
                const itemIndex = parseInt(match[1]) - 1;
                if (itemIndex >= 0 && itemIndex < originalItems.length) {
                    selectedItems.push(originalItems[itemIndex]);
                }
            }
        }
        
        // If AI didn't select any items or response format is incorrect, return first N items as fallback
        if (selectedItems.length === 0) {
            console.log('AI judge returned no items, using fallback selection');
            return originalItems.slice(0, Math.min(this.settings.resultsPerTopic, originalItems.length));
        }
        
        return selectedItems;
    }

    // Simplified query builder with broader terms to get more results
    private buildOptimizedQuery(topic: string): string {
        // Always use English for search to get the most comprehensive results
        // Base query with the topic
        let query = `${topic}`;
        
        // Add English news terms regardless of target language
        query += ' news OR updates OR recent OR latest';
        
        // Add topic-specific terms - using more general terms
        const lowercaseTopic = topic.toLowerCase();
        
        if (lowercaseTopic.includes('tech')) {
            query += ' technology OR innovation OR digital';
        } else if (lowercaseTopic.includes('world') || lowercaseTopic.includes('global')) {
            query += ' international OR global';
        } else if (lowercaseTopic.includes('business') || lowercaseTopic.includes('finance')) {
            query += ' market OR economic OR industry';
        } else if (lowercaseTopic.includes('science')) {
            query += ' research OR discovery';
        } else if (lowercaseTopic.includes('health')) {
            query += ' medical OR healthcare';
        }
        
        // Minimal negative terms to avoid filtering too much
        query += ' -spam';
        
        return query;
    }

    // Create a more generic query to capture more results - always in English
    private createSpecificQuery(topic: string): string {
        return `${topic} news article`;
    }

    // Additional query variants to increase coverage - always in English
    private createBroadQuery(topic: string): string {
        return `latest ${topic} developments`;
    }

    private createRecentQuery(topic: string): string {
        return `${topic} this week important`;
    }

    private async fetchNewsFromFreeSources(topic: string): Promise<NewsItem[]> {
        const allNews: NewsItem[] = [];
        const maxResults = this.settings.maxSearchResults || 30;
        
        // List of free news sources and RSS feeds
        const newsSources = [
            // BBC News RSS feeds
            {
                name: 'BBC News',
                baseUrl: 'https://feeds.bbci.co.uk/news',
                feeds: ['rss.xml', 'technology/rss.xml', 'business/rss.xml', 'world/rss.xml']
            },
            // CNN RSS feeds
            {
                name: 'CNN',
                baseUrl: 'https://rss.cnn.com/rss',
                feeds: ['edition.rss', 'cnn_tech.rss', 'cnn_world.rss']
            },
            // Reuters RSS feeds (alternative URLs)
            {
                name: 'Reuters',
                baseUrl: 'https://feeds.reuters.com',
                feeds: ['/technology/rss', '/world/rss', '/business/rss']
            },
            // NPR RSS feeds
            {
                name: 'NPR',
                baseUrl: 'https://feeds.npr.org',
                feeds: ['/1001/rss.xml', '/1019/rss.xml', '/1003/rss.xml'] // All Stories, Technology, World
            },
            // Associated Press RSS feeds
            {
                name: 'Associated Press',
                baseUrl: 'https://apnews.com',
                feeds: ['/rss/technology', '/rss/world-news', '/rss/business']
            }
        ];
        
        // Try NewsAPI (free tier available) if we have enough quota
        try {
            const newsApiResults = await this.fetchFromNewsAPI(topic);
            for (const item of newsApiResults) {
                if (!allNews.some(existing => existing.link === item.link)) {
                    allNews.push(item);
                }
            }
        } catch (error) {
            console.log('NewsAPI not available, using RSS feeds only');
        }
        
        // Fetch from RSS feeds with improved error handling
        const feedPromises: Promise<void>[] = [];
        let activeFetches = 0;
        const maxConcurrentFetches = 3;
        
        for (const source of newsSources) {
            if (allNews.length >= maxResults) break;
            
            for (const feed of source.feeds) {
                // Control concurrency to avoid overwhelming servers
                while (activeFetches >= maxConcurrentFetches) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                activeFetches++;
                const feedPromise = (async () => {
                    try {
                        const feedUrl = `${source.baseUrl}/${feed}`.replace(/\/+/g, '/').replace('http:/', 'http://').replace('https:/', 'https://');
                        const feedResults = await this.fetchFromRSSFeed(feedUrl, source.name, topic);
                        
                        for (const item of feedResults) {
                            if (!allNews.some(existing => existing.link === item.link) && allNews.length < maxResults) {
                                allNews.push(item);
                            }
                        }
                        
                    } catch (error) {
                        console.log(`Failed to fetch from ${source.name} (${feed}):`, error.message);
                    } finally {
                        activeFetches--;
                    }
                })();
                
                feedPromises.push(feedPromise);
                
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        // Wait for all feed fetches to complete
        await Promise.allSettled(feedPromises);
        
        // Filter items to match the topic better
        const filteredNews = allNews.filter(item => 
            this.matchesTopicKeywords(item, topic)
        );
        
        // If we don't have enough topic-specific results, include some general news
        let finalResults = filteredNews.slice(0, maxResults);
        if (finalResults.length < 3 && allNews.length > 0) {
            const remainingGeneral = allNews
                .filter(item => !filteredNews.includes(item))
                .slice(0, Math.max(0, 3 - finalResults.length));
            finalResults = [...finalResults, ...remainingGeneral];
        }
        
        return finalResults.slice(0, maxResults);
    }
    
    private async fetchFromNewsAPI(topic: string): Promise<NewsItem[]> {
        // This would require a free NewsAPI key, but we'll implement a basic version
        // that uses the NewsAPI developer endpoint (limited but free)
        const query = encodeURIComponent(topic);
        const apiUrl = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=20&language=en`;
        
        // Note: This would need an API key in production
        // For now, we'll throw an error to skip this source
        throw new Error('NewsAPI requires API key');
    }
    
    private async fetchFromRSSFeed(feedUrl: string, sourceName: string, topic: string): Promise<NewsItem[]> {
        try {
            // Add timeout to RSS feed requests using Promise.race
            const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('RSS feed request timed out')), 15000)
            );
            
            const requestPromise = requestUrl({ 
                url: feedUrl,
                headers: {
                    'User-Agent': 'ObsidianNewsPlugin/1.7.0'
                }
            });
            
            const response = await Promise.race([requestPromise, timeoutPromise]);
            const newsItems: NewsItem[] = [];
            
            // Basic XML parsing for RSS feeds
            const xmlContent = response.text;
            
            // Extract items using regex (improved approach for various RSS formats)
            const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
            const titleRegex = /<title[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/i;
            const linkRegex = /<link[^>]*(?:\s+href=["'](.*?)["'])?[^>]*>(.*?)<\/link>|<link[^>]*href=["'](.*?)["'][^>]*\/?>|<link[^>]*>(.*?)<\/link>/i;
            const descRegex = /<(?:description|summary|content)[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/(?:description|summary|content)>/i;
            const pubDateRegex = /<(?:pubDate|published|updated)[^>]*>(.*?)<\/(?:pubDate|published|updated)>/i;
            
            let match;
            while ((match = itemRegex.exec(xmlContent)) !== null && newsItems.length < 10) {
                const itemXml = match[1];
                
                const titleMatch = titleRegex.exec(itemXml);
                const linkMatch = linkRegex.exec(itemXml);
                const descMatch = descRegex.exec(itemXml);
                const pubDateMatch = pubDateRegex.exec(itemXml);
                
                if (titleMatch && linkMatch) {
                    const title = (titleMatch[1] || titleMatch[2] || '').trim();
                    const link = (linkMatch[1] || linkMatch[2] || linkMatch[3] || linkMatch[4] || '').trim();
                    const description = (descMatch ? (descMatch[1] || descMatch[2] || '') : '').trim();
                    const publishedTime = pubDateMatch ? pubDateMatch[1].trim() : undefined;
                    
                    // Clean HTML tags from description
                    const cleanDesc = description.replace(/<[^>]*>/g, '').trim();
                    
                    if (title && link && this.isRecentNews(publishedTime)) {
                        newsItems.push({
                            title: this.decodeHtml(title),
                            link: link,
                            snippet: this.decodeHtml(cleanDesc).substring(0, 300),
                            publishedTime: publishedTime,
                            source: sourceName
                        });
                    }
                }
            }
            
            return newsItems;
            
        } catch (error) {
            console.error(`Error fetching RSS feed ${feedUrl}:`, error);
            return [];
        }
    }
    
    private matchesTopicKeywords(item: NewsItem, topic: string): boolean {
        const searchTerms = topic.toLowerCase().split(/[\s,]+/);
        const searchText = `${item.title} ${item.snippet}`.toLowerCase();
        
        // Create broader keyword matching for specific topics
        const expandedTerms = [...searchTerms];
        
        // Add related keywords for common topics
        const topicKeywords = {
            'technology': ['tech', 'digital', 'software', 'hardware', 'ai', 'artificial intelligence', 'computer', 'internet'],
            'blockchain': ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'defi', 'nft', 'web3', 'digital currency'],
            'world': ['international', 'global', 'foreign', 'country', 'nation', 'politics', 'government'],
            'business': ['economy', 'finance', 'market', 'company', 'corporate', 'industry', 'trade'],
            'science': ['research', 'study', 'scientific', 'discovery', 'innovation', 'medical', 'health']
        };
        
        // Add related keywords based on topic
        for (const [key, keywords] of Object.entries(topicKeywords)) {
            if (topic.toLowerCase().includes(key)) {
                expandedTerms.push(...keywords);
            }
        }
        
        // Check if any search term or related keyword is found
        return expandedTerms.some(term => 
            term.length > 2 && searchText.includes(term)
        );
    }
    
    private isRecentNews(publishedTime?: string): boolean {
        if (!publishedTime) return true; // If no date, assume recent
        
        try {
            const pubDate = new Date(publishedTime);
            const now = new Date();
            const daysDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Consider news from the last 7 days as recent
            return daysDiff <= 7;
        } catch {
            return true; // If date parsing fails, assume recent
        }
    }
    
    private decodeHtml(html: string): string {
        return html
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'");
    }

    private async fetchNewsFromGoogle(
        query: string, 
        dateRestrict: string, 
        maxResults: number = 10
    ): Promise<NewsItem[]> {
        const requestsNeeded = Math.ceil(maxResults / 10);
        const actualRequests = Math.min(requestsNeeded, 3);
        
        let allResults: NewsItem[] = [];
        let requestErrors = 0;
        
        for (let i = 0; i < actualRequests; i++) {
            if (allResults.length >= maxResults) break;
            
            const startIndex = (i * 10) + 1;
            
            const params = new URLSearchParams({
                key: this.settings.googleSearchApiKey,
                cx: this.settings.googleSearchEngineId,
                q: query,
                num: '10',
                dateRestrict: dateRestrict,
                fields: 'items(title,link,snippet,pagemap/metatags/publishedTime,pagemap/metatags/og_site_name)',
                sort: i === 0 ? 'date' : 'relevance',
                start: startIndex.toString()
            });
            
            try {
                const response = await requestUrl({
                    url: `https://www.googleapis.com/customsearch/v1?${params.toString()}`
                });
                
                const data: SearchResponse = JSON.parse(response.text);
                
                // Check if the API returned an error
                if (data.error) {
                    console.error(`Google Search API error: ${data.error.message} (${data.error.status})`);
                    requestErrors++;
                    continue;
                }
                
                if (!data || !data.items || data.items.length === 0) {
                    // Not considering empty results as an error, just continue
                    continue;
                }
                
                // Process results into NewsItems (without quality scoring)
                const pageResults = data.items.map(item => {
                    const url = new URL(item.link);
                    const domain = url.hostname.replace('www.', '');
                    const source = item.pagemap?.metatags?.[0]?.og_site_name || domain;
                    
                    return {
                        title: item.title,
                        link: item.link,
                        snippet: this.cleanNewsContent(item.snippet),
                        publishedTime: item.pagemap?.metatags?.[0]?.publishedTime,
                        source: source
                    };
                });
                
                // Add only non-duplicate results
                for (const item of pageResults) {
                    if (!allResults.some(existing => existing.link === item.link)) {
                        allResults.push(item);
                    }
                }
                
                if (i < actualRequests - 1) {
                    await new Promise(r => setTimeout(r, 200));
                }
                
            } catch (error) {
                console.error(`Search API error on page ${i+1}:`, error);
                requestErrors++;
            }
        }
        
        // If all requests failed and we have no results, throw an error
        if (requestErrors === actualRequests && allResults.length === 0) {
            throw new Error(`All ${requestErrors} API requests failed for query: ${query}`);
        }
        
        return allResults;
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
            
            return `=== NEWS ITEM ===\n` +
                `Title: ${item.title}\n` +
                `Source: ${item.source || domain}\n` +
                `URL: ${item.link}\n` +
                `Published: ${item.publishedTime || 'Unknown'}\n` +
                `Content: ${item.snippet}\n`;
        }).join('\n\n');

        // Get appropriate prompt
        const prompt = this.getAIPrompt(enhancedNewsText, topic, this.settings.outputFormat);

        try {
            if (this.settings.apiProvider === 'claude') {
                return await this.generateSummaryWithClaude(prompt);
            } else if (this.settings.apiProvider === 'openai') {
                return await this.generateSummaryWithOpenAI(prompt);
            } else if (this.settings.apiProvider === 'google') {
                return await this.generateSummaryWithGemini(prompt, topic);
            } else {
                throw new Error('Unsupported API provider for summarization');
            }
        } catch (error) {
            console.error('Failed to generate summary:', error);
            
            // Provide fallback content with the actual news items when AI summarization fails
            const fallbackContent = this.createFallbackSummary(newsItems, topic);
            
            return `**Note: AI summarization failed for ${topic}**\n\n` +
                   `Error: ${error.message || 'Unknown error'}\n\n` +
                   `**Raw news items found:**\n\n${fallbackContent}`;
        }
    }

    async generateSummaryWithClaude(prompt: string, retryCount: number = 0): Promise<string> {
        if (!this.settings.claudeApiKey) {
            throw new Error('Missing Claude API key');
        }

        const maxRetries = 3;
        const baseDelay = 1000; // 1 second

        try {
            console.log(`Using AI SDK for Claude with custom fetch - Model: ${this.settings.claudeModel}`);
            console.log(`API key format check: ${this.settings.claudeApiKey?.startsWith('sk-ant-') ? 'Valid format' : 'Invalid format'}`);
            console.log(`Prompt length: ${prompt.length} characters`);
            
            const anthropic = createAnthropic({
                apiKey: this.settings.claudeApiKey,
                fetch: this.createCustomFetch()
            });
            
            const { text } = await generateText({
                model: anthropic(this.settings.claudeModel),
                prompt: prompt,
                temperature: 0.2,
            });

            console.log(`Claude AI SDK call successful, response length: ${text?.length || 0} characters`);
            return text;
        } catch (error) {
            console.error(`Claude AI SDK error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
            console.error(`Error details:`, {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            
            // Check if we should retry
            const shouldRetry = retryCount < maxRetries && (
                error.message.includes('fetch') ||
                error.message.includes('timeout') ||
                error.message.includes('ECONNRESET') ||
                error.message.includes('ENOTFOUND') ||
                error.message.includes('network') ||
                error.status === 500 ||
                error.status === 502 ||
                error.status === 503 ||
                error.status === 504
            );

            if (shouldRetry) {
                const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
                console.log(`Retrying Claude AI SDK call in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.generateSummaryWithClaude(prompt, retryCount + 1);
            }
            
            // Provide more specific error messages with evidence
            let errorMessage = `AI SDK Error: ${error.message}`;
            const diagnosticInfo = this.gatherAISDKDiagnostics(error);
            
            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                errorMessage = 'Invalid Claude API key or unauthorized access';
            } else if (error.message.includes('429') || error.message.includes('rate limit')) {
                errorMessage = 'Claude API rate limit exceeded - please wait and try again';
            } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMessage = 'Claude API request timed out after multiple retries - network connection issue';
            } else if (error.message.includes('fetch') || error.message.includes('network')) {
                errorMessage = `Network error with AI SDK - ${diagnosticInfo}`;
            } else if (error.message.includes('ENOTFOUND')) {
                errorMessage = 'DNS lookup failed for Claude API - check internet connection and DNS settings';
            }
            
            throw new Error(`Claude API error: ${errorMessage}`);
        }
    }

    async generateSummaryWithOpenAI(prompt: string, retryCount: number = 0): Promise<string> {
        if (!this.settings.openaiApiKey) {
            throw new Error('Missing OpenAI API key');
        }

        const maxRetries = 3;
        const baseDelay = 1000; // 1 second

        try {
            console.log(`Using AI SDK for OpenAI with custom fetch - Model: ${this.settings.openaiModel}`);
            console.log(`API key format check: ${this.settings.openaiApiKey?.startsWith('sk-') ? 'Valid format' : 'Invalid format'}`);
            console.log(`Prompt length: ${prompt.length} characters`);
            
            const openai = createOpenAI({
                apiKey: this.settings.openaiApiKey,
                fetch: this.createCustomFetch()
            });
            
            const { text } = await generateText({
                model: openai(this.settings.openaiModel),
                prompt: prompt,
                temperature: 0.2,
            });

            console.log(`OpenAI AI SDK call successful, response length: ${text?.length || 0} characters`);
            return text;
        } catch (error) {
            console.error(`OpenAI AI SDK error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
            console.error(`Error details:`, {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            
            // Check if we should retry
            const shouldRetry = retryCount < maxRetries && (
                error.message.includes('fetch') ||
                error.message.includes('timeout') ||
                error.message.includes('ECONNRESET') ||
                error.message.includes('ENOTFOUND') ||
                error.message.includes('network') ||
                error.status === 500 ||
                error.status === 502 ||
                error.status === 503 ||
                error.status === 504
            );

            if (shouldRetry) {
                const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
                console.log(`Retrying OpenAI AI SDK call in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.generateSummaryWithOpenAI(prompt, retryCount + 1);
            }
            
            // Provide more specific error messages with evidence
            let errorMessage = `AI SDK Error: ${error.message}`;
            const diagnosticInfo = this.gatherAISDKDiagnostics(error);
            
            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                errorMessage = 'Invalid OpenAI API key or unauthorized access';
            } else if (error.message.includes('429') || error.message.includes('rate limit')) {
                errorMessage = 'OpenAI API rate limit exceeded - please wait and try again';
            } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMessage = 'OpenAI API request timed out after multiple retries - network connection issue';
            } else if (error.message.includes('fetch') || error.message.includes('network')) {
                errorMessage = `Network error with AI SDK - ${diagnosticInfo}`;
            } else if (error.message.includes('ENOTFOUND')) {
                errorMessage = 'DNS lookup failed for OpenAI API - check internet connection and DNS settings';
            }
            
            throw new Error(`OpenAI API error: ${errorMessage}`);
        }
    }

    async generateSummaryWithGemini(prompt: string, topic: string): Promise<string> {
        // Check if API key is available
        if (!this.settings.geminiApiKey) {
            throw new Error('Missing Gemini API key');
        }
        
        // Initialize the Gemini API
        const genAI = new GoogleGenerativeAI(this.settings.geminiApiKey);
        
        // Use the model "gemini-1.5-flash" for better performance
        const modelName = "gemini-1.5-flash";
            
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
        
        // Validate result structure
        if (!result || !result.response) {
            throw new Error('Invalid AI response structure');
        }
        
        // Return the summary text
        return result.response.text();
    }

    // Fallback summary when AI fails
    private createFallbackSummary(newsItems: NewsItem[], topic: string): string {
        if (!newsItems.length) {
            return `No news items found for ${topic}.`;
        }

        return newsItems.slice(0, Math.min(8, this.settings.resultsPerTopic)).map((item, index) => {
            try {
                const domain = new URL(item.link).hostname.replace('www.', '');
                const source = item.source || domain;
                const snippet = item.snippet?.substring(0, 200) || 'No description available';
                const publishedTime = item.publishedTime ? ` (${item.publishedTime})` : '';
                
                return `### ${index + 1}. ${item.title}\n\n` +
                       `**Source:** ${source}${publishedTime}\n\n` +
                       `**Summary:** ${snippet}${snippet.length >= 200 ? '...' : ''}\n\n` +
                       `**Link:** [Read full article](${item.link})\n\n---`;
            } catch (error) {
                // Handle URL parsing errors
                return `### ${index + 1}. ${item.title}\n\n` +
                       `**Source:** ${item.source || 'Unknown'}\n\n` +
                       `**Summary:** ${item.snippet?.substring(0, 200) || 'No description available'}\n\n` +
                       `**Link:** [Read full article](${item.link})\n\n---`;
            }
        }).join('\n\n');
    }

    private getAIPrompt(newsText: string, topic: string, format: 'detailed' | 'concise'): string {
        // If user has custom prompt enabled and provided one, use it
        if (this.settings.useCustomPrompt && this.settings.customPrompt && newsText) {
            return this.settings.customPrompt.replace('{{NEWS_TEXT}}', newsText);
        }
        
        // Language instruction - Make it clear to translate from English to target language if needed
        const languageInstruction = this.settings.language !== 'en' ? 
            ` Translate all content into the language with ISO 639-1 code "${this.settings.language}". The source news may be in English but your response should be entirely in the target language.` : '';
        
        // If no custom prompt, use default based on provider
        let basePrompt = ``;
        if (this.settings.apiProvider === 'google') {
            basePrompt = `Analyze these news articles about ${topic} and provide a substantive summary.${languageInstruction}

            ${newsText}

            KEY REQUIREMENTS:
            1. Focus on concrete developments, facts, and data
            2. For each news item include the SOURCE in markdown format: [Source](URL)
            3. Use specific dates rather than relative time references
            4. Prioritize news with specific details (numbers, names, quotes)
            5. If content lacks substance, state "${this.getTranslation('limitedNews')} ${topic}"`;
        } else {
            // For Sonar API, use a different prompt structure with explicit translation instruction
            basePrompt = `You are a helpful AI assistant. Please answer in the required format.${languageInstruction}

            KEY REQUIREMENTS:
            1. Focus on concrete developments, facts, and data
            2. For each news item include the SOURCE in markdown format: [Source](URL)
            3. Use specific dates rather than relative time references
            4. Prioritize news with specific details (numbers, names, quotes)
            5. Only return the news - do not include any meta-narratives, explanations, or instructions. 
            6. If content lacks substance, state "${this.getTranslation('limitedNews')} ${topic}"`;

            return basePrompt;
        }

        // Add format-specific instructions
        if (format === 'detailed') {
            let formattedPrompt = basePrompt + `

Format your summary with these sections:

### ${this.getTranslation('keyDevelopments')}
- **[Clear headline with key detail]**: Concrete facts with specific details. [Source](URL)
- **[Clear headline with key detail]**: Concrete facts with specific details. [Source](URL)`;

            // Only add analysis section if the feature is enabled
            if (this.settings.enableAnalysisContext) {
                formattedPrompt += `

### ${this.getTranslation('analysisContext')}
[Provide context, implications, or background for the most significant developments]`;
            }
            
            return formattedPrompt;
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
            
            // Prepare request body - Always search in English but translate results to target language
            const requestBody = {
                model: "sonar",
                messages: [
                    {
                        role: "system",
                        content: systemMessage
                    },
                    {
                        role: "user",
                        content: this.settings.language !== 'en' ? 
                            `What are the latest significant news about "${topic}"? Search for information in English, but translate your final response into the language with ISO 639-1 code "${this.settings.language}".` :
                            `What are the latest significant news about "${topic}"?`
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
                url: 'https://api.perplexity.ai/chat/completions',
                ...options
            });
            
            if (response.status >= 200 && response.status < 300) {
                const data = JSON.parse(response.text);
                if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                    return data.choices[0].message.content;
                } else {
                    throw new Error('Invalid response format from Sonar API');
                }
            } else {
                // console.error(`Sonar API returned status ${response.status}: ${response.text}`);
                throw new Error(`Sonar API returned status ${response.status}: ${response.text}`);
            }
        } catch (error) {
            console.error('Sonar API error:', error);
            // This error message will be detected in the generateDailyNews method
            return `Error fetching news about ${topic} from Sonar API. Please check your API key and settings.\n\nError details: ${error.message}\n\nCheck the developer console for more information.`;
        }
    }

    // Method to gather AI SDK diagnostic information
    private gatherAISDKDiagnostics(error: any): string {
        const diagnostics = [];
        
        // Check error properties
        if (error.name) diagnostics.push(`Error type: ${error.name}`);
        if (error.code) diagnostics.push(`Error code: ${error.code}`);
        if (error.cause) diagnostics.push(`Cause: ${error.cause}`);
        
        // Check if it's a network-related error
        if (error.message.includes('fetch')) {
            diagnostics.push('Fetch API failure - possibly network connectivity issue in Obsidian environment');
        }
        
        // Check stack trace for more details
        if (error.stack && error.stack.includes('ai-sdk')) {
            diagnostics.push('Error originated from AI SDK');
        }
        
        return diagnostics.join(', ');
    }

    // Create diagnostic note when AI SDK consistently fails
    async createAISDKDiagnosticNote(): Promise<void> {
        const date = new Date().toISOString().split('T')[0];
        const fileName = `AI-SDK-Diagnostics-${date}.md`;
        const archiveFolder = this.normalizePath(this.settings.archiveFolder);
        const filePath = `${archiveFolder}/${fileName}`;

        // Check if diagnostic note already exists today
        if (await this.app.vault.adapter.exists(filePath)) {
            return;
        }

        // Gather system information
        const userAgent = navigator.userAgent;
        const obsidianVersion = (this.app as any).appVersion || 'Unknown';
        const nodeVersion = process?.version || 'Unknown';
        
        const diagnosticContent = `# AI SDK Diagnostic Report
        
**Date:** ${new Date().toLocaleString()}
**Plugin Version:** 1.7.0

## Issue Description
The AI SDK by Vercel is failing to make API calls from within the Obsidian environment.

## Evidence
- **RSS Feed Retrieval:** ✅ Working (using requestUrl)
- **Direct API Connectivity:** ✅ Working (tested with curl)
- **AI SDK API Calls:** ❌ Failing

## Technical Details

### Environment
- **Obsidian Version:** ${obsidianVersion}
- **User Agent:** ${userAgent}
- **Node.js Version:** ${nodeVersion}
- **Platform:** ${process?.platform || navigator.platform}

### AI SDK Versions
- **@ai-sdk/anthropic:** 2.0.8
- **@ai-sdk/openai:** 2.0.22  
- **ai:** 5.0.26

### Network Tests
- **api.anthropic.com:** Reachable via curl
- **api.openai.com:** Reachable via curl
- **RSS feeds (BBC, CNN, Reuters):** Working via requestUrl

## Error Patterns
Both Claude and OpenAI AI SDK calls fail with network-related errors, while:
1. RSS feeds work perfectly using Obsidian's requestUrl
2. Direct curl commands to the same APIs succeed
3. API keys are valid (correct format)

## Hypothesis
The AI SDK by Vercel may be using networking libraries or methods that are not compatible with Obsidian's sandboxed environment, while Obsidian's native requestUrl function works correctly.

## Recommended Solutions
1. **Switch to Google/Gemini provider** (uses different SDK)
2. **Use Sonar by Perplexity** (different API approach)  
3. **Wait for AI SDK compatibility updates** with Obsidian environment

## Console Logs
Check Obsidian's Developer Console (Ctrl+Shift+I) for detailed error messages when attempting to use Claude or OpenAI providers.
`;

        try {
            // Create folder if it doesn't exist
            if (!(await this.app.vault.adapter.exists(archiveFolder))) {
                await this.app.vault.createFolder(archiveFolder);
            }
            
            await this.app.vault.create(filePath, diagnosticContent);
            new Notice(`Created AI SDK diagnostic note: ${fileName}`, 5000);
        } catch (error) {
            console.error('Failed to create diagnostic note:', error);
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
        } else if (this.settings.apiProvider === 'claude') {
            // Check Claude API settings (no Google API required)
            if (!this.settings.claudeApiKey) {
                new Notice('Missing Claude API key. Please add your Anthropic API key in settings.', 5000);
                return false;
            }
            // Validate Claude API key format
            if (!this.settings.claudeApiKey.startsWith('sk-ant-')) {
                new Notice('Invalid Claude API key format. Keys should start with "sk-ant-"', 5000);
                return false;
            }
            // Validate Claude model name
            if (!this.settings.claudeModel) {
                new Notice('Missing Claude model configuration. Please specify a model name.', 5000);
                return false;
            }
        } else if (this.settings.apiProvider === 'openai') {
            // Check OpenAI API settings (no Google API required)
            if (!this.settings.openaiApiKey) {
                new Notice('Missing OpenAI API key. Please add your OpenAI API key in settings.', 5000);
                return false;
            }
        }
        return true;
    }

    // Add a method to test API connectivity
    async testClaudeConnection(): Promise<boolean> {
        if (!this.settings.claudeApiKey) {
            return false;
        }

        try {
            console.log('Testing Claude API connection with AI SDK and custom fetch...');
            
            const anthropic = createAnthropic({
                apiKey: this.settings.claudeApiKey,
                fetch: this.createCustomFetch()
            });
            
            const { text } = await generateText({
                model: anthropic(this.settings.claudeModel),
                prompt: 'Say "API test successful" in exactly those words.',
                temperature: 0.1,
            });

            const success = text.includes('API test successful');
            console.log(`Claude API test result: ${success ? 'SUCCESS' : 'FAILED'}`);
            console.log(`Test response: "${text}"`);
            return success;
        } catch (error) {
            console.error('Claude API connection test failed with AI SDK:', error);
            console.error(`Error details:`, {
                name: error.name,
                message: error.message,
                stack: error.stack?.substring(0, 500),
                cause: error.cause
            });
            return false;
        }
    }

    async testOpenAIConnection(): Promise<boolean> {
        if (!this.settings.openaiApiKey) {
            return false;
        }

        try {
            console.log('Testing OpenAI API connection with AI SDK and custom fetch...');
            
            const openai = createOpenAI({
                apiKey: this.settings.openaiApiKey,
                fetch: this.createCustomFetch()
            });
            
            const { text } = await generateText({
                model: openai(this.settings.openaiModel),
                prompt: 'Say "API test successful" in exactly those words.',
                temperature: 0.1,
            });

            const success = text.includes('API test successful');
            console.log(`OpenAI API test result: ${success ? 'SUCCESS' : 'FAILED'}`);
            console.log(`Test response: "${text}"`);
            return success;
        } catch (error) {
            console.error('OpenAI API connection test failed with AI SDK:', error);
            console.error(`Error details:`, {
                name: error.name,
                message: error.message,
                stack: error.stack?.substring(0, 500),
                cause: error.cause
            });
            return false;
        }
    }

    async generateDailyNews() {
        // Validate API configuration first
        if (!this.validateApiConfig()) {
            return null;
        }

        // Language Validation - modified to handle missing translations
        if (this.settings.language.length !== 2) {
            new Notice("Invalid language code. Please enter a valid ISO 639-1 code (e.g., 'en', 'fr').", 5000);
            return null;
        }
        
        // If language doesn't have translations, warn but continue with English
        if (!(LANGUAGE_TRANSLATIONS as any)[this.settings.language]) {
            console.warn(`No translations available for language code "${this.settings.language}". Using English as fallback for UI elements.`);
            // Optional: show notice to user
            new Notice(`No translations available for "${this.settings.language}". UI will show in English, but content will be in the selected language.`, 4000);
            // We don't return null here, allowing the process to continue with English UI
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
            let content = `*${this.getTranslation('generatedAt')} ${new Date().toLocaleTimeString()}*\n\n`;
            content += `---\n\n`;

            // Add table of contents
            content += `## ${this.getTranslation('tableOfContents')}\n\n`;
            this.settings.topics.forEach(topic => {
                content += `- [${topic}](#${topic.toLowerCase().replace(/\s+/g, '%20')})\n`;
            });

            // Track topic processing status
            type TopicStatus = {
                topic: string;
                retrievalSuccess: boolean;
                summarizationSuccess: boolean;
                newsCount: number;
                error?: string;
            };
            
            const topicStatuses: TopicStatus[] = [];
            let aiSdkFailureCount = 0; // Track AI SDK failures
            
            // Process each topic
            for (const topic of this.settings.topics) {
                const topicStatus: TopicStatus = {
                    topic: topic,
                    retrievalSuccess: false,
                    summarizationSuccess: false,
                    newsCount: 0
                };
                
                try {
                    content += `\n---\n\n`;
                    content += `## ${topic}\n\n`;
                    
                    new Notice(`Fetching news for ${topic}...`);

                    if (this.settings.apiProvider === 'google' || this.settings.apiProvider === 'claude' || this.settings.apiProvider === 'openai') {
                        try {
                            // Step 1: News Retrieval (same for all these providers)
                            const newsItems = await this.fetchNews(topic);
                            topicStatus.retrievalSuccess = true;
                            topicStatus.newsCount = newsItems.length;
                            
                            if (newsItems.length) {
                                try {
                                    // Step 2: News Summarization (provider-specific)
                                    new Notice(`Summarizing ${newsItems.length} news items for ${topic}...`);
                                    const summary = await this.generateSummary(newsItems, topic);
                                    
                                    // Check if summary contains error messages
                                    if (summary.includes('AI summarization failed') || summary.includes('Error generating summary') || summary.includes('Failed to generate')) {
                                        topicStatus.error = `Summarization failed for topic "${topic}"`;
                                        content += summary + '\n'; // Summary already includes error context and fallback content
                                    } else {
                                        topicStatus.summarizationSuccess = true;
                                        content += summary + '\n';
                                    }
                                } catch (summarizationError) {
                                    console.error(`Summarization error for ${topic}:`, summarizationError);
                                    topicStatus.error = `Summarization error: ${summarizationError.message}`;
                                    content += `**News retrieval successful, but summarization failed for ${topic}.**\n\n`;
                                    content += `Error details: ${summarizationError.message}\n\n`;
                                    
                                    // Track AI SDK failures
                                    if (summarizationError.message.includes('AI SDK') || 
                                        summarizationError.message.includes('fetch') ||
                                        summarizationError.message.includes('network')) {
                                        aiSdkFailureCount++;
                                    }
                                }
                            } else {
                                content += `${this.getTranslation('noRecentNews')} ${topic}.\n\n`;
                                topicStatus.error = `No news found for topic "${topic}"`;
                            }
                        } catch (retrievalError) {
                            console.error(`News retrieval error for ${topic}:`, retrievalError);
                            topicStatus.error = `Retrieval error: ${retrievalError.message}`;
                            content += `**${this.getTranslation('errorRetrieving')} ${topic}.**\n\n`;
                            content += `Error details: ${retrievalError.message}\n\n`;
                        }
                    } else if (this.settings.apiProvider === 'sonar') {
                        try {
                            // Sonar combines retrieval and summarization in one step
                            const summary = await this.fetchAndSummarizeWithSonar(topic);
                            
                            // Check if summary contains error messages
                            if (summary.includes('Error fetching news about') || summary.includes('API error')) {
                                topicStatus.error = `Sonar API error for topic "${topic}"`;
                                content += summary + '\n';
                            } else {
                                topicStatus.retrievalSuccess = true;
                                topicStatus.summarizationSuccess = true;
                                topicStatus.newsCount = 1; // We don't know exactly how many items Sonar found
                                content += summary + '\n';
                            }
                        } catch (sonarError) {
                            console.error(`Sonar API error for ${topic}:`, sonarError);
                            topicStatus.error = `Sonar API error: ${sonarError.message}`;
                            content += `**${this.getTranslation('errorRetrieving')} ${topic} using Sonar API.**\n\n`;
                            content += `Error details: ${sonarError.message}\n\n`;
                        }
                    }

                } catch (topicError) {
                    console.error(`Unexpected error processing topic ${topic}:`, topicError);
                    topicStatus.error = `Unexpected error: ${topicError.message}`;
                    content += `${this.getTranslation('errorRetrieving')} ${topic}. Please try again later.\n\n`;
                }
                
                topicStatuses.push(topicStatus);
            }

            // Analyze results to determine if note should be created
            const atLeastOneSuccessfulTopic = topicStatuses.some(status => 
                status.retrievalSuccess && status.summarizationSuccess);
                
            const atLeastOneNewsItem = topicStatuses.some(status => status.newsCount > 0);
            
            const allRetrievalsFailed = topicStatuses.every(status => !status.retrievalSuccess);
                
            // Generate error analysis for logging
            const errorSummary = topicStatuses
                .filter(status => status.error)
                .map(status => `${status.topic}: ${status.error}`)
                .join('\n');
                
            // Decide whether to create the note - only skip if all news retrievals failed
            if (allRetrievalsFailed) {
                const errorMessage = 'Failed to retrieve news for any topics.';
                
                if (this.settings.enableNotifications) {
                    new Notice(`${errorMessage} No note was created.`, 5000);
                }
                console.error(`${errorMessage} No note was created.\nError details:\n${errorSummary}`);
                return null;
            }
            
            // If we have news but summarization failed, still create the note with error information
            if (atLeastOneNewsItem && !atLeastOneSuccessfulTopic) {
                if (this.settings.enableNotifications) {
                    new Notice('News retrieved but summarization failed. Note created with error details.', 5000);
                }
                console.warn('News retrieved but summarization failed for all topics. Creating note with error information.');
            }

            // Create folder if it doesn't exist
            try {
                if (!(await this.app.vault.adapter.exists(archiveFolder))) {
                    await this.app.vault.createFolder(archiveFolder);
                }
            } catch (folderError) {
                console.error("Failed to create folder:", folderError);
                new Notice('Failed to create archive folder', 5000);
                return null;
            }

            // Add an error summary at the end of the note if some topics failed
            if (topicStatuses.some(status => status.error)) {
                content += '\n---\n\n';
                content += `## ${this.getTranslation('processingStatus')}\n\n`;
                content += 'Some topics encountered issues during processing:\n\n';
                
                for (const status of topicStatuses) {
                    if (status.error) {
                        const stage = !status.retrievalSuccess ? 'News Retrieval' : 'News Summarization';
                        content += `- **${status.topic}**: Issue during ${stage} - ${status.error}\n`;
                    }
                }
            }

            // Check if file already exists and handle accordingly
            if (await this.app.vault.adapter.exists(fileName)) {
                // File exists, update it instead
                const existingFile = this.app.vault.getAbstractFileByPath(fileName);
                if (existingFile instanceof TFile) {
                    await this.app.vault.modify(existingFile, content);
                    if (this.settings.enableNotifications) {
                        new Notice('Daily news updated successfully', 3000);
                    }
                } else {
                    // File path exists but is not a file, create with timestamp
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const newFileName = fileName.replace('.md', `-${timestamp}.md`);
                    await this.app.vault.create(newFileName, content);
                    if (this.settings.enableNotifications) {
                        new Notice('Daily news generated successfully', 3000);
                    }
                    return newFileName;
                }
            } else {
                // File doesn't exist, create it
                await this.app.vault.create(fileName, content);
                if (this.settings.enableNotifications) {
                    new Notice('Daily news generated successfully', 3000);
                }
            }
            
            // Create diagnostic note if AI SDK consistently fails
            if (aiSdkFailureCount > 0 && (this.settings.apiProvider === 'claude' || this.settings.apiProvider === 'openai')) {
                await this.createAISDKDiagnosticNote();
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
                } else {
                    // News generation failed, show a notification
                    new Notice('Failed to generate news briefing. No note was created.', 5000);
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

    // Helper method to get language-specific translations
    private getTranslation(key: string): string {
        // Get the language-specific translations or default to English
        const translations = (LANGUAGE_TRANSLATIONS as any)[this.settings.language] || LANGUAGE_TRANSLATIONS['en'];
        
        // Return the translation for the key or the key itself if no translation exists
        return (translations as any)[key] || (LANGUAGE_TRANSLATIONS['en'] as any)[key] || key;
    }
}