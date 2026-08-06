import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminFeatureUnavailable } from '@/features/admin/components/admin-feature-unavailable'

export function UnavailableBatchTaskView() {
  const { t } = useTranslation('admin')
  const navigate = useNavigate()

  return (
    <div className="space-y-4 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/admin/batches')}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('batches.back')}
      </Button>
      <AdminFeatureUnavailable
        title={t('featureAvailability.batchTasksTitle')}
        description={t('featureAvailability.batchTasksDescription')}
      />
    </div>
  )
}
