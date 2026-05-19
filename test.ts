/* ─────────────────────────────────────────────────────────────
   api/test.ts — Vercel serverless function
   Tests: Anthropic API + Guidewire API connectivity
   Route: GET /api/test
   ───────────────────────────────────────────────────────────── */
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'unknown',
  }

  /* ── Test 1: Anthropic API key present ── */
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
  results.anthropic_key_present = hasAnthropicKey
  results.anthropic_key_prefix  = hasAnthropicKey
    ? process.env.ANTHROPIC_API_KEY!.substring(0, 18) + '...'
    : 'MISSING'

  /* ── Test 2: GW env vars present ── */
  results.gw_base_url_present = !!process.env.GW_BASE_URL
  results.gw_credentials_present = !!(process.env.GW_USERNAME && process.env.GW_PASSWORD)
  results.gw_base_url = process.env.GW_BASE_URL || 'MISSING'

  /* ── Test 3: Ping Anthropic API ── */
  if (hasAnthropicKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':         'application/json',
          'x-api-key':            process.env.ANTHROPIC_API_KEY!,
          'anthropic-version':    '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 30,
          messages: [{ role: 'user', content: 'Reply with exactly: API_OK' }],
        }),
      })
      const data = await response.json() as any
      results.anthropic_api_ping = response.ok ? '✅ Connected' : `❌ ${response.status}`
      results.anthropic_response = data?.content?.[0]?.text || data?.error?.message || 'No response'
    } catch (err: any) {
      results.anthropic_api_ping = `❌ Error: ${err.message}`
    }
  } else {
    results.anthropic_api_ping = '⚠️ Skipped — no API key'
  }

  /* ── Test 4: Ping Guidewire ClaimCenter ── */
  if (process.env.GW_BASE_URL && process.env.GW_USERNAME) {
    try {
      const gwUrl = `${process.env.GW_BASE_URL}/claim/v1/claims?pageSize=1`
      const credentials = Buffer.from(
        `${process.env.GW_USERNAME}:${process.env.GW_PASSWORD}`
      ).toString('base64')

      const response = await fetch(gwUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type':  'application/json',
        },
        // Note: SSL verification disabled equivalent — Node.js fetch doesn't
        // support this natively; install node-fetch or use https agent if needed
      })
      results.gw_api_ping   = response.ok ? '✅ Connected' : `❌ HTTP ${response.status}`
      results.gw_status_code = response.status
    } catch (err: any) {
      results.gw_api_ping = `❌ Error: ${err.message}`
    }
  } else {
    results.gw_api_ping = '⚠️ Skipped — GW env vars missing'
  }

  /* ── Summary ── */
  results.all_systems_ready = (
    hasAnthropicKey &&
    !!process.env.GW_BASE_URL &&
    results.anthropic_api_ping?.startsWith('✅') === true
  )

  return res.status(200).json(results)
}
