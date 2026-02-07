import { render, screen } from '@testing-library/react';
import { PrimeReactProvider } from 'primereact/api';
import { Select } from './Select';

const options = [
  { label: 'SSH', value: 'ssh' },
  { label: 'API', value: 'api' },
];

function renderSelect(props = {}) {
  return render(
    <PrimeReactProvider>
      <Select id="type" label="Type" options={options} {...props} />
    </PrimeReactProvider>,
  );
}

describe('Select', () => {
  it('renders with label', () => {
    renderSelect();
    expect(screen.getByText('Type')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    renderSelect({ required: true });
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error message', () => {
    renderSelect({ error: 'Required' });
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
