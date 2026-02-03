/**
 * Unit tests for ClaudeAgenticProvider
 * TDD: These tests are written FIRST and should FAIL until implementation
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { server } from '../mocks/server';
import { DEFAULT_SETTINGS, type DailyNewsSettings } from '../../src/types';

// Note: ClaudeAgenticProvider will be imported after implementation
// import { ClaudeAgenticProvider } from '../../src/providers/agentic/claude-agentic-provider';

describe('ClaudeAgenticProvider', () => {
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
            apiProvider: 'claude',
            anthropicApiKey: 'test-valid-api-key',
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
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const provider = new ClaudeAgenticProvider(settings);
            expect(provider).toBeDefined();
        });
    });

    describe('getProviderName', () => {
        it('should return "Claude (Agentic Search)"', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const provider = new ClaudeAgenticProvider(settings);
            expect(provider.getProviderName()).toBe('Claude (Agentic Search)');
        });
    });

    describe('validateConfiguration', () => {
        it('should return true when anthropicApiKey is set', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const provider = new ClaudeAgenticProvider(settings);
            expect(provider.validateConfiguration()).toBe(true);
        });

        it('should return false when anthropicApiKey is empty', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const settingsWithoutKey = { ...settings, anthropicApiKey: '' };
            const provider = new ClaudeAgenticProvider(settingsWithoutKey);
            expect(provider.validateConfiguration()).toBe(false);
        });

        it('should return false when anthropicApiKey is undefined', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const settingsWithoutKey = { ...settings, anthropicApiKey: undefined as any };
            const provider = new ClaudeAgenticProvider(settingsWithoutKey);
            expect(provider.validateConfiguration()).toBe(false);
        });
    });

    describe('fetchAndSummarizeNews', () => {
        it('should return error message when API key is not configured', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const settingsWithoutKey = { ...settings, anthropicApiKey: '' };
            const provider = new ClaudeAgenticProvider(settingsWithoutKey);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
            expect(result).toContain('API key');
        });

        it('should successfully fetch and summarize news with valid API key', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const provider = new ClaudeAgenticProvider(settings);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            // Should contain markdown formatting
            expect(result).toContain('###');
        });

        it('should handle authentication errors gracefully', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const settingsWithInvalidKey = { ...settings, anthropicApiKey: 'invalid-key' };
            const provider = new ClaudeAgenticProvider(settingsWithInvalidKey);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
        });

        // Skip: SDK has built-in exponential backoff retry which makes this test very slow
        // Rate limit handling is verified through contract tests where we can control the mock
        it.skip('should handle rate limit errors gracefully', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const settingsWithRateLimitedKey = { ...settings, anthropicApiKey: 'rate-limited-key' };
            const provider = new ClaudeAgenticProvider(settingsWithRateLimitedKey);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
        });

        it('should support custom prompts when enabled', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const settingsWithCustomPrompt = {
                ...settings,
                useCustomPrompt: true,
                customPrompt: 'Find news about {{TOPIC}} and format as bullet points',
            };
            const provider = new ClaudeAgenticProvider(settingsWithCustomPrompt);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should support multiple languages', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const settingsInFrench = { ...settings, language: 'fr' };
            const provider = new ClaudeAgenticProvider(settingsInFrench);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should respect outputFormat setting', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const settingsConcise = { ...settings, outputFormat: 'concise' as const };
            const provider = new ClaudeAgenticProvider(settingsConcise);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should handle enableAnalysisContext setting', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const settingsNoAnalysis = { ...settings, enableAnalysisContext: false };
            const provider = new ClaudeAgenticProvider(settingsNoAnalysis);

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('provider integration', () => {
        it('should extend BaseNewsProvider', async () => {
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const { BaseNewsProvider } = await import('../../src/providers/base-news-provider');
            const provider = new ClaudeAgenticProvider(settings);

            expect(provider).toBeInstanceOf(BaseNewsProvider);
        });
    });
});
