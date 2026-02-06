import { render, screen } from '@testing-library/react';
import Chat from './Chat';
import '../../i18n';

describe('Chat', () => {
  it('renders empty state message', () => {
    render(<Chat />);
    expect(
      screen.getByText('Select a project to start chatting.'),
    ).toBeInTheDocument();
  });
});
