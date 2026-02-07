import { render, screen } from '@testing-library/react';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('renders with label', () => {
    render(<TextInput id="name" label="Name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<TextInput id="name" label="Name" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<TextInput id="name" label="Name" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('shows dirty indicator', () => {
    render(<TextInput id="name" label="Name" dirty />);
    expect(screen.getByText('(modified)')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<TextInput id="name" label="Name" disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });
});
