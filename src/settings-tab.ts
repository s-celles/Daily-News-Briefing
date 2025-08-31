import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type { DailyNewsSettings } from './types';
import type DailyNewsPlugin from '../main';
import { LANGUAGE_NAMES } from './constants';

export class DailyNewsSettingTab extends PluginSettingTab {
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
            .setDesc('Select either Google APIs (requires 3 keys) or Sonar API (requires 1 key)')
            .addDropdown(dropdown => dropdown
                .addOption('google', 'Google (Search + Gemini)')
                .addOption('sonar', 'Sonar by Perplexity')
                .setValue(this.plugin.settings.apiProvider)
                .onChange(async (value: 'google' | 'sonar') => {
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
        } else {
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
        }

        // News Configuration section
        containerEl.createEl('h2', {text: 'News Configuration'});
        
        new Setting(containerEl)
            .setName('Language')
            .setDesc('Language for news content and UI elements')
            .addDropdown(dropdown => {
                // Add all supported languages to the dropdown
                Object.entries(LANGUAGE_NAMES).forEach(([code, name]) => {
                    dropdown.addOption(code, name);
                });
                
                return dropdown
                    .setValue(this.plugin.settings.language)
                    .onChange(async (value) => {
                        this.plugin.settings.language = value;
                        await this.plugin.saveSettings();
                    });
            });
        
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
            // Search Configuration section
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
        }

        // Output Settings section
        containerEl.createEl('h2', {text: 'Output Configuration'});
        
        if (this.plugin.settings.apiProvider === 'google') {
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

            // Additional advanced settings for API-specific settings
            if (this.plugin.settings.apiProvider === 'google') {

                // Add AI Query Generation setting in Google
                new Setting(containerEl)
                .setName('Use AI for search queries')
                .setDesc('Use AI to generate optimized search queries (uses Gemini API)')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.useAIForQueries)
                    .onChange(async (value) => {
                        this.plugin.settings.useAIForQueries = value;
                        await this.plugin.saveSettings();
                    }));

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