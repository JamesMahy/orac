import { render, screen } from '@testing-library/react';
import Hosts from './Hosts';
import '../../i18n';

describe('Hosts', () => {
  it('renders empty state message', () => {
    render(<Hosts />);
    expect(
      screen.getByText('No hosts configured. Add a host to get started.'),
    ).toBeInTheDocument();
  });
});
