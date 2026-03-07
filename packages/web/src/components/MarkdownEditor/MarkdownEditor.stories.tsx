import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownEditor, type MarkdownEditorHandle } from './MarkdownEditor';

const meta: Meta<typeof MarkdownEditor> = {
  title: 'Components/MarkdownEditor',
  component: MarkdownEditor,
  decorators: [
    Story => (
      <div className="max-w-2xl rounded-xl border border-border bg-surface p-2">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MarkdownEditor>;

export const Default: Story = {
  args: {
    placeholder: 'Message...',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Message...',
    disabled: true,
  },
};

function InteractiveStory() {
  const editorRef = useRef<MarkdownEditorHandle>(null);

  const handleUpdate = (markdown: string) => {
    console.log('Markdown:', markdown);
  };

  return (
    <div className="space-y-2">
      <MarkdownEditor
        ref={editorRef}
        placeholder="Type **bold**, *italic*, `code`, or ``` for code blocks..."
        onUpdate={handleUpdate}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => alert(editorRef.current?.getMarkdown())}
          className="rounded bg-primary px-2 py-1 text-sm text-white">
          Get Markdown
        </button>
        <button
          type="button"
          onClick={() => editorRef.current?.clear()}
          className="rounded bg-border px-2 py-1 text-sm">
          Clear
        </button>
      </div>
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveStory />,
};
