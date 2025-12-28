import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTemplates, useContacts } from '@/hooks/useOutreach'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { X, ChevronRight, ChevronLeft, Upload, Mail, MessageSquare, Phone, Mic } from 'lucide-react'
import Papa from 'papaparse'

type ChannelType = 'email' | 'sms' | 'voice' | 'call'

interface CampaignWizardProps {
  onClose: () => void
  onComplete: () => void
}

export function CampaignWizard({ onClose, onComplete }: CampaignWizardProps) {
  const [step, setStep] = useState(1)
  const { templates } = useTemplates()
  const { refetch: refetchContacts } = useContacts()
  const { toast } = useToast()
  
  // Form state
  const [channelType, setChannelType] = useState<ChannelType>('email')
  const [campaignName, setCampaignName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [contacts, setContacts] = useState<any[]>([])
  const [sendType, setSendType] = useState<'instant' | 'batch'>('instant')
  const [delayMinutes, setDelayMinutes] = useState(2)
  
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)

  const channelOptions = [
    { id: 'email' as ChannelType, label: 'Email', icon: Mail, description: 'Send personalized emails' },
    { id: 'sms' as ChannelType, label: 'SMS', icon: MessageSquare, description: 'Text message campaigns' },
    { id: 'voice' as ChannelType, label: 'Voice Broadcast', icon: Mic, description: 'AI-generated voice messages' },
    { id: 'call' as ChannelType, label: 'Cold Calling', icon: Phone, description: 'AI agent phone calls' },
  ]

  // Step 1: Select Channel & Template
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Channel</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how to reach your contacts
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {channelOptions.map(channel => {
          const Icon = channel.icon
          return (
            <Card 
              key={channel.id}
              className={`p-4 cursor-pointer transition-all ${
                channelType === channel.id 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setChannelType(channel.id)}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">{channel.label}</div>
                  <div className="text-xs text-muted-foreground">{channel.description}</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="pt-4 border-t">
        <h3 className="text-lg font-semibold mb-2">Select Template</h3>
        <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates available. Create one first.</p>
          ) : (
            templates.map(template => (
              <Card key={template.id} className="p-4 cursor-pointer hover:border-primary">
                <label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value={template.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{template.template_name}</h4>
                      <span className="text-sm text-green-600 font-medium">
                        {template.conversion_rate}% conversion
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.subject_line}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.body_template}
                    </p>
                  </div>
                </label>
              </Card>
            ))
          )}
        </RadioGroup>
      </div>

      {selectedTemplate && (
        <div className="pt-4 border-t">
          <Label>Campaign Name</Label>
          <Input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g., Q1 2025 Outreach"
            className="mt-2"
          />
        </div>
      )}
    </div>
  )

  // Step 2: Customize Message
  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Customize Message</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Edit the {channelType === 'email' ? 'subject and body' : 'message content'} (optional)
        </p>
      </div>

      {channelType === 'email' && (
        <div>
          <Label>Subject Line</Label>
          <Input
            value={customSubject || selectedTemplateData?.subject_line || ''}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Subject line"
            className="mt-2"
          />
        </div>
      )}

      <div>
        <Label>{channelType === 'email' ? 'Email Body' : 'Message Content'}</Label>
        <Textarea
          value={customBody || selectedTemplateData?.body_template || ''}
          onChange={(e) => setCustomBody(e.target.value)}
          placeholder={channelType === 'sms' ? 'SMS message (max 160 chars)' : 'Message content'}
          rows={channelType === 'sms' ? 4 : 12}
          className="mt-2 font-mono text-sm"
          maxLength={channelType === 'sms' ? 160 : undefined}
        />
        {channelType === 'sms' && (
          <p className="text-xs text-muted-foreground mt-1">
            {(customBody || selectedTemplateData?.body_template || '').length}/160 characters
          </p>
        )}
        {selectedTemplateData?.variables && (
          <p className="text-xs text-muted-foreground mt-2">
            Available variables: {selectedTemplateData.variables.join(', ')}
          </p>
        )}
      </div>
    </div>
  )

  // Step 3: Add Contacts
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setContacts(results.data)
        setUploading(false)
        toast({
          title: "Contacts loaded",
          description: `${results.data.length} contacts ready for campaign.`
        })
      },
      error: (err) => {
        setUploading(false)
        toast({
          title: "CSV parsing failed",
          description: err.message || "Please check your file format.",
          variant: "destructive"
        })
      }
    })
  }

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Add Contacts</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a CSV file with {channelType === 'email' ? 'email' : 'phone'}, first_name, last_name, company
        </p>
      </div>

      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <Label htmlFor="csv-upload" className="cursor-pointer">
          <div className="text-sm font-medium mb-2">
            {uploading ? 'Uploading...' : 'Click to upload CSV'}
          </div>
          <div className="text-xs text-muted-foreground">
            Required columns: {channelType === 'email' ? 'email' : 'phone'}, first_name, last_name, company
          </div>
        </Label>
        <Input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="hidden"
        />
      </div>

      {contacts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {contacts.length} contacts ready
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContacts([])}
            >
              Clear
            </Button>
          </div>
          <Card className="p-4 max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {contacts.slice(0, 10).map((contact, i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span>{contact.email || contact.phone}</span>
                  <span className="text-muted-foreground">
                    {contact.first_name} {contact.last_name}
                  </span>
                </div>
              ))}
              {contacts.length > 10 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  + {contacts.length - 10} more
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )

  // Step 4: Configure & Send
  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure & Send</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how to send your campaign
        </p>
      </div>

      <RadioGroup value={sendType} onValueChange={(v) => setSendType(v as any)}>
        <Card className="p-4 cursor-pointer hover:border-primary">
          <label className="flex items-start gap-3 cursor-pointer">
            <RadioGroupItem value="instant" className="mt-1" />
            <div>
              <div className="font-semibold mb-1">Send Immediately</div>
              <div className="text-sm text-muted-foreground">
                Start sending now with {delayMinutes} minute delay between messages
              </div>
            </div>
          </label>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary">
          <label className="flex items-start gap-3 cursor-pointer">
            <RadioGroupItem value="batch" className="mt-1" />
            <div>
              <div className="font-semibold mb-1">Batch Send</div>
              <div className="text-sm text-muted-foreground">
                Send in controlled batches over time
              </div>
            </div>
          </label>
        </Card>
      </RadioGroup>

      <div>
        <Label>Delay Between Messages (minutes)</Label>
        <Input
          type="number"
          value={delayMinutes}
          onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 1)}
          min={1}
          max={60}
          className="mt-2"
        />
      </div>

      <Card className="p-4 bg-muted">
        <h4 className="font-semibold mb-2">Campaign Summary</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Channel:</span>
            <span className="font-medium capitalize">{channelType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campaign:</span>
            <span className="font-medium">{campaignName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Template:</span>
            <span className="font-medium">{selectedTemplateData?.template_name || 'Custom'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recipients:</span>
            <span className="font-medium">{contacts.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Send type:</span>
            <span className="font-medium capitalize">{sendType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delay:</span>
            <span className="font-medium">{delayMinutes} min</span>
          </div>
        </div>
      </Card>
    </div>
  )

  const handleCreate = async () => {
    setCreating(true)

    try {
      // 1. Insert contacts to database
      const contactRecords = contacts.map(c => ({
        email: c.email || '',
        first_name: c.first_name || '',
        last_name: c.last_name || '',
        company: c.company || ''
      }))

      const { error: contactError } = await supabase
        .from('contacts')
        .upsert(contactRecords, { onConflict: 'email' })

      if (contactError) throw contactError

      // 2. Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('outreach_campaigns')
        .insert({
          campaign_name: campaignName,
          template_id: selectedTemplate || null,
          status: 'approved',
          send_type: sendType,
          delay_between_emails: delayMinutes * 60,
          total_count: contacts.length,
          track_opens: true,
          track_clicks: true
        })
        .select()
        .single()

      if (campaignError) throw campaignError
      if (!campaign) throw new Error('Failed to create campaign')

      // 3. Create email/message records
      const subject = customSubject || selectedTemplateData?.subject_line || ''
      const body = customBody || selectedTemplateData?.body_template || ''

      const emailRecords = contacts.map(contact => ({
        campaign_id: campaign.id,
        recipient_email: contact.email,
        recipient_name: `${contact.first_name} ${contact.last_name}`.trim(),
        subject,
        body_text: body,
        status: 'pending',
        tracking_pixel_id: crypto.randomUUID().split('-')[0]
      }))

      const { error: emailsError } = await supabase
        .from('outreach_emails')
        .insert(emailRecords)

      if (emailsError) throw emailsError

      // 4. Refresh contacts list
      await refetchContacts()

      toast({
        title: "Campaign created",
        description: `${campaignName} with ${contacts.length} recipients is ready.`
      })

      onComplete()
      
    } catch (error: any) {
      console.error('Campaign creation error:', error)
      toast({
        title: "Failed to create campaign",
        description: error.message || "Please check the console for details.",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return selectedTemplate && campaignName
    if (step === 2) return true
    if (step === 3) return contacts.length > 0
    if (step === 4) return true
    return false
  }

  const getChannelIcon = () => {
    const channel = channelOptions.find(c => c.id === channelType)
    const Icon = channel?.icon || Mail
    return <Icon className="mr-2 h-4 w-4" />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Create Campaign</h2>
            <p className="text-sm text-muted-foreground">Step {step} of 4</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={creating || !canProceed()}
            >
              {getChannelIcon()}
              {creating ? 'Creating...' : 'Create & Send'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
