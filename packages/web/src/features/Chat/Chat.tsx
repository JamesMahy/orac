import { useTranslation } from 'react-i18next';

export function Chat() {
  const { t } = useTranslation('features', { keyPrefix: 'Chat' });

  return (
    <div className="flex-1 overflow-auto p-6">
      <p className="text-text-muted">{t('Select a project to start chatting.')}</p>
    </div>
  );
}
