import type { Meta, StoryObj } from '@storybook/react';
import { FormError } from './FormError';

const meta: Meta<typeof FormError> = {
  title: 'Components/FormError',
  component: FormError,
};

export default meta;
type Story = StoryObj<typeof FormError>;

export const Default: Story = {
  args: { message: 'Something went wrong' },
};

export const LongMessage: Story = {
  args: {
    message:
      'Connection test failed: Unable to reach the server. Please check the hostname and port.',
  },
};

export const NoMessage: Story = {
  args: { message: undefined },
};

export const NullMessage: Story = {
  args: { message: null },
};
