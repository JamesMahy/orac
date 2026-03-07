import { type RefObject } from 'react';
import { vi } from 'vitest';

export const mockEditorClear = vi.fn();
export const mockEditorFocus = vi.fn();
export const mockEditorGetMarkdown = vi.fn().mockReturnValue('');
export const mockEditorGetText = vi.fn().mockReturnValue('');

export function resetEditorMocks() {
  mockEditorClear.mockClear();
  mockEditorFocus.mockClear();
  mockEditorGetMarkdown.mockReturnValue('');
  mockEditorGetText.mockReturnValue('');
}

export const markdownEditorMock = {
  MarkdownEditor: vi.fn().mockImplementation(
    ({ placeholder, disabled, onUpdate, onKeyDown, ref }: {
      placeholder?: string;
      disabled?: boolean;
      onUpdate?: (markdown: string) => void;
      onKeyDown?: (event: KeyboardEvent) => boolean;
      ref?: RefObject<unknown>;
    }) => {
      if (ref) {
        (ref as RefObject<unknown>).current = {
          clear: mockEditorClear,
          focus: mockEditorFocus,
          getMarkdown: mockEditorGetMarkdown,
          getText: mockEditorGetText,
        };
      }
      return (
        <textarea
          aria-label={placeholder}
          disabled={disabled}
          onChange={event => {
            mockEditorGetMarkdown.mockReturnValue(event.target.value);
            onUpdate?.(event.target.value);
          }}
          onKeyDown={event => {
            const result = onKeyDown?.(event.nativeEvent);
            if (result) event.preventDefault();
          }}
        />
      );
    },
  ),
};
