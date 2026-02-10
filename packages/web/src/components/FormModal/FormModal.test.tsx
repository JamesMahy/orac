import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimeReactProvider } from 'primereact/api';
import '../../i18n';
import { FormModal } from './FormModal';

const defaultProps = {
  visible: true,
  header: 'Create Host',
  onClose: vi.fn(),
  onSave: vi.fn(),
  children: <p>Form content</p>,
};

function renderFormModal(props = {}) {
  return render(
    <PrimeReactProvider>
      <FormModal {...defaultProps} {...props} />
    </PrimeReactProvider>,
  );
}

describe('FormModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders header and children', () => {
    renderFormModal();
    expect(
      screen.getByRole('dialog', { name: 'Create Host' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('renders nothing when not visible', () => {
    renderFormModal({ visible: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows Close button when no unsaved changes', () => {
    renderFormModal({ hasUnsavedChanges: false });
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('shows Cancel button when there are unsaved changes', () => {
    renderFormModal({ hasUnsavedChanges: true });
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onSave when Save is clicked', async () => {
    const onSave = vi.fn();
    renderFormModal({ onSave, hasUnsavedChanges: true });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('calls onClose when Close is clicked without unsaved changes', async () => {
    const onClose = vi.fn();
    renderFormModal({ onClose, hasUnsavedChanges: false });
    await userEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('prompts confirmation when closing with unsaved changes', async () => {
    const onClose = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderFormModal({ onClose, hasUnsavedChanges: true });
    await userEvent.click(screen.getByText('Cancel'));
    expect(window.confirm).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when unsaved changes confirmation is accepted', async () => {
    const onClose = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderFormModal({ onClose, hasUnsavedChanges: true });
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows loading spinner when isLoading', () => {
    renderFormModal({ isLoading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Form content')).not.toBeInTheDocument();
  });

  it('shows error message and hides children', () => {
    renderFormModal({ errorMessage: 'Host not found' });
    expect(screen.getByRole('alert')).toHaveTextContent('Host not found');
    expect(screen.queryByText('Form content')).not.toBeInTheDocument();
  });

  it('shows Reset Form button for existing host with changes', () => {
    const onReset = vi.fn();
    renderFormModal({
      isExistingHost: true,
      hasUnsavedChanges: true,
      onReset,
    });
    expect(
      screen.getByRole('button', { name: 'Reset Form' }),
    ).toBeInTheDocument();
  });

  it('hides Reset Form button when no unsaved changes', () => {
    renderFormModal({
      isExistingHost: true,
      hasUnsavedChanges: false,
      onReset: vi.fn(),
    });
    expect(
      screen.queryByRole('button', { name: 'Reset Form' }),
    ).not.toBeInTheDocument();
  });

  it('calls onReset when Reset Form is clicked', async () => {
    const onReset = vi.fn();
    renderFormModal({
      isExistingHost: true,
      hasUnsavedChanges: true,
      onReset,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Reset Form' }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('disables Save for existing host without changes', () => {
    renderFormModal({
      isExistingHost: true,
      hasUnsavedChanges: false,
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('disables buttons when busy', () => {
    renderFormModal({
      isBusy: true,
      hasUnsavedChanges: true,
      isExistingHost: true,
      onReset: vi.fn(),
    });
    expect(screen.getByText('Cancel').closest('button')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset Form' })).toBeDisabled();
  });

  it('shows custom save label', () => {
    renderFormModal({ saveLabel: 'Save Anyway' });
    expect(
      screen.getByRole('button', { name: 'Save Anyway' }),
    ).toBeInTheDocument();
  });

  it('shows Saving... label when busy and no custom label', () => {
    renderFormModal({ isBusy: true, hasUnsavedChanges: true });
    expect(
      screen.getByRole('button', { name: 'Saving...' }),
    ).toBeInTheDocument();
  });

  it('renders extra actions', () => {
    renderFormModal({
      extraActions: <button>Test Connection</button>,
    });
    expect(
      screen.getByRole('button', { name: 'Test Connection' }),
    ).toBeInTheDocument();
  });
});
