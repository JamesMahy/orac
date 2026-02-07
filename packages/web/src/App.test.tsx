import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { vi } from 'vitest';
import { useAuthStore } from '@stores/authStore';
import { App } from './App';
import './i18n';

vi.mock('@api/hosts', () => ({
  hostsApi: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

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
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('renders login page when not authenticated', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('ORAC')).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders the sidebar with app title when authenticated', () => {
    useAuthStore.getState().setCredentials('admin', 'password');
    useAuthStore.getState().authenticate();
    renderWithProviders(<App />);
    expect(screen.getByText('ORAC')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument();
  });

  it('renders sidebar navigation links when authenticated', () => {
    useAuthStore.getState().setCredentials('admin', 'password');
    useAuthStore.getState().authenticate();
    renderWithProviders(<App />);
    expect(screen.getAllByText('Hosts')).toHaveLength(2);
  });

  it('renders hosts page at /', async () => {
    useAuthStore.getState().setCredentials('admin', 'password');
    useAuthStore.getState().authenticate();
    renderWithProviders(<App />);
    expect(
      await screen.findByText(
        'No hosts configured. Add a host to get started.',
      ),
    ).toBeInTheDocument();
  });

  it('renders projects page at /projects', () => {
    useAuthStore.getState().setCredentials('admin', 'password');
    useAuthStore.getState().authenticate();
    renderWithProviders(<App />, '/projects');
    expect(
      screen.getByText('No projects yet. Create a project to get started.'),
    ).toBeInTheDocument();
  });

  it('renders chat page at /chat', () => {
    useAuthStore.getState().setCredentials('admin', 'password');
    useAuthStore.getState().authenticate();
    renderWithProviders(<App />, '/chat');
    expect(
      screen.getByText('Select a project to start chatting.'),
    ).toBeInTheDocument();
  });

  it('renders 404 page for unknown routes', () => {
    useAuthStore.getState().setCredentials('admin', 'password');
    useAuthStore.getState().authenticate();
    renderWithProviders(<App />, '/nonexistent');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByText("The page you're looking for doesn't exist."),
    ).toBeInTheDocument();
  });

  it('renders skip link for keyboard accessibility', () => {
    useAuthStore.getState().setCredentials('admin', 'password');
    useAuthStore.getState().authenticate();
    renderWithProviders(<App />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });
});
