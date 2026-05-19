/* api/gwtest.ts — debug Guidewire connectivity */
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

export default async function handler(req: any, res: any) {
  const BASE  = process.env.GW_BASE_URL || 'NOT SET'
  const USER  = process.env.GW_USERNAME || 'NOT SET'
  const PASS  = process.env.GW_PASSWORD || 'NOT SET'
  const auth  = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64')

  const results: any = {
    env: { GW_BASE_URL: BASE, GW_USERNAME: USER, GW_PASSWORD: PASS ? '***set***' : 'NOT SET' }
  }

  /* Test 1: GET /claim/v1/claims?pageSize=1 */
  try {
    const url = `${BASE}/claim/v1/claims?pageSize=1`
    results.test1_url = url
    const r = await fetch(url, { method:'GET', headers:{ Authorization:auth, 'Content-Type':'application/json' } })
    const txt = await r.text()
    results.test1_status = r.status
    results.test1_ok     = r.ok
    try { results.test1_body = JSON.parse(txt) } catch { results.test1_body = txt.slice(0,500) }
  } catch(e:any) {
    results.test1_error = e.message
  }

  /* Test 2: Try the exact Python base URL format */
  try {
    const url2 = `${BASE}/claim/v1/claims`
    results.test2_url = url2
    const r2 = await fetch(url2, { method:'GET', headers:{ Authorization:auth, 'Content-Type':'application/json' } })
    results.test2_status = r2.status
    results.test2_ok = r2.ok
  } catch(e:any) {
    results.test2_error = e.message
  }

  res.status(200).json(results)
}
