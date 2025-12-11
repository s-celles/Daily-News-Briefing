import { App, Plugin, Notice, TFile } from 'obsidian';
import { DailyNewsSettingTab } from './src/settings-tab';
import { DailyNewsSettings, DEFAULT_SETTINGS } from './src/types';
import { NewsProviderFactory } from './src/providers/news-provider-factory';

export default class DailyNewsPlugin extends Plugin {
    settings: DailyNewsSettings;

    async onload() {
        await this.loadSettings();
        
        this.addSettingTab(new DailyNewsSettingTab(this.app, this));

        this.addRibbonIcon('newspaper', 'Daily News Briefing', () => {
            this.openOrCreateDailyNews();
        });

        this.registerInterval(
            window.setInterval(() => this.checkAndGenerateNews(), 60 * 1000)
        );

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

    async checkAndGenerateNews() {
        const now = new Date();
        const scheduledTime = this.settings.scheduleTime.split(':');
        const targetHour = parseInt(scheduledTime[0]);
        const targetMinute = parseInt(scheduledTime[1]);

        if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {
            await this.generateDailyNews();
        }
    }

    private validateApiConfig(): boolean {
        const isValid = NewsProviderFactory.validateProviderConfig(this.settings);
        if (!isValid) {
            new Notice('Missing API configuration. Please check the Daily News Briefing settings.', 5000);
        }
        return isValid;
    }

    async generateDailyNews() {
        if (!this.validateApiConfig()) {
            return null;
        }

        const date = new Date().toISOString().split('T')[0];
        
        try {
            const archiveFolder = this.normalizePath(this.settings.archiveFolder);
            const fileName = `${archiveFolder}/Daily News - ${date}.md`;

            if (await this.app.vault.adapter.exists(fileName)) {
                new Notice('Daily news has already been generated for today.', 5000);
                return fileName;
            }
            
            new Notice('Generating daily news briefing...');
            
            let content = `*Generated at ${new Date().toLocaleTimeString()} with ${NewsProviderFactory.getProviderName(this.settings)}*\n\n`;
            content += `---\n\n`;

            content += `## Table of Contents\n\n`;
            this.settings.topics.forEach(topic => {
                content += `- [${topic}](#${topic.toLowerCase().replace(/\s+/g, '-')})\n`;
            });

            const provider = NewsProviderFactory.createProvider(this.settings);

            for (const topic of this.settings.topics) {
                try {
                    content += `\n---\n\n`;
                    content += `## ${topic}\n\n`;
                    
                    new Notice(`Fetching news for ${topic}...`);

                    const summary = await provider.fetchAndSummarizeNews(topic);
                    content += summary + '\n';

                } catch (topicError) {
                    console.error(`Error processing topic ${topic}:`, topicError);
                    content += `Error retrieving news for ${topic}. ${topicError.message}\n\n`;
                }
            }

            if (!(await this.app.vault.adapter.exists(archiveFolder))) {
                await this.app.vault.createFolder(archiveFolder);
            }

            await this.app.vault.create(fileName, content);
            
            if (this.settings.enableNotifications) {
                new Notice('Daily news generated successfully!', 3000);
            }
            
            return fileName;
            
        } catch (error) {
            console.error('Failed to generate daily news briefing:', error);
            new Notice('Failed to generate news. Check developer console for details.', 5000);
            return null;
        }
    }

    async openOrCreateDailyNews() {
        const date = new Date().toISOString().split('T')[0];
        const filePath = this.normalizePath(`${this.settings.archiveFolder}/Daily News - ${date}.md`);
        
        try {
            const fileExists = await this.app.vault.adapter.exists(filePath);
            
            if (fileExists) {
                this.openNewsFile(filePath);
            } else {
                new Notice('Generating today\'s news briefing...');
                const createdPath = await this.generateDailyNews();
                
                if (createdPath) {
                    setTimeout(() => {
                        this.openNewsFile(createdPath);
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error opening or creating daily news:', error);
            new Notice('Unable to open or create daily news');
        }
    }

    private normalizePath(path: string): string {
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        path = path.replace(/\/+/g, '/');
        return path;
    }

    private openNewsFile(filePath: string) {
        try {
            filePath = this.normalizePath(filePath);
            const file = this.app.vault.getAbstractFileByPath(filePath);
            
            if (file instanceof TFile) {
                this.app.workspace.openLinkText(file.path, '', false)
                    .catch(() => {
                        this.app.workspace.getLeaf(false).openFile(file);
                    });
            } else {
                new Notice(`Unable to find news file at: ${filePath}`);
            }
        } catch (error) {
            new Notice('Error opening news file');
        }
    }
}
