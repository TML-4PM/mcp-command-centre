import { Button } from '@/components/ui/button'

interface CampaignWizardProps {
  onClose: () => void
  onComplete: () => void
}

export function CampaignWizard({ onClose }: CampaignWizardProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Create Campaign</h2>
        <p className="text-muted-foreground mb-6">Campaign wizard coming soon...</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
