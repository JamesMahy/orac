import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import App from './App';
import './i18n';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </PrimeReactProvider>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the app title', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('ORAC')).toBeInTheDocument();
  });
});
