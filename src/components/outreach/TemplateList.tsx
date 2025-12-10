import { useTemplates } from '@/hooks/useOutreach'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'

export function TemplateList() {
  const { templates, loading } = useTemplates()

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading templates...</div>

  return (
    <div className="space-y-4">
      {templates.map(t => (
        <Card key={t.id} className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{t.template_name}</h3>
              <p className="text-sm font-medium text-muted-foreground mb-2">{t.subject_line}</p>
              <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap line-clamp-3">{t.body_template}</p>
              <div className="flex gap-2">
                <Badge>{t.category}</Badge>
                {t.variables.map(v => <Badge key={v} variant="outline">{v}</Badge>)}
              </div>
            </div>
            <div className="ml-6 text-right">
              <div className="text-2xl font-bold text-green-600 mb-1">{t.conversion_rate}%</div>
              <div className="text-xs text-muted-foreground mb-3">conversion</div>
              <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Edit</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
