import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const options = [
  { label: 'SSH', value: 'ssh' },
  { label: 'API', value: 'api' },
];

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  args: {
    id: 'demo',
    label: 'Type',
    options,
    placeholder: 'Select a type...',
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { value: 'ssh' },
};

export const WithError: Story = {
  args: { error: 'Please select a type' },
};

export const Required: Story = {
  args: { required: true },
};
