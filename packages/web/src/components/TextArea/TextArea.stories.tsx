import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
  title: 'Components/TextArea',
  component: TextArea,
  args: {
    id: 'demo',
    label: 'Label',
    placeholder: 'Enter text...',
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { value: 'Hello world\nLine two' },
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
