import { config } from '../config.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

interface CompletionResult {
  content: string;
  model: string;
  tokensUsed: { prompt: number; completion: number };
}

// Simple rate limiter
let lastRequestTime = 0;
const minIntervalMs = 60_000 / config.openrouter.rateLimitRpm;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < minIntervalMs) {
    await new Promise(resolve => setTimeout(resolve, minIntervalMs - elapsed));
  }
  lastRequestTime = Date.now();
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<CompletionResult> {
  const model = options.model || config.openrouter.models.primary;
  const maxRetries = config.openrouter.maxRetries;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await waitForRateLimit();

    try {
      const body: Record<string, unknown> = {
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4096,
      };

      if (options.jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${config.openrouter.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openrouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dornt.com',
          'X-Title': 'Dornt News Intelligence',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429 || response.status >= 500) {
        // Rate limited or server error — retry with backoff
        const delay = config.openrouter.retryDelayMs * Math.pow(2, attempt);
        console.log(`OpenRouter ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const err = await response.text();

        // If primary model fails, try fallback
        if (model === config.openrouter.models.primary && attempt === maxRetries) {
          console.log(`Primary model failed, trying fallback: ${config.openrouter.models.fallback}`);
          return chatCompletion(messages, {
            ...options,
            model: config.openrouter.models.fallback,
          });
        }

        throw new Error(`OpenRouter API error ${response.status}: ${err}`);
      }

      const data = await response.json() as any;
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content || '',
        model: data.model || model,
        tokensUsed: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
        },
      };
    } catch (err) {
      if (attempt === maxRetries) {
        // Last attempt with primary — try fallback
        if (model === config.openrouter.models.primary) {
          console.log(`Primary model error, trying fallback: ${err}`);
          return chatCompletion(messages, {
            ...options,
            model: config.openrouter.models.fallback,
          });
        }
        throw err;
      }

      const delay = config.openrouter.retryDelayMs * Math.pow(2, attempt);
      console.log(`Request error, retrying in ${delay}ms: ${err}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

export async function generateJson<T>(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<{ data: T; tokensUsed: { prompt: number; completion: number } }> {
  const result = await chatCompletion(messages, { ...options, jsonMode: true });
  // Strip markdown fences if the model wraps JSON in ```json ... ```
  let content = result.content.trim();
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  const data = JSON.parse(content) as T;
  return { data, tokensUsed: result.tokensUsed };
}
