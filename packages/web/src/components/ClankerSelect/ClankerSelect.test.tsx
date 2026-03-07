import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimeReactProvider } from 'primereact/api';
import { vi } from 'vitest';
import { ClankerSelect } from './ClankerSelect';
import '../../i18n';

const options = [
  { clankerId: 'cl-1', name: 'Claude' },
  { clankerId: 'cl-2', name: 'GPT' },
];

function renderSelect(
  overrides: Partial<Parameters<typeof ClankerSelect>[0]> = {},
) {
  const defaultProps = {
    options,
    selectedClankerId: 'cl-1',
    temperatureOverride: '',
    onSelect: vi.fn(),
    onTemperatureChange: vi.fn(),
    ...overrides,
  };
  return {
    ...render(
      <PrimeReactProvider>
        <ClankerSelect {...defaultProps} />
      </PrimeReactProvider>,
    ),
    onSelect: defaultProps.onSelect,
    onTemperatureChange: defaultProps.onTemperatureChange,
  };
}

describe('ClankerSelect', () => {
  it('renders nothing when options are empty', () => {
    const { container } = renderSelect({ options: [] });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the clanker dropdown with options', () => {
    renderSelect();

    const select = screen.getByLabelText('Send to');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('GPT')).toBeInTheDocument();
  });

  it('calls onSelect when clanker is changed', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSelect();

    await user.selectOptions(screen.getByLabelText('Send to'), 'cl-2');

    expect(onSelect).toHaveBeenCalledWith('cl-2');
  });

  it('shows "Default" when temperatureOverride is empty', () => {
    renderSelect({ temperatureOverride: '' });

    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('shows the temperature value when override is set', () => {
    renderSelect({ temperatureOverride: '0.7' });

    expect(screen.getByText('0.7')).toBeInTheDocument();
  });

  it('renders the temperature toggle button', () => {
    renderSelect({ temperatureOverride: '0.5' });

    const button = screen.getByText('0.5');
    expect(button.tagName).toBe('BUTTON');
  });
});
