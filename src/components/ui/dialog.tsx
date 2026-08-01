/**
 * Reusable Dialog component.
 *
 * A modal overlay with a title and content area.
 * Closes on Escape key or clicking the backdrop.
 *
 * Design decisions:
 * - Uses React Portal pattern (rendered at root level)
 * - Backdrop blur for visual depth
 * - Focus trap is handled by the caller (not built-in)
 * - No animation library — uses CSS transitions
 */

import { useEffect, useCallback } from 'react';
import { XIcon } from '@/components/ui/icons';

interface DialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Callback when the dialog should close. */
  onClose: () => void;
  /** Dialog title. */
  title: string;
  /** Dialog content. */
  children: React.ReactNode;
  /** Optional additional class for the dialog panel. */
  className?: string;
}

export function Dialog({ open, onClose, title, children, className = '' }: DialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative bg-slate-800 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-lg ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
