import { randomBytes, createHash } from 'node:crypto';

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

function base64url(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Generate a PKCE code_verifier + code_challenge pair. */
export function generatePKCE(): PKCEPair {
  const codeVerifier = base64url(randomBytes(64));
  const hash = createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64url(hash);
  return { codeVerifier, codeChallenge };
}

/** Build the OpenRouter authorization URL. */
export function getAuthUrl(callbackUrl: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    callback_url: callbackUrl,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://openrouter.ai/auth?${params.toString()}`;
}

/** Exchange an authorization code for an API key. */
export async function exchangeCodeForKey(code: string, codeVerifier: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      code_challenge_method: 'S256',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter key exchange failed (${response.status}): ${text}`);
  }

  const data = await response.json() as { key: string };
  return data.key;
}

export interface KeyInfo {
  valid: boolean;
  label?: string;
  limit?: number;
  usage?: number;
}

/** Validate an API key against OpenRouter. */
export async function validateKey(apiKey: string): Promise<KeyInfo> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json() as {
      data?: { label?: string; limit?: number; usage?: number };
    };

    return {
      valid: true,
      label: data.data?.label,
      limit: data.data?.limit,
      usage: data.data?.usage,
    };
  } catch {
    return { valid: false };
  }
}
