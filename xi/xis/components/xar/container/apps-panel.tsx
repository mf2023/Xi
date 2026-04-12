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

import { useXAR } from "./xar-context";
import { Monitor, FolderOpen, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const APP_ICONS: Record<string, React.ReactNode> = {
  monitor: <Monitor className="h-5 w-5" />,
  explorer: <FolderOpen className="h-5 w-5" />,
  inference: <Play className="h-5 w-5" />,
};

export function AppsPanel() {
  const { apps, loadApp, isAppRunning } = useXAR();

  const handleAppClick = async (appId: string) => {
    if (isAppRunning(appId)) {
      return;
    }
    await loadApp(appId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Apps
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {apps.map((app) => {
            const isRunning = isAppRunning(app.id);
            const icon = APP_ICONS[app.id];

            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app.id)}
                disabled={isRunning}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left",
                  isRunning
                    ? "bg-muted/50 text-muted-foreground cursor-default"
                    : "hover:bg-muted/50 text-foreground cursor-pointer"
                )}
              >
                {icon && (
                  <span className={cn("flex-shrink-0", isRunning && "opacity-50")}>
                    {icon}
                  </span>
                )}
                <div className="flex flex-col min-w-0">
                  <span className={cn("text-sm font-medium truncate", isRunning && "line-through")}>
                    {app.name}
                  </span>
                  {isRunning && (
                    <span className="text-xs text-muted-foreground">Running</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
