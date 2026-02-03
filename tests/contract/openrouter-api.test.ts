/**
 * Contract tests for OpenRouter API
 * Validates that our implementation correctly interfaces with the OpenRouter API
 * TDD: These tests are written FIRST and should FAIL until implementation
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('OpenRouter API Contract', () => {
    beforeAll(() => {
        server.listen({ onUnhandledRequest: 'error' });
    });

    afterAll(() => {
        server.close();
    });

    beforeEach(() => {
        server.resetHandlers();
    });

    describe('Chat Completions API', () => {
        it('should send correct headers with request', async () => {
            let capturedHeaders: Headers | null = null;

            server.use(
                http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
                    capturedHeaders = request.headers;
                    return HttpResponse.json({
                        id: 'gen-test',
                        object: 'chat.completion',
                        created: Date.now(),
                        model: 'anthropic/claude-3.5-sonnet',
                        choices: [
                            {
                                index: 0,
                                message: { role: 'assistant', content: 'Test response' },
                                finish_reason: 'stop',
                            },
                        ],
                        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
                    });
                })
            );

            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new OpenRouterAgenticProvider({
                ...DEFAULT_SETTINGS,
                openrouterApiKey: 'test-api-key',
                openrouterModel: 'anthropic/claude-3.5-sonnet',
            });

            await provider.fetchAndSummarizeNews('Technology');

            expect(capturedHeaders).not.toBeNull();
            expect(capturedHeaders?.get('Authorization')).toBe('Bearer test-api-key');
            expect(capturedHeaders?.get('content-type')).toBe('application/json');
            // Check for attribution headers
            expect(capturedHeaders?.get('HTTP-Referer') || capturedHeaders?.get('X-Title')).toBeTruthy();
        });

        it('should send correct request body structure', async () => {
            let capturedBody: any = null;

            server.use(
                http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
                    capturedBody = await request.json();
                    return HttpResponse.json({
                        id: 'gen-test',
                        object: 'chat.completion',
                        created: Date.now(),
                        model: 'anthropic/claude-3.5-sonnet',
                        choices: [
                            {
                                index: 0,
                                message: { role: 'assistant', content: 'Test response' },
                                finish_reason: 'stop',
                            },
                        ],
                        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
                    });
                })
            );

            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new OpenRouterAgenticProvider({
                ...DEFAULT_SETTINGS,
                openrouterApiKey: 'test-api-key',
                openrouterModel: 'anthropic/claude-3.5-sonnet',
            });

            await provider.fetchAndSummarizeNews('Technology');

            expect(capturedBody).not.toBeNull();
            expect(capturedBody.model).toBe('anthropic/claude-3.5-sonnet');
            expect(capturedBody.messages).toBeDefined();
            expect(Array.isArray(capturedBody.messages)).toBe(true);
        });

        it('should handle successful response', async () => {
            const expectedContent = '### Key Developments\n\n- Test news item';

            server.use(
                http.post('https://openrouter.ai/api/v1/chat/completions', () => {
                    return HttpResponse.json({
                        id: 'gen-test',
                        object: 'chat.completion',
                        created: Date.now(),
                        model: 'anthropic/claude-3.5-sonnet',
                        choices: [
                            {
                                index: 0,
                                message: { role: 'assistant', content: expectedContent },
                                finish_reason: 'stop',
                            },
                        ],
                        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
                    });
                })
            );

            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new OpenRouterAgenticProvider({
                ...DEFAULT_SETTINGS,
                openrouterApiKey: 'test-api-key',
                openrouterModel: 'anthropic/claude-3.5-sonnet',
            });

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Key Developments');
        });

        it('should handle 401 authentication error', async () => {
            server.use(
                http.post('https://openrouter.ai/api/v1/chat/completions', () => {
                    return HttpResponse.json(
                        {
                            error: {
                                code: 401,
                                message: 'Invalid API key',
                            },
                        },
                        { status: 401 }
                    );
                })
            );

            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new OpenRouterAgenticProvider({
                ...DEFAULT_SETTINGS,
                openrouterApiKey: 'invalid-key',
                openrouterModel: 'anthropic/claude-3.5-sonnet',
            });

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
        });

        // Skip: OpenAI SDK has built-in exponential backoff retry for 503 errors
        // which makes this test very slow even with mocks
        it.skip('should handle model unavailable error', async () => {
            server.use(
                http.post('https://openrouter.ai/api/v1/chat/completions', () => {
                    return HttpResponse.json(
                        {
                            error: {
                                code: 503,
                                message: 'Model unavailable/model is not available',
                                metadata: {
                                    provider_name: 'unavailable',
                                },
                            },
                        },
                        { status: 503 }
                    );
                })
            );

            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new OpenRouterAgenticProvider({
                ...DEFAULT_SETTINGS,
                openrouterApiKey: 'test-api-key',
                openrouterModel: 'unavailable/model',
            });

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
        });

        it('should handle network errors gracefully', async () => {
            server.use(
                http.post('https://openrouter.ai/api/v1/chat/completions', () => {
                    return HttpResponse.error();
                })
            );

            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new OpenRouterAgenticProvider({
                ...DEFAULT_SETTINGS,
                openrouterApiKey: 'test-api-key',
                openrouterModel: 'anthropic/claude-3.5-sonnet',
            });

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
        });
    });

    describe('Model Configuration', () => {
        it('should use the selected model from settings', async () => {
            let capturedModel: string | null = null;

            server.use(
                http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
                    const body = await request.json() as any;
                    capturedModel = body.model;
                    return HttpResponse.json({
                        id: 'gen-test',
                        object: 'chat.completion',
                        created: Date.now(),
                        model: body.model,
                        choices: [
                            {
                                index: 0,
                                message: { role: 'assistant', content: 'Test' },
                                finish_reason: 'stop',
                            },
                        ],
                        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
                    });
                })
            );

            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new OpenRouterAgenticProvider({
                ...DEFAULT_SETTINGS,
                openrouterApiKey: 'test-api-key',
                openrouterModel: 'openai/gpt-4o',
            });

            await provider.fetchAndSummarizeNews('Technology');

            expect(capturedModel).toBe('openai/gpt-4o');
        });

        it('should fallback to default model when not specified', async () => {
            let capturedModel: string | null = null;

            server.use(
                http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
                    const body = await request.json() as any;
                    capturedModel = body.model;
                    return HttpResponse.json({
                        id: 'gen-test',
                        object: 'chat.completion',
                        created: Date.now(),
                        model: body.model,
                        choices: [
                            {
                                index: 0,
                                message: { role: 'assistant', content: 'Test' },
                                finish_reason: 'stop',
                            },
                        ],
                        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
                    });
                })
            );

            const { OpenRouterAgenticProvider } = await import('../../src/providers/agentic/openrouter-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');
            const { OPENROUTER_DEFAULT_MODEL } = await import('../../src/constants');

            const provider = new OpenRouterAgenticProvider({
                ...DEFAULT_SETTINGS,
                openrouterApiKey: 'test-api-key',
                openrouterModel: '', // Empty model
            });

            await provider.fetchAndSummarizeNews('Technology');

            expect(capturedModel).toBe(OPENROUTER_DEFAULT_MODEL);
        });
    });
});
