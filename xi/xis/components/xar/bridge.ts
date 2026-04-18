/**
 * Copyright © 2026 Wenze Wei. All Rights Reserved.
 *
 * This file is part of Xi.
 * The Xi project belongs to the Dunimd Team.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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

import { XARMessage } from "./types";

type EventHandler = (message: XARMessage) => void;

export class XARBridge {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private isIntentionallyClosed = false;

  constructor(url = "ws://127.0.0.1:3140/xar") {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isIntentionallyClosed = false;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.emit({ type: "connected" });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: XARMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch {
            this.emit({ type: "raw", payload: event.data });
          }
        };

        this.ws.onerror = (error) => {
          this.emit({ type: "error", payload: error });
          reject(error);
        };

        this.ws.onclose = () => {
          this.emit({ type: "disconnected" });
          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: XARMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.emit({ type: "send_failed", payload: message });
    }
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  private handleMessage(message: XARMessage): void {
    this.emit(message);
  }

  private emit(message: XARMessage): void {
    this.eventHandlers.get(message.type)?.forEach((handler) => {
      handler(message);
    });
    this.eventHandlers.get("*")?.forEach((handler) => {
      handler(message);
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit({ type: "reconnect_failed" });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
