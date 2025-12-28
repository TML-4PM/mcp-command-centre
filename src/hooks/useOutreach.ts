import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { Campaign, EmailTemplate, Contact, OutreachResponse, OutreachEmail } from '@/types/outreach'

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCampaigns = useCallback(async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setCampaigns((data || []) as Campaign[])
    } catch (err: any) {
      console.error('Failed to fetch campaigns:', err)
      setError(err.message)
      toast({
        title: "Failed to load campaigns",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCampaigns()
    const subscription = supabase
      .channel('campaigns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outreach_campaigns' }, fetchCampaigns)
      .subscribe()
    return () => { subscription.unsubscribe() }
  }, [fetchCampaigns])

  return { campaigns, loading, error, refetch: fetchCampaigns }
}

export function useTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchTemplates = useCallback(async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('conversion_rate', { ascending: false })
      
      if (fetchError) throw fetchError
      setTemplates((data || []) as EmailTemplate[])
    } catch (err: any) {
      console.error('Failed to fetch templates:', err)
      setError(err.message)
      toast({
        title: "Failed to load templates",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  return { templates, loading, error, refetch: fetchTemplates }
}

export function useContacts(limit = 1000) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchContacts = useCallback(async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('engagement_score', { ascending: false })
        .limit(limit)
      
      if (fetchError) throw fetchError
      setContacts((data || []) as Contact[])
    } catch (err: any) {
      console.error('Failed to fetch contacts:', err)
      setError(err.message)
      toast({
        title: "Failed to load contacts",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [limit, toast])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  return { contacts, loading, error, refetch: fetchContacts }
}

export function useHotLeads() {
  const [leads, setLeads] = useState<OutreachResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('outreach_responses')
        .select('*')
        .eq('action_required', true)
        .order('urgency_score', { ascending: false })
        .limit(10)
      
      if (fetchError) throw fetchError
      setLeads((data || []) as OutreachResponse[])
    } catch (err: any) {
      console.error('Failed to fetch leads:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    const subscription = supabase
      .channel('responses')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'outreach_responses' }, fetchLeads)
      .subscribe()
    return () => { subscription.unsubscribe() }
  }, [fetchLeads])

  return { leads, loading, error, refetch: fetchLeads }
}

export function useCampaignDetails(campaignId: string) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [emails, setEmails] = useState<OutreachEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDetails = useCallback(async () => {
    if (!campaignId) return
    
    try {
      setError(null)
      const { data: c, error: campaignError } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
      
      if (campaignError) throw campaignError
      setCampaign(c as Campaign)
      
      const { data: e, error: emailsError } = await supabase
        .from('outreach_emails')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
      
      if (emailsError) throw emailsError
      setEmails((e || []) as OutreachEmail[])
    } catch (err: any) {
      console.error('Failed to fetch campaign details:', err)
      setError(err.message)
      toast({
        title: "Failed to load campaign",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [campaignId, toast])

  useEffect(() => { fetchDetails() }, [fetchDetails])

  return { campaign, emails, loading, error, refetch: fetchDetails }
}
