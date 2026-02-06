import { useTranslation } from 'react-i18next';

export default function Hosts() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6">
      <p className="text-text-muted">{t('hosts.empty')}</p>
    </div>
  );
}
