#!/usr/bin/env npx tsx

/**
 * Test prompts — Interactive testing of LLM prompts via OpenRouter.
 * Usage: OPENROUTER_API_KEY=sk-... npx tsx scripts/test-prompts.ts
 */

import * as readline from 'node:readline';

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error('Set OPENROUTER_API_KEY environment variable');
  process.exit(1);
}

const MODELS = {
  '1': { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 8B' },
  '2': { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 70B' },
  '3': { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet' },
  '4': { id: 'openai/gpt-4o', name: 'GPT-4o' },
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise(r => rl.question(q, r));

async function chatCompletion(model: string, messages: Array<{ role: string; content: string }>) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://dornt.com',
      'X-Title': 'Dornt Prompt Test',
    },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 2048 }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokens: data.usage,
  };
}

async function main() {
  console.log('Dornt Prompt Tester');
  console.log('Models: 1=Llama 8B, 2=Llama 70B, 3=Claude Sonnet, 4=GPT-4o\n');

  const modelChoice = await ask('Select model (1-4): ');
  const model = MODELS[modelChoice as keyof typeof MODELS];
  if (!model) {
    console.error('Invalid choice');
    process.exit(1);
  }
  console.log(`Using ${model.name}\n`);

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: 'You are Dornt, a news intelligence analyst. You provide factual, balanced analysis with clear source attribution.' },
  ];

  while (true) {
    const input = await ask('You: ');
    if (input === 'quit' || input === 'exit') break;

    messages.push({ role: 'user', content: input });

    try {
      const result = await chatCompletion(model.id, messages);
      console.log(`\n${model.name}: ${result.content}`);
      console.log(`[tokens: ${result.tokens?.prompt_tokens || '?'}p/${result.tokens?.completion_tokens || '?'}c]\n`);
      messages.push({ role: 'assistant', content: result.content });
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  }

  rl.close();
}

main().catch(console.error);
