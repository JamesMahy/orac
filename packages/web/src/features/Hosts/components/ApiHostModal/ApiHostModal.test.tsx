import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { vi } from 'vitest';
import type { Host } from '@orac/shared';
import { ApiHostModal } from './ApiHostModal';
import '../../../../i18n';

vi.mock('@api/hosts', () => ({
  hostsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@api/ssh', () => ({
  sshApi: {
    testConnection: vi.fn(),
    getStatus: vi.fn(),
  },
}));

const { hostsApi } = await import('@api/hosts');
const { sshApi } = await import('@api/ssh');

const mockApiHost: Host = {
  hostId: '2',
  name: 'My API Host',
  type: 'api',
  hostname: null,
  port: null,
  username: null,
  hostKeyFingerprint: null,
  endpoint: 'https://api.example.com/v1',
  provider: 'openai',
  model: 'gpt-4',
  hasPassword: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const defaultProps = {
  visible: true,
  onClose: vi.fn(),
  onComplete: vi.fn(),
};

function renderModal(
  props: Partial<typeof defaultProps & { existingHostId: string }> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <ApiHostModal {...defaultProps} {...props} />
      </PrimeReactProvider>
    </QueryClientProvider>,
  );
}

describe('ApiHostModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('does not test connection when editing an API host', async () => {
    const user = userEvent.setup();
    vi.mocked(hostsApi.getById).mockResolvedValue(mockApiHost);
    vi.mocked(hostsApi.update).mockResolvedValue({
      ...mockApiHost,
      name: 'Renamed API Host',
    });

    renderModal({ existingHostId: '2' });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Name/)).toHaveValue('My API Host');
    });

    const nameInput = screen.getByLabelText(/^Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed API Host');

    const apiKeyInput = screen.getByLabelText(/^API Key/);
    await user.type(apiKeyInput, 'sk-test-123');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(hostsApi.update).toHaveBeenCalled();
    });

    expect(sshApi.testConnection).not.toHaveBeenCalled();
  });

  it('creates a new API host without connection testing', async () => {
    const user = userEvent.setup();
    vi.mocked(hostsApi.create).mockResolvedValue(mockApiHost);

    renderModal();

    await user.type(screen.getByLabelText(/^Name/), 'New API Host');
    await user.type(
      screen.getByLabelText(/^Endpoint/),
      'https://api.example.com/v1',
    );
    await user.type(screen.getByLabelText(/^API Key/), 'sk-test-123');
    await user.type(screen.getByLabelText(/^Provider/), 'openai');
    await user.type(screen.getByLabelText(/^Model/), 'gpt-4');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(hostsApi.create).toHaveBeenCalled();
    });

    expect(sshApi.testConnection).not.toHaveBeenCalled();
  });

  it('disables Save button when no changes on existing host', async () => {
    vi.mocked(hostsApi.getById).mockResolvedValue(mockApiHost);

    renderModal({ existingHostId: '2' });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Name/)).toHaveValue('My API Host');
    });

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
