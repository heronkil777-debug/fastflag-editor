import { useEffect, useState, useCallback, useRef } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useFlagStore } from '@/stores/flag-store';
import { Toolbar } from '@/components/toolbar';
import { FlagTable } from '@/components/flag-table';
import { StatusBar } from '@/components/status-bar';
import { AddFlagDialog } from '@/components/add-flag-dialog';
import { ImportDialog } from '@/components/import-dialog';
import { ContextMenu, type ContextMenuEntry } from '@/components/context-menu';
import { EditIcon, CopyIcon, TrashIcon, TagIcon } from '@/components/ui/icons';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

function NotificationToast({ notification }: { notification: Notification }) {
  const colorMap = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg shadow-xl text-xs border z-50 animate-in ${colorMap[notification.type]}`}
    >
      {notification.message}
    </div>
  );
}

export default function App() {
  const selectedFlagId = useUIStore(s => s.selectedFlagId);
  const editingCell = useUIStore(s => s.editingCell);
  const contextMenu = useUIStore(s => s.contextMenu);
  const selectFlag = useUIStore(s => s.selectFlag);
  const stopEditing = useUIStore(s => s.stopEditing);
  const closeContextMenu = useUIStore(s => s.closeContextMenu);
  const openAddDialog = useUIStore(s => s.openAddDialog);
  const openImportDialog = useUIStore(s => s.openImportDialog);
  const startEditing = useUIStore(s => s.startEditing);

  const flags = useFlagStore(s => s.flags);
  const removeFlag = useFlagStore(s => s.removeFlag);
  const removeFlags = useFlagStore(s => s.removeFlags);
  const duplicateFlag = useFlagStore(s => s.duplicateFlag);
  const togglePreset = useFlagStore(s => s.togglePreset);
  const addTag = useFlagStore(s => s.addTag);
  const autoTagFlag = useFlagStore(s => s.autoTagFlag);
  const importFromJSON = useFlagStore(s => s.importFromJSON);
  const exportAll = useFlagStore(s => s.exportAll);

  const [notification, setNotification] = useState<Notification | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wallpaper state
  const [wallpaper, setWallpaper] = useState<string | null>(null);

  // Load wallpaper from disk on startup
  useEffect(() => {
    if (window.electron?.loadWallpaper) {
      void window.electron.loadWallpaper().then(r => {
        if (r?.ok && r.dataUrl) setWallpaper(r.dataUrl);
      });
    }
  }, []);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const detail = (e as CustomEvent<Notification>).detail;
      setNotification(detail);
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
        notificationTimerRef.current = null;
      }, 3000);
    };
    window.addEventListener('ff-notification', handleNotification);
    return () => {
      window.removeEventListener('ff-notification', handleNotification);
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, []);

  const notify = useCallback((message: string, type: Notification['type'] = 'success') => {
    window.dispatchEvent(new CustomEvent('ff-notification', { detail: { message, type } }));
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('focus-search'));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openAddDialog();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        openImportDialog();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'x' && flags.length > 0) {
        e.preventDefault();
        if (confirm(`Delete all ${flags.length} flags?`)) {
          removeFlags(flags.map(f => f.id));
          selectFlag(null);
          notify(`Deleted all ${flags.length} flags`);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c' && flags.length > 0) {
        e.preventDefault();
        navigator.clipboard
          .writeText(exportAll())
          .then(() => notify(`Copied ${flags.length} flags`))
          .catch(() => notify('Failed to copy', 'error'));
        return;
      }
      if (isInputFocused) return;
      if (e.key === 'Delete' && selectedFlagId) {
        removeFlag(selectedFlagId);
        selectFlag(null);
        return;
      }
      if (e.key === 'Escape') {
        if (editingCell) stopEditing();
        else if (contextMenu) closeContextMenu();
        else if (selectedFlagId) selectFlag(null);
        return;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedFlagId,
    editingCell,
    contextMenu,
    flags,
    closeContextMenu,
    exportAll,
    notify,
    openAddDialog,
    openImportDialog,
    removeFlag,
    removeFlags,
    selectFlag,
    stopEditing,
  ]);

  // Paste to import
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const text = e.clipboardData?.getData('text/plain');
      if (!text?.trim()) return;
      const count = importFromJSON(text.trim());
      if (count > 0) {
        e.preventDefault();
        notify(`Imported ${count} flag${count !== 1 ? 's' : ''}`);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [importFromJSON, notify]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (!file?.name.endsWith('.json')) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        if (text) {
          const count = importFromJSON(text);
          if (count > 0) notify(`Imported ${count} flag${count !== 1 ? 's' : ''}`);
        }
      };
      reader.readAsText(file);
    },
    [importFromJSON, notify]
  );

  const contextMenuItems: ContextMenuEntry[] = contextMenu
    ? [
        {
          key: 'edit',
          label: 'Edit Name',
          icon: <EditIcon className="w-3.5 h-3.5" />,
          onClick: () => startEditing({ flagId: contextMenu.flagId, column: 'name' }),
        },
        {
          key: 'edit-value',
          label: 'Edit Value',
          icon: <EditIcon className="w-3.5 h-3.5" />,
          onClick: () => startEditing({ flagId: contextMenu.flagId, column: 'value' }),
        },
        {
          key: 'duplicate',
          label: 'Duplicate',
          icon: <CopyIcon className="w-3.5 h-3.5" />,
          onClick: () => duplicateFlag(contextMenu.flagId),
        },
        {
          key: 'toggle-preset',
          label: 'Toggle Preset',
          icon: <span style={{ fontSize: '12px' }}>✓</span>,
          onClick: () => togglePreset(contextMenu.flagId),
        },
        {
          key: 'auto-tag',
          label: 'Auto-Tag',
          icon: <TagIcon className="w-3.5 h-3.5" />,
          onClick: () => {
            autoTagFlag(contextMenu.flagId);
            notify('Tags updated');
          },
        },
        {
          key: 'add-tag',
          label: 'Add Tag…',
          icon: <TagIcon className="w-3.5 h-3.5" />,
          onClick: () => {
            const tag = prompt('Tag name:');
            if (tag?.trim()) addTag(contextMenu.flagId, tag.trim());
          },
        },
        { key: 'sep-1', separator: true },
        {
          key: 'delete',
          label: 'Delete',
          icon: <TrashIcon className="w-3.5 h-3.5" />,
          danger: true,
          onClick: () => {
            removeFlag(contextMenu.flagId);
            if (selectedFlagId === contextMenu.flagId) selectFlag(null);
          },
        },
      ]
    : [];

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: wallpaper ? `url(${wallpaper}) center/cover fixed` : 'var(--ff-bg-primary)',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Toolbar />
      <FlagTable />
      <StatusBar onWallpaperChange={setWallpaper} />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}
      <AddFlagDialog />
      <ImportDialog />
      {notification && <NotificationToast notification={notification} />}
    </div>
  );
}
