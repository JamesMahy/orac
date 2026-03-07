import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownContent } from './MarkdownContent';

const meta: Meta<typeof MarkdownContent> = {
  title: 'Components/MarkdownContent',
  component: MarkdownContent,
  decorators: [
    Story => (
      <div className="max-w-xl rounded-2xl bg-border/30 px-4 py-2.5 text-base leading-relaxed text-text">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MarkdownContent>;

export const PlainText: Story = {
  args: {
    content: 'Hello world! This is a plain text message.',
  },
};

export const Bold: Story = {
  args: {
    content: 'This has **bold text** in it.',
  },
};

export const Italic: Story = {
  args: {
    content: 'This has *italic text* in it.',
  },
};

export const InlineCode: Story = {
  args: {
    content: 'Use `console.log()` for debugging.',
  },
};

export const CodeBlock: Story = {
  args: {
    content: '```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n```',
  },
};

export const List: Story = {
  args: {
    content: '- First item\n- Second item\n- Third item',
  },
};

export const OrderedList: Story = {
  args: {
    content: '1. First step\n2. Second step\n3. Third step',
  },
};

export const Blockquote: Story = {
  args: {
    content: '> This is a quote from someone important.',
  },
};

export const Heading: Story = {
  args: {
    content: '## Section Title\n\nSome content below the heading.',
  },
};

export const Link: Story = {
  args: {
    content: 'Check out [this link](https://example.com) for more info.',
  },
};

export const Mixed: Story = {
  args: {
    content: `## Summary

Here's a **quick overview** of the changes:

- Added *markdown* support
- Integrated \`react-markdown\` with syntax highlighting
- Updated the \`MessageBubble\` component

> Note: Old plain-text messages still render correctly.

\`\`\`typescript
const editor = useEditor({
  extensions: [StarterKit, Markdown],
});
\`\`\`

For more details, see the [documentation](https://example.com).`,
  },
};

export const Table: Story = {
  args: {
    content: `| Feature | Status |
|---------|--------|
| Bold | Done |
| Code blocks | Done |
| Tables | Done |`,
  },
};
