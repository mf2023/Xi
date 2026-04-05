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

export type NetworkType = "ethernet" | "wifi" | "mobile" | "none";

export interface WifiNetwork {
  ssid: string;
  signal: number;
  secured: boolean;
  connected: boolean;
}

export interface StatusNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  time: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

export type StatusClientMessage =
  | { type: "get_status" }
  | { type: "set_volume"; value: number }
  | { type: "set_muted"; value: boolean }
  | { type: "set_network"; enabled: boolean }
  | { type: "refresh_network" }
  | { type: "set_bluetooth"; enabled: boolean }
  | { type: "get_notifications" }
  | { type: "create_notification"; notification_type: string; title: string; message: string; metadata?: Record<string, unknown> }
  | { type: "mark_read"; id: string }
  | { type: "delete_notification"; id: string }
  | { type: "clear_notifications" }
  | { type: "get_wifi_networks" };

export type StatusServerMessage =
  | { type: "status"; volume: number; muted: boolean; network_type: NetworkType; network_enabled: boolean; bluetooth: boolean }
  | { type: "notifications"; notifications: StatusNotification[]; unread_count: number }
  | { type: "notification_new"; notification: StatusNotification }
  | { type: "notification_created"; notification: StatusNotification }
  | { type: "notification_update"; id: string; read: boolean }
  | { type: "notification_delete"; id: string }
  | { type: "notifications_cleared" }
  | { type: "wifi_networks"; networks: WifiNetwork[]; connected_ssid: string }
  | { type: "error"; message: string };

type StatusMessageHandler = (message: StatusServerMessage) => void;
type ConnectionHandler = () => void;

export class PiscesL1StatusWS {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, Set<StatusMessageHandler>> = new Map();
  private onConnectHandlers: Set<ConnectionHandler> = new Set();
  private onDisconnectHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private shouldReconnect: boolean = true;

  constructor(url?: string) {
    if (url) {
      this.url = url;
    } else {
      this.url = "ws://127.0.0.1:3140/ws/status";
    }
  }

  connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return new Promise((resolve, reject) => {
        const onOpen = () => {
          this.ws?.removeEventListener("open", onOpen);
          this.ws?.removeEventListener("error", onError);
          resolve();
        };
        const onError = (e: Event) => {
          this.ws?.removeEventListener("open", onOpen);
          this.ws?.removeEventListener("error", onError);
          reject(new Error("WebSocket connection failed"));
        };
        this.ws?.addEventListener("open", onOpen);
        this.ws?.addEventListener("error", onError);
      });
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`[Status WS] Connecting to WebSocket at: ${this.url}`);
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          console.log(`[Status WS] Connected successfully`);
          this.onConnectHandlers.forEach((handler) => handler());
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log(`[Status WS] Disconnected. Code: ${event.code}, Reason: ${event.reason}`);
          this.onDisconnectHandlers.forEach((handler) => handler());
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[Status WS] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.ws.onerror = (error) => {
          console.error(`[Status WS] Connection error:`, error);
          const errorMsg = error instanceof Event ? "Failed to connect to WebSocket server" : String(error);
          console.error(`[Status WS] Error message: ${errorMsg}`);
          reject(new Error(errorMsg));
        };

        this.ws.onmessage = (event) => {
          try {
            const message: StatusServerMessage = JSON.parse(event.data);
            const handlers = this.handlers.get(message.type);
            if (handlers) {
              handlers.forEach((handler) => handler(message));
            }
            const allHandlers = this.handlers.get("*");
            if (allHandlers) {
              allHandlers.forEach((handler) => handler(message));
            }
          } catch (e) {
            console.error("Failed to parse Status WebSocket message:", e);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: StatusClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("Status WebSocket is not connected");
    }
  }

  on(type: StatusServerMessage["type"] | "*", handler: StatusMessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off(type: StatusServerMessage["type"] | "*", handler: StatusMessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  onConnect(handler: ConnectionHandler): void {
    this.onConnectHandlers.add(handler);
  }

  offConnect(handler: ConnectionHandler): void {
    this.onConnectHandlers.delete(handler);
  }

  onDisconnect(handler: ConnectionHandler): void {
    this.onDisconnectHandlers.add(handler);
  }

  offDisconnect(handler: ConnectionHandler): void {
    this.onDisconnectHandlers.delete(handler);
  }

  getStatus(): void {
    this.send({ type: "get_status" });
  }

  setVolume(value: number): void {
    this.send({ type: "set_volume", value });
  }

  setMuted(value: boolean): void {
    this.send({ type: "set_muted", value });
  }

  setNetwork(enabled: boolean): void {
    this.send({ type: "set_network", enabled });
  }

  refreshNetwork(): void {
    this.send({ type: "refresh_network" });
  }

  setBluetooth(enabled: boolean): void {
    this.send({ type: "set_bluetooth", enabled });
  }

  getNotifications(): void {
    this.send({ type: "get_notifications" });
  }

  createNotification(notificationType: string, title: string, message: string, metadata?: Record<string, unknown>): void {
    this.send({ type: "create_notification", notification_type: notificationType, title, message, metadata });
  }

  markRead(id: string): void {
    this.send({ type: "mark_read", id });
  }

  deleteNotification(id: string): void {
    this.send({ type: "delete_notification", id });
  }

  clearNotifications(): void {
    this.send({ type: "clear_notifications" });
  }

  getWifiNetworks(): void {
    this.send({ type: "get_wifi_networks" });
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const statusWS = new PiscesL1StatusWS();
