/**
 * Contract tests for Claude API
 * Validates that our implementation correctly interfaces with the Anthropic API
 * TDD: These tests are written FIRST and should FAIL until implementation
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Claude API Contract', () => {
    beforeAll(() => {
        server.listen({ onUnhandledRequest: 'error' });
    });

    afterAll(() => {
        server.close();
    });

    beforeEach(() => {
        server.resetHandlers();
    });

    describe('Messages API', () => {
        it('should send correct headers with request', async () => {
            let capturedHeaders: Headers | null = null;

            server.use(
                http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
                    capturedHeaders = request.headers;
                    return HttpResponse.json({
                        id: 'msg_test',
                        type: 'message',
                        role: 'assistant',
                        content: [{ type: 'text', text: 'Test response' }],
                        model: 'claude-sonnet-4-5-20250929',
                        stop_reason: 'end_turn',
                        usage: { input_tokens: 10, output_tokens: 20 },
                    });
                })
            );

            // Import and test the provider
            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new ClaudeAgenticProvider({
                ...DEFAULT_SETTINGS,
                anthropicApiKey: 'test-api-key',
            });

            await provider.fetchAndSummarizeNews('Technology');

            expect(capturedHeaders).not.toBeNull();
            expect(capturedHeaders?.get('x-api-key')).toBe('test-api-key');
            expect(capturedHeaders?.get('anthropic-version')).toBeTruthy();
            expect(capturedHeaders?.get('content-type')).toBe('application/json');
        });

        it('should send correct request body structure', async () => {
            let capturedBody: any = null;

            server.use(
                http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
                    capturedBody = await request.json();
                    return HttpResponse.json({
                        id: 'msg_test',
                        type: 'message',
                        role: 'assistant',
                        content: [{ type: 'text', text: 'Test response' }],
                        model: 'claude-sonnet-4-5-20250929',
                        stop_reason: 'end_turn',
                        usage: { input_tokens: 10, output_tokens: 20 },
                    });
                })
            );

            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new ClaudeAgenticProvider({
                ...DEFAULT_SETTINGS,
                anthropicApiKey: 'test-api-key',
            });

            await provider.fetchAndSummarizeNews('Technology');

            expect(capturedBody).not.toBeNull();
            expect(capturedBody.model).toBeDefined();
            expect(capturedBody.messages).toBeDefined();
            expect(Array.isArray(capturedBody.messages)).toBe(true);
            expect(capturedBody.max_tokens).toBeDefined();
        });

        it('should include web_search tool in request', async () => {
            let capturedBody: any = null;

            server.use(
                http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
                    capturedBody = await request.json();
                    return HttpResponse.json({
                        id: 'msg_test',
                        type: 'message',
                        role: 'assistant',
                        content: [{ type: 'text', text: 'Test response' }],
                        model: 'claude-sonnet-4-5-20250929',
                        stop_reason: 'end_turn',
                        usage: { input_tokens: 10, output_tokens: 20 },
                    });
                })
            );

            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new ClaudeAgenticProvider({
                ...DEFAULT_SETTINGS,
                anthropicApiKey: 'test-api-key',
            });

            await provider.fetchAndSummarizeNews('Technology');

            expect(capturedBody).not.toBeNull();
            expect(capturedBody.tools).toBeDefined();
            expect(Array.isArray(capturedBody.tools)).toBe(true);

            const webSearchTool = capturedBody.tools.find((t: any) =>
                t.type === 'web_search_20250305' || t.name === 'web_search'
            );
            expect(webSearchTool).toBeDefined();
        });

        it('should handle successful response with text content', async () => {
            const expectedContent = '### Key Developments\n\n- Test news item';

            server.use(
                http.post('https://api.anthropic.com/v1/messages', () => {
                    return HttpResponse.json({
                        id: 'msg_test',
                        type: 'message',
                        role: 'assistant',
                        content: [{ type: 'text', text: expectedContent }],
                        model: 'claude-sonnet-4-5-20250929',
                        stop_reason: 'end_turn',
                        usage: { input_tokens: 10, output_tokens: 20 },
                    });
                })
            );

            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new ClaudeAgenticProvider({
                ...DEFAULT_SETTINGS,
                anthropicApiKey: 'test-api-key',
            });

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Key Developments');
        });

        it('should handle 401 authentication error', async () => {
            server.use(
                http.post('https://api.anthropic.com/v1/messages', () => {
                    return HttpResponse.json(
                        {
                            type: 'error',
                            error: {
                                type: 'authentication_error',
                                message: 'Invalid API key provided',
                            },
                        },
                        { status: 401 }
                    );
                })
            );

            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new ClaudeAgenticProvider({
                ...DEFAULT_SETTINGS,
                anthropicApiKey: 'invalid-key',
            });

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
        });

        // Skip: Anthropic SDK has built-in exponential backoff retry for 429 errors
        // which makes this test very slow even with mocks (SDK retries before MSW can respond)
        it.skip('should handle 429 rate limit error', async () => {
            server.use(
                http.post('https://api.anthropic.com/v1/messages', () => {
                    return HttpResponse.json(
                        {
                            type: 'error',
                            error: {
                                type: 'rate_limit_error',
                                message: 'Rate limit exceeded',
                            },
                        },
                        { status: 429 }
                    );
                })
            );

            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new ClaudeAgenticProvider({
                ...DEFAULT_SETTINGS,
                anthropicApiKey: 'test-api-key',
            });

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
        });

        it('should handle network errors gracefully', async () => {
            server.use(
                http.post('https://api.anthropic.com/v1/messages', () => {
                    return HttpResponse.error();
                })
            );

            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');

            const provider = new ClaudeAgenticProvider({
                ...DEFAULT_SETTINGS,
                anthropicApiKey: 'test-api-key',
            });

            const result = await provider.fetchAndSummarizeNews('Technology');

            expect(result).toContain('Error');
        });
    });

    describe('Model Configuration', () => {
        it('should use the correct model name', async () => {
            let capturedModel: string | null = null;

            server.use(
                http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
                    const body = await request.json() as any;
                    capturedModel = body.model;
                    return HttpResponse.json({
                        id: 'msg_test',
                        type: 'message',
                        role: 'assistant',
                        content: [{ type: 'text', text: 'Test' }],
                        model: body.model,
                        stop_reason: 'end_turn',
                        usage: { input_tokens: 10, output_tokens: 20 },
                    });
                })
            );

            const { ClaudeAgenticProvider } = await import('../../src/providers/agentic/claude-agentic-provider');
            const { DEFAULT_SETTINGS } = await import('../../src/types');
            const { CLAUDE_MODEL_NAME } = await import('../../src/constants');

            const provider = new ClaudeAgenticProvider({
                ...DEFAULT_SETTINGS,
                anthropicApiKey: 'test-api-key',
            });

            await provider.fetchAndSummarizeNews('Technology');

            expect(capturedModel).toBe(CLAUDE_MODEL_NAME);
        });
    });
});
