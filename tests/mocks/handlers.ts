/**
 * MSW request handlers for API mocking
 */
import { http, HttpResponse } from 'msw';

// Claude/Anthropic API handlers
const claudeHandlers = [
  // Claude Messages API
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json() as any;

    // Check for invalid API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey === 'invalid-key') {
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
    }

    // Check for rate limiting simulation
    if (apiKey === 'rate-limited-key') {
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
    }

    // Successful response with web search results
    return HttpResponse.json({
      id: 'msg_mock123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `### Key Developments

- **Breaking Tech News**: A major technology company announced groundbreaking developments. [Source](https://example.com/tech-news)
- **Industry Update**: Significant changes in the industry landscape. [Source](https://example.com/industry)

### Analysis & Context

This represents significant shifts in the technology sector with implications for various stakeholders.`,
        },
      ],
      model: body.model || 'claude-sonnet-4-5-20250929',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 100,
        output_tokens: 200,
      },
    });
  }),
];

// OpenRouter API handlers
const openRouterHandlers = [
  // OpenRouter Chat Completions API
  http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
    const body = await request.json() as any;

    // Check for invalid API key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader === 'Bearer invalid-key') {
      return HttpResponse.json(
        {
          error: {
            code: 401,
            message: 'Invalid API key',
          },
        },
        { status: 401 }
      );
    }

    // Check for rate limiting simulation
    if (authHeader === 'Bearer rate-limited-key') {
      return HttpResponse.json(
        {
          error: {
            code: 429,
            message: 'Rate limit exceeded',
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': '1700000000',
          },
        }
      );
    }

    // Check for model unavailable simulation
    if (body.model === 'unavailable/model') {
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
    }

    // Successful response
    return HttpResponse.json({
      id: 'gen-mock123',
      object: 'chat.completion',
      created: Date.now(),
      model: body.model || 'anthropic/claude-3.5-sonnet',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: `### Key Developments

- **Latest News**: Important developments in the requested topic. [Source](https://example.com/news1)
- **Breaking Update**: Significant news item with details. [Source](https://example.com/news2)

### Analysis & Context

These developments represent important shifts with broad implications for the field.`,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      },
    });
  }),

  // OpenRouter Models API
  http.get('https://openrouter.ai/api/v1/models', () => {
    return HttpResponse.json({
      data: [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'openai/gpt-4o', name: 'GPT-4o' },
        { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
        { id: 'mistralai/mistral-large', name: 'Mistral Large' },
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
      ],
    });
  }),
];

export const handlers = [
  ...claudeHandlers,
  ...openRouterHandlers,
];
