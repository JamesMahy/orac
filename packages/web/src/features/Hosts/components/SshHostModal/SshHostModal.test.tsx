import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { vi } from 'vitest';
import type { Host, TestConnectionResponse } from '@orac/shared';
import { SshHostModal } from './SshHostModal';
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

const mockSshHost: Host = {
  hostId: '1',
  name: 'My SSH Host',
  type: 'ssh',
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
};

const mockSshHostWithFingerprint: Host = {
  ...mockSshHost,
  hostKeyFingerprint: 'SHA256:abc123',
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
        <ConfirmDialog />
        <SshHostModal {...defaultProps} {...props} />
      </PrimeReactProvider>
    </QueryClientProvider>,
  );
}

async function fillSshForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { name?: string; hostname?: string; username?: string } = {},
) {
  const {
    name = 'Test Host',
    hostname = 'example.com',
    username = 'testuser',
  } = overrides;

  const nameInput = screen.getByLabelText(/^Name/);
  const hostnameInput = screen.getByLabelText(/^Hostname/);
  const usernameInput = screen.getByLabelText(/^Username/);

  await user.clear(nameInput);
  await user.type(nameInput, name);
  await user.clear(hostnameInput);
  await user.type(hostnameInput, hostname);
  await user.clear(usernameInput);
  await user.type(usernameInput, username);
}

describe('SshHostModal — auto-test SSH connection on save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  describe('creating a new SSH host', () => {
    it('tests connection and shows fingerprint confirmation when creating SSH host', async () => {
      const user = userEvent.setup();
      const successResponse: TestConnectionResponse = {
        success: true,
        fingerprint: 'SHA256:abc123',
      };
      vi.mocked(sshApi.testConnection).mockResolvedValue(successResponse);
      vi.mocked(hostsApi.create).mockResolvedValue(mockSshHost);

      renderModal();
      await fillSshForm(user);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(sshApi.testConnection).toHaveBeenCalledWith({
          hostname: 'example.com',
          port: undefined,
          username: 'testuser',
          password: undefined,
        });
      });

      // Save should be blocked by fingerprint confirmation dialog
      expect(hostsApi.create).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Yes' }));

      await waitFor(() => {
        expect(hostsApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            hostKeyFingerprint: 'SHA256:abc123',
          }),
        );
      });
    });

    it('shows warning and Save Anyway when connection test fails', async () => {
      const user = userEvent.setup();
      const failureResponse: TestConnectionResponse = {
        success: false,
        message: 'Connection refused',
      };
      vi.mocked(sshApi.testConnection).mockResolvedValue(failureResponse);

      renderModal();
      await fillSshForm(user);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(
          screen.getByText('Connection test failed', { exact: false }),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText('Connection test failed: Connection refused'),
      ).toBeInTheDocument();

      expect(hostsApi.create).not.toHaveBeenCalled();

      expect(
        screen.getByRole('button', { name: 'Save Anyway' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });

    it('saves without testing when Save Anyway is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(sshApi.testConnection).mockResolvedValue({
        success: false,
        message: 'Connection refused',
      });
      vi.mocked(hostsApi.create).mockResolvedValue(mockSshHost);

      renderModal();
      await fillSshForm(user);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Save Anyway' }),
        ).toBeInTheDocument();
      });

      vi.mocked(sshApi.testConnection).mockClear();

      await user.click(screen.getByRole('button', { name: 'Save Anyway' }));

      await waitFor(() => {
        expect(hostsApi.create).toHaveBeenCalled();
      });

      expect(sshApi.testConnection).not.toHaveBeenCalled();
    });

    it('shows warning when connection test throws an error', async () => {
      const user = userEvent.setup();
      vi.mocked(sshApi.testConnection).mockRejectedValue(
        new Error('Network error'),
      );

      renderModal();
      await fillSshForm(user);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(
          screen.getByText('Connection test failed: Network error'),
        ).toBeInTheDocument();
      });

      expect(hostsApi.create).not.toHaveBeenCalled();
    });

    it('clears warning when SSH field is edited after failure', async () => {
      const user = userEvent.setup();
      vi.mocked(sshApi.testConnection).mockResolvedValue({
        success: false,
        message: 'Connection refused',
      });

      renderModal();
      await fillSshForm(user);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(
          screen.getByText('Connection test failed: Connection refused'),
        ).toBeInTheDocument();
      });

      const hostnameInput = screen.getByLabelText(/^Hostname/);
      await user.clear(hostnameInput);
      await user.type(hostnameInput, 'new-host.com');

      await waitFor(() => {
        expect(
          screen.queryByText('Connection test failed: Connection refused'),
        ).not.toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save Anyway' }),
      ).not.toBeInTheDocument();
    });

    it('re-tests connection after editing SSH field and saving again', async () => {
      const user = userEvent.setup();
      vi.mocked(sshApi.testConnection)
        .mockResolvedValueOnce({
          success: false,
          message: 'Connection refused',
        })
        .mockResolvedValueOnce({
          success: true,
          fingerprint: 'SHA256:abc123',
        });
      vi.mocked(hostsApi.create).mockResolvedValue(mockSshHost);

      renderModal();
      await fillSshForm(user);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(
          screen.getByText('Connection test failed: Connection refused'),
        ).toBeInTheDocument();
      });

      const hostnameInput = screen.getByLabelText(/^Hostname/);
      await user.clear(hostnameInput);
      await user.type(hostnameInput, 'fixed-host.com');

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Save' }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(sshApi.testConnection).toHaveBeenCalledTimes(2);
      });

      // Fingerprint confirmation dialog appears for new host
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Yes' }));

      await waitFor(() => {
        expect(hostsApi.create).toHaveBeenCalled();
      });
    });

    it('does not save when fingerprint is rejected', async () => {
      const user = userEvent.setup();
      vi.mocked(sshApi.testConnection).mockResolvedValue({
        success: true,
        fingerprint: 'SHA256:abc123',
      });

      renderModal();
      await fillSshForm(user);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'No' }));

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: 'No' }),
        ).not.toBeInTheDocument();
      });

      expect(hostsApi.create).not.toHaveBeenCalled();

      // Save button should still be available
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('editing an existing SSH host', () => {
    it('skips connection test when only name is changed', async () => {
      const user = userEvent.setup();
      vi.mocked(hostsApi.getById).mockResolvedValue(mockSshHost);
      vi.mocked(hostsApi.update).mockResolvedValue({
        ...mockSshHost,
        name: 'Renamed Host',
      });

      renderModal({ existingHostId: '1' });

      await waitFor(() => {
        expect(screen.getByLabelText(/^Name/)).toHaveValue('My SSH Host');
      });

      const nameInput = screen.getByLabelText(/^Name/);
      await user.clear(nameInput);
      await user.type(nameInput, 'Renamed Host');

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(hostsApi.update).toHaveBeenCalled();
      });

      expect(sshApi.testConnection).not.toHaveBeenCalled();
    });

    it('tests connection and shows fingerprint confirmation when hostname is changed', async () => {
      const user = userEvent.setup();
      vi.mocked(hostsApi.getById).mockResolvedValue(mockSshHost);
      vi.mocked(sshApi.testConnection).mockResolvedValue({
        success: true,
        fingerprint: 'SHA256:xyz789',
      });
      vi.mocked(hostsApi.update).mockResolvedValue({
        ...mockSshHost,
        hostname: 'new-host.com',
        hostKeyFingerprint: 'SHA256:xyz789',
      });

      renderModal({ existingHostId: '1' });

      await waitFor(() => {
        expect(screen.getByLabelText(/^Hostname/)).toHaveValue('192.168.1.1');
      });

      const hostnameInput = screen.getByLabelText(/^Hostname/);
      await user.clear(hostnameInput);
      await user.type(hostnameInput, 'new-host.com');

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(sshApi.testConnection).toHaveBeenCalled();
      });

      // Fingerprint confirmation dialog (no stored fingerprint)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Yes' }));

      await waitFor(() => {
        expect(hostsApi.update).toHaveBeenCalled();
      });
    });

    it('saves silently when fingerprint matches stored', async () => {
      const user = userEvent.setup();
      vi.mocked(hostsApi.getById).mockResolvedValue(mockSshHostWithFingerprint);
      vi.mocked(sshApi.testConnection).mockResolvedValue({
        success: true,
        fingerprint: 'SHA256:abc123',
      });
      vi.mocked(hostsApi.update).mockResolvedValue({
        ...mockSshHostWithFingerprint,
        username: 'newuser',
      });

      renderModal({ existingHostId: '1' });

      await waitFor(() => {
        expect(screen.getByLabelText(/^Username/)).toHaveValue('root');
      });

      const usernameInput = screen.getByLabelText(/^Username/);
      await user.clear(usernameInput);
      await user.type(usernameInput, 'newuser');

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(sshApi.testConnection).toHaveBeenCalled();
      });

      // No fingerprint confirmation — matches stored
      await waitFor(() => {
        expect(hostsApi.update).toHaveBeenCalled();
      });

      expect(
        screen.queryByRole('button', { name: 'Accept & Save' }),
      ).not.toBeInTheDocument();
    });

    it('shows warning when fingerprint has changed', async () => {
      const user = userEvent.setup();
      vi.mocked(hostsApi.getById).mockResolvedValue(mockSshHostWithFingerprint);
      vi.mocked(sshApi.testConnection).mockResolvedValue({
        success: true,
        fingerprint: 'SHA256:newkey999',
      });
      vi.mocked(hostsApi.update).mockResolvedValue({
        ...mockSshHostWithFingerprint,
        hostname: 'new-host.com',
        hostKeyFingerprint: 'SHA256:newkey999',
      });

      renderModal({ existingHostId: '1' });

      await waitFor(() => {
        expect(screen.getByLabelText(/^Hostname/)).toHaveValue('192.168.1.1');
      });

      const hostnameInput = screen.getByLabelText(/^Hostname/);
      await user.clear(hostnameInput);
      await user.type(hostnameInput, 'new-host.com');

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(sshApi.testConnection).toHaveBeenCalled();
      });

      // Should show confirm dialog for changed fingerprint
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Yes' }));

      await waitFor(() => {
        expect(hostsApi.update).toHaveBeenCalled();
      });
    });

    it('tests connection when username is changed on existing host', async () => {
      const user = userEvent.setup();
      vi.mocked(hostsApi.getById).mockResolvedValue(mockSshHost);
      vi.mocked(sshApi.testConnection).mockResolvedValue({
        success: true,
        fingerprint: 'SHA256:xyz789',
      });
      vi.mocked(hostsApi.update).mockResolvedValue({
        ...mockSshHost,
        username: 'newuser',
      });

      renderModal({ existingHostId: '1' });

      await waitFor(() => {
        expect(screen.getByLabelText('Username', { exact: false })).toHaveValue(
          'root',
        );
      });

      const usernameInput = screen.getByLabelText(/^Username/);
      await user.clear(usernameInput);
      await user.type(usernameInput, 'newuser');

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(sshApi.testConnection).toHaveBeenCalled();
      });

      // Accept fingerprint to complete save
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Yes' }));

      await waitFor(() => {
        expect(hostsApi.update).toHaveBeenCalled();
      });
    });
  });

  describe('button states', () => {
    it('disables Save button when no changes on existing host', async () => {
      vi.mocked(hostsApi.getById).mockResolvedValue(mockSshHost);

      renderModal({ existingHostId: '1' });

      await waitFor(() => {
        expect(screen.getByLabelText(/^Name/)).toHaveValue('My SSH Host');
      });

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });
  });

  describe('fingerprint accepted on test is not re-asked on save', () => {
    it('saves without re-prompting when fingerprint was accepted during manual test', async () => {
      const user = userEvent.setup();
      vi.mocked(sshApi.testConnection).mockResolvedValue({
        success: true,
        fingerprint: 'SHA256:abc123',
      });
      vi.mocked(hostsApi.create).mockResolvedValue(mockSshHost);

      renderModal();
      await fillSshForm(user);

      // Manual test connection
      await user.click(screen.getByRole('button', { name: 'Test Connection' }));

      // Accept fingerprint in confirmation dialog
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: 'Yes' }));

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: 'Yes' }),
        ).not.toBeInTheDocument();
      });

      // Now save — fingerprint already accepted, no dialog should appear
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(hostsApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            hostKeyFingerprint: 'SHA256:abc123',
          }),
        );
      });
    });
  });
});
