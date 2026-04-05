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
import { statusWS, StatusNotification, StatusServerMessage, NetworkType, WifiNetwork } from "@/lib/api/status-ws";

let handlersRegistered = false;

const registerHandlers = (set: any) => {
  if (handlersRegistered) return;
  handlersRegistered = true;

  const handleMessage = (message: StatusServerMessage) => {
    switch (message.type) {
      case "status":
        set({
          volume: message.volume,
          muted: message.muted,
          networkType: message.network_type,
          networkEnabled: message.network_enabled,
          bluetooth: message.bluetooth,
        });
        break;

      case "notifications":
        set({
          notifications: message.notifications,
          unreadCount: message.unread_count,
        });
        break;

      case "notification_new":
        set((state: any) => ({
          notifications: [message.notification, ...state.notifications],
          unreadCount: state.unreadCount + (message.notification.read ? 0 : 1),
        }));
        break;

      case "notification_created":
        set((state: any) => ({
          notifications: [message.notification, ...state.notifications],
          unreadCount: state.unreadCount + (message.notification.read ? 0 : 1),
        }));
        break;

      case "notification_update":
        set((state: any) => ({
          notifications: state.notifications.map((n: any) =>
            n.id === message.id ? { ...n, read: message.read } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
        break;

      case "notification_delete":
        set((state: any) => {
          const deleted = state.notifications.find((n: any) => n.id === message.id);
          return {
            notifications: state.notifications.filter((n: any) => n.id !== message.id),
            unreadCount: Math.max(0, state.unreadCount - (deleted && !deleted.read ? 1 : 0)),
          };
        });
        break;

      case "notifications_cleared":
        set({
          notifications: [],
          unreadCount: 0,
        });
        break;

      case "wifi_networks":
        set({
          wifiNetworks: message.networks,
          connectedSsid: message.connected_ssid,
        });
        break;

      case "error":
        console.error("[Status Store] Error:", message.message);
        break;
    }
  };

  statusWS.on("*", handleMessage);

  statusWS.onConnect(() => {
    set({ isConnected: true });
    statusWS.getStatus();
    statusWS.getNotifications();
  });

  statusWS.onDisconnect(() => {
    set({ isConnected: false });
  });
};

interface StatusState {
  volume: number;
  muted: boolean;
  networkType: NetworkType;
  networkEnabled: boolean;
  bluetooth: boolean;
  notifications: StatusNotification[];
  unreadCount: number;
  isConnected: boolean;
  wifiNetworks: WifiNetwork[];
  connectedSsid: string;

  connect: () => Promise<void>;
  disconnect: () => void;

  setVolume: (value: number) => void;
  setMuted: (value: boolean) => void;
  setNetwork: (enabled: boolean) => void;
  refreshNetwork: () => void;
  setBluetooth: (enabled: boolean) => void;

  getNotifications: () => void;
  markRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  getWifiNetworks: () => void;
}

export const useStatusStore = create<StatusState>((set, get) => ({
  volume: 75,
  muted: false,
  networkType: "none",
  networkEnabled: false,
  bluetooth: false,
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  wifiNetworks: [],
  connectedSsid: "",

  connect: async () => {
    registerHandlers(set);
    try {
      await statusWS.connect();
    } catch (error) {
      console.error("[Status Store] Failed to connect:", error);
    }
  },

  disconnect: () => {
    statusWS.disconnect();
    set({ isConnected: false });
  },

  setVolume: (value: number) => {
    statusWS.setVolume(value);
    set({ volume: value });
  },

  setMuted: (value: boolean) => {
    statusWS.setMuted(value);
    set({ muted: value });
  },

  setNetwork: (enabled: boolean) => {
    statusWS.setNetwork(enabled);
    set({ networkEnabled: enabled });
  },

  refreshNetwork: () => {
    statusWS.refreshNetwork();
  },

  setBluetooth: (enabled: boolean) => {
    statusWS.setBluetooth(enabled);
    set({ bluetooth: enabled });
  },

  getNotifications: () => {
    statusWS.getNotifications();
  },

  markRead: (id: string) => {
    statusWS.markRead(id);
  },

  deleteNotification: (id: string) => {
    statusWS.deleteNotification(id);
  },

  clearNotifications: () => {
    statusWS.clearNotifications();
  },

  getWifiNetworks: () => {
    statusWS.getWifiNetworks();
  },
}));
