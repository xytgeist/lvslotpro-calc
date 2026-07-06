/**
 * OpenAI synopsis for wire bot posts (Market Edge + Crypto Edge).
 * Falls back to clipped RSS/Finnhub summary when API unavailable.
 */

import { decodeHtmlEntities } from './decodeHtmlEntities.ts'
import type { NewsProfile } from './loungeBotNewsProfile.ts'

const SYNOPSIS_MAX = 380
const OPENAI_TIMEOUT_MS = 12000

const PERSONA: Record<NewsProfile, string> = {
  market: 'Market Edge financial wire — neutral, fast, third-person factual tone.',
  crypto: 'Crypto Edge wire — neutral, third-person factual tone on digital assets and policy.',
}

function clipFeedSummary(summary: string, maxSentences = 2): string {
  let t = decodeHtmlEntities(String(summary || ''))
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length < 48) return ''
  if (/^(read more|click here|view article)/i.test(t)) return ''

  const parts = t.match(/[^.!?]+[.!?]+(?:\s|$)/g)
  if (parts?.length) {
    return parts
      .slice(0, maxSentences)
      .join(' ')
      .trim()
      .slice(0, SYNOPSIS_MAX)
  }
  return t.slice(0, SYNOPSIS_MAX)
}

export async function generateWireSynopsis(opts: {
  headline: string
  originalTitle?: string
  summary?: string
  sourceLabel: string
  newsProfile?: NewsProfile
}): Promise<string> {
  const headline = String(opts.headline || '').trim()
  const summary = String(opts.summary || '').trim()
  const source = String(opts.sourceLabel || 'Report').trim()
  const profile = opts.newsProfile === 'crypto' ? 'crypto' : 'market'

  const key = Deno.env.get('OPENAI_API_KEY')?.trim()
  if (key && headline) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), OPENAI_TIMEOUT_MS)
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: Deno.env.get('OPENAI_CHAT_MODEL') || 'gpt-4o-mini',
          temperature: 0.35,
          max_tokens: 160,
          messages: [
            {
              role: 'system',
              content:
                `Write exactly 1-2 sentences as a post synopsis under a headline. ` +
                `${PERSONA[profile]} ` +
                `Third person only — never use we, our, us, I, or the publisher's editorial voice. ` +
                `Do not repeat the headline verbatim. No investment advice. No em dashes. ` +
                `Output ONLY the synopsis (no headline, URL, source label, or quotes). ` +
                `Max ${SYNOPSIS_MAX} characters.`,
            },
            {
              role: 'user',
              content:
                `Source: ${source}\n` +
                `Headline: ${headline}\n` +
                (opts.originalTitle && opts.originalTitle !== headline
                  ? `Original headline: ${opts.originalTitle}\n`
                  : '') +
                `Feed excerpt: ${summary || '(none provided)'}`,
            },
          ],
        }),
      })
      clearTimeout(timer)
      if (res.ok) {
        const json = await res.json()
        const text = String(json?.choices?.[0]?.message?.content || '')
          .replace(/^["']|["']$/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        if (text.length >= 40) return text.slice(0, SYNOPSIS_MAX)
      }
    } catch {
      /* fallback */
    }
  }

  return clipFeedSummary(summary)
}
