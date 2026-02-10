import type { Meta, StoryObj } from '@storybook/react';
import { Button } from 'primereact/button';
import { FormModal } from './FormModal';

const meta: Meta<typeof FormModal> = {
  title: 'Components/FormModal',
  component: FormModal,
  args: {
    visible: true,
    header: 'Create Host',
    onClose: () => {},
    onSave: () => {},
    children: (
      <div className="flex flex-col gap-4">
        <p>Form fields go here.</p>
      </div>
    ),
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FormModal>;

export const Default: Story = {};

export const WithUnsavedChanges: Story = {
  args: {
    hasUnsavedChanges: true,
  },
};

export const ExistingHost: Story = {
  args: {
    header: 'Update My Server',
    isExistingHost: true,
    hasUnsavedChanges: true,
    onReset: () => {},
  },
};

export const ExistingHostNoChanges: Story = {
  args: {
    header: 'Update My Server',
    isExistingHost: true,
    hasUnsavedChanges: false,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    errorMessage: 'Host not found',
  },
};

export const Busy: Story = {
  args: {
    isBusy: true,
    hasUnsavedChanges: true,
  },
};

export const CustomSaveLabel: Story = {
  args: {
    saveLabel: 'Save Anyway',
    saveSeverity: 'warning',
    hasUnsavedChanges: true,
  },
};

export const WithExtraActions: Story = {
  args: {
    hasUnsavedChanges: true,
    extraActions: (
      <Button
        label="Test Connection"
        icon="pi pi-wifi"
        severity="info"
        outlined
      />
    ),
  },
};
