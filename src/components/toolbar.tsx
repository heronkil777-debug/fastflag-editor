import { useRef, useEffect, useMemo } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useFlagStore } from '@/stores/flag-store';
import {
  SearchIcon,
  PlusIcon,
  UploadIcon,
  DownloadIcon,
  FilterIcon,
  XIcon,
  ChevronDownIcon,
  FileIcon,
  FlagIcon,
  ClipboardIcon,
  TagIcon,
  TrashIcon,
} from '@/components/ui/icons';

export function Toolbar() {
  const searchQuery = useUIStore(s => s.searchQuery);
  const setSearchQuery = useUIStore(s => s.setSearchQuery);
  const openAddDialog = useUIStore(s => s.openAddDialog);
  const openImportDialog = useUIStore(s => s.openImportDialog);
  const filterTag = useUIStore(s => s.filterTag);
  const setFilterTag = useUIStore(s => s.setFilterTag);
  const isTagFilterOpen = useUIStore(s => s.isTagFilterOpen);
  const toggleTagFilter = useUIStore(s => s.toggleTagFilter);
  const closeTagFilter = useUIStore(s => s.closeTagFilter);
  const isExportMenuOpen = useUIStore(s => s.isExportMenuOpen);
  const toggleExportMenu = useUIStore(s => s.toggleExportMenu);
  const closeExportMenu = useUIStore(s => s.closeExportMenu);
  const selectedFlagId = useUIStore(s => s.selectedFlagId);
  const selectFlag = useUIStore(s => s.selectFlag);

  const flags = useFlagStore(s => s.flags);
  const removeFlag = useFlagStore(s => s.removeFlag);
  const removeFlags = useFlagStore(s => s.removeFlags);
  const exportAll = useFlagStore(s => s.exportAll);
  const exportPresetRoblox = useFlagStore(s => s.exportPresetRoblox);
  const exportAllRoblox = useFlagStore(s => s.exportAllRoblox);
  const autoTagAll = useFlagStore(s => s.autoTagAll);

  const searchRef = useRef<HTMLInputElement>(null);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const flag of flags) for (const tag of flag.tags) tagSet.add(tag);
    return Array.from(tagSet).sort();
  }, [flags]);

  const presetCount = useMemo(() => flags.filter(f => f.preset).length, [flags]);

  useEffect(() => {
    const handleFocusSearch = () => searchRef.current?.focus();
    window.addEventListener('focus-search', handleFocusSearch);
    return () => window.removeEventListener('focus-search', handleFocusSearch);
  }, []);

  const notify = (message: string, type: string = 'success') => {
    window.dispatchEvent(new CustomEvent('ff-notification', { detail: { message, type } }));
  };

  const handleDeleteSelected = () => {
    if (!selectedFlagId) return;
    removeFlag(selectedFlagId);
    selectFlag(null);
    notify('Flag deleted');
  };

  const handleDeleteAll = () => {
    if (flags.length === 0) return;
    if (confirm(`Delete all ${flags.length} flags?`)) {
      removeFlags(flags.map(f => f.id));
      selectFlag(null);
      notify(`Deleted all ${flags.length} flags`);
    }
  };

  const handleCopyAll = async () => {
    if (flags.length === 0) {
      notify('No flags to copy', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(exportAll());
      notify(`Copied ${flags.length} flags`);
    } catch {
      notify('Failed to copy', 'error');
    }
  };

  const handleSave = () => {
    const json = exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fastflags.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('Saved to fastflags.json');
  };

  const handleExport = (json: string, filename: string) => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    closeExportMenu();
    notify(`Exported to ${filename}`);
  };

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 shrink-0 border-b"
      style={{ background: 'var(--ff-bg-secondary)', borderColor: 'var(--ff-border)' }}
    >
      <span
        className="text-sm font-semibold tracking-tight whitespace-nowrap"
        style={{ color: 'var(--ff-text-primary)' }}
      >
        FastFlag Editor
      </span>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded font-mono"
        style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-text-muted)' }}
      >
        v0.1.0
      </span>
      <div className="w-px h-5 mx-1" style={{ background: 'var(--ff-border)' }} />

      {/* Add */}
      <button
        onClick={openAddDialog}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors"
        style={{ background: 'var(--ff-accent)', color: '#fff' }}
      >
        <PlusIcon className="w-3 h-3" />
        Add
      </button>

      {/* Delete Selected */}
      <button
        onClick={handleDeleteSelected}
        disabled={!selectedFlagId}
        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors disabled:opacity-30"
        style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-danger)' }}
      >
        <TrashIcon className="w-3 h-3" />
        Delete Selected
      </button>

      {/* Delete All */}
      <button
        onClick={handleDeleteAll}
        disabled={flags.length === 0}
        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors disabled:opacity-30"
        style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-danger)' }}
      >
        <TrashIcon className="w-3 h-3" />
        Delete All
      </button>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={flags.length === 0}
        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors disabled:opacity-30"
        style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-text-secondary)' }}
      >
        <FileIcon className="w-3 h-3" />
        Save
      </button>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative" style={{ minWidth: 160 }}>
        <SearchIcon
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
          style={{ color: 'var(--ff-text-muted)' }}
        />
        <input
          ref={searchRef}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Find..."
          className="w-full rounded-md pl-7 pr-7 py-1 text-xs focus:outline-none"
          style={{
            background: 'var(--ff-bg-tertiary)',
            border: '1px solid var(--ff-border)',
            color: 'var(--ff-text-primary)',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5"
            style={{ color: 'var(--ff-text-muted)' }}
          >
            <XIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Copy All */}
      <button
        onClick={handleCopyAll}
        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors"
        style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-text-secondary)' }}
      >
        <ClipboardIcon className="w-3 h-3" />
        Copy All
      </button>

      {/* Import */}
      <button
        onClick={openImportDialog}
        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors"
        style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-text-secondary)' }}
      >
        <UploadIcon className="w-3 h-3" />
        Import
      </button>

      {/* Export */}
      <div className="relative">
        <button
          onClick={toggleExportMenu}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors"
          style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-text-secondary)' }}
        >
          <DownloadIcon className="w-3 h-3" />
          Export
          <ChevronDownIcon className="w-2.5 h-2.5" />
        </button>
        {isExportMenuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={closeExportMenu} />
            <div
              className="absolute right-0 top-full mt-1 py-1 min-w-[200px] rounded-lg shadow-2xl border z-30"
              style={{ background: 'var(--ff-bg-secondary)', borderColor: 'var(--ff-border)' }}
            >
              <button
                onClick={() => handleExport(exportAll(), 'fastflags.json')}
                className="w-full text-left px-3 py-1.5 text-xs hover:brightness-125"
                style={{ color: 'var(--ff-text-secondary)' }}
              >
                <FileIcon className="w-3.5 h-3.5 inline mr-2" />
                All Flags (Editor)
              </button>
              <button
                onClick={() => handleExport(exportPresetRoblox(), 'ClientAppSettings.json')}
                disabled={presetCount === 0}
                className="w-full text-left px-3 py-1.5 text-xs hover:brightness-125 disabled:opacity-30"
                style={{ color: 'var(--ff-text-secondary)' }}
              >
                <FlagIcon
                  className="w-3.5 h-3.5 inline mr-2"
                  style={{ color: 'var(--ff-accent)' }}
                />
                Presets Only ({presetCount})
              </button>
              <button
                onClick={() => handleExport(exportAllRoblox(), 'ClientAppSettings.json')}
                className="w-full text-left px-3 py-1.5 text-xs hover:brightness-125"
                style={{ color: 'var(--ff-text-secondary)' }}
              >
                <FlagIcon className="w-3.5 h-3.5 inline mr-1" />
                All → Roblox
              </button>
            </div>
          </>
        )}
      </div>

      {/* Auto Tag */}
      {flags.length > 0 && (
        <button
          onClick={() => {
            const n = autoTagAll();
            notify(`Updated ${n} flag${n !== 1 ? 's' : ''}`);
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors"
          style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-text-secondary)' }}
        >
          <TagIcon className="w-3 h-3" />
          Auto Tag
        </button>
      )}

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="relative">
          <button
            onClick={toggleTagFilter}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors"
            style={{
              background: filterTag ? 'var(--ff-accent)' : 'var(--ff-bg-tertiary)',
              color: filterTag ? '#fff' : 'var(--ff-text-secondary)',
            }}
          >
            <FilterIcon className="w-3 h-3" />
            {filterTag || 'Tags'}
            <ChevronDownIcon className="w-2.5 h-2.5" />
          </button>
          {isTagFilterOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={closeTagFilter} />
              <div
                className="absolute right-0 top-full mt-1 py-1 min-w-[150px] rounded-lg shadow-2xl z-30 max-h-60 overflow-y-auto"
                style={{ background: 'var(--ff-bg-secondary)', borderColor: 'var(--ff-border)' }}
              >
                <button
                  onClick={() => setFilterTag(null)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:brightness-125"
                  style={{
                    color: filterTag === null ? 'var(--ff-accent)' : 'var(--ff-text-secondary)',
                  }}
                >
                  All
                </button>
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:brightness-125"
                    style={{
                      color: filterTag === tag ? 'var(--ff-accent)' : 'var(--ff-text-secondary)',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
