import type { Meta, StoryObj } from '@storybook/react';
import clsx from 'clsx';

type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
};

function Button({ label, variant = 'primary', onClick }: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-lg px-4 py-2 font-medium transition-colors',
        variant === 'primary'
          ? 'bg-primary text-white hover:bg-primary-dark'
          : 'bg-border text-text hover:bg-text-muted/20',
      )}
      onClick={onClick}>
      {label}
    </button>
  );
}

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    label: 'Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Button',
    variant: 'secondary',
  },
};
