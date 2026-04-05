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
import { persist } from "zustand/middleware";
import type {
  XiConfig,
  XiPathsConfig,
  XiCommandConfig,
} from "@/types/config";
import { apiClient } from "@/lib/api/client";

interface ConfigState {
  config: XiConfig | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchConfig: () => Promise<void>;
  fetchPaths: () => Promise<XiPathsConfig | null>;
  fetchCommands: () => Promise<Record<string, XiCommandConfig> | null>;
  fetchCommand: (name: string) => Promise<XiCommandConfig | null>;

  setTheme: (theme: "light" | "dark" | "system") => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  reset: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000;

const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3140";
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      config: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchConfig: async () => {
        const state = get();
        if (
          state.lastFetched &&
          Date.now() - state.lastFetched < CACHE_DURATION &&
          state.config !== null
        ) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${getApiBaseUrl()}/v1/xi/config`,
            {
              headers: {
                Authorization: `Bearer ${apiClient.getHandshakeState().token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch config: ${response.statusText}`);
          }

          const data = await response.json();

          set({
            config: {
              project: data.project,
              paths: data.paths,
              api: data.api,
              ui: data.ui,
              notifications: data.notifications,
              commands: data.commands || {},
            },
            lastFetched: Date.now(),
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to fetch config",
            isLoading: false,
          });
        }
      },

      fetchPaths: async () => {
        try {
          const response = await fetch(
            `${getApiBaseUrl()}/v1/xi/paths`,
            {
              headers: {
                Authorization: `Bearer ${apiClient.getHandshakeState().token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch paths: ${response.statusText}`);
          }

          const data = await response.json();
          return data as XiPathsConfig;
        } catch (error) {
          console.error("Failed to fetch paths:", error);
          return null;
        }
      },

      fetchCommands: async () => {
        try {
          const response = await fetch(
            `${getApiBaseUrl()}/v1/xi/commands`,
            {
              headers: {
                Authorization: `Bearer ${apiClient.getHandshakeState().token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch commands: ${response.statusText}`);
          }

          const data = await response.json();
          return data.commands as Record<string, XiCommandConfig>;
        } catch (error) {
          console.error("Failed to fetch commands:", error);
          return null;
        }
      },

      fetchCommand: async (name: string) => {
        try {
          const response = await fetch(
            `${getApiBaseUrl()}/v1/xi/commands/${name}`,
            {
              headers: {
                Authorization: `Bearer ${apiClient.getHandshakeState().token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch command: ${response.statusText}`);
          }

          const data = await response.json();
          return data as XiCommandConfig;
        } catch (error) {
          console.error(`Failed to fetch command ${name}:`, error);
          return null;
        }
      },

      setTheme: (theme: "light" | "dark" | "system") => {
        set((state) => {
          if (!state.config) return state;
          return {
            config: {
              ...state.config,
              ui: {
                ...state.config.ui,
                theme,
              },
            },
          };
        });
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set((state) => {
          if (!state.config) return state;
          return {
            config: {
              ...state.config,
              ui: {
                ...state.config.ui,
                sidebar_collapsed: collapsed,
              },
            },
          };
        });
      },

      reset: () => {
        set({
          config: null,
          isLoading: false,
          error: null,
          lastFetched: null,
        });
      },
    }),
    {
      name: "xi-config-storage",
      partialize: (state) => ({
        config: state.config ? {
          ui: state.config.ui,
        } : null,
      }),
    }
  )
);

export function useTheme() {
  const { config, setTheme } = useConfigStore();

  const applyTheme = (theme: "light" | "dark" | "system") => {
    setTheme(theme);

    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  };

  return {
    theme: config?.ui.theme ?? "system",
    setTheme: applyTheme,
  };
}
