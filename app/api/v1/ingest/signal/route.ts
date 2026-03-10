import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SIGNAL_FAMILIES = [
  'tabs_content',
  'work_delivery',
  'finance_maat',
  'open_banking',
  'rdti_ip_research',
  'calendar_time',
  'people_orgs',
  'products_pricing',
  'systems_config',
]

const CHANNELS = [
  'browser_tab',
  'pr',
  'email',
  'calendar_event',
  'task',
  'webhook',
  'manual',
  'api',
  'file',
  'message',
]

const SOURCE_SYSTEMS = [
  'chrome_ext',
  'snaps_web',
  'github',
  'xero',
  'basiq',
  'manual',
  'claude',
  'lambda',
  'vercel',
  'notion',
]

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token || token !== process.env.BRIDGE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Required field validation
    const { org_id, signal_family, channel, source_system } = body
    if (!org_id) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    if (!signal_family) return NextResponse.json({ error: 'signal_family is required' }, { status: 400 })
    if (!channel) return NextResponse.json({ error: 'channel is required' }, { status: 400 })
    if (!source_system) return NextResponse.json({ error: 'source_system is required' }, { status: 400 })

    // Enum validation
    if (!SIGNAL_FAMILIES.includes(signal_family)) {
      return NextResponse.json(
        { error: `signal_family must be one of: ${SIGNAL_FAMILIES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!CHANNELS.includes(channel)) {
      return NextResponse.json(
        { error: `channel must be one of: ${CHANNELS.join(', ')}` },
        { status: 400 }
      )
    }
    if (!SOURCE_SYSTEMS.includes(source_system)) {
      return NextResponse.json(
        { error: `source_system must be one of: ${SOURCE_SYSTEMS.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('[signal-ingest] unhandled error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
