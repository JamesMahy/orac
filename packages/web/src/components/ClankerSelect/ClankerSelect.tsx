import { useRef, useCallback, type ChangeEvent, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { OverlayPanel } from 'primereact/overlaypanel';

type ClankerOption = {
  clankerId: string;
  name: string;
};

type ClankerSelectProps = {
  options: ClankerOption[];
  selectedClankerId: string | null;
  temperatureOverride: string;
  onSelect: (clankerId: string) => void;
  onTemperatureChange: (temperature: string) => void;
};

export function ClankerSelect({
  options,
  selectedClankerId,
  temperatureOverride,
  onSelect,
  onTemperatureChange,
}: ClankerSelectProps) {
  const { t } = useTranslation('features', { keyPrefix: 'WorkspaceChat' });
  const popoverRef = useRef<OverlayPanel>(null);

  const handleClankerChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onSelect(event.target.value);
    },
    [onSelect],
  );

  const handleSliderChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onTemperatureChange(event.target.value);
    },
    [onTemperatureChange],
  );

  const handleTemperatureClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      popoverRef.current?.toggle(event);
    },
    [],
  );

  if (options.length === 0) return null;

  const temperatureDisplay = temperatureOverride || t('Default');

  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor="clanker-select"
          className="text-base text-text-muted">
          {t('Send to')}
        </label>
        <select
          id="clanker-select"
          value={selectedClankerId ?? ''}
          onChange={handleClankerChange}
          className="rounded-md border border-border bg-surface px-2 py-1 text-base text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          {options.map(option => (
            <option key={option.clankerId} value={option.clankerId}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-base text-text-muted">{t('Temperature')}</span>
        <button
          type="button"
          onClick={handleTemperatureClick}
          className="rounded-md border border-border bg-surface px-2 py-1 text-base text-text hover:border-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          {temperatureDisplay}
        </button>

        <OverlayPanel ref={popoverRef}>
          <div className="p-3">
            <div className="flex items-center gap-3">
              <span className="text-base text-text-muted">0</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperatureOverride || '1'}
                onChange={handleSliderChange}
                className="w-32 cursor-pointer accent-primary"
              />
              <span className="text-base text-text-muted">2</span>
            </div>
            <div className="mt-1 text-center text-base font-medium text-text">
              {temperatureOverride || '1.0'}
            </div>
          </div>
        </OverlayPanel>
      </div>
    </div>
  );
}
