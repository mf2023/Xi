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

import { create } from "zustand";
import type { FileItem, DiskInfo, DriveInfo } from "@/lib/api/explorer-ws";
import { PiscesL1ExplorerWS, explorerWS, type ExplorerServerMessage } from "@/lib/api/explorer-ws";

interface ExplorerState {
  currentPath: string;
  items: FileItem[];
  diskInfo: DiskInfo | null;
  drives: DriveInfo[];
  isWindows: boolean;
  isLoading: boolean;
  error: string | null;
  ws: PiscesL1ExplorerWS | null;
  isWsConnected: boolean;
  selectedPath: string | null;
  clipboard: { path: string; operation: "copy" | "cut" } | null;

  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  getDrives: () => void;
  browse: (path: string) => void;
  clearPath: () => void;
  createFolder: (path: string) => void;
  createFile: (path: string, content: string) => void;
  deleteItem: (path: string) => void;
  renameItem: (oldPath: string, newPath: string) => void;
  copyItem: (source: string, dest: string) => void;
  moveItem: (source: string, dest: string) => void;
  setSelectedPath: (path: string | null) => void;
  setClipboard: (path: string, operation: "copy" | "cut") => void;
  clearClipboard: () => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  currentPath: "",
  items: [],
  diskInfo: null,
  drives: [],
  isWindows: false,
  isLoading: false,
  error: null,
  ws: null,
  isWsConnected: false,
  selectedPath: null,
  clipboard: null,

  connectWebSocket: async () => {
    const existingWs = get().ws;
    if (existingWs && existingWs.isConnected) {
      return;
    }

    const ws = new PiscesL1ExplorerWS();

    ws.onConnect(() => {
      set({ isWsConnected: true, error: null, isLoading: false });
      ws.getDrives();
    });

    ws.onDisconnect(() => {
      set({ isWsConnected: false });
    });

    ws.on("drives", (msg: ExplorerServerMessage) => {
      if (msg.type === "drives") {
        set({
          drives: msg.drives,
          isWindows: msg.is_windows,
          isLoading: false,
        });
        if (msg.drives.length > 0 && !get().currentPath) {
          ws.browse(msg.drives[0].path);
        }
      }
    });

    ws.on("directory", (msg: ExplorerServerMessage) => {
      if (msg.type === "directory") {
        const storePath = get().currentPath;
        const normalizePath = (p: string) => {
          let normalized = p.replace(/\\/g, "/");
          if (normalized.length > 1 && normalized.endsWith("/")) {
            normalized = normalized.slice(0, -1);
          }
          return normalized;
        };
        
        const normalizedStorePath = normalizePath(storePath);
        const msgPath = normalizePath(msg.path);
        
        if (msgPath === normalizedStorePath) {
          set({
            items: msg.items,
            diskInfo: msg.disk || null,
            isWindows: msg.is_windows || false,
            isLoading: false,
          });
        }
      }
    });

    ws.on("operation_result", (msg: ExplorerServerMessage) => {
      if (msg.type === "operation_result") {
        if (msg.success) {
          ws.browse(get().currentPath);
        } else {
          set({ error: msg.error || "Operation failed" });
        }
      }
    });

    ws.on("error", (msg: ExplorerServerMessage) => {
      if (msg.type === "error") {
        set({ error: msg.message });
      }
    });

    try {
      set({ isLoading: true });
      await ws.connect();
      set({ ws });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  disconnectWebSocket: () => {
    const ws = get().ws;
    if (ws) {
      ws.disconnect();
      set({ ws: null, isWsConnected: false });
    }
  },

  getDrives: () => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      ws.getDrives();
    } else {
      set({ error: "WebSocket not connected" });
    }
  },

  browse: (path) => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      const normalizedPath = path.replace(/\\/g, "/");
      set({ isLoading: true, currentPath: normalizedPath });
      ws.browse(normalizedPath);
    } else {
      set({ error: "WebSocket not connected" });
    }
  },

  clearPath: () => {
    set({ currentPath: "", items: [], isLoading: false });
  },

  createFolder: (path) => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      ws.createFolder(path);
    } else {
      set({ error: "WebSocket not connected" });
    }
  },

  createFile: (path, content) => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      ws.createFile(path, content);
    } else {
      set({ error: "WebSocket not connected" });
    }
  },

  deleteItem: (path) => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      ws.deleteItem(path);
    } else {
      set({ error: "WebSocket not connected" });
    }
  },

  renameItem: (oldPath, newPath) => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      ws.renameItem(oldPath, newPath);
    } else {
      set({ error: "WebSocket not connected" });
    }
  },

  copyItem: (source, dest) => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      ws.copyItem(source, dest);
    } else {
      set({ error: "WebSocket not connected" });
    }
  },

  moveItem: (source, dest) => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      ws.moveItem(source, dest);
    } else {
      set({ error: "WebSocket not connected" });
    }
  },

  setSelectedPath: (path) => {
    set({ selectedPath: path });
  },

  setClipboard: (path, operation) => {
    set({ clipboard: { path, operation } });
  },

  clearClipboard: () => {
    set({ clipboard: null });
  },
}));
