import { render, screen } from '@testing-library/react';
import { Projects } from './Projects';
import '../../i18n';

describe('Projects', () => {
  it('renders empty state message', () => {
    render(<Projects />);
    expect(
      screen.getByText('No projects yet. Create a project to get started.'),
    ).toBeInTheDocument();
  });
});
