import { render, screen } from '@testing-library/react';
import { MarkdownContent } from './MarkdownContent';

describe('MarkdownContent', () => {
  it('renders plain text as a paragraph', () => {
    render(<MarkdownContent content="Hello world" />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders bold text', () => {
    const { container } = render(<MarkdownContent content="**bold text**" />);

    const strong = container.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong).toHaveTextContent('bold text');
  });

  it('renders italic text', () => {
    const { container } = render(<MarkdownContent content="*italic text*" />);

    const em = container.querySelector('em');
    expect(em).toBeInTheDocument();
    expect(em).toHaveTextContent('italic text');
  });

  it('renders inline code', () => {
    const { container } = render(
      <MarkdownContent content="Use `console.log` here" />,
    );

    const code = container.querySelector('code:not(pre > code)');
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent('console.log');
  });

  it('renders code blocks', () => {
    const { container } = render(
      <MarkdownContent content={'```js\nconst x = 1;\n```'} />,
    );

    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre).toHaveTextContent('const x = 1');
  });

  it('renders unordered lists', () => {
    render(<MarkdownContent content={'- item one\n- item two'} />);

    expect(screen.getByText('item one')).toBeInTheDocument();
    expect(screen.getByText('item two')).toBeInTheDocument();
  });

  it('renders links with target blank', () => {
    render(
      <MarkdownContent content="[click here](https://example.com)" />,
    );

    const link = screen.getByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders blockquotes', () => {
    render(<MarkdownContent content="> quoted text" />);

    const blockquote = screen.getByText('quoted text').closest('blockquote');
    expect(blockquote).toBeInTheDocument();
  });

  it('renders headings', () => {
    render(<MarkdownContent content="## Heading Two" />);

    expect(
      screen.getByRole('heading', { name: 'Heading Two', level: 2 }),
    ).toBeInTheDocument();
  });
});
