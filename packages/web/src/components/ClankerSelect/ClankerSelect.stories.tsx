import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ClankerSelect } from './ClankerSelect';

const options = [
  { clankerId: 'cl-1', name: 'Claude' },
  { clankerId: 'cl-2', name: 'GPT-4o' },
  { clankerId: 'cl-3', name: 'Gemini' },
];

const meta: Meta<typeof ClankerSelect> = {
  title: 'Components/ClankerSelect',
  component: ClankerSelect,
};

export default meta;
type Story = StoryObj<typeof ClankerSelect>;

export const Default: Story = {
  args: {
    options,
    selectedClankerId: 'cl-1',
    temperatureOverride: '',
  },
};

export const WithTemperature: Story = {
  args: {
    options,
    selectedClankerId: 'cl-1',
    temperatureOverride: '0.7',
  },
};

export const SingleOption: Story = {
  args: {
    options: [{ clankerId: 'cl-1', name: 'Claude' }],
    selectedClankerId: 'cl-1',
    temperatureOverride: '',
  },
};

export const NoOptions: Story = {
  args: {
    options: [],
    selectedClankerId: null,
    temperatureOverride: '',
  },
};

function InteractiveStory() {
  const [selectedClankerId, setSelectedClankerId] = useState('cl-1');
  const [temperatureOverride, setTemperatureOverride] = useState('');

  return (
    <ClankerSelect
      options={options}
      selectedClankerId={selectedClankerId}
      temperatureOverride={temperatureOverride}
      onSelect={setSelectedClankerId}
      onTemperatureChange={setTemperatureOverride}
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveStory />,
};
