import { render, screen } from '@testing-library/react';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('renders with label', () => {
    render(<TextArea id="description" label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<TextArea id="description" label="Description" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(
      <TextArea id="description" label="Description" error="Too long" />,
    );
    expect(screen.getByText('Too long')).toBeInTheDocument();
  });

  it('shows dirty indicator', () => {
    render(<TextArea id="description" label="Description" dirty />);
    expect(screen.getByText('(modified)')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<TextArea id="description" label="Description" disabled />);
    expect(screen.getByLabelText('Description')).toBeDisabled();
  });
});
