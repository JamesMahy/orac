import {
  type Ref,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
} from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import styles from './MarkdownEditor.module.scss';

export type MarkdownEditorHandle = {
  clear: () => void;
  focus: () => void;
  getMarkdown: () => string;
  getText: () => string;
};

type MarkdownEditorProps = {
  placeholder?: string;
  disabled?: boolean;
  onUpdate?: (markdown: string) => void;
  onKeyDown?: (event: KeyboardEvent) => boolean;
};

function MarkdownEditorComponent(
  { placeholder, disabled, onUpdate, onKeyDown }: MarkdownEditorProps,
  ref: Ref<MarkdownEditorHandle>,
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    editable: !disabled,
    editorProps: {
      attributes: {
        class: styles.editor,
        role: 'textbox',
        'aria-label': placeholder ?? '',
        'aria-multiline': 'true',
      },
      handleKeyDown: (_view, event) => {
        return onKeyDown?.(event) ?? false;
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      // tiptap-markdown stores getMarkdown() on editor.storage.markdown but the type is not exported
      const storage = (updatedEditor.storage as unknown as Record<string, { getMarkdown: () => string }>);
      onUpdate?.(storage.markdown.getMarkdown());
    },
  });

  const handleContainerClick = useCallback(() => {
    editor?.commands.focus();
  }, [editor]);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        editor?.commands.clearContent(true);
      },
      focus: () => {
        editor?.commands.focus();
      },
      getMarkdown: () => {
        // tiptap-markdown stores getMarkdown() on editor.storage.markdown but the type is not exported
        const storage = editor?.storage as unknown as Record<string, { getMarkdown: () => string }> | undefined;
        return storage?.markdown.getMarkdown() ?? '';
      },
      getText: () => {
        return editor?.getText() ?? '';
      },
    }),
    [editor],
  );

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  return (
    <div
      onClick={handleContainerClick}
      className="w-full min-h-10.5 max-h-50 cursor-text overflow-y-auto bg-transparent px-2 py-2 text-base leading-normal text-text">
      <EditorContent editor={editor} />
    </div>
  );
}

export const MarkdownEditor = forwardRef(MarkdownEditorComponent);
