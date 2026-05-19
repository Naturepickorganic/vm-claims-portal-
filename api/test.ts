export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    anthropic_key: process.env.ANTHROPIC_API_KEY ? '✅ Found' : '❌ Missing',
    gw_url: process.env.GW_BASE_URL ? '✅ Found' : '❌ Missing',
    gw_user: process.env.GW_USERNAME ? '✅ Found' : '❌ Missing',
  })
}
