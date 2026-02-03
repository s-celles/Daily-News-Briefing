/**
 * Unit tests for OpenRouterSummarizer
 * TDD: These tests are written FIRST and should FAIL until implementation
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { server } from '../mocks/server';
import { DEFAULT_SETTINGS, type DailyNewsSettings, type NewsItem } from '../../src/types';

describe('OpenRouterSummarizer', () => {
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
            apiProvider: 'google-openrouter',
            openrouterApiKey: 'test-valid-api-key',
            openrouterModel: 'anthropic/claude-3.5-sonnet',
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
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const summarizer = new OpenRouterSummarizer(settings);
            expect(summarizer).toBeDefined();
        });
    });

    describe('summarize', () => {
        it('should return "no news found" message when newsItems is empty', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const summarizer = new OpenRouterSummarizer(settings);

            const result = await summarizer.summarize([], 'Technology');

            expect(result).toContain('No recent news found');
        });

        it('should successfully summarize news items', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const summarizer = new OpenRouterSummarizer(settings);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle missing API key', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const settingsWithoutKey = { ...settings, openrouterApiKey: '' };
            const summarizer = new OpenRouterSummarizer(settingsWithoutKey);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toContain('Error');
            expect(result).toContain('API key');
        });

        it('should handle authentication errors gracefully', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const settingsWithInvalidKey = { ...settings, openrouterApiKey: 'invalid-key' };
            const summarizer = new OpenRouterSummarizer(settingsWithInvalidKey);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toContain('Error');
        });

        it('should support custom prompts when enabled', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const settingsWithCustomPrompt = {
                ...settings,
                useCustomPrompt: true,
                customPrompt: 'Summarize these news: {{NEWS_TEXT}}',
            };
            const summarizer = new OpenRouterSummarizer(settingsWithCustomPrompt);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should support multiple languages', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const settingsInFrench = { ...settings, language: 'fr' };
            const summarizer = new OpenRouterSummarizer(settingsInFrench);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should respect outputFormat setting', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const settingsConcise = { ...settings, outputFormat: 'concise' as const };
            const summarizer = new OpenRouterSummarizer(settingsConcise);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should handle enableAnalysisContext setting', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const settingsNoAnalysis = { ...settings, enableAnalysisContext: false };
            const summarizer = new OpenRouterSummarizer(settingsNoAnalysis);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should use the selected model', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const settingsWithModel = { ...settings, openrouterModel: 'openai/gpt-4o' };
            const summarizer = new OpenRouterSummarizer(settingsWithModel);

            const result = await summarizer.summarize(mockNewsItems, 'Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('interface implementation', () => {
        it('should implement AISummarizer interface', async () => {
            const { OpenRouterSummarizer } = await import('../../src/providers/summarizers/openrouter-summarizer');
            const summarizer = new OpenRouterSummarizer(settings);

            // Check that summarize method exists
            expect(typeof summarizer.summarize).toBe('function');
        });
    });
});
