/**
 * Unit tests for ClaudeSummarizer
 * TDD: These tests are written FIRST and should FAIL until implementation
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { server } from '../mocks/server';
import { DEFAULT_SETTINGS, type DailyNewsSettings, type NewsItem } from '../../src/types';

describe('ClaudeSummarizer', () => {
    let settings: DailyNewsSettings;
    let mockNewsItems: NewsItem[];

    beforeAll(() => {
        server.listen({ onUnhandledRequest: 'error' });
    });

    afterAll(() => {
        server.close();
    });

    beforeEach(() => {
        settings = {
            ...DEFAULT_SETTINGS,
            apiProvider: 'google-claude',
            anthropicApiKey: 'test-valid-api-key',
            topics: ['Technology'],
            language: 'en',
            outputFormat: 'detailed',
            enableAnalysisContext: true,
        };

        mockNewsItems = [
            {
                title: 'Test News Article 1',
                link: 'https://example.com/article1',
                snippet: 'This is the first test article about technology developments.',
                publishedTime: '2026-02-03',
                source: 'Example News',
            },
            {
                title: 'Test News Article 2',
                link: 'https://example.com/article2',
                snippet: 'This is the second test article with more information.',
                publishedTime: '2026-02-02',
                source: 'Example Source',
            },
        ];

        server.resetHandlers();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance with settings', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const summarizer = new ClaudeSummarizer(settings);
            expect(summarizer).toBeDefined();
        });
    });

    describe('summarize', () => {
        it('should return "no news found" message when newsItems is empty', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const summarizer = new ClaudeSummarizer(settings);

            const result = await summarizer.summarize([], 'Technology');

            expect(result).toContain('No recent news found');
        });

        it('should successfully summarize news items', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const summarizer = new ClaudeSummarizer(settings);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle missing API key', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const settingsWithoutKey = { ...settings, anthropicApiKey: '' };
            const summarizer = new ClaudeSummarizer(settingsWithoutKey);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toContain('Error');
            expect(result).toContain('API key');
        });

        it('should handle authentication errors gracefully', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const settingsWithInvalidKey = { ...settings, anthropicApiKey: 'invalid-key' };
            const summarizer = new ClaudeSummarizer(settingsWithInvalidKey);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toContain('Error');
        });

        it('should support custom prompts when enabled', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const settingsWithCustomPrompt = {
                ...settings,
                useCustomPrompt: true,
                customPrompt: 'Summarize these news: {{NEWS_TEXT}}',
            };
            const summarizer = new ClaudeSummarizer(settingsWithCustomPrompt);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should support multiple languages', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const settingsInFrench = { ...settings, language: 'fr' };
            const summarizer = new ClaudeSummarizer(settingsInFrench);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should respect outputFormat setting', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const settingsConcise = { ...settings, outputFormat: 'concise' as const };
            const summarizer = new ClaudeSummarizer(settingsConcise);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should handle enableAnalysisContext setting', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const settingsNoAnalysis = { ...settings, enableAnalysisContext: false };
            const summarizer = new ClaudeSummarizer(settingsNoAnalysis);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('interface implementation', () => {
        it('should implement AISummarizer interface', async () => {
            const { ClaudeSummarizer } = await import('../../src/providers/summarizers/claude-summarizer');
            const summarizer = new ClaudeSummarizer(settings);

            // Check that summarize method exists
            expect(typeof summarizer.summarize).toBe('function');
        });
    });
});
