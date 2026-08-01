/**
 * Import Dialog component.
 *
 * Modal dialog for importing flags via:
 * 1. Pasting JSON into a text area
 * 2. Loading from a file
 *
 * Auto-detects the format (Roblox ClientAppSettings.json or our internal format).
 * Auto-tags all imported flags based on their names.
 *
 * Design decisions:
 * - Text area is the primary input method (paste-friendly)
 * - File picker is a secondary option
 * - Real-time validation feedback as the user types
 * - Auto-detects format and shows a preview of what will be imported
 */

import { useState, useRef, useCallback } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useFlagStore } from '@/stores/flag-store';
import { detectFormat } from '@/adapters/roblox';
import { Dialog } from '@/components/ui/dialog';
import { ClipboardIcon, FileIcon } from '@/components/ui/icons';

export function ImportDialog() {
  const isOpen = useUIStore(s => s.isImportDialogOpen);
  const closeDialog = useUIStore(s => s.closeImportDialog);
  const importFromJSON = useFlagStore(s => s.importFromJSON);

  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = useCallback((value: string) => {
    setJsonText(value);
    setError(null);

    if (!value.trim()) {
      setDetectedFormat(null);
      return;
    }

    const format = detectFormat(value);
    switch (format) {
      case 'roblox':
        setDetectedFormat('Roblox ClientAppSettings.json');
        break;
      case 'fastflag-editor':
        setDetectedFormat('FastFlag Editor backup');
        break;
      default:
        setDetectedFormat(null);
        try {
          JSON.parse(value);
          setError('Unrecognized format. Expected Roblox or FastFlag Editor format.');
        } catch {
          setError('Invalid JSON. Please check the content and try again.');
        }
    }
  }, []);

  const handleImport = () => {
    if (!jsonText.trim()) return;

    const count = importFromJSON(jsonText);
    if (count > 0) {
      window.dispatchEvent(
        new CustomEvent('ff-notification', {
          detail: {
            message: `Imported ${count} flag${count !== 1 ? 's' : ''} with auto-tags`,
            type: 'success' as const,
          },
        })
      );
      setJsonText('');
      setError(null);
      setDetectedFormat(null);
      closeDialog();
    } else {
      setError('No valid flags found. Please check the format.');
    }
  };

  const handleFileLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      setJsonText(text);
      handleTextChange(text);
    };
    input.click();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJsonText(text);
        handleTextChange(text);
      }
    } catch {
      setError('Could not read clipboard. Please paste manually with Ctrl+V.');
    }
  };

  const handleClose = () => {
    setJsonText('');
    setError(null);
    setDetectedFormat(null);
    closeDialog();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} title="Import Flags" className="max-w-2xl">
      <div className="space-y-4">
        {/* Quick actions */}
        <div className="flex gap-2">
          <button
            onClick={handlePaste}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-md border border-slate-600/50 transition-colors"
          >
            <ClipboardIcon className="w-3.5 h-3.5" />
            Paste from Clipboard
          </button>
          <button
            onClick={handleFileLoad}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-md border border-slate-600/50 transition-colors"
          >
            <FileIcon className="w-3.5 h-3.5" />
            Load from File
          </button>
        </div>

        {/* Text area */}
        <div className="relative">
          <textarea
            ref={textAreaRef}
            value={jsonText}
            onChange={e => handleTextChange(e.target.value)}
            placeholder={
              'Paste your JSON here...\n\nExample (Roblox format):\n{\n  "FFlagDebugDisableTelemetryEpicV2": "True",\n  "FIntRenderShadowQuality": "21"\n}'
            }
            className="w-full h-64 bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors resize-y"
            spellCheck={false}
          />

          {/* Format indicator */}
          {detectedFormat && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-md border border-emerald-500/30">
              {detectedFormat}
            </div>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Info */}
        <p className="text-xs text-slate-500">
          Supports Roblox ClientAppSettings.json and FastFlag Editor backup formats. All imported
          flags will be automatically tagged based on their names.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-700/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!jsonText.trim() || !detectedFormat}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Import Flags
          </button>
        </div>
      </div>
    </Dialog>
  );
}
