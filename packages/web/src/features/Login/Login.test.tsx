import { render, screen } from '@testing-library/react';
import { PrimeReactProvider } from 'primereact/api';
import { Login } from './Login';
import '../../i18n';

function renderLogin() {
  return render(
    <PrimeReactProvider>
      <Login />
    </PrimeReactProvider>,
  );
}

describe('Login', () => {
  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByText('ORAC')).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });
});
