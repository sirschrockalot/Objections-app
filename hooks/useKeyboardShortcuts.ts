import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onNextObjection?: () => void;
  onRevealResponses?: () => void;
  onAddResponse?: () => void;
  onNewSession?: () => void;
  onCloseModal?: () => void;
  onToggleHelp?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]')
      ) {
        return;
      }

      // Space: Get next objection
      if (event.key === ' ' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        shortcuts.onNextObjection?.();
        return;
      }

      // R: Reveal responses
      if (event.key === 'r' || event.key === 'R') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          shortcuts.onRevealResponses?.();
          return;
        }
      }

      // A: Add response
      if (event.key === 'a' || event.key === 'A') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          shortcuts.onAddResponse?.();
          return;
        }
      }

      // N: New practice session
      if (event.key === 'n' || event.key === 'N') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          shortcuts.onNewSession?.();
          return;
        }
      }

      // Esc: Close modals
      if (event.key === 'Escape') {
        shortcuts.onCloseModal?.();
        return;
      }

      // ? or /: Toggle help
      if (event.key === '?' || event.key === '/') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
          event.preventDefault();
          shortcuts.onToggleHelp?.();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

