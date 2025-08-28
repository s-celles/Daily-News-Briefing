import { App, TFile, Notice } from 'obsidian';
import type { DailyNewsSettings, TopicStatus } from './types';
import { LANGUAGE_TRANSLATIONS } from './constants';

export class FileUtils {
    static normalizePath(path: string): string {
        // Ensure path doesn't start with a slash
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        
        // Replace any double slashes with single slashes
        path = path.replace(/\/+/g, '/');
        
        return path;
    }

    static async openNewsFile(app: App, filePath: string) {
        try {
            // Normalize the path for consistent handling
            filePath = FileUtils.normalizePath(filePath);
            
            // Try to get the file from the vault
            const file = app.vault.getAbstractFileByPath(filePath);
            
            if (file instanceof TFile) {
                // Try to open the file using workspace API
                app.workspace.openLinkText(file.path, '', false)
                    .then(() => {
                        new Notice('Opened today\'s news briefing');
                    })
                    .catch(error => {
                        // Fallback: Try to actively focus the leaf after opening
                        app.workspace.getLeaf(false).openFile(file)
                            .then(() => {
                                new Notice('Opened today\'s news briefing (fallback method)');
                            })
                            .catch(e => {
                                new Notice('Unable to open news file. Try opening it manually.');
                            });
                    });
            } else {
                new Notice(`Unable to find news file. Please check path: ${filePath}`);
            }
        } catch (error) {
            new Notice('Error opening news file');
        }
    }
}

export class ValidationUtils {
    // This class can be extended with other validation methods in the future
    // API validation is now handled by the NewsProviderFactory
}

export class LanguageUtils {
    static getTranslation(key: string, language: string): string {
        // Get the language-specific translations or default to English
        const translations = LANGUAGE_TRANSLATIONS[language] || LANGUAGE_TRANSLATIONS['en'];
        
        // Return the translation for the key or the key itself if no translation exists
        return translations[key] || LANGUAGE_TRANSLATIONS['en'][key] || key;
    }
}

export class ContentUtils {
    static buildTableOfContents(topics: string[]): string {
        let content = '';
        topics.forEach(topic => {
            content += `- [${topic}](#${topic.toLowerCase().replace(/\s+/g, '%20')})\n`;
        });
        return content;
    }

    static buildProcessingStatus(topicStatuses: TopicStatus[], language: string): string {
        let content = '\n---\n\n';
        content += `## ${LanguageUtils.getTranslation('processingStatus', language)}\n\n`;
        content += 'Some topics encountered issues during processing:\n\n';
        
        for (const status of topicStatuses) {
            if (status.error) {
                const stage = !status.retrievalSuccess ? 'News Retrieval' : 'News Summarization';
                content += `- **${status.topic}**: Issue during ${stage} - ${status.error}\n`;
            }
        }
        return content;
    }

    static analyzeTopicResults(topicStatuses: TopicStatus[]): {
        atLeastOneSuccessfulTopic: boolean;
        atLeastOneNewsItem: boolean;
        allTopicsFailed: boolean;
        errorSummary: string;
    } {
        const atLeastOneSuccessfulTopic = topicStatuses.some(status => 
            status.retrievalSuccess && status.summarizationSuccess);
            
        const atLeastOneNewsItem = topicStatuses.some(status => status.newsCount > 0);
        
        const allTopicsFailed = topicStatuses.every(status => 
            !status.retrievalSuccess || !status.summarizationSuccess);
            
        // Generate error analysis for logging
        const errorSummary = topicStatuses
            .filter(status => status.error)
            .map(status => `${status.topic}: ${status.error}`)
            .join('\n');
        
        return {
            atLeastOneSuccessfulTopic,
            atLeastOneNewsItem,
            allTopicsFailed,
            errorSummary
        };
    }
}