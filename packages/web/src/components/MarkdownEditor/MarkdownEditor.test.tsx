import { render, screen } from '@testing-library/react';
import { MarkdownEditor } from './MarkdownEditor';

describe('MarkdownEditor', () => {
  it('renders the editor with role textbox', () => {
    render(<MarkdownEditor placeholder="Type here..." />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders placeholder text via aria-label', () => {
    render(<MarkdownEditor placeholder="Message..." />);

    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('aria-label', 'Message...');
  });

  it('sets contenteditable to false when disabled', () => {
    render(<MarkdownEditor placeholder="Message..." disabled />);

    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contenteditable', 'false');
  });
});
