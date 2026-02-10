import { useTranslation } from 'react-i18next';

type FingerprintMessageProps = {
  fingerprint: string;
  previousFingerprint?: string;
};

export function FingerprintMessage({
  fingerprint,
  previousFingerprint,
}: FingerprintMessageProps) {
  const { t } = useTranslation('features', { keyPrefix: 'Hosts' });

  if (previousFingerprint) {
    return (
      <div>
        <p>
          {t('The host key has changed.')}
        </p>
        <p className="mt-2">
          {t('Previous:')}
          <code className="mt-1 block break-all font-mono text-xs">
            {previousFingerprint}
          </code>
        </p>
        <p className="mt-2">
          {t('New:')}
          <code className="mt-1 block break-all font-mono text-xs">
            {fingerprint}
          </code>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>
        {t('Do you want to trust this host?')}
      </p>
      <code className="mt-2 block break-all font-mono text-xs">
        {fingerprint}
      </code>
    </div>
  );
}
