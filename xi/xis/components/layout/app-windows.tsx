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

import { useApps } from "./apps-context";
import { MonitorWindow } from "./monitor-window";
import { FileExplorerWindow } from "./file-explorer-window";
import { RunOrchestrator } from "./run-orchestrator";

export function AppWindows() {
  const { apps } = useApps();

  return (
    <>
      {apps.map((app) => {
        if (app.state === "closed") return null;
        
        switch (app.id) {
          case "monitor":
            return <MonitorWindow key={app.id} state={app.state} />;
          case "explorer":
            return <FileExplorerWindow key={app.id} state={app.state} />;
          case "run-orchestrator":
            return <RunOrchestrator key={app.id} state={app.state} />;
          default:
            return null;
        }
      })}
    </>
  );
}
