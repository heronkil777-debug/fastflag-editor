import { useMemo, useRef } from 'react';
import { useFlagStore } from '@/stores/flag-store';
import { useUIStore } from '@/stores/ui-store';
import { EditIcon, XIcon } from '@/components/ui/icons';

interface StatusBarProps {
  onWallpaperChange: (dataUrl: string | null) => void;
}

export function StatusBar({ onWallpaperChange }: StatusBarProps) {
  const flags = useFlagStore((s) => s.flags);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const presetFilter = useUIStore((s) => s.presetFilter);
  const togglePresetFilter = useUIStore((s) => s.togglePresetFilter);

  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const presetCount = useMemo(() => flags.filter((f) => f.preset).length, [flags]);
  const filteredCount = useMemo(() => {
    if (!searchQuery && !presetFilter) return flags.length;
    let result = flags;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q) || f.value.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (presetFilter) {
      result = result.filter((f) => f.preset);
    }
    return result.length;
  }, [flags, searchQuery, presetFilter]);

  const notify = (msg: string, type = 'success') => {
    window.dispatchEvent(new CustomEvent('ff-notification', { detail: { message: msg, type } }));
  };

  const handleWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { 
      notify('Please select an image (PNG, JPG, etc.)', 'error'); 
      if (e.target) e.target.value = ''; 
      return; 
    }
    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      notify('File too large. Max 100MB.', 'error');
      if (e.target) e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      // Save to filesystem via IPC (no size limit issues)
      if ((window as any).electron?.saveWallpaper) {
        const result = await (window as any).electron.saveWallpaper(dataUrl);
        if (result?.ok) {
          onWallpaperChange(dataUrl);
          notify('Wallpaper saved!');
        } else {
          // Fallback to direct memory
          onWallpaperChange(dataUrl);
          notify('Wallpaper set (memory only)');
        }
      } else {
        onWallpaperChange(dataUrl);
        notify('Wallpaper updated!');
      }
      if (e.target) e.target.value = '';
    };
    reader.onerror = () => { notify('Failed to read file', 'error'); };
    reader.readAsDataURL(file);
  };

  const handleClearWallpaper = async () => {
    if ((window as any).electron?.removeWallpaper) {
      await (window as any).electron.removeWallpaper();
    }
    onWallpaperChange(null);
    notify('Wallpaper removed');
  };

  return (
    <div className="flex items-center justify-between px-3 py-1 shrink-0 border-t text-[11px]"
      style={{ background: 'var(--ff-bg-secondary)', borderColor: 'var(--ff-border)', color: 'var(--ff-text-muted)' }}>
      
      <div className="flex items-center gap-2">
        <span>{flags.length} {flags.length === 1 ? 'flag' : 'flags'}{searchQuery ? ` (${filteredCount} shown)` : ''}</span>
        {presetCount > 0 && <span style={{ color: 'var(--ff-accent)' }}>{presetCount} presets</span>}
      </div>

      <div className="flex items-center gap-2">
        {/* Show Presets Only toggle */}
        <button onClick={togglePresetFilter}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors"
          style={{ background: presetFilter ? 'var(--ff-accent)' : 'var(--ff-bg-tertiary)', color: presetFilter ? '#fff' : 'var(--ff-text-secondary)' }}>
          <span style={{ fontSize: '10px' }}>✓</span>Show Presets Only
        </button>

        <div className="w-px h-4" style={{ background: 'var(--ff-border)' }} />

        {/* Wallpaper */}
        <input ref={wallpaperInputRef} type="file" accept="image/*" className="hidden" onChange={handleWallpaper} />
        <button onClick={() => wallpaperInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors"
          style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-text-secondary)' }}
          title="Set background wallpaper (max 100MB)">
          <EditIcon className="w-3 h-3" />Wallpaper
        </button>
        <button onClick={handleClearWallpaper}
          className="p-0.5 rounded transition-colors"
          style={{ color: 'var(--ff-text-muted)' }}
          title="Remove wallpaper">
          <XIcon className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}