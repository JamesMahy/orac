import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { vi } from 'vitest';
import { Hosts } from './Hosts';
import '../../i18n';

vi.mock('@api/hosts', () => ({
  hostsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const { hostsApi } = await import('@api/hosts');

function renderHosts() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <Hosts />
      </PrimeReactProvider>
    </QueryClientProvider>,
  );
}

const mockHosts = [
  {
    id: '1',
    name: 'My SSH Host',
    type: 'ssh' as const,
    hostname: '192.168.1.1',
    port: 22,
    username: 'root',
    hostKeyFingerprint: null,
    endpoint: null,
    provider: null,
    model: null,
    hasPassword: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'My API Host',
    type: 'api' as const,
    hostname: null,
    port: null,
    username: null,
    hostKeyFingerprint: null,
    endpoint: 'https://api.openai.com/v1',
    provider: 'openai',
    model: 'gpt-4',
    hasPassword: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

describe('Hosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders host list when data loads', async () => {
    vi.mocked(hostsApi.getAll).mockResolvedValue(mockHosts);
    renderHosts();

    expect(await screen.findByText('My SSH Host')).toBeInTheDocument();
    expect(screen.getByText('My API Host')).toBeInTheDocument();
  });

  it('renders empty state when no hosts', async () => {
    vi.mocked(hostsApi.getAll).mockResolvedValue([]);
    renderHosts();

    expect(
      await screen.findByText(
        'No hosts configured. Add a host to get started.',
      ),
    ).toBeInTheDocument();
  });

  it('renders Add SSH Host button', async () => {
    vi.mocked(hostsApi.getAll).mockResolvedValue([]);
    renderHosts();

    expect(
      await screen.findByRole('button', { name: 'Add SSH Host' }),
    ).toBeInTheDocument();
  });

  it('renders Add API Host button', async () => {
    vi.mocked(hostsApi.getAll).mockResolvedValue([]);
    renderHosts();

    expect(
      await screen.findByRole('button', { name: 'Add API Host' }),
    ).toBeInTheDocument();
  });

  it('renders type badges', async () => {
    vi.mocked(hostsApi.getAll).mockResolvedValue(mockHosts);
    renderHosts();

    expect(await screen.findByText('SSH')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
  });

  it('renders host targets', async () => {
    vi.mocked(hostsApi.getAll).mockResolvedValue(mockHosts);
    renderHosts();

    expect(await screen.findByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('https://api.openai.com/v1')).toBeInTheDocument();
  });
});
