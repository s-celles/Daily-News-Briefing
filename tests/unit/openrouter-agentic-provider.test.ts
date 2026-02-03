/**
 * Unit tests for OpenRouterAgenticProvider
 * TDD: These tests are written FIRST and should FAIL until implementation
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { server } from '../mocks/server';
import { DEFAULT_SETTINGS, type DailyNewsSettings } from '../../src/types';

describe('OpenRouterAgenticProvider', () => {
    let settings: DailyNewsSettings;

    beforeAll(() => {
        server.listen({ onUnhandledRequest: 'error' });
    });

    afterAll(() => {
        server.close();
    });

    beforeEach(() => {
        settings = {
            ...DEFAULT_SETTINGS,
            apiProvider: 'openrouter',
            openrouterApiKey: 'test-valid-api-key',
            openrouterModel: 'anthropic/claude-3.5-sonnet',
            topics: ['Technology'],
            language: 'en',
            outputFormat: 'detailed',
            enableAnalysisContext: true,
        };
        server.resetHandlers();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance with settings', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const provider = new OpenRouterAgenticProvider(settings);
            expect(provider).toBeDefined();
        });
    });

    describe('getProviderName', () => {
        it('should return "OpenRouter (Agentic Search)"', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const provider = new OpenRouterAgenticProvider(settings);
            expect(provider.getProviderName()).toBe('OpenRouter (Agentic Search)');
        });
    });

    describe('validateConfiguration', () => {
        it('should return true when openrouterApiKey is set', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const provider = new OpenRouterAgenticProvider(settings);
            expect(provider.validateConfiguration()).toBe(true);
        });

        it('should return false when openrouterApiKey is empty', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const settingsWithoutKey = { ...settings, openrouterApiKey: '' };
            const provider = new OpenRouterAgenticProvider(settingsWithoutKey);
            expect(provider.validateConfiguration()).toBe(false);
        });

        it('should return false when openrouterApiKey is undefined', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const settingsWithoutKey = { ...settings, openrouterApiKey: undefined as any };
            const provider = new OpenRouterAgenticProvider(settingsWithoutKey);
            expect(provider.validateConfiguration()).toBe(false);
        });
    });

    describe('fetchAndSummarizeNews', () => {
        it('should return error message when API key is not configured', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const settingsWithoutKey = { ...settings, openrouterApiKey: '' };
            const provider = new OpenRouterAgenticProvider(settingsWithoutKey);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
            expect(result).toContain('API key');
        });

        it('should successfully fetch and summarize news with valid API key', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const provider = new OpenRouterAgenticProvider(settings);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            // Should contain markdown formatting
            expect(result).toContain('###');
        });

        it('should handle authentication errors gracefully', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const settingsWithInvalidKey = { ...settings, openrouterApiKey: 'invalid-key' };
            const provider = new OpenRouterAgenticProvider(settingsWithInvalidKey);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
        });

        it('should support custom prompts when enabled', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const settingsWithCustomPrompt = {
                ...settings,
                useCustomPrompt: true,
                customPrompt: 'Find news about {{TOPIC}} and format as bullet points',
            };
            const provider = new OpenRouterAgenticProvider(settingsWithCustomPrompt);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should support multiple languages', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const settingsInFrench = { ...settings, language: 'fr' };
            const provider = new OpenRouterAgenticProvider(settingsInFrench);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should respect outputFormat setting', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const settingsConcise = { ...settings, outputFormat: 'concise' as const };
            const provider = new OpenRouterAgenticProvider(settingsConcise);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should handle enableAnalysisContext setting', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const settingsNoAnalysis = { ...settings, enableAnalysisContext: false };
            const provider = new OpenRouterAgenticProvider(settingsNoAnalysis);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should use the selected model', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const settingsWithModel = { ...settings, openrouterModel: 'openai/gpt-4o' };
            const provider = new OpenRouterAgenticProvider(settingsWithModel);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('provider integration', () => {
        it('should extend BaseNewsProvider', async () => {
            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const { BaseNewsProvider } = await import('../../src/providers/base-news-provider');
            const provider = new OpenRouterAgenticProvider(settings);

            expect(provider).toBeInstanceOf(BaseNewsProvider);
        });
    });
});
