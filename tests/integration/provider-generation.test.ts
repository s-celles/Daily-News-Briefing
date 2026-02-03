/**
 * Integration tests for news provider generation flow
 * Tests the end-to-end flow of news generation for all new providers
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { NewsProviderFactory } from '../../src/providers/news-provider-factory';
import { DEFAULT_SETTINGS, type DailyNewsSettings } from '../../src/types';

describe('Provider News Generation Integration', () => {
    beforeAll(() => {
        server.listen({ onUnhandledRequest: 'error' });
    });

    afterAll(() => {
        server.close();
    });

    beforeEach(() => {
        server.resetHandlers();
    });

    describe('Claude (Agentic Search)', () => {
        it('should create and validate Claude agentic provider', () => {
            const settings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'claude',
                anthropicApiKey: 'test-valid-api-key',
            };

            const provider = NewsProviderFactory.createProvider(settings);
            expect(provider).toBeDefined();
            expect(provider.getProviderName()).toBe('Claude (Agentic Search)');
            expect(provider.validateConfiguration()).toBe(true);
        });

        it('should generate news with Claude agentic provider', async () => {
            const settings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'claude',
                anthropicApiKey: 'test-valid-api-key',
                topics: ['Technology'],
            };

            const provider = NewsProviderFactory.createProvider(settings);
            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should validate provider config correctly', () => {
            const validSettings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'claude',
                anthropicApiKey: 'test-key',
            };

            const invalidSettings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'claude',
                anthropicApiKey: '',
            };

            expect(NewsProviderFactory.validateProviderConfig(validSettings)).toBe(true);
            expect(NewsProviderFactory.validateProviderConfig(invalidSettings)).toBe(false);
        });
    });

    describe('OpenRouter (Agentic Search)', () => {
        it('should create and validate OpenRouter agentic provider', () => {
            const settings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'openrouter',
                openrouterApiKey: 'test-valid-api-key',
                openrouterModel: 'anthropic/claude-3.5-sonnet',
            };

            const provider = NewsProviderFactory.createProvider(settings);
            expect(provider).toBeDefined();
            expect(provider.getProviderName()).toBe('OpenRouter (Agentic Search)');
            expect(provider.validateConfiguration()).toBe(true);
        });

        it('should generate news with OpenRouter agentic provider', async () => {
            const settings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'openrouter',
                openrouterApiKey: 'test-valid-api-key',
                openrouterModel: 'anthropic/claude-3.5-sonnet',
                topics: ['Technology'],
            };

            const provider = NewsProviderFactory.createProvider(settings);
            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should validate provider config correctly', () => {
            const validSettings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'openrouter',
                openrouterApiKey: 'test-key',
            };

            const invalidSettings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'openrouter',
                openrouterApiKey: '',
            };

            expect(NewsProviderFactory.validateProviderConfig(validSettings)).toBe(true);
            expect(NewsProviderFactory.validateProviderConfig(invalidSettings)).toBe(false);
        });
    });

    describe('Google Search + Claude Summarizer', () => {
        it('should create and validate Google + Claude provider', () => {
            const settings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'google-claude',
                googleSearchApiKey: 'test-google-key',
                googleSearchEngineId: 'test-engine-id',
                anthropicApiKey: 'test-anthropic-key',
            };

            const provider = NewsProviderFactory.createProvider(settings);
            expect(provider).toBeDefined();
            expect(provider.getProviderName()).toBe('Google Search + Claude Summarizer');
            expect(provider.validateConfiguration()).toBe(true);
        });

        it('should validate provider config correctly', () => {
            const validSettings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'google-claude',
                googleSearchApiKey: 'test-google-key',
                googleSearchEngineId: 'test-engine-id',
                anthropicApiKey: 'test-anthropic-key',
            };

            const missingGoogle: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'google-claude',
                googleSearchApiKey: '',
                googleSearchEngineId: 'test-engine-id',
                anthropicApiKey: 'test-anthropic-key',
            };

            const missingAnthropic: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'google-claude',
                googleSearchApiKey: 'test-google-key',
                googleSearchEngineId: 'test-engine-id',
                anthropicApiKey: '',
            };

            expect(NewsProviderFactory.validateProviderConfig(validSettings)).toBe(true);
            expect(NewsProviderFactory.validateProviderConfig(missingGoogle)).toBe(false);
            expect(NewsProviderFactory.validateProviderConfig(missingAnthropic)).toBe(false);
        });
    });

    describe('Google Search + OpenRouter Summarizer', () => {
        it('should create and validate Google + OpenRouter provider', () => {
            const settings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'google-openrouter',
                googleSearchApiKey: 'test-google-key',
                googleSearchEngineId: 'test-engine-id',
                openrouterApiKey: 'test-openrouter-key',
                openrouterModel: 'anthropic/claude-3.5-sonnet',
            };

            const provider = NewsProviderFactory.createProvider(settings);
            expect(provider).toBeDefined();
            expect(provider.getProviderName()).toBe('Google Search + OpenRouter Summarizer');
            expect(provider.validateConfiguration()).toBe(true);
        });

        it('should validate provider config correctly', () => {
            const validSettings: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'google-openrouter',
                googleSearchApiKey: 'test-google-key',
                googleSearchEngineId: 'test-engine-id',
                openrouterApiKey: 'test-openrouter-key',
            };

            const missingGoogle: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'google-openrouter',
                googleSearchApiKey: '',
                googleSearchEngineId: 'test-engine-id',
                openrouterApiKey: 'test-openrouter-key',
            };

            const missingOpenRouter: DailyNewsSettings = {
                ...DEFAULT_SETTINGS,
                apiProvider: 'google-openrouter',
                googleSearchApiKey: 'test-google-key',
                googleSearchEngineId: 'test-engine-id',
                openrouterApiKey: '',
            };

            expect(NewsProviderFactory.validateProviderConfig(validSettings)).toBe(true);
            expect(NewsProviderFactory.validateProviderConfig(missingGoogle)).toBe(false);
            expect(NewsProviderFactory.validateProviderConfig(missingOpenRouter)).toBe(false);
        });
    });

    describe('Provider Name Retrieval', () => {
        it('should return correct names for all new providers', () => {
            const providers = [
                { apiProvider: 'claude' as const, expected: 'Claude (Agentic Search)' },
                { apiProvider: 'openrouter' as const, expected: 'OpenRouter (Agentic Search)' },
                { apiProvider: 'google-claude' as const, expected: 'Google Search + Claude Summarizer' },
                { apiProvider: 'google-openrouter' as const, expected: 'Google Search + OpenRouter Summarizer' },
            ];

            for (const { apiProvider, expected } of providers) {
                const settings = { ...DEFAULT_SETTINGS, apiProvider };
                expect(NewsProviderFactory.getProviderName(settings)).toBe(expected);
            }
        });
    });
});
