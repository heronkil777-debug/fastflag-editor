/**
 * Add Flag Dialog component.
 *
 * Modal dialog for creating a new FastFlag.
 * Supports name, value, and optional tag inputs.
 * Auto-suggests tags based on the flag name as the user types.
 *
 * Design decisions:
 * - Form resets on open to avoid stale data
 * - Auto-focuses the name input
 * - Tag input with Enter-to-add pattern
 * - Auto-suggested tags shown as the user types the name
 * - Name is required, value defaults to empty string
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useFlagStore } from '@/stores/flag-store';
import { Dialog } from '@/components/ui/dialog';
import { suggestTags } from '@/utils/auto-tag';
import { getTagColor } from '@/utils/tag-colors';
import { XIcon, PlusIcon } from '@/components/ui/icons';

export function AddFlagDialog() {
  const isOpen = useUIStore(s => s.isAddDialogOpen);
  const closeDialog = useUIStore(s => s.closeAddDialog);
  const addFlag = useFlagStore(s => s.addFlag);

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  // Auto-suggested tags based on the name being typed
  const suggestedTags = useMemo(() => {
    if (!name.trim()) return [];
    const auto = suggestTags(name);
    // Filter out tags the user has already added
    return auto.filter(t => !tags.includes(t));
  }, [name, tags]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setValue('');
      setTagInput('');
      setTags([]);
      // Delay focus to allow Dialog animation
      const timer = setTimeout(() => nameRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleUseAllSuggested = () => {
    setTags([...tags, ...suggestedTags]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // If user hasn't added any tags, use auto-suggested tags
    const finalTags = tags.length > 0 ? tags : undefined;
    addFlag(name.trim(), value.trim(), finalTags);
    closeDialog();
  };

  return (
    <Dialog open={isOpen} onClose={closeDialog} title="Add New Flag">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Flag Name <span className="text-red-400">*</span>
          </label>
          <input
            ref={nameRef}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. FIntRenderShadowQuality"
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Value */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Value</label>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. 21, True, False, 0.5"
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags</label>

          {/* Current tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => {
                const color = getTagColor(tag);
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: color.bg,
                      color: color.text,
                      border: `1px solid ${color.border}`,
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:opacity-70"
                    >
                      <XIcon className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Auto-suggested tags */}
          {suggestedTags.length > 0 && (
            <div className="mb-2 p-2 bg-slate-800/50 rounded-lg border border-dashed border-slate-600/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                  Auto-suggested
                </span>
                <button
                  type="button"
                  onClick={handleUseAllSuggested}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Use all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTags.map(tag => {
                  const color = getTagColor(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddSuggestedTag(tag)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: color.bg,
                        color: color.text,
                        border: `1px solid ${color.border}`,
                      }}
                    >
                      <PlusIcon className="w-2.5 h-2.5" />
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manual tag input */}
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add a custom tag…"
              className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-300 text-sm rounded-lg border border-slate-600/50 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-700/50">
          <button
            type="button"
            onClick={closeDialog}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Flag
          </button>
        </div>
      </form>
    </Dialog>
  );
}
