import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import App from './App';
import './i18n';

function renderWithProviders(ui: React.ReactElement, initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
      </PrimeReactProvider>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the sidebar with app title', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('ORAC')).toBeInTheDocument();
  });

  it('renders sidebar navigation links', () => {
    renderWithProviders(<App />);
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Hosts')).toHaveLength(2); // sidebar + header
  });

  it('renders hosts page at /', () => {
    renderWithProviders(<App />);
    expect(
      screen.getByText('No hosts configured. Add a host to get started.'),
    ).toBeInTheDocument();
  });

  it('renders projects page at /projects', () => {
    renderWithProviders(<App />, '/projects');
    expect(
      screen.getByText('No projects yet. Create a project to get started.'),
    ).toBeInTheDocument();
  });

  it('renders chat page at /chat', () => {
    renderWithProviders(<App />, '/chat');
    expect(
      screen.getByText('Select a project to start chatting.'),
    ).toBeInTheDocument();
  });

  it('renders 404 page for unknown routes', () => {
    renderWithProviders(<App />, '/nonexistent');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByText("The page you're looking for doesn't exist."),
    ).toBeInTheDocument();
  });

  it('renders skip link for keyboard accessibility', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });
});
