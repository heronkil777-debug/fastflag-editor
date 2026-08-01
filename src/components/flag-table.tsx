import { useMemo, useCallback } from 'react';
import type { FastFlag, SortConfig } from '@/types/flag';
import { useFlagStore } from '@/stores/flag-store';
import { useUIStore } from '@/stores/ui-store';
import { useVirtualList } from '@/hooks/use-virtual-list';
import { ChevronUpIcon, ChevronDownIcon, PlusIcon, UploadIcon } from '@/components/ui/icons';

const ROW_HEIGHT = 42;

const COLUMNS: { key: string; label: string; width: string }[] = [
  { key: 'tags', label: 'Tags', width: '240px' },
  { key: 'preset', label: 'P', width: '36px' },
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'value', label: 'Value', width: '1fr' },
];

function sortFlags(flags: FastFlag[], config: SortConfig | null): FastFlag[] {
  if (!config) return flags;
  return [...flags].sort((a, b) => {
    let cmp = 0;
    switch (config.column) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'value': cmp = a.value.localeCompare(b.value); break;
      case 'preset': cmp = Number(a.preset) - Number(b.preset); break;
      case 'tags': cmp = a.tags.join(',').localeCompare(b.tags.join(',')); break;
    }
    return config.direction === 'asc' ? cmp : -cmp;
  });
}

function filterFlags(flags: FastFlag[], searchQuery: string, filterTag: string | null, presetFilter: boolean): FastFlag[] {
  let result = flags;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter((f) => f.name.toLowerCase().includes(q) || f.value.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q)));
  }
  if (filterTag) {
    result = result.filter((f) => f.tags.includes(filterTag));
  }
  if (presetFilter) {
    result = result.filter((f) => f.preset);
  }
  return result;
}

function EmptyState({ hasFlags }: { hasFlags: boolean }) {
  const openAddDialog = useUIStore((s) => s.openAddDialog);
  const openImportDialog = useUIStore((s) => s.openImportDialog);

  if (hasFlags) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs" style={{ color: 'var(--ff-text-muted)' }}>
        No flags match your search.
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3 max-w-xs">
        <span className="text-3xl">🏁</span>
        <h3 className="font-medium" style={{ color: 'var(--ff-text-secondary)' }}>No flags yet</h3>
        <p className="text-xs" style={{ color: 'var(--ff-text-muted)' }}>Add a flag, import a file, or paste JSON.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={openAddDialog} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ background: 'var(--ff-accent)', color: '#fff' }}>
            <PlusIcon className="w-3.5 h-3.5" />Add Flag
          </button>
          <button onClick={openImportDialog} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors"
            style={{ background: 'var(--ff-bg-tertiary)', color: 'var(--ff-text-secondary)' }}>
            <UploadIcon className="w-3.5 h-3.5" />Import
          </button>
        </div>
      </div>
    </div>
  );
}

function TableHeader() {
  const sortConfig = useUIStore((s) => s.sortConfig);
  const setSortConfig = useUIStore((s) => s.setSortConfig);

  return (
    <div className="flex items-center shrink-0 border-b" style={{ height: ROW_HEIGHT, background: 'var(--ff-bg-secondary)', borderColor: 'var(--ff-border)' }}>
      {COLUMNS.map((col) => (
        <div key={col.key}
          className={`flex items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider select-none ${col.key === 'preset' ? 'justify-center' : ''} ${col.key !== 'tags' && col.key !== 'preset' ? 'cursor-pointer' : 'cursor-default'}`}
          style={{ width: col.width, minWidth: col.width, color: 'var(--ff-text-muted)' }}
          onClick={() => { if (col.key === 'tags' || col.key === 'preset') return; setSortConfig(col.key as SortConfig['column']); }}>
          {col.label}
          {sortConfig?.column === col.key && (
            sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-2.5 h-2.5" style={{ color: 'var(--ff-accent)' }} /> : <ChevronDownIcon className="w-2.5 h-2.5" style={{ color: 'var(--ff-accent)' }} />)}
        </div>
      ))}
    </div>
  );
}

export function FlagTable() {
  const flags = useFlagStore((s) => s.flags);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const sortConfig = useUIStore((s) => s.sortConfig);
  const filterTag = useUIStore((s) => s.filterTag);
  const presetFilter = useUIStore((s) => s.presetFilter);
  const selectedFlagId = useUIStore((s) => s.selectedFlagId);
  const selectFlag = useUIStore((s) => s.selectFlag);
  const showContextMenu = useUIStore((s) => s.showContextMenu);
  const togglePreset = useFlagStore((s) => s.togglePreset);

  const filteredFlags = useMemo(
    () => sortFlags(filterFlags(flags, searchQuery, filterTag, presetFilter), sortConfig),
    [flags, searchQuery, filterTag, presetFilter, sortConfig]
  );

  const { scrollRef, onScroll, visibleItems, totalHeight, offsetY } = useVirtualList({
    items: filteredFlags,
    rowHeight: ROW_HEIGHT,
    containerHeight: 600,
    overscan: 8,
  });

  const handleContextMenu = useCallback((e: React.MouseEvent, flagId: string) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, flagId);
  }, [showContextMenu]);

  if (filteredFlags.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TableHeader />
        <EmptyState hasFlags={flags.length > 0} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TableHeader />
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-auto">
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
            {visibleItems.map(({ item: flag }) => {
              const isSelected = flag.id === selectedFlagId;
              return (
                <div key={flag.id}
                  className={`flex items-center border-b transition-colors cursor-pointer ${isSelected ? '' : ''}`}
                  style={{
                    height: ROW_HEIGHT,
                    background: isSelected ? 'var(--ff-bg-tertiary)' : 'transparent',
                    borderColor: 'var(--ff-border-light)',
                  }}
                  onClick={() => { selectFlag(flag.id); }}
                  onContextMenu={(e) => handleContextMenu(e, flag.id)}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    const col = e.clientX - rect.left < 280 ? 'tags' : e.clientX - rect.left < 320 ? 'preset' : e.clientX - rect.left < rect.width / 2 + 160 ? 'name' : 'value';
                    useUIStore.getState().startEditing({ flagId: flag.id, column: col as 'name' | 'value' | 'tags' });
                  }}>
                  
                  {/* Tags column */}
                  <div className="flex items-center gap-1 px-2 flex-wrap" style={{ width: '240px', minWidth: '240px' }}>
                    {flag.tags.map((tag) => {
                      const color = stringToColor(tag);
                      return (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: color + '22', color: color, border: `1px solid ${color}44` }}>
                          {tag}
                        </span>
                      );
                    })}
                  </div>

                  {/* Preset checkbox */}
                  <div className="flex items-center justify-center" style={{ width: '36px', minWidth: '36px' }}
                    onClick={(e) => { e.stopPropagation(); togglePreset(flag.id); }}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${flag.preset ? '' : ''}`}
                      style={{ background: flag.preset ? 'var(--ff-accent)' : 'var(--ff-bg-tertiary)', border: flag.preset ? 'none' : '1px solid var(--ff-border)' }}>
                      {flag.preset && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex-1 px-2 text-xs truncate" style={{ color: 'var(--ff-text-primary)' }}>
                    {flag.name}
                  </div>

                  {/* Value */}
                  <div className="flex-1 px-2 text-[11px] truncate font-mono" style={{ color: flag.value === 'True' ? '#34d399' : flag.value === 'False' ? '#f87171' : 'var(--ff-text-secondary)' }}>
                    {flag.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#a78bfa', '#7c3aed', '#c084fc', '#9333ea', '#d8b4fe', '#6d28d9', '#e9d5ff', '#5b21b6'];
  return colors[Math.abs(hash) % colors.length];
}