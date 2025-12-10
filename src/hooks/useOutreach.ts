import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Campaign, EmailTemplate, Contact, OutreachResponse, OutreachEmail } from '@/types/outreach'

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
    const subscription = supabase
      .channel('campaigns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outreach_campaigns' }, () => fetchCampaigns())
      .subscribe()
    return () => { subscription.unsubscribe() }
  }, [])

  async function fetchCampaigns() {
    const { data } = await supabase.from('outreach_campaigns').select('*').order('created_at', { ascending: false })
    if (data) setCampaigns(data)
    setLoading(false)
  }

  return { campaigns, loading, refetch: fetchCampaigns }
}

export function useTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    const { data } = await supabase.from('email_templates').select('*').eq('is_active', true).order('conversion_rate', { ascending: false })
    if (data) setTemplates(data)
    setLoading(false)
  }

  return { templates, loading, refetch: fetchTemplates }
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchContacts() }, [])

  async function fetchContacts() {
    const { data } = await supabase.from('contacts').select('*').order('engagement_score', { ascending: false }).limit(1000)
    if (data) setContacts(data)
    setLoading(false)
  }

  return { contacts, loading, refetch: fetchContacts }
}

export function useHotLeads() {
  const [leads, setLeads] = useState<OutreachResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
    const subscription = supabase
      .channel('responses')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'outreach_responses' }, () => fetchLeads())
      .subscribe()
    return () => { subscription.unsubscribe() }
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('outreach_responses').select('*').eq('action_required', true).order('urgency_score', { ascending: false }).limit(10)
    if (data) setLeads(data)
    setLoading(false)
  }

  return { leads, loading, refetch: fetchLeads }
}

export function useCampaignDetails(campaignId: string) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [emails, setEmails] = useState<OutreachEmail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (campaignId) fetchDetails() }, [campaignId])

  async function fetchDetails() {
    const { data: c } = await supabase.from('outreach_campaigns').select('*').eq('id', campaignId).single()
    if (c) setCampaign(c)
    const { data: e } = await supabase.from('outreach_emails').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false })
    if (e) setEmails(e)
    setLoading(false)
  }

  return { campaign, emails, loading, refetch: fetchDetails }
}
