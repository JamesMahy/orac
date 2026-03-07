import { memo, type ComponentProps } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';

type MarkdownContentProps = {
  content: string;
};

const components: ComponentProps<typeof Markdown>['components'] = {
  p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:opacity-80">
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-1 list-disc pl-5 first:mt-0 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal pl-5 first:mt-0 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  h1: ({ children }) => (
    <h1 className="my-2 text-xl font-bold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="my-2 text-lg font-bold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="my-1.5 text-base font-bold first:mt-0">{children}</h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-1 border-l-3 border-current/30 pl-3 opacity-80 first:mt-0 last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.startsWith('language-') || className === 'hljs';
    if (isBlock) {
      return (
        <code className={className}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-black/10 px-1 py-0.5 text-[0.9em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-1.5 overflow-x-auto rounded-lg bg-[#0d1117] p-3 text-sm text-[#e6edf3] first:mt-0 last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-1.5 overflow-x-auto first:mt-0 last:mb-0">
      <table className="min-w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-current/20 px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-current/20 px-2 py-1">{children}</td>
  ),
  hr: () => <hr className="my-2 border-current/20" />,
};

function MarkdownContentComponent({ content }: MarkdownContentProps) {
  return (
    <div className="break-words">
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={components}>
        {content}
      </Markdown>
    </div>
  );
}

export const MarkdownContent = memo(MarkdownContentComponent);
