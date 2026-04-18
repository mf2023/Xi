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

"use client";

import { useEffect, useRef, useMemo, useState, useCallback, createContext, useContext, ReactNode } from "react";
import { XARBridge } from "../bridge";
import { AppWindow } from "./AppWindow";

type AppState = "closed" | "minimized" | "normal" | "maximized";

interface AppPosition {
  x: number;
  y: number;
}

interface WindowConfig {
  id: string;
  title?: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

interface XARManifest {
  id: string;
  name: string;
  version: string;
  icon?: string;
  description?: string;
  windows: WindowConfig[];
}

interface XARUI {
  entry: string;
  components: Record<string, string>;
}

interface XARLogic {
  entry: string;
  modules: Record<string, string>;
}

interface XARLoadedApp {
  manifest: XARManifest;
  ui: XARUI;
  logic: XARLogic;
}

interface XARApp {
  id: string;
  name: string;
  icon?: string;
  state: AppState;
  position: AppPosition | null;
  size: { width: number; height: number } | null;
  manifest?: XARManifest;
  loadedApp?: XARLoadedApp;
}

interface XARContextType {
  apps: XARApp[];
  runningApps: XARApp[];
  loadedApps: Map<string, XARLoadedApp>;
  focusedAppId: string | null;
  loadApp: (id: string) => Promise<boolean>;
  closeApp: (id: string) => void;
  minimizeApp: (id: string) => void;
  maximizeApp: (id: string) => void;
  restoreApp: (id: string) => void;
  focusApp: (id: string) => void;
  isAppMaximized: (id: string) => boolean;
  isAppFocused: (id: string) => boolean;
  isAppRunning: (id: string) => boolean;
  getAppPosition: (id: string) => AppPosition | null;
  getAppSize: (id: string) => { width: number; height: number } | null;
  updateAppPosition: (id: string, position: AppPosition) => void;
  updateAppSize: (id: string, size: { width: number; height: number }) => void;
}

const XARContext = createContext<XARContextType | undefined>(undefined);

export function XARProvider({ children }: { children: ReactNode }) {
  const bridge = useMemo(() => {
    const newBridge = new XARBridge();
    console.log('Created new XARBridge instance');
    return newBridge;
  }, []);

  const [apps, setApps] = useState<XARApp[]>([
    { id: "monitor", name: "System Monitor", icon: "activity", state: "closed", position: null, size: null },
    { id: "explorer", name: "File Explorer", icon: "folder", state: "closed", position: null, size: null },
    { id: "inference", name: "AI Inference", icon: "sparkles", state: "closed", position: null, size: null },
    { id: "run_orchestrator", name: "Run Orchestrator", icon: "play", state: "closed", position: null, size: null },
  ]);

  const [loadedApps, setLoadedApps] = useState<Map<string, XARLoadedApp>>(new Map());
  const [focusedAppId, setFocusedAppId] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    bridge.connect()
      .then(() => {
        setIsConnected(true);
        bridge.send({ type: "xar.list" });
      })
      .catch((error) => {
        console.error("Failed to connect to XAR WebSocket:", error);
        setIsConnected(false);
      });

    const unsubConnected = bridge.on("connected", () => {
      setIsConnected(true);
      bridge.send({ type: "xar.list" });
    });

    const unsubDisconnected = bridge.on("disconnected", () => {
      setIsConnected(false);
    });

    const unsubListResp = bridge.on("xar.list.response", (msg) => {
      const payload = msg.payload as { apps: Array<{ id: string; name: string; icon?: string }> };
      if (payload?.apps) {
        setApps((prev) =>
          prev.map((app) => {
            const info = payload.apps.find((a) => a.id === app.id);
            if (info) {
              return { ...app, name: info.name, icon: info.icon };
            }
            return app;
          })
        );
      }
    });

    const unsubLoadSuccess = bridge.on("xar.load.success", (msg) => {
      const payload = msg.payload as {
        app: string;
        manifest: XARManifest;
        ui: XARUI;
        logic: XARLogic;
      };
      if (payload?.app && payload.manifest) {
        setLoadedApps((prev) => new Map(prev).set(payload.app, {
          manifest: payload.manifest,
          ui: payload.ui,
          logic: payload.logic,
        }));
        setApps((prev) =>
          prev.map((app) =>
            app.id === payload.app
              ? { ...app, manifest: payload.manifest }
              : app
          )
        );
      }
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubListResp();
      unsubLoadSuccess();
      bridge.disconnect();
    };
  }, [bridge]);

  const loadApp = useCallback(async (id: string): Promise<boolean> => {
    const existing = loadedApps.get(id);
    if (existing) {
      setFocusedAppId(id);
      setApps((prev) =>
        prev.map((app) =>
          app.id === id && app.state === "closed"
            ? { ...app, state: "normal" }
            : app
        )
      );
      return true;
    }

    setApps((prev) =>
      prev.map((app) =>
        app.id === id && app.state === "closed"
          ? { ...app, state: "normal" }
          : app
      )
    );
    setFocusedAppId(id);
    
    // Create a mock loaded app to display the UI without waiting for WebSocket response
    const mockLoadedApp: XARLoadedApp = {
      manifest: {
        id: id,
        name: apps.find(a => a.id === id)?.name || id,
        version: "1.0.0",
        icon: apps.find(a => a.id === id)?.icon,
        description: "Mock app for testing",
        windows: [{
          id: "main",
          title: apps.find(a => a.id === id)?.name || id,
          width: 800,
          height: 600
        }]
      },
      ui: {
        entry: "mock://ui/entry",
        components: {}
      },
      logic: {
        entry: "mock://logic/entry",
        modules: {}
      }
    };
    
    setLoadedApps((prev) => new Map(prev).set(id, mockLoadedApp));
    setApps((prev) =>
      prev.map((app) =>
        app.id === id
          ? { ...app, manifest: mockLoadedApp.manifest }
          : app
      )
    );
    
    // Still try to load via WebSocket for real functionality
    bridge.send({ type: "xar.load", app: id });
    return true;
  }, [bridge, loadedApps, apps]);

  const closeApp = useCallback((id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id
          ? { ...app, state: "closed", position: null, size: null }
          : app
      )
    );
    if (focusedAppId === id) {
      setFocusedAppId(null);
    }
  }, [focusedAppId]);

  const minimizeApp = useCallback((id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, state: "minimized" } : app
      )
    );
    if (focusedAppId === id) {
      setFocusedAppId(null);
    }
  }, [focusedAppId]);

  const maximizeApp = useCallback((id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, state: "maximized" } : app
      )
    );
    setFocusedAppId(id);
  }, []);

  const restoreApp = useCallback((id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, state: "normal" } : app
      )
    );
    setFocusedAppId(id);
  }, []);

  const focusApp = useCallback((id: string) => {
    setFocusedAppId(id);
  }, []);

  const isAppMaximized = useCallback(
    (id: string) => {
      const app = apps.find((a) => a.id === id);
      return app?.state === "maximized";
    },
    [apps]
  );

  const isAppFocused = useCallback(
    (id: string) => focusedAppId === id,
    [focusedAppId]
  );

  const isAppRunning = useCallback(
    (id: string) => {
      const app = apps.find((a) => a.id === id);
      return app?.state !== "closed";
    },
    [apps]
  );

  const getAppPosition = useCallback(
    (id: string) => {
      const app = apps.find((a) => a.id === id);
      return app?.position || null;
    },
    [apps]
  );

  const getAppSize = useCallback(
    (id: string) => {
      const app = apps.find((a) => a.id === id);
      return app?.size || null;
    },
    [apps]
  );

  const updateAppPosition = useCallback(
    (id: string, position: AppPosition) => {
      setApps((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, position } : app
        )
      );
    },
    []
  );

  const updateAppSize = useCallback(
    (id: string, size: { width: number; height: number }) => {
      setApps((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, size } : app
        )
      );
    },
    []
  );

  const runningApps = useMemo(
    () => apps.filter((app) => app.state !== "closed"),
    [apps]
  );

  const value = useMemo(
    () => ({
      apps,
      runningApps,
      loadedApps,
      focusedAppId,
      loadApp,
      closeApp,
      minimizeApp,
      maximizeApp,
      restoreApp,
      focusApp,
      isAppMaximized,
      isAppFocused,
      isAppRunning,
      getAppPosition,
      getAppSize,
      updateAppPosition,
      updateAppSize,
    }),
    [
      apps,
      runningApps,
      loadedApps,
      focusedAppId,
      loadApp,
      closeApp,
      minimizeApp,
      maximizeApp,
      restoreApp,
      focusApp,
      isAppMaximized,
      isAppFocused,
      isAppRunning,
      getAppPosition,
      getAppSize,
      updateAppPosition,
      updateAppSize,
    ]
  );

  return (
    <XARContext.Provider value={value}>
      {children}
    </XARContext.Provider>
  );
}

export function useXAR() {
  const context = useContext(XARContext);
  if (context === undefined) {
    throw new Error("useXAR must be used within an XARProvider");
  }
  return context;
}

export function XARAppWindows() {
  const {
    apps,
    closeApp,
    minimizeApp,
    maximizeApp,
    restoreApp,
    focusApp,
    isAppMaximized,
    isAppFocused,
    getAppPosition,
    getAppSize,
    updateAppPosition,
    updateAppSize,
  } = useXAR();

  const containerRef = useRef<Map<string, HTMLDivElement>>(new Map());

  return (
    <>
      {apps.map((app) => {
        if (app.state === "closed") return null;

        const windowConfig = app.manifest?.windows?.[0] || {
          id: "main",
          title: app.name,
          width: 800,
          height: 600,
        };
        const defaultSize = {
          width: windowConfig.width || 800,
          height: windowConfig.height || 600,
        };

        return (
          <AppWindow
            key={app.id}
            appId={app.id}
            title={windowConfig.title || app.name}
            defaultSize={defaultSize}
            onClose={() => closeApp(app.id)}
            onMinimize={() => minimizeApp(app.id)}
            onMaximize={() => maximizeApp(app.id)}
            onRestore={() => restoreApp(app.id)}
            onFocus={() => focusApp(app.id)}
            savedPosition={getAppPosition(app.id)}
            savedSize={getAppSize(app.id)}
            onPositionChange={(pos) => updateAppPosition(app.id, pos)}
            onSizeChange={(size) => updateAppSize(app.id, size)}
            isMaximized={isAppMaximized(app.id)}
            isFocused={isAppFocused(app.id)}
          >
            <XARAppRenderer appId={app.id} containerRef={containerRef} />
          </AppWindow>
        );
      })}
    </>
  );
}

interface XARAppRendererProps {
  appId: string;
  containerRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

function XARAppRenderer({ appId, containerRef }: XARAppRendererProps) {
  const { apps, loadedApps } = useXAR();
  const app = apps.find((a) => a.id === appId);
  const loaded = loadedApps.get(appId);

  useEffect(() => {
    const container = containerRef.current.get(appId);
    if (!container || !loaded) return;

    const timer = setTimeout(() => {
      const el = containerRef.current.get(appId);
      if (el && el.innerHTML.includes("Loading")) {
        el.innerHTML = `<div style="padding: 20px; color: #666;">
          <h3>${app?.name || appId}</h3>
          <p>XAP package loaded successfully!</p>
          <p style="font-size: 12px; color: #999;">
            UI: ${loaded.ui?.entry ? loaded.ui.entry.substring(0, 100) + "..." : "No entry"}
          </p>
        </div>`;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [appId, app?.name, loaded, containerRef]);

  if (!app || app.state === "closed") {
    return null;
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-center">
          <div className="animate-pulse">Loading application...</div>
          <div className="text-xs text-muted-foreground mt-2">{appId}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(el) => {
        if (el) containerRef.current.set(appId, el);
      }}
      className="w-full h-full"
      data-app-id={appId}
    >
      <div className="w-full h-full flex flex-col">
        <div className="p-4 border-b border-border/50">
          <span className="font-medium">{app.name}</span>
          <span className="text-xs text-muted-foreground ml-2">XAP Ready</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-muted-foreground">
            <p>Application container ready.</p>
            <p className="mt-2">Click interactions would be handled via WebSocket.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
