/**
 * Copyright © 2026 Wenze Wei. All Rights Reserved.
 *
 * This file is part of Xi.
 * The Xi project belongs to the Dunimd Team.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client";

import { useState, useCallback, useEffect, MouseEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApps } from "./apps-context";
import { useContextMenu, type ContextMenuItem } from "./context-menu";
import { AppWindow } from "./app-window";
import { useExplorerStore } from "@/lib/stores";
import { getAppForFile } from "@/lib/config/file-associations";
import { useI18n } from "@/lib/i18n";
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  HardDrive,
  ArrowUp,
  RefreshCw,
  Search,
  Grid,
  List,
  FolderOpen,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  FilePlus,
  FolderPlus,
  Computer,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Edit,
  Info,
  Eye,
  Terminal,
  X,
  Check,
  ArrowDownUp,
  MoreHorizontal,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FileExplorerWindowProps {
  state: "minimized" | "normal" | "maximized";
}

interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  modified?: string;
}

interface DriveInfo {
  name: string;
  path: string;
  total: number;
  used: number;
  free: number;
}

interface DirectoryInfo {
  path: string;
  items: FileItem[];
  disk?: {
    total: number;
    used: number;
    free: number;
  } | null;
  is_windows: boolean;
}

interface DrivesInfo {
  is_windows: boolean;
  drives: DriveInfo[];
}

const getFileIcon = (item: FileItem) => {
  if (item.is_dir) {
    return <Folder className="h-5 w-5 text-amber-500" />;
  }
  
  const ext = item.name.split(".").pop()?.toLowerCase() || "";
  
  switch (ext) {
    case "txt":
    case "md":
    case "doc":
    case "docx":
      return <FileText className="h-5 w-5 text-blue-500" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
      return <Image className="h-5 w-5 text-green-500" />;
    case "mp4":
    case "avi":
    case "mov":
    case "mkv":
      return <Video className="h-5 w-5 text-purple-500" />;
    case "mp3":
    case "wav":
    case "flac":
    case "aac":
      return <Music className="h-5 w-5 text-pink-500" />;
    case "zip":
    case "tar":
    case "gz":
    case "rar":
    case "7z":
      return <Archive className="h-5 w-5 text-orange-500" />;
    case "py":
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "java":
    case "c":
    case "cpp":
    case "rs":
    case "go":
      return <Code className="h-5 w-5 text-cyan-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
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

interface FolderTreeItemProps {
  item: FileItem;
  currentPath: string;
  expandedPaths: Set<string>;
  treeData: Map<string, FileItem[]>;
  onToggle: (path: string) => void;
  onNavigate: (path: string) => void;
  level: number;
}

const FolderTreeItem = ({ item, currentPath, expandedPaths, treeData, onToggle, onNavigate, level }: FolderTreeItemProps) => {
  const isExpanded = expandedPaths.has(item.path);
  const isActive = currentPath === item.path;
  const subFolders = treeData.get(item.path) || [];
  const isLoaded = treeData.has(item.path);
  const hasChildren = subFolders.length > 0;
  const showArrow = true;

  return (
    <div>
      <div
        className={cn(
          "w-full flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-muted/50 transition-colors cursor-pointer",
          isActive && "bg-muted"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <button
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-muted rounded"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggle(item.path);
          }}
        >
          {showArrow ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )
          ) : null}
        </button>
        <button
          className="flex items-center gap-1 flex-1 text-left"
          onClick={() => onNavigate(item.path)}
        >
          <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span className="truncate">{item.name}</span>
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

export function FileExplorerWindow({ state }: FileExplorerWindowProps) {
  const { t } = useI18n();
  const { 
    minimizeApp, 
    closeApp, 
    maximizeApp, 
    restoreApp, 
    isAppMaximized, 
    getAppPosition, 
    updateAppPosition, 
    getAppSize, 
    updateAppSize,
    focusApp,
    isAppFocused,
    openAppWithParams,
  } = useApps();
  const { showContextMenu } = useContextMenu();
  const queryClient = useQueryClient();
  
  const savedPosition = getAppPosition("explorer");
  const savedSize = getAppSize("explorer");
  const maximized = isAppMaximized("explorer");
  const focused = isAppFocused("explorer");
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showDrivesView, setShowDrivesView] = useState(true);
  const [clipboard, setClipboard] = useState<{ path: string; operation: "copy" | "cut" } | null>(null);
  const [renamingItem, setRenamingItem] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [drivesExpanded, setDrivesExpanded] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<Map<string, FileItem[]>>(new Map());

  const { diskInfo, drives, isLoading, isWsConnected, connectWebSocket, disconnectWebSocket, browse, isWindows, ws, currentPath, clearPath, items } = useExplorerStore();

  useEffect(() => {
    if (!isWsConnected) {
      connectWebSocket();
    }
    return () => {
      disconnectWebSocket();
    };
  }, [isWsConnected, connectWebSocket, disconnectWebSocket]);

  const navigateTo = useCallback((path: string) => {
    if (path === "") {
      setShowDrivesView(true);
      clearPath();
    } else {
      setShowDrivesView(false);
      browse(path);
    }
    setSelectedPath(null);
    setRenamingItem(null);
    setCreatingFolder(false);
    setCreatingFile(false);
  }, [browse, clearPath]);

  const loadSubFolders = useCallback(async (path: string) => {
    try {
      const { ws } = useExplorerStore.getState();
      if (!ws || !ws.isConnected) {
        console.error("WebSocket not connected");
        return;
      }
      const items = await ws.browseOnce(path);
      const folders = items.filter((item: FileItem) => item.is_dir);
      const normalizedPath = path.replace(/\\/g, "/");
      setTreeData(prev => new Map(prev).set(normalizedPath, folders));
    } catch (error) {
      console.error("Failed to load subfolders:", error);
    }
  }, []);

  const toggleExpand = useCallback((path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      if (!treeData.has(path)) {
        loadSubFolders(path);
      }
    }
    setExpandedPaths(newExpanded);
  }, [expandedPaths, treeData, loadSubFolders]);

  const goUp = useCallback(() => {
    if (showDrivesView) return;
    
    if (!currentPath) {
      setShowDrivesView(true);
      return;
    }
    
    if (isWindows) {
      const normalizedPath = currentPath.replace(/\\/g, "/");
      const parts = normalizedPath.split("/").filter(Boolean);
      
      if (parts.length <= 1) {
        navigateTo("");
        return;
      }
      
      parts.pop();
      if (parts.length === 1 && parts[0].endsWith(":")) {
        navigateTo(parts[0] + "/");
      } else {
        navigateTo(parts.join("/"));
      }
    } else {
      if (currentPath === "/") {
        navigateTo("");
        return;
      }
      const parts = currentPath.split("/").filter(Boolean);
      parts.pop();
      const newPath = parts.length === 0 ? "/" : "/" + parts.join("/");
      navigateTo(newPath);
    }
  }, [currentPath, isWindows, navigateTo, showDrivesView]);

  const canGoUp = useCallback(() => {
    if (showDrivesView) return false;
    if (!currentPath) return false;
    return true;
  }, [currentPath, showDrivesView]);

  const pathParts = currentPath ? currentPath.replace(/\\/g, "/").split("/").filter(Boolean) : [];

  const filteredItems = items?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    const multiplier = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "name") {
      return multiplier * a.name.localeCompare(b.name);
    }
    if (sortBy === "date") {
      return multiplier * ((a.modified || "").localeCompare(b.modified || ""));
    }
    if (sortBy === "size") {
      return multiplier * ((a.size || 0) - (b.size || 0));
    }
    if (sortBy === "type") {
      const getType = (item: FileItem) => {
        if (item.is_dir) return "0_folder";
        const ext = item.name.split(".").pop()?.toLowerCase() || "";
        return ext;
      };
      return multiplier * getType(a).localeCompare(getType(b));
    }
    return 0;
  }) || [];

  const refreshDirectory = useCallback(() => {
    browse(currentPath);
  }, [browse, currentPath]);

  const handleFileOpen = useCallback((item: FileItem) => {
    if (item.is_dir) {
      navigateTo(item.path);
    } else {
      const appId = getAppForFile(item.name);
      if (appId) {
        openAppWithParams(appId, { 
          path: item.path, 
          filename: item.name,
        });
      } else {
        console.log("No application configured for file:", item.name);
      }
    }
  }, [navigateTo, openAppWithParams]);

  const handleDelete = useCallback(async (item: FileItem) => {
    if (!confirm(t("fileExplorer.confirmDelete", { name: item.name }))) return;
    if (!ws || !ws.isConnected) {
      alert(t("errors.wsDisconnected"));
      return;
    }
    ws.deleteItem(item.path);
    refreshDirectory();
  }, [ws, refreshDirectory, t]);

  const handleRename = useCallback(async () => {
    if (!renamingItem || !newName.trim()) {
      setRenamingItem(null);
      return;
    }
    if (!ws || !ws.isConnected) {
      alert(t("errors.wsDisconnected"));
      return;
    }
    const parentPath = renamingItem.path.substring(0, renamingItem.path.lastIndexOf("/"));
    const newPath = parentPath + "/" + newName.trim();
    ws.renameItem(renamingItem.path, newPath);
    setRenamingItem(null);
    setNewName("");
    refreshDirectory();
  }, [ws, renamingItem, newName, refreshDirectory]);

  const handleCreateFolder = useCallback(async () => {
    if (!newItemName.trim() || !currentPath) return;
    if (!ws || !ws.isConnected) {
      alert(t("errors.wsDisconnected"));
      return;
    }
    const folderPath = currentPath + (currentPath.endsWith("/") ? "" : "/") + newItemName.trim();
    ws.createFolder(folderPath);
    setCreatingFolder(false);
    setNewItemName("");
    refreshDirectory();
  }, [ws, newItemName, currentPath, refreshDirectory, t]);

  const handleCreateFile = useCallback(async () => {
    if (!newItemName.trim() || !currentPath) return;
    if (!ws || !ws.isConnected) {
      alert(t("errors.wsDisconnected"));
      return;
    }
    const filePath = currentPath + (currentPath.endsWith("/") ? "" : "/") + newItemName.trim();
    ws.createFile(filePath, "");
    setCreatingFile(false);
    setNewItemName("");
    refreshDirectory();
  }, [ws, newItemName, currentPath, refreshDirectory, t]);

  const handlePaste = useCallback(async () => {
    if (!clipboard || !currentPath) return;
    if (!ws || !ws.isConnected) {
      alert(t("errors.wsDisconnected"));
      return;
    }
    const itemName = clipboard.path.substring(clipboard.path.lastIndexOf("/") + 1);
    const destPath = currentPath + (currentPath.endsWith("/") ? "" : "/") + itemName;
    if (clipboard.operation === "copy") {
      ws.copyItem(clipboard.path, destPath);
    } else {
      ws.moveItem(clipboard.path, destPath);
      setClipboard(null);
    }
    refreshDirectory();
  }, [ws, clipboard, currentPath, refreshDirectory, t]);

  const startRename = useCallback((item: FileItem) => {
    setRenamingItem(item);
    setNewName(item.name);
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent, item?: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      setSelectedPath(item.path);
    }
    
    const menuItems = item ? [
      {
        id: "open",
        label: item.is_dir ? t("fileExplorer.contextMenu.open") : t("fileExplorer.contextMenu.openFile"),
        icon: item.is_dir ? <Folder className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
        onClick: () => handleFileOpen(item),
      },
      { id: "divider1", label: "", divider: true },
      {
        id: "copy",
        label: t("fileExplorer.contextMenu.copy"),
        icon: <Copy className="h-4 w-4" />,
        shortcut: "Ctrl+C",
        onClick: () => {
          setClipboard({ path: item.path, operation: "copy" });
        },
      },
      {
        id: "cut",
        label: t("fileExplorer.contextMenu.cut"),
        icon: <Scissors className="h-4 w-4" />,
        shortcut: "Ctrl+X",
        onClick: () => {
          setClipboard({ path: item.path, operation: "cut" });
        },
      },
      { id: "divider2", label: "", divider: true },
      {
        id: "rename",
        label: t("fileExplorer.contextMenu.rename"),
        icon: <Edit className="h-4 w-4" />,
        shortcut: "F2",
        onClick: () => {
          startRename(item);
        },
      },
      {
        id: "delete",
        label: t("fileExplorer.contextMenu.delete"),
        icon: <Trash2 className="h-4 w-4" />,
        danger: true,
        shortcut: "Del",
        onClick: () => {
          handleDelete(item);
        },
      },
      { id: "divider3", label: "", divider: true },
      {
        id: "properties",
        label: t("fileExplorer.contextMenu.properties"),
        icon: <Info className="h-4 w-4" />,
        onClick: () => {
          console.log("Properties:", item.path);
        },
      },
    ] : [
      {
        id: "newFolder",
        label: t("fileExplorer.contextMenu.newFolder"),
        icon: <FolderPlus className="h-4 w-4" />,
        onClick: () => {
          setCreatingFolder(true);
          setCreatingFile(false);
          setNewItemName("");
        },
      },
      {
        id: "newFile",
        label: t("fileExplorer.contextMenu.newFile"),
        icon: <FilePlus className="h-4 w-4" />,
        onClick: () => {
          setCreatingFile(true);
          setCreatingFolder(false);
          setNewItemName("");
        },
      },
      ...(clipboard && !showDrivesView ? [
        { id: "divider2", label: "", divider: true },
        {
          id: "paste",
          label: t("fileExplorer.contextMenu.paste"),
          icon: <Clipboard className="h-4 w-4" />,
          shortcut: "Ctrl+V",
          onClick: () => {
            handlePaste();
          },
        },
      ] : []),
      { id: "divider3", label: "", divider: true },
      !showDrivesView && {
        id: "view",
        label: t("fileExplorer.contextMenu.view"),
        icon: <Eye className="h-4 w-4" />,
        children: [
          {
            id: "view-large",
            label: t("fileExplorer.contextMenu.largeIcons"),
            checked: viewMode === "grid",
            onClick: () => setViewMode("grid"),
          },
          {
            id: "view-list",
            label: t("fileExplorer.contextMenu.details"),
            checked: viewMode === "list",
            onClick: () => setViewMode("list"),
          },
        ],
      },
      !showDrivesView && {
        id: "sort",
        label: t("fileExplorer.contextMenu.sortBy"),
        icon: <ArrowDownUp className="h-4 w-4" />,
        children: [
          {
            id: "sort-name",
            label: t("fileExplorer.contextMenu.name"),
            checked: sortBy === "name",
            onClick: () => setSortBy("name"),
          },
          {
            id: "sort-date",
            label: t("fileExplorer.contextMenu.date"),
            checked: sortBy === "date",
            onClick: () => setSortBy("date"),
          },
          {
            id: "sort-type",
            label: t("fileExplorer.contextMenu.type"),
            checked: sortBy === "type",
            onClick: () => setSortBy("type"),
          },
          {
            id: "sort-size",
            label: t("fileExplorer.contextMenu.size"),
            checked: sortBy === "size",
            onClick: () => setSortBy("size"),
          },
          { id: "divider-sort", label: "", divider: true },
          {
            id: "sort-asc",
            label: t("fileExplorer.contextMenu.ascending"),
            checked: sortOrder === "asc",
            onClick: () => setSortOrder("asc"),
          },
          {
            id: "sort-desc",
            label: t("fileExplorer.contextMenu.descending"),
            checked: sortOrder === "desc",
            onClick: () => setSortOrder("desc"),
          },
        ],
      },
      !showDrivesView && { id: "divider4", label: "", divider: true },
      {
        id: "refresh",
        label: t("fileExplorer.contextMenu.refresh"),
        icon: <RefreshCw className="h-4 w-4" />,
        shortcut: "F5",
        onClick: () => refreshDirectory(),
      },
    ].filter(Boolean) as ContextMenuItem[];

    showContextMenu(e.clientX, e.clientY, menuItems);
  }, [showContextMenu, navigateTo, refreshDirectory, currentPath, clipboard, showDrivesView, handleDelete, startRename, handlePaste, viewMode, sortBy, sortOrder, setViewMode, setSortBy, setSortOrder]);

  const handleBackgroundContextMenu = useCallback((e: MouseEvent) => {
    handleContextMenu(e);
  }, [handleContextMenu]);

  if (state === "minimized") {
    return null;
  }

  return (
    <AppWindow
      appId="explorer"
      title={t("fileExplorer.title")}
      icon={<Folder className="h-5 w-5 text-amber-500" />}
      defaultSize={{ width: 1000, height: 700 }}
      onMinimize={() => minimizeApp("explorer")}
      onClose={() => closeApp("explorer")}
      savedPosition={savedPosition}
      onPositionChange={(pos) => updateAppPosition("explorer", pos)}
      savedSize={savedSize}
      onSizeChange={(size) => updateAppSize("explorer", size)}
      isMaximized={maximized}
      onMaximize={() => maximizeApp("explorer")}
      onRestore={() => restoreApp("explorer")}
      isFocused={focused}
      onFocus={() => focusApp("explorer")}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/30">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-muted/50 hover:bg-muted"
            onClick={goUp}
            disabled={!canGoUp()}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-muted/50 hover:bg-muted"
            onClick={() => refreshDirectory()}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          
          <div className="flex-1 flex items-center bg-muted/50 rounded-md px-3 py-1.5 overflow-x-auto">
            {showDrivesView ? (
              <span className="text-sm text-muted-foreground">
                {isWindows ? t("fileExplorer.thisPC") : t("fileExplorer.computer")}
              </span>
            ) : pathParts.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                {isWindows ? t("fileExplorer.thisPC") : t("fileExplorer.computer")}
              </span>
            ) : (
              pathParts.map((part, index) => (
                <div key={index} className="flex items-center flex-shrink-0">
                  {index > 0 && <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs hover:bg-muted"
                    onClick={() => {
                      const parts = pathParts.slice(0, index + 1);
                      let newPath: string;
                      if (isWindows) {
                        newPath = parts[0] + "/" + parts.slice(1).join("/");
                        if (!newPath.endsWith("/")) newPath += "/";
                      } else {
                        newPath = "/" + parts.join("/");
                      }
                      navigateTo(newPath);
                    }}
                  >
                    {part}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="relative w-64 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("fileExplorer.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 bg-muted/50 border-0"
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-56 border-r border-border/50 bg-muted/20 overflow-y-auto flex-shrink-0">
            <div className="p-2">
              <button
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted/50 transition-colors mb-1",
                  showDrivesView && "bg-muted"
                )}
                onClick={() => navigateTo("")}
              >
                <Computer className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>{isWindows ? t("fileExplorer.thisPC") : t("fileExplorer.computer")}</span>
              </button>
              
              <div className="mt-1">
                <button
                  className="w-full flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setDrivesExpanded(!drivesExpanded)}
                >
                  {drivesExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <span>{isWindows ? t("fileExplorer.devicesAndDrives") : t("fileExplorer.storage")}</span>
                </button>
                
                {drivesExpanded && (
                  drives.length > 0 ? (
                    <div className="space-y-0.5 ml-1">
                      {drives.map((drive, index) => {
                        const normalizedDrivePath = drive.path.replace(/\\/g, "/");
                        const isExpanded = expandedPaths.has(normalizedDrivePath);
                        const subFolders = treeData.get(normalizedDrivePath) || [];
                        return (
                          <div key={index}>
                            <div
                              className={cn(
                                "w-full flex items-center gap-1 px-2 py-1.5 rounded text-sm hover:bg-muted/50 transition-colors cursor-pointer",
                                currentPath === drive.path && "bg-muted"
                              )}
                            >
                              <button
                                className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-muted rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  toggleExpand(normalizedDrivePath);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                              </button>
                              <button
                                className="flex items-center gap-1 flex-1 text-left"
                                onClick={() => navigateTo(drive.path)}
                              >
                                <HardDrive className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{drive.name}</span>
                              </button>
                            </div>
                            {isExpanded && (
                              <div>
                                {subFolders.map((subItem, subIndex) => (
                                  <FolderTreeItem
                                    key={subIndex}
                                    item={subItem}
                                    currentPath={currentPath}
                                    expandedPaths={expandedPaths}
                                    treeData={treeData}
                                    onToggle={toggleExpand}
                                    onNavigate={navigateTo}
                                    level={1}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center ml-1">
                      {t("fileExplorer.noDrives")}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/10">
              <div className="flex items-center gap-1">
                {!showDrivesView && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 hover:bg-muted"
                      onClick={() => {
                        setCreatingFolder(true);
                        setCreatingFile(false);
                        setNewItemName("");
                      }}
                    >
                      <FolderPlus className="h-4 w-4 mr-1" />
                      <span className="text-xs">{t("fileExplorer.toolbar.new")}</span>
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted"
                  disabled={!selectedPath || showDrivesView}
                  onClick={() => {
                    if (selectedPath) {
                      setClipboard({ path: selectedPath, operation: "cut" });
                    }
                  }}
                >
                  <Scissors className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted"
                  disabled={!selectedPath || showDrivesView}
                  onClick={() => {
                    if (selectedPath) {
                      setClipboard({ path: selectedPath, operation: "copy" });
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted"
                  disabled={!clipboard || showDrivesView}
                  onClick={handlePaste}
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted text-red-500 hover:text-red-600"
                  disabled={!selectedPath || showDrivesView}
                  onClick={() => {
                    if (selectedPath) {
                      const item = items.find(i => i.path === selectedPath);
                      if (item) handleDelete(item);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 hover:bg-muted"
                  disabled={showDrivesView}
                  onClick={() => {
                    const orders = ["asc", "desc"] as const;
                    const nextOrder = orders[(orders.indexOf(sortOrder) + 1) % orders.length];
                    setSortOrder(nextOrder);
                  }}
                >
                  <ArrowDownUp className="h-4 w-4 mr-1" />
                  <span className="text-xs">{t("fileExplorer.toolbar.sort")}</span>
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div 
              className="flex-1 overflow-auto p-4"
              onContextMenu={handleBackgroundContextMenu}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  {t("common.loading")}
                </div>
              ) : showDrivesView ? (
                <div className="flex flex-col h-full overflow-auto p-4">
                  <div className="flex flex-wrap gap-4">
                    {drives.length > 0 ? (
                      drives.map((drive, index) => (
                        <button
                          key={index}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-left w-[280px]"
                          onClick={() => navigateTo(drive.path)}
                        >
                          <HardDrive className="h-10 w-10 text-blue-500 flex-shrink-0" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate">{drive.name}</span>
                            <div className="w-full h-1.5 bg-muted rounded-full mt-2 mb-1">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${drive.total > 0 ? (drive.used / drive.total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatSize(drive.free)} free of {formatSize(drive.total)}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground w-full">
                        <HardDrive className="h-12 w-12 mb-2 opacity-30" />
                        <p className="text-sm">{t("fileExplorer.noDrives")}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : filteredItems.length === 0 && !creatingFolder && !creatingFile ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mb-2 opacity-30" />
                  <p className="text-sm">{t("fileExplorer.noFiles")}</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-6 gap-2">
                  {creatingFolder && (
                    <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                      <Folder className="h-10 w-10 text-amber-500 mb-1" />
                      <div className="flex items-center gap-1 w-full">
                        <Input
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="Folder name"
                          className="h-6 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateFolder();
                            if (e.key === "Escape") {
                              setCreatingFolder(false);
                              setNewItemName("");
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleCreateFolder}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => {
                            setCreatingFolder(false);
                            setNewItemName("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {creatingFile && (
                    <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                      <File className="h-10 w-10 text-gray-500 mb-1" />
                      <div className="flex items-center gap-1 w-full">
                        <Input
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="File name"
                          className="h-6 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateFile();
                            if (e.key === "Escape") {
                              setCreatingFile(false);
                              setNewItemName("");
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleCreateFile}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => {
                            setCreatingFile(false);
                            setNewItemName("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {filteredItems.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
                        selectedPath === item.path && "bg-muted",
                        clipboard?.path === item.path && clipboard.operation === "cut" && "opacity-50"
                      )}
                      onDoubleClick={() => handleFileOpen(item)}
                      onClick={() => setSelectedPath(item.path)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                    >
                      {renamingItem?.path === item.path ? (
                        <>
                          {item.is_dir ? (
                            <Folder className="h-10 w-10 text-amber-500 mb-1" />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center">
                              {getFileIcon(item)}
                            </div>
                          )}
                          <div className="flex items-center gap-1 w-full">
                            <Input
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="h-6 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename();
                                if (e.key === "Escape") {
                                  setRenamingItem(null);
                                  setNewName("");
                                }
                              }}
                            />
                            <Button
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRename();
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          {item.is_dir ? (
                            <Folder className="h-10 w-10 text-amber-500 mb-1" />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center">
                              {getFileIcon(item)}
                            </div>
                          )}
                          <span className="text-xs text-center truncate w-full">{item.name}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2">Modified</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2 text-right">Size</div>
                  </div>
                  {creatingFolder && (
                    <div className="w-full grid grid-cols-12 gap-2 px-3 py-2 text-sm rounded-md bg-muted">
                      <div className="col-span-6 flex items-center gap-2">
                        <Folder className="h-4 w-4 text-amber-500" />
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Folder name"
                            className="h-6 text-xs flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateFolder();
                              if (e.key === "Escape") {
                                setCreatingFolder(false);
                                setNewItemName("");
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleCreateFolder}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              setCreatingFolder(false);
                              setNewItemName("");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-2" />
                      <div className="col-span-2" />
                      <div className="col-span-2" />
                    </div>
                  )}
                  {creatingFile && (
                    <div className="w-full grid grid-cols-12 gap-2 px-3 py-2 text-sm rounded-md bg-muted">
                      <div className="col-span-6 flex items-center gap-2">
                        <File className="h-4 w-4 text-gray-500" />
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="File name"
                            className="h-6 text-xs flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateFile();
                              if (e.key === "Escape") {
                                setCreatingFile(false);
                                setNewItemName("");
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleCreateFile}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              setCreatingFile(false);
                              setNewItemName("");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-2" />
                      <div className="col-span-2" />
                      <div className="col-span-2" />
                    </div>
                  )}
                  {filteredItems.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-full grid grid-cols-12 gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted/50 transition-colors cursor-pointer",
                        selectedPath === item.path && "bg-muted",
                        clipboard?.path === item.path && clipboard.operation === "cut" && "opacity-50"
                      )}
                      onDoubleClick={() => handleFileOpen(item)}
                      onClick={() => setSelectedPath(item.path)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                    >
                      {renamingItem?.path === item.path ? (
                        <>
                          <div className="col-span-6 flex items-center gap-2">
                            {getFileIcon(item)}
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="h-6 text-xs flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRename();
                                  if (e.key === "Escape") {
                                    setRenamingItem(null);
                                    setNewName("");
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRename();
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="col-span-2" />
                          <div className="col-span-2" />
                          <div className="col-span-2" />
                        </>
                      ) : (
                        <>
                          <div className="col-span-6 flex items-center gap-2 truncate">
                            {getFileIcon(item)}
                            <span className="truncate">{item.name}</span>
                          </div>
                          <div className="col-span-2 text-muted-foreground text-xs self-center">
                            {formatDate(item.modified)}
                          </div>
                          <div className="col-span-2 text-muted-foreground text-xs self-center">
                            {item.is_dir ? "Folder" : item.name.split(".").pop()?.toUpperCase() || "File"}
                          </div>
                          <div className="col-span-2 text-right text-muted-foreground text-xs self-center">
                            {item.is_dir ? "-" : formatSize(item.size)}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{showDrivesView ? `${drives.length} drives` : `${filteredItems.length} items`}</span>
            {!showDrivesView && diskInfo && (
              <span>
                {formatSize(diskInfo.free)} free of {formatSize(diskInfo.total)}
              </span>
            )}
            {clipboard && (
              <span className="text-blue-500">
                {clipboard.operation === "copy" ? "Copied" : "Cut"}: {clipboard.path.split("/").pop()}
              </span>
            )}
          </div>
          {selectedPath && (
            <span>Selected: {selectedPath}</span>
          )}
        </div>
      </div>
    </AppWindow>
  );
}
