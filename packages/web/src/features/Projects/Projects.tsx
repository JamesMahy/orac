import { useTranslation } from 'react-i18next';

export function Projects() {
  const { t } = useTranslation('features', { keyPrefix: 'Projects' });

  return (
    <div className="flex-1 overflow-auto p-6">
      <p className="text-text-muted">{t('No projects yet. Create a project to get started.')}</p>
    </div>
  );
}
