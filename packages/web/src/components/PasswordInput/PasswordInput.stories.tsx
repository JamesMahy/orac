import type { Meta, StoryObj } from '@storybook/react';
import { PasswordInput } from './PasswordInput';

const meta: Meta<typeof PasswordInput> = {
  title: 'Components/PasswordInput',
  component: PasswordInput,
  args: {
    id: 'demo',
    label: 'Password',
    placeholder: 'Enter password...',
  },
};

export default meta;
type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const WithError: Story = {
  args: { error: 'Password is required' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'secret' },
};
