import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { MessageInput } from './MessageInput';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, enabled: false } },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrimeReactProvider>
      <QueryClientProvider client={queryClient}>
        <div className="max-w-2xl border-t border-border">{children}</div>
      </QueryClientProvider>
    </PrimeReactProvider>
  );
}

const clankerOptions = [
  { clankerId: 'cl-1', name: 'Claude' },
  { clankerId: 'cl-2', name: 'GPT-4o' },
];

const meta: Meta<typeof MessageInput> = {
  title: 'Components/MessageInput',
  component: MessageInput,
  decorators: [
    Story => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageInput>;

export const Default: Story = {
  args: {
    workspaceId: 'ws-1',
    clankerOptions,
    selectedClankerId: 'cl-1',
    temperatureOverride: '',
    commands: [],
    isSending: false,
    onClankerChange: () => {},
    onTemperatureChange: () => {},
    onSend: () => Promise.resolve(),
  },
};

export const Sending: Story = {
  args: {
    ...Default.args,
    isSending: true,
  },
};

export const WithTemperature: Story = {
  args: {
    ...Default.args,
    temperatureOverride: '0.7',
  },
};

export const NoClankers: Story = {
  args: {
    ...Default.args,
    clankerOptions: [],
    selectedClankerId: null,
  },
};

export const Interactive: Story = {
  render: () => {
    const [selectedClankerId, setSelectedClankerId] = useState('cl-1');
    const [temperatureOverride, setTemperatureOverride] = useState('');

    return (
      <MessageInput
        workspaceId="ws-1"
        clankerOptions={clankerOptions}
        selectedClankerId={selectedClankerId}
        temperatureOverride={temperatureOverride}
        commands={[]}
        isSending={false}
        onClankerChange={setSelectedClankerId}
        onTemperatureChange={setTemperatureOverride}
        onSend={async content => {
          alert(`Sent: ${content}`);
        }}
      />
    );
  },
};
