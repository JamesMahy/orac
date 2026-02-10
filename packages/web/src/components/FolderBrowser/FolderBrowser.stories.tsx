import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FolderBrowser } from './FolderBrowser';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta: Meta<typeof FolderBrowser> = {
  title: 'Components/Hosts/FolderBrowser',
  component: FolderBrowser,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  args: {
    visible: true,
    hostId: 'host-1',
    onSelect: () => {},
    onClose: () => {},
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FolderBrowser>;

export const Default: Story = {};

export const WithInitialPath: Story = {
  args: {
    initialPath: '/home/james/Development',
  },
};
