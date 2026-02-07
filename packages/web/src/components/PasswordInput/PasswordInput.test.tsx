import { render, screen } from '@testing-library/react';
import { PrimeReactProvider } from 'primereact/api';
import '../../i18n';
import { PasswordInput } from './PasswordInput';

function renderPasswordInput(props = {}) {
  return render(
    <PrimeReactProvider>
      <PasswordInput id="password" label="Password" {...props} />
    </PrimeReactProvider>,
  );
}

describe('PasswordInput', () => {
  it('renders with label', () => {
    renderPasswordInput();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    renderPasswordInput({ required: true });
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error message', () => {
    renderPasswordInput({ error: 'Required' });
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
