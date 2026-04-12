import { XARBridge, XARMessage } from "@/components/xar/bridge";
import { FileItem, DriveInfo, FileOperationResult } from "./types";

export class ExplorerAPI {
  private bridge: XARBridge;

  constructor(bridge: XARBridge) {
    this.bridge = bridge;
  }

  async listDirectory(path: string): Promise<FileItem[]> {
    return new Promise((resolve, reject) => {
      const message: XARMessage = {
        type: "explorer:list",
        payload: { path },
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Request timeout"));
      }, 10000);

      const cleanup = this.bridge.on("explorer:list:result", (msg: XARMessage) => {
        clearTimeout(timeout);
        resolve(msg.payload as FileItem[]);
      });

      this.bridge.send(message);
    });
  }

  async createItem(path: string, isDirectory: boolean, content: string = ""): Promise<FileOperationResult> {
    return new Promise((resolve, reject) => {
      const message: XARMessage = {
        type: isDirectory ? "explorer:createFolder" : "explorer:createFile",
        payload: { path, content },
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Request timeout"));
      }, 10000);

      const cleanup = this.bridge.on("explorer:create:result", (msg: XARMessage) => {
        clearTimeout(timeout);
        const payload = msg.payload as { success: boolean; error?: string };
        resolve({
          success: payload.success,
          error: payload.error,
          path,
        });
      });

      this.bridge.send(message);
    });
  }

  async deleteItem(path: string): Promise<FileOperationResult> {
    return new Promise((resolve, reject) => {
      const message: XARMessage = {
        type: "explorer:delete",
        payload: { path },
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Request timeout"));
      }, 10000);

      const cleanup = this.bridge.on("explorer:delete:result", (msg: XARMessage) => {
        clearTimeout(timeout);
        const payload = msg.payload as { success: boolean; error?: string };
        resolve({
          success: payload.success,
          error: payload.error,
          path,
        });
      });

      this.bridge.send(message);
    });
  }

  async renameItem(oldPath: string, newPath: string): Promise<FileOperationResult> {
    return new Promise((resolve, reject) => {
      const message: XARMessage = {
        type: "explorer:rename",
        payload: { oldPath, newPath },
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Request timeout"));
      }, 10000);

      const cleanup = this.bridge.on("explorer:rename:result", (msg: XARMessage) => {
        clearTimeout(timeout);
        const payload = msg.payload as { success: boolean; error?: string };
        resolve({
          success: payload.success,
          error: payload.error,
          path: newPath,
        });
      });

      this.bridge.send(message);
    });
  }

  async getDrives(): Promise<DriveInfo[]> {
    return new Promise((resolve, reject) => {
      const message: XARMessage = {
        type: "explorer:drives",
        payload: {},
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Request timeout"));
      }, 10000);

      const cleanup = this.bridge.on("explorer:drives:result", (msg: XARMessage) => {
        clearTimeout(timeout);
        resolve(msg.payload as DriveInfo[]);
      });

      this.bridge.send(message);
    });
  }

  subscribe(event: string, handler: (msg: XARMessage) => void): () => void {
    return this.bridge.on(event, handler);
  }

  isConnected(): boolean {
    return this.bridge.isConnected;
  }
}
