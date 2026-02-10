import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { vi } from 'vitest';
import { FolderBrowser } from './FolderBrowser';
import '../../i18n';

vi.mock('@api/ssh', () => ({
  sshApi: {
    testConnection: vi.fn(),
    getStatus: vi.fn(),
    browse: vi.fn(),
  },
}));

const { sshApi } = await import('@api/ssh');

const defaultProps = {
  visible: true,
  hostId: 'host-1',
  onSelect: vi.fn(),
  onClose: vi.fn(),
};

const mockBrowseResponse = {
  path: '/home/james',
  parentPath: '/home',
  entries: [
    { name: 'Documents', type: 'directory' as const, size: 0 },
    { name: 'Projects', type: 'directory' as const, size: 0 },
  ],
};

function renderFolderBrowser(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <FolderBrowser {...defaultProps} {...props} />
      </PrimeReactProvider>
    </QueryClientProvider>,
  );
}

describe('FolderBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(sshApi.browse).mockReturnValue(new Promise(() => {}));
    renderFolderBrowser();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders directory listing', async () => {
    vi.mocked(sshApi.browse).mockResolvedValue(mockBrowseResponse);
    renderFolderBrowser();

    expect(await screen.findByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('navigates when clicking a folder', async () => {
    vi.mocked(sshApi.browse).mockResolvedValue(mockBrowseResponse);
    renderFolderBrowser();

    await screen.findByText('Documents');
    await userEvent.click(screen.getByText('Documents'));

    expect(sshApi.browse).toHaveBeenCalledWith(
      'host-1',
      '/home/james/Documents',
    );
  });

  it('navigates to parent when clicking ..', async () => {
    vi.mocked(sshApi.browse).mockResolvedValue(mockBrowseResponse);
    renderFolderBrowser();

    await screen.findByText('..');
    await userEvent.click(screen.getByText('..'));

    expect(sshApi.browse).toHaveBeenCalledWith('host-1', '/home');
  });

  it('renders breadcrumb segments that are clickable', async () => {
    vi.mocked(sshApi.browse).mockResolvedValue(mockBrowseResponse);
    renderFolderBrowser();

    await screen.findByText('Documents');

    const breadcrumb = screen.getByRole('navigation', {
      name: 'Breadcrumb',
    });
    expect(within(breadcrumb).getByText('root')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('home')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('james')).toBeInTheDocument();

    await userEvent.click(within(breadcrumb).getByText('home'));

    expect(sshApi.browse).toHaveBeenCalledWith('host-1', '/home');
  });

  it('calls onSelect with resolved path when Select Folder is clicked', async () => {
    const onSelect = vi.fn();
    vi.mocked(sshApi.browse).mockResolvedValue(mockBrowseResponse);
    renderFolderBrowser({ onSelect });

    await screen.findByText('Documents');
    await userEvent.click(
      screen.getByRole('button', { name: 'Select Folder' }),
    );

    expect(onSelect).toHaveBeenCalledWith('/home/james');
  });

  it('renders error state', async () => {
    vi.mocked(sshApi.browse).mockRejectedValue({
      errors: ['path_not_found'],
    });
    renderFolderBrowser();

    expect(
      await screen.findByText('The specified path does not exist'),
    ).toBeInTheDocument();
  });

  it('shows empty directory message', async () => {
    vi.mocked(sshApi.browse).mockResolvedValue({
      path: '/home/james/empty',
      parentPath: '/home/james',
      entries: [],
    });
    renderFolderBrowser();

    expect(
      await screen.findByText('This directory is empty'),
    ).toBeInTheDocument();
  });

  it('renders nothing when not visible', () => {
    vi.mocked(sshApi.browse).mockResolvedValue(mockBrowseResponse);
    renderFolderBrowser({ visible: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show .. row at root', async () => {
    vi.mocked(sshApi.browse).mockResolvedValue({
      path: '/',
      parentPath: null,
      entries: [{ name: 'bin', type: 'directory', size: 4096 }],
    });
    renderFolderBrowser();

    await screen.findByText('bin');
    expect(screen.queryByText('..')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    vi.mocked(sshApi.browse).mockResolvedValue(mockBrowseResponse);
    renderFolderBrowser({ onClose });

    await screen.findByText('Documents');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('disables Select Folder button while loading', () => {
    vi.mocked(sshApi.browse).mockReturnValue(new Promise(() => {}));
    renderFolderBrowser();

    expect(
      screen.getByRole('button', { name: 'Select Folder' }),
    ).toBeDisabled();
  });

  it('displays current path in a readonly input', async () => {
    vi.mocked(sshApi.browse).mockResolvedValue(mockBrowseResponse);
    renderFolderBrowser();

    await screen.findByText('Documents');
    const pathInput = screen.getByRole('textbox', { name: 'Current path' });
    expect(pathInput).toHaveValue('/home/james');
    expect(pathInput).toHaveAttribute('readonly');
  });
});
