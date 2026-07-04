/**
 * Rewrite X tweet text for editorial queue (OpenAI optional).
 */

const CAPTION_MAX = 500

export async function rewriteTweetForBot(opts: {
  sourceText: string
  xHandle: string
  persona?: string
}): Promise<string> {
  const raw = String(opts.sourceText || '').trim()
  if (!raw) return ''

  const key = Deno.env.get('OPENAI_API_KEY')?.trim()
  if (key) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: Deno.env.get('OPENAI_CHAT_MODEL') || 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 220,
          messages: [
            {
              role: 'system',
              content:
                `Rewrite the following X post for an EdgeTilt Lounge bot account. ` +
                `Voice: ${opts.persona || 'concise, informed, not spammy'}. ` +
                `Do not copy verbatim. No em dashes. Max ${CAPTION_MAX} chars. ` +
                `Do not impersonate the original author; informational tone only.`,
            },
            {
              role: 'user',
              content: `@${opts.xHandle}: ${raw}`,
            },
          ],
        }),
      })
      if (res.ok) {
        const json = await res.json()
        const text = String(json?.choices?.[0]?.message?.content || '').trim()
        if (text) return text.slice(0, CAPTION_MAX)
      }
    } catch {
      /* fallback below */
    }
  }

  const cleaned = raw.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim()
  const prefix = `@${opts.xHandle.replace(/^@/, '')} pulse: `
  const room = CAPTION_MAX - prefix.length
  const body = cleaned.length <= room ? cleaned : `${cleaned.slice(0, room - 1)}…`
  return `${prefix}${body}`.slice(0, CAPTION_MAX)
}
