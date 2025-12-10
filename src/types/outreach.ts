// Outreach automation type definitions

export interface EmailTemplate {
  id: string
  template_name: string
  category: string
  subject_line: string
  body_template: string
  variables: string[]
  conversion_rate: number
  spam_score: number
  is_active: boolean
  created_at: string
}

export interface Contact {
  id: string
  email: string
  first_name?: string
  last_name?: string
  company?: string
  title?: string
  industry?: string
  linkedin_url?: string
  custom_fields?: Record<string, any>
  email_valid: boolean
  bounce_status: 'clean' | 'soft_bounce' | 'hard_bounce' | 'invalid'
  engagement_score: number
  tags: string[]
  last_contacted_at?: string
  created_at: string
}

export interface Campaign {
  id: string
  campaign_name: string
  template_id: string
  status: 'draft' | 'approved' | 'sending' | 'paused' | 'complete'
  send_type: 'instant' | 'batch' | 'drip'
  scheduled_at?: string
  timezone_aware: boolean
  emails_per_hour: number
  delay_between_emails: number
  track_opens: boolean
  track_clicks: boolean
  total_count: number
  sent_count: number
  opened_count: number
  clicked_count: number
  replied_count: number
  bounced_count: number
  created_at: string
  created_by: string
}

export interface OutreachEmail {
  id: string
  campaign_id: string
  contact_id?: string
  recipient_email: string
  recipient_name?: string
  subject: string
  body_html?: string
  body_text?: string
  scheduled_for?: string
  status: 'pending' | 'sending' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'
  sent_at?: string
  opened_at?: string
  first_click_at?: string
  replied_at?: string
  error_message?: string
  attempt_count: number
  tracking_pixel_id: string
  created_at: string
}

export interface OutreachResponse {
  id: string
  email_id: string
  campaign_id: string
  from_email: string
  subject?: string
  body?: string
  sentiment: 'positive' | 'interested' | 'neutral' | 'negative' | 'auto_reply'
  is_auto_reply: boolean
  is_out_of_office: boolean
  is_unsubscribe: boolean
  action_required: boolean
  urgency_score: number
  ai_summary?: string
  suggested_response?: string
  received_at: string
}
