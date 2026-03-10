import { createClient } from '@supabase/supabase-js'

const SIGNAL_FAMILIES = [
  'tabs_content', 'work_delivery', 'finance_maat', 'open_banking',
  'rdti_ip_research', 'calendar_time', 'people_orgs', 'products_pricing', 'systems_config',
]
const CHANNELS = [
  'browser_tab', 'pr', 'email', 'calendar_event', 'task',
  'webhook', 'manual', 'api', 'file', 'message',
]
const SOURCE_SYSTEMS = [
  'chrome_ext', 'snaps_web', 'github', 'xero', 'basiq',
  'manual', 'claude', 'lambda', 'vercel', 'notion',
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token || token !== process.env.BRIDGE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const body = req.body
  const { org_id, signal_family, channel, source_system } = body

  if (!org_id) return res.status(400).json({ error: 'org_id is required' })
  if (!signal_family) return res.status(400).json({ error: 'signal_family is required' })
  if (!channel) return res.status(400).json({ error: 'channel is required' })
  if (!source_system) return res.status(400).json({ error: 'source_system is required' })

  if (!SIGNAL_FAMILIES.includes(signal_family))
    return res.status(400).json({ error: `signal_family must be one of: ${SIGNAL_FAMILIES.join(', ')}` })
  if (!CHANNELS.includes(channel))
    return res.status(400).json({ error: `channel must be one of: ${CHANNELS.join(', ')}` })
  if (!SOURCE_SYSTEMS.includes(source_system))
    return res.status(400).json({ error: `source_system must be one of: ${SOURCE_SYSTEMS.join(', ')}` })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const row = {
    org_id,
    business_id: body.business_id || null,
    signal_family,
    channel,
    source_system,
    topic: body.topic || null,
    topics: body.topics || [],
    summary: body.summary || null,
    actions: body.actions || [],
    tags: body.tags || [],
    importance_score: body.importance_score ?? 0,
    time_window_start: body.time_window_start || new Date().toISOString(),
    time_window_end: body.time_window_end || null,
    primary_url: body.primary_url || null,
    raw_meta: body.raw_meta || {},
  }

  const { data, error } = await supabase
    .from('t4h_insights')
    .insert(row)
    .select('insight_id, org_id, business_id, signal_family, channel, topic, summary, actions, tags, primary_url, created_at')
    .single()

  if (error) {
    console.error('[signal-ingest] supabase error:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(201).json(data)
}
