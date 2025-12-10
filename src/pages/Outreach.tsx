import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { CampaignList } from '@/components/outreach/CampaignList'
import { TemplateList } from '@/components/outreach/TemplateList'
import { ContactList } from '@/components/outreach/ContactList'
import { CampaignWizard } from '@/components/outreach/CampaignWizard'
import { HotLeadsSidebar } from '@/components/outreach/HotLeadsSidebar'

export default function Outreach() {
  const [showWizard, setShowWizard] = useState(false)
  const [activeTab, setActiveTab] = useState('campaigns')

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outreach Automation</h1>
          <p className="text-muted-foreground mt-1">Manage campaigns, templates, and contacts</p>
        </div>
        <Button onClick={() => setShowWizard(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>
            <TabsContent value="campaigns" className="mt-6"><CampaignList /></TabsContent>
            <TabsContent value="templates" className="mt-6"><TemplateList /></TabsContent>
            <TabsContent value="contacts" className="mt-6"><ContactList /></TabsContent>
          </Tabs>
        </div>
        <div className="lg:col-span-1">
          <HotLeadsSidebar />
        </div>
      </div>

      {showWizard && (
        <CampaignWizard onClose={() => setShowWizard(false)} onComplete={() => { setShowWizard(false); setActiveTab('campaigns') }} />
      )}
    </div>
  )
}
