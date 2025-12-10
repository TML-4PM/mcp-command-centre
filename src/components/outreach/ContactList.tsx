import { useContacts } from '@/hooks/useOutreach'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function ContactList() {
  const { contacts, loading } = useContacts()

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading contacts...</div>

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." className="pl-10" />
      </div>
      
      <Card className="p-6">
        <div className="space-y-3">
          {contacts.slice(0, 100).map(c => (
            <div key={c.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <div className="font-medium">{c.email}</div>
                <div className="text-sm text-muted-foreground">
                  {c.first_name} {c.last_name} {c.company && `• ${c.company}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.bounce_status === 'clean' ? 'secondary' : 'destructive'}>{c.bounce_status}</Badge>
                <div className="text-right">
                  <div className="text-sm font-medium">Score: {c.engagement_score}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
