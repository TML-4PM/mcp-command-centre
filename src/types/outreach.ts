// Outreach automation type definitions
// These types align with database schema

export interface EmailTemplate {
  id: string
  template_name: string
  category: string
  subject_line: string
  body_template: string
  variables: string[] | null
  conversion_rate: number
  spam_score: number
  is_active: boolean
  created_at: string
}

export interface Contact {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  title?: string | null
  industry?: string | null
  linkedin_url?: string | null
  custom_fields?: Record<string, any> | null
  email_valid: boolean
  bounce_status: string
  engagement_score: number
  tags: string[]
  last_contacted_at?: string | null
  created_at: string
}

export interface Campaign {
  id: string
  campaign_name: string
  template_id: string | null
  status: string
  send_type: string
  scheduled_at?: string | null
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
  contact_id?: string | null
  recipient_email: string
  recipient_name?: string | null
  subject: string
  body_html?: string | null
  body_text?: string | null
  scheduled_for?: string | null
  status: string
  sent_at?: string | null
  opened_at?: string | null
  first_click_at?: string | null
  replied_at?: string | null
  error_message?: string | null
  attempt_count: number
  tracking_pixel_id: string
  created_at: string
}

export interface OutreachResponse {
  id: string
  email_id: string
  campaign_id: string
  from_email: string
  subject?: string | null
  body?: string | null
  sentiment: string
  is_auto_reply: boolean
  is_out_of_office: boolean
  is_unsubscribe: boolean
  action_required: boolean
  urgency_score: number
  ai_summary?: string | null
  suggested_response?: string | null
  received_at: string
}
