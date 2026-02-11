import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { vi } from 'vitest';
import { Projects } from './Projects';
import '../../i18n';

vi.mock('@api/projects', () => ({
  projectsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@stores/projectModalStore', () => ({
  useProjectModalStore: vi.fn(() => ({
    visible: false,
    editingProjectId: null,
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    close: vi.fn(),
  })),
}));

const { projectsApi } = await import('@api/projects');

function renderProjects() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <Projects />
      </PrimeReactProvider>
    </QueryClientProvider>,
  );
}

const mockProjects = [
  {
    id: '1',
    name: 'Bearly Fit',
    description: 'Fitness tracking application',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'ORAC',
    description: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

describe('Projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project list when data loads', async () => {
    vi.mocked(projectsApi.getAll).mockResolvedValue(mockProjects);
    renderProjects();

    expect(await screen.findByText('Bearly Fit')).toBeInTheDocument();
    expect(screen.getByText('ORAC')).toBeInTheDocument();
  });

  it('renders empty state when no projects', async () => {
    vi.mocked(projectsApi.getAll).mockResolvedValue([]);
    renderProjects();

    expect(
      await screen.findByText(
        'No projects yet. Create a project to get started.',
      ),
    ).toBeInTheDocument();
  });

  it('renders Add Project button', async () => {
    vi.mocked(projectsApi.getAll).mockResolvedValue([]);
    renderProjects();

    expect(
      await screen.findByRole('button', { name: 'Add Project' }),
    ).toBeInTheDocument();
  });

  it('renders description for projects that have one', async () => {
    vi.mocked(projectsApi.getAll).mockResolvedValue(mockProjects);
    renderProjects();

    expect(
      await screen.findByText('Fitness tracking application'),
    ).toBeInTheDocument();
  });

  it('renders edit and delete buttons for each project', async () => {
    vi.mocked(projectsApi.getAll).mockResolvedValue(mockProjects);
    renderProjects();

    await screen.findByText('Bearly Fit');

    expect(
      screen.getByRole('button', { name: 'Edit Bearly Fit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete Bearly Fit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit ORAC' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete ORAC' }),
    ).toBeInTheDocument();
  });
});
