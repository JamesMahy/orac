import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './TextInput';

const meta: Meta<typeof TextInput> = {
  title: 'Components/TextInput',
  component: TextInput,
  args: {
    id: 'demo',
    label: 'Label',
    placeholder: 'Enter text...',
  },
};

export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { value: 'Hello world' },
};

export const Required: Story = {
  args: { required: true },
};

export const WithError: Story = {
  args: { error: 'This field is required', value: '' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'Cannot edit' },
};

export const Modified: Story = {
  args: { dirty: true, value: 'Changed' },
};
