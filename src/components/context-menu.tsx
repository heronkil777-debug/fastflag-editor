/**
 * Context Menu component.
 *
 * A positioned dropdown menu that appears on right-click.
 * Closes on click outside or Escape key.
 *
 * Design decisions:
 * - Positioned absolutely at the click coordinates
 * - Adjusts position to stay within viewport bounds
 * - Closes automatically on any action click
 * - Renders via portal pattern (fixed positioning)
 */

import { useEffect, useRef, useCallback } from 'react';

export interface ContextMenuItem {
  /** Unique key for React rendering. */
  key: string;
  /** Display label. */
  label: string;
  /** Optional icon element. */
  icon?: React.ReactNode;
  /** Click handler. */
  onClick: () => void;
  /** Whether this item is destructive (e.g., delete). */
  danger?: boolean;
  /** Whether this item is disabled. */
  disabled?: boolean;
}

export interface ContextMenuSeparator {
  key: string;
  separator: true;
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

interface ContextMenuProps {
  /** X position (client coordinates). */
  x: number;
  /** Y position (client coordinates). */
  y: number;
  /** Menu items. */
  items: ContextMenuEntry[];
  /** Callback to close the menu. */
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    // Delay listener to avoid the same right-click that opened the menu
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 36 - 20);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-800 border border-slate-700/80 rounded-lg shadow-2xl py-1 min-w-[200px] overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map(entry => {
        if ('separator' in entry) {
          return <div key={entry.key} className="h-px bg-slate-700/50 my-1" />;
        }

        return (
          <button
            key={entry.key}
            onClick={() => {
              entry.onClick();
              onClose();
            }}
            disabled={entry.disabled}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2.5 transition-colors ${
              entry.disabled
                ? 'text-slate-500 cursor-not-allowed'
                : entry.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            {entry.icon && <span className="w-4 h-4 shrink-0">{entry.icon}</span>}
            <span>{entry.label}</span>
          </button>
        );
      })}
    </div>
  );
}
