import * as React from "react";
import { XARControls } from "@/components/xar/types";
import { XARBridge } from "@/components/xar/bridge";
import { FileItem, DriveInfo, ContextMenuItem } from "../logic/types";
import { ExplorerAPI } from "../logic/api";
import {
  Tree,
  TreeNode,
  Toolbar,
  Breadcrumb,
  Button,
  Input,
  Dialog,
  ScrollArea,
  Container,
  List,
} from "@/components/xar/controls";

interface AppProps {
  appId: string;
  controls: XARControls;
  bridge: XARBridge;
}

interface AppState {
  currentPath: string;
  items: FileItem[];
  drives: DriveInfo[];
  selectedItem: FileItem | null;
  isLoading: boolean;
  showContextMenu: boolean;
  contextMenuPosition: { x: number; y: number };
  creatingFolder: boolean;
  creatingFile: boolean;
  renamingItem: FileItem | null;
  newItemName: string;
  expandedPaths: Set<string>;
  treeData: Map<string, FileItem[]>;
  clipboard: { path: string; operation: "copy" | "cut" } | null;
  sortBy: "name" | "date" | "size" | "type";
  sortOrder: "asc" | "desc";
  searchQuery: string;
  showDrivesView: boolean;
}

const getFileIcon = (item: FileItem): string => {
  if (item.is_dir) return "📁";

  const ext = item.name.split(".").pop()?.toLowerCase() || "";
  const iconMap: Record<string, string> = {
    txt: "📄",
    md: "📝",
    doc: "📄",
    docx: "📄",
    png: "🖼️",
    jpg: "🖼️",
    jpeg: "🖼️",
    gif: "🖼️",
    svg: "🖼️",
    webp: "🖼️",
    mp4: "🎬",
    avi: "🎬",
    mov: "🎬",
    mkv: "🎬",
    mp3: "🎵",
    wav: "🎵",
    flac: "🎵",
    aac: "🎵",
    zip: "📦",
    tar: "📦",
    gz: "📦",
    rar: "📦",
    "7z": "📦",
    py: "🐍",
    js: "📜",
    ts: "📘",
    jsx: "⚛️",
    tsx: "⚛️",
    java: "☕",
    c: "©",
    cpp: "➕",
    rs: "🦀",
    go: "🐹",
  };
  return iconMap[ext] || "📄";
};

const formatSize = (bytes: number | undefined): string => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
};

const FolderTreeItem: React.FC<{
  item: FileItem;
  currentPath: string;
  expandedPaths: Set<string>;
  treeData: Map<string, FileItem[]>;
  onToggle: (path: string) => void;
  onNavigate: (path: string) => void;
  level: number;
}> = ({ item, currentPath, expandedPaths, treeData, onToggle, onNavigate, level }) => {
  const isExpanded = expandedPaths.has(item.path);
  const isActive = currentPath === item.path;
  const subFolders = treeData.get(item.path) || [];

  return (
    <div>
      <div
        className={`tree-item ${isActive ? "active" : ""}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <button
          className="tree-toggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.path);
          }}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
        <button
          className="tree-label"
          onClick={() => onNavigate(item.path)}
        >
          <span className="tree-icon">📁</span>
          <span className="tree-name">{item.name}</span>
        </button>
      </div>
      {isExpanded && (
        <div>
          {subFolders.map((subItem, index) => (
            <FolderTreeItem
              key={index}
              item={subItem}
              currentPath={currentPath}
              expandedPaths={expandedPaths}
              treeData={treeData}
              onToggle={onToggle}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const App: React.FC<AppProps> = ({ appId, controls, bridge }) => {
  const api = React.useMemo(() => new ExplorerAPI(bridge), [bridge]);

  const [state, setState] = React.useState<AppState>({
    currentPath: "",
    items: [],
    drives: [],
    selectedItem: null,
    isLoading: false,
    showContextMenu: false,
    contextMenuPosition: { x: 0, y: 0 },
    creatingFolder: false,
    creatingFile: false,
    renamingItem: null,
    newItemName: "",
    expandedPaths: new Set(),
    treeData: new Map(),
    clipboard: null,
    sortBy: "name",
    sortOrder: "asc",
    searchQuery: "",
    showDrivesView: true,
  });

  React.useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const drives = await api.getDrives();
      setState(prev => ({ ...prev, drives, isLoading: false }));
    } catch (error) {
      console.error("Failed to load drives:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadDirectory = async (path: string) => {
    setState(prev => ({ ...prev, isLoading: true, currentPath: path, showDrivesView: false }));
    try {
      const items = await api.listDirectory(path);
      setState(prev => ({ ...prev, items, isLoading: false }));
    } catch (error) {
      console.error("Failed to load directory:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadSubFolders = async (path: string) => {
    try {
      if (!api.isConnected()) return;
      const items = await api.listDirectory(path);
      const folders = items.filter((item: FileItem) => item.is_dir);
      const normalizedPath = path.replace(/\\/g, "/");
      setState(prev => {
        const newTreeData = new Map(prev.treeData);
        newTreeData.set(normalizedPath, folders);
        return { ...prev, treeData: newTreeData };
      });
    } catch (error) {
      console.error("Failed to load subfolders:", error);
    }
  };

  const handleNavigate = (path: string) => {
    if (path === "") {
      setState(prev => ({ ...prev, showDrivesView: true, currentPath: "", items: [] }));
    } else {
      loadDirectory(path);
    }
  };

  const handleToggle = (path: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
        if (!prev.treeData.has(path)) {
          loadSubFolders(path);
        }
      }
      return { ...prev, expandedPaths: newExpanded };
    });
  };

  const handleGoUp = () => {
    if (state.showDrivesView || !state.currentPath) return;

    const normalizedPath = state.currentPath.replace(/\\/g, "/");
    const parts = normalizedPath.split("/").filter(Boolean);

    if (parts.length <= 1) {
      handleNavigate("");
      return;
    }

    parts.pop();
    if (parts.length === 1 && parts[0].endsWith(":")) {
      handleNavigate(parts[0] + "/");
    } else {
      handleNavigate(parts.join("/"));
    }
  };

  const handleCreateFolder = async () => {
    if (!state.newItemName.trim() || !state.currentPath) return;
    const folderPath = state.currentPath + (state.currentPath.endsWith("/") ? "" : "/") + state.newItemName.trim();
    try {
      await api.createItem(folderPath, true);
      setState(prev => ({ ...prev, creatingFolder: false, newItemName: "" }));
      loadDirectory(state.currentPath);
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const handleCreateFile = async () => {
    if (!state.newItemName.trim() || !state.currentPath) return;
    const filePath = state.currentPath + (state.currentPath.endsWith("/") ? "" : "/") + state.newItemName.trim();
    try {
      await api.createItem(filePath, false, "");
      setState(prev => ({ ...prev, creatingFile: false, newItemName: "" }));
      loadDirectory(state.currentPath);
    } catch (error) {
      console.error("Failed to create file:", error);
    }
  };

  const handleDelete = async (item: FileItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.deleteItem(item.path);
      setState(prev => ({ ...prev, selectedItem: null }));
      loadDirectory(state.currentPath);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleRename = async () => {
    if (!state.renamingItem || !state.newItemName.trim()) {
      setState(prev => ({ ...prev, renamingItem: null, newItemName: "" }));
      return;
    }
    const parentPath = state.renamingItem.path.substring(0, state.renamingItem.path.lastIndexOf("/"));
    const newPath = parentPath + "/" + state.newItemName.trim();
    try {
      await api.renameItem(state.renamingItem.path, newPath);
      setState(prev => ({ ...prev, renamingItem: null, newItemName: "" }));
      loadDirectory(state.currentPath);
    } catch (error) {
      console.error("Failed to rename item:", error);
    }
  };

  const handleRefresh = () => {
    if (state.currentPath) {
      loadDirectory(state.currentPath);
    } else {
      loadDrives();
    }
  };

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.is_dir) {
      handleNavigate(item.path);
    }
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    setState(prev => ({
      ...prev,
      selectedItem: item,
      showContextMenu: true,
      contextMenuPosition: { x: e.clientX, y: e.clientY },
    }));
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setState(prev => ({
      ...prev,
      showContextMenu: true,
      contextMenuPosition: { x: e.clientX, y: e.clientY },
    }));
  };

  const closeContextMenu = () => {
    setState(prev => ({ ...prev, showContextMenu: false }));
  };

  const handleCopy = () => {
    if (state.selectedItem) {
      setState(prev => ({
        ...prev,
        clipboard: { path: state.selectedItem!.path, operation: "copy" },
        showContextMenu: false,
      }));
    }
  };

  const handleCut = () => {
    if (state.selectedItem) {
      setState(prev => ({
        ...prev,
        clipboard: { path: state.selectedItem!.path, operation: "cut" },
        showContextMenu: false,
      }));
    }
  };

  const handlePaste = async () => {
    if (!state.clipboard || !state.currentPath) return;
    const itemName = state.clipboard.path.substring(state.clipboard.path.lastIndexOf("/") + 1);
    const destPath = state.currentPath + (state.currentPath.endsWith("/") ? "" : "/") + itemName;
    try {
      await api.renameItem(state.clipboard.path, destPath);
      setState(prev => ({ ...prev, clipboard: null }));
      loadDirectory(state.currentPath);
    } catch (error) {
      console.error("Failed to paste item:", error);
    }
    closeContextMenu();
  };

  const getContextMenuItems = (): ContextMenuItem[] => {
    if (state.selectedItem) {
      return [
        {
          id: "open",
          label: state.selectedItem.is_dir ? "Open" : "Open File",
          onClick: () => handleItemDoubleClick(state.selectedItem!),
        },
        { id: "divider1", label: "", divider: true },
        { id: "copy", label: "Copy", onClick: handleCopy },
        { id: "cut", label: "Cut", onClick: handleCut },
        { id: "divider2", label: "", divider: true },
        {
          id: "rename",
          label: "Rename",
          onClick: () => setState(prev => ({
            ...prev,
            renamingItem: prev.selectedItem,
            newItemName: prev.selectedItem!.name,
          })),
        },
        {
          id: "delete",
          label: "Delete",
          danger: true,
          onClick: () => handleDelete(state.selectedItem!),
        },
      ];
    }

    const items: ContextMenuItem[] = [
      {
        id: "newFolder",
        label: "New Folder",
        onClick: () => setState(prev => ({
          ...prev,
          creatingFolder: true,
          creatingFile: false,
          newItemName: "",
        })),
      },
      {
        id: "newFile",
        label: "New File",
        onClick: () => setState(prev => ({
          ...prev,
          creatingFile: true,
          creatingFolder: false,
          newItemName: "",
        })),
      },
    ];

    if (state.clipboard && !state.showDrivesView) {
      items.push({ id: "divider-clip", label: "", divider: true });
      items.push({
        id: "paste",
        label: "Paste",
        onClick: handlePaste,
      });
    }

    items.push({ id: "divider-refresh", label: "", divider: true });
    items.push({
      id: "refresh",
      label: "Refresh",
      onClick: handleRefresh,
    });

    return items;
  };

  const filteredItems = state.items
    .filter((item) => item.name.toLowerCase().includes(state.searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
      const multiplier = state.sortOrder === "asc" ? 1 : -1;
      if (state.sortBy === "name") {
        return multiplier * a.name.localeCompare(b.name);
      }
      if (state.sortBy === "date") {
        return multiplier * ((a.modified || "").localeCompare(b.modified || ""));
      }
      if (state.sortBy === "size") {
        return multiplier * ((a.size || 0) - (b.size || 0));
      }
      if (state.sortBy === "type") {
        const getType = (item: FileItem) => {
          if (item.is_dir) return "0_folder";
          const ext = item.name.split(".").pop()?.toLowerCase() || "";
          return ext;
        };
        return multiplier * getType(a).localeCompare(getType(b));
      }
      return 0;
    });

  const treeNodes: TreeNode[] = state.drives.map((drive) => ({
    id: drive.path,
    name: drive.name,
    isDirectory: true,
    children: (state.treeData.get(drive.path.replace(/\\/g, "/")) || [])
      .filter((item) => item.is_dir)
      .map((item) => ({
        id: item.path,
        name: item.name,
        isDirectory: true,
      })),
  }));

  const pathParts = state.currentPath ? state.currentPath.replace(/\\/g, "/").split("/").filter(Boolean) : [];

  return (
    <Container className="explorer-app">
      <div className="explorer-toolbar">
        <Button variant="ghost" size="icon" onClick={handleGoUp} disabled={!state.currentPath && !state.showDrivesView}>
          ⬆️
        </Button>
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          🔄
        </Button>
        <div className="toolbar-spacer" />
        <Input
          className="search-input"
          placeholder="Search..."
          value={state.searchQuery}
          onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
        />
      </div>

      <Breadcrumb
        path={state.showDrivesView ? "" : state.currentPath}
        onNavigate={(segment, index) => {
          const parts = pathParts.slice(0, index + 1);
          handleNavigate(parts.join("/"));
        }}
      />

      <div className="explorer-content">
        <div className="explorer-sidebar">
          <div className="sidebar-header" onClick={() => handleNavigate("")}>
            💻 This PC
          </div>
          <ScrollArea className="sidebar-tree">
            {state.drives.length > 0 ? (
              state.drives.map((drive, index) => {
                const normalizedPath = drive.path.replace(/\\/g, "/");
                return (
                  <FolderTreeItem
                    key={index}
                    item={{
                      name: drive.name,
                      path: normalizedPath,
                      is_dir: true,
                    }}
                    currentPath={state.currentPath}
                    expandedPaths={state.expandedPaths}
                    treeData={state.treeData}
                    onToggle={handleToggle}
                    onNavigate={handleNavigate}
                    level={0}
                  />
                );
              })
            ) : (
              <div className="no-drives">No drives available</div>
            )}
          </ScrollArea>
        </div>

        <div className="explorer-main" onContextMenu={handleBackgroundContextMenu}>
          <div className="explorer-toolbar-secondary">
            {!state.showDrivesView && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setState(prev => ({
                    ...prev,
                    creatingFolder: true,
                    creatingFile: false,
                    newItemName: "",
                  }))}
                >
                  📁 New Folder
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setState(prev => ({
                    ...prev,
                    creatingFile: true,
                    creatingFolder: false,
                    newItemName: "",
                  }))}
                >
                  📄 New File
                </Button>
              </>
            )}
          </div>

          <ScrollArea className="explorer-items">
            {state.isLoading ? (
              <div className="loading-state">Loading...</div>
            ) : state.showDrivesView ? (
              <div className="drives-grid">
                {state.drives.map((drive, index) => (
                  <div
                    key={index}
                    className="drive-card"
                    onClick={() => handleNavigate(drive.path)}
                  >
                    <div className="drive-icon">💾</div>
                    <div className="drive-info">
                      <div className="drive-name">{drive.name}</div>
                      <div className="drive-space">
                        {formatSize(drive.free)} free of {formatSize(drive.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 && !state.creatingFolder && !state.creatingFile ? (
              <div className="empty-state">This folder is empty</div>
            ) : (
              <List className="items-list">
                {state.creatingFolder && (
                  <div className="item-create">
                    <span className="item-icon">📁</span>
                    <Input
                      className="item-name-input"
                      value={state.newItemName}
                      onChange={(e) => setState(prev => ({ ...prev, newItemName: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateFolder();
                        if (e.key === "Escape") setState(prev => ({ ...prev, creatingFolder: false }));
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleCreateFolder}>✓</Button>
                    <Button size="sm" variant="ghost" onClick={() => setState(prev => ({ ...prev, creatingFolder: false }))}>✕</Button>
                  </div>
                )}
                {state.creatingFile && (
                  <div className="item-create">
                    <span className="item-icon">📄</span>
                    <Input
                      className="item-name-input"
                      value={state.newItemName}
                      onChange={(e) => setState(prev => ({ ...prev, newItemName: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateFile();
                        if (e.key === "Escape") setState(prev => ({ ...prev, creatingFile: false }));
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleCreateFile}>✓</Button>
                    <Button size="sm" variant="ghost" onClick={() => setState(prev => ({ ...prev, creatingFile: false }))}>✕</Button>
                  </div>
                )}
                {filteredItems.map((item, index) => (
                  <div
                    key={index}
                    className={`item-row ${state.selectedItem?.path === item.path ? "selected" : ""}`}
                    onClick={() => setState(prev => ({ ...prev, selectedItem: item }))}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    onContextMenu={(e) => handleItemContextMenu(e, item)}
                  >
                    {state.renamingItem?.path === item.path ? (
                      <>
                        <span className="item-icon">{getFileIcon(item)}</span>
                        <Input
                          className="item-name-input"
                          value={state.newItemName}
                          onChange={(e) => setState(prev => ({ ...prev, newItemName: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename();
                            if (e.key === "Escape") setState(prev => ({ ...prev, renamingItem: null }));
                          }}
                          autoFocus
                        />
                        <Button size="sm" onClick={handleRename}>✓</Button>
                      </>
                    ) : (
                      <>
                        <span className="item-icon">{getFileIcon(item)}</span>
                        <span className="item-name">{item.name}</span>
                        <span className="item-date">{formatDate(item.modified)}</span>
                        <span className="item-type">{item.is_dir ? "Folder" : item.name.split(".").pop()?.toUpperCase() || "File"}</span>
                        <span className="item-size">{item.is_dir ? "-" : formatSize(item.size)}</span>
                      </>
                    )}
                  </div>
                ))}
              </List>
            )}
          </ScrollArea>
        </div>
      </div>

      <div className="explorer-statusbar">
        <span>{state.showDrivesView ? `${state.drives.length} drives` : `${filteredItems.length} items`}</span>
        {state.clipboard && (
          <span className="clipboard-status">
            {state.clipboard.operation === "copy" ? "Copied" : "Cut"}: {state.clipboard.path.split("/").pop()}
          </span>
        )}
      </div>

      {state.showContextMenu && (
        <Dialog
          open={state.showContextMenu}
          onClose={closeContextMenu}
          position={state.contextMenuPosition}
        >
          {getContextMenuItems().map((menuItem) =>
            menuItem.divider ? (
              <div key={menuItem.id} className="context-menu-divider" />
            ) : (
              <div
                key={menuItem.id}
                className={`context-menu-item ${menuItem.danger ? "danger" : ""}`}
                onClick={() => {
                  menuItem.onClick?.();
                  closeContextMenu();
                }}
              >
                {menuItem.label}
              </div>
            )
          )}
        </Dialog>
      )}
    </Container>
  );
};

export default App;
