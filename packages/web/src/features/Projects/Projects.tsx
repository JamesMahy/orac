import { useTranslation } from 'react-i18next';

export function Projects() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6">
      <p className="text-text-muted">{t('projects.empty')}</p>
    </div>
  );
}
