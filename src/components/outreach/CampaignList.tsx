import { useCampaigns } from '@/hooks/useOutreach'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export function CampaignList() {
  const { campaigns, loading } = useCampaigns()

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>

  if (campaigns.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
        <p className="text-muted-foreground">Create your first campaign to get started</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {campaigns.map(c => {
        const progress = c.total_count > 0 ? (c.sent_count / c.total_count) * 100 : 0
        const openRate = c.sent_count > 0 ? Math.round((c.opened_count / c.sent_count) * 100) : 0
        const statusColor = { draft: 'secondary', approved: 'default', sending: 'default', paused: 'outline', complete: 'secondary' }[c.status] as any

        return (
          <Card key={c.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{c.campaign_name}</h3>
                  <Badge variant={statusColor}>{c.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Created {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {c.status === 'sending' && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{c.sent_count} / {c.total_count}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-5 gap-4">
              <div>
                <div className="text-2xl font-bold">{c.sent_count}</div>
                <div className="text-xs text-muted-foreground">Sent</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{c.opened_count}</div>
                <div className="text-xs text-muted-foreground">Opened</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{c.clicked_count}</div>
                <div className="text-xs text-muted-foreground">Clicked</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{c.replied_count}</div>
                <div className="text-xs text-muted-foreground">Replied</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{openRate}%</div>
                <div className="text-xs text-muted-foreground">Open Rate</div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
