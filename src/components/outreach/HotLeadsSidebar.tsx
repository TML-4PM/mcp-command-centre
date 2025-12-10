import { useHotLeads } from '@/hooks/useOutreach'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function HotLeadsSidebar() {
  const { leads, loading } = useHotLeads()

  if (loading) return <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>

  if (leads.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-bold mb-2">🔥 Hot Leads</h3>
        <p className="text-sm text-muted-foreground">No hot leads yet</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="font-bold mb-4">🔥 Hot Leads</h3>
      <div className="space-y-3">
        {leads.map(lead => (
          <div key={lead.id} className="border-b pb-3 last:border-0">
            <div className="flex justify-between items-start mb-1">
              <div className="text-sm font-medium truncate flex-1">{lead.from_email}</div>
              <Badge variant={lead.urgency_score > 7 ? 'destructive' : 'default'} className="text-xs ml-2">
                {lead.urgency_score}/10
              </Badge>
            </div>
            {lead.ai_summary && (
              <p className="text-xs text-muted-foreground line-clamp-2">{lead.ai_summary}</p>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(lead.received_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
