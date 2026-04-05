/**
 * Copyright © 2025-2026 Wenze Wei. All Rights Reserved.
 *
 * This file is part of PiscesL1.
 * The PiscesL1 project belongs to the Dunimd Team.
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
 *
 * DISCLAIMER: Users must comply with applicable AI regulations.
 * Non-compliance may result in service termination or legal liability.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  Square,
  Brain,
  MessageSquare,
  Download,
  Gauge,
  Package,
  CheckCircle,
  Loader2,
  AlertCircle,
  Eye,
  Plus,
  RotateCcw,
  Terminal,
  Clock,
  XCircle,
} from "lucide-react";
import { useApps } from "./apps-context";
import { AppWindow } from "./app-window";
import { useRunsStore } from "@/lib/stores";
import type { RunTypeInfo, RunTypeParameter } from "@/lib/api/runs-ws";
import type { RunInfo } from "@/types";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "./sidebar-panel";
import { DynamicWidget } from "@/components/ui/dynamic-widget";
import type { DynamicParameter, WidgetType } from "@/types/dynamic";

interface RunOrchestratorProps {
  state: "minimized" | "normal" | "maximized";
}

type OrchestratorMode = "create" | "view";

interface OrchestratorParams {
  mode?: OrchestratorMode;
  runType?: string;
  runId?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain className="h-5 w-5" />,
  MessageSquare: <MessageSquare className="h-5 w-5" />,
  Download: <Download className="h-5 w-5" />,
  Gauge: <Gauge className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  Play: <Play className="h-5 w-5" />,
};

const statusColors: Record<string, string> = {
  running: "text-green-500",
  completed: "text-blue-500",
  failed: "text-red-500",
  paused: "text-yellow-500",
  pending: "text-gray-500",
  cancelled: "text-gray-500",
};

const statusBgColors: Record<string, string> = {
  running: "bg-green-500/10",
  completed: "bg-blue-500/10",
  failed: "bg-red-500/10",
  paused: "bg-yellow-500/10",
  pending: "bg-gray-500/10",
  cancelled: "bg-gray-500/10",
};

const statusIcons: Record<string, React.ReactNode> = {
  running: <div className="run-list__status-dot run-list__status-dot--running" />,
  completed: <CheckCircle className="h-4 w-4 text-blue-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  paused: <Pause className="h-4 w-4 text-yellow-500" />,
  pending: <Clock className="h-4 w-4 text-gray-500" />,
  cancelled: <XCircle className="h-4 w-4 text-gray-500" />,
};

function convertToDynamicParameter(param: RunTypeParameter): DynamicParameter {
  return {
    name: param.name,
    type: param.type,
    description: param.description,
    required: param.required,
    default: param.default as string | number | boolean | null,
    options: param.options,
    min: param.min,
    max: param.max,
    source: param.source,
    source_type: param.source_type ?? undefined,
    filter: param.filter,
    available: param.available,
    unavailable_reason: param.unavailable_reason,
    tab: param.tab,
    widget: param.widget ? {
      type: param.widget.type as unknown as WidgetType,
      style: {
        width: param.widget.style.width as "full" | "half" | "auto" | undefined,
        placeholder: param.widget.style.placeholder,
      },
      props: param.widget.props,
    } : undefined,
  };
}

export function RunOrchestrator({ state }: RunOrchestratorProps) {
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
    getAppParams,
    clearAppParams,
  } = useApps();

  const savedPosition = getAppPosition("run-orchestrator");
  const savedSize = getAppSize("run-orchestrator");
  const maximized = isAppMaximized("run-orchestrator");
  const focused = isAppFocused("run-orchestrator");

  const {
    runs,
    runTypes,
    schema,
    schemaLoading,
    config,
    isLoading,
    isWsConnected,
    error,
    connectWebSocket,
    getSchema,
    updateConfigValue,
    createRun,
    resetSchema,
    controlRun,
    getRunOutputs,
  } = useRunsStore();

  const [mode, setMode] = useState<OrchestratorMode>("create");
  const [selectedRunType, setSelectedRunType] = useState<RunTypeInfo | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunInfo | null>(null);
  const [runName, setRunName] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [initialParams, setInitialParams] = useState<OrchestratorParams | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ success: boolean; message: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const creatingRef = useRef(false);
  const lastCreateTimeRef = useRef(0);
  
  const { collapsed, toggle: toggleSidebar } = useSidebarCollapse(false);

  useEffect(() => {
    if (!isWsConnected && !error) {
      connectWebSocket();
    }
  }, [isWsConnected, error, connectWebSocket]);

  useEffect(() => {
    const params = getAppParams("run-orchestrator") as OrchestratorParams | null;
    if (params) {
      setInitialParams(params);
      clearAppParams("run-orchestrator");
    }
  }, [getAppParams, clearAppParams]);

  useEffect(() => {
    if (initialParams) {
      if (initialParams.mode) {
        setMode(initialParams.mode);
      }
      if (initialParams.runId) {
        const run = runs.find(r => r.run_id === initialParams.runId);
        if (run) {
          setSelectedRun(run);
          if (run.command) {
            const rt = runTypes.find(t => t.name === run.command);
            if (rt) {
              setSelectedRunType(rt);
            }
          }
        }
      }
      if (initialParams.runType && initialParams.mode === "create") {
        const rt = runTypes.find(t => t.name === initialParams.runType);
        if (rt) {
          setSelectedRunType(rt);
          setRunName(`${rt.label}-${Date.now()}`);
        }
      }
      setInitialParams(null);
    }
  }, [initialParams, runs, runTypes]);

  useEffect(() => {
    if (mode === "create" && selectedRunType) {
      getSchema(selectedRunType.name);
      setActiveTab("basic");
    }
  }, [mode, selectedRunType, getSchema]);

  useEffect(() => {
    if (mode === "view" && selectedRun) {
      const outputs = getRunOutputs(selectedRun.run_id);
      if (outputs.length > 0) {
        setLogs(outputs.map(o => `[${o.timestamp}] [${o.source}] ${o.line}`));
      } else {
        setLogs([
          `[${new Date().toISOString()}] Run ${selectedRun.run_id} loaded`,
          `[${new Date().toISOString()}] Status: ${selectedRun.status}`,
          selectedRun.exit_code !== undefined && selectedRun.exit_code !== 0 
            ? `[${new Date().toISOString()}] Exit code: ${selectedRun.exit_code}`
            : `[${new Date().toISOString()}] Phase: ${selectedRun.phase || "init"}`,
        ]);
      }
    }
  }, [mode, selectedRun, getRunOutputs]);

  useEffect(() => {
    if (mode === "view" && selectedRun) {
      const interval = setInterval(() => {
        const outputs = getRunOutputs(selectedRun.run_id);
        if (outputs.length > 0) {
          setLogs(outputs.map(o => `[${o.timestamp}] [${o.source}] ${o.line}`));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, selectedRun, getRunOutputs]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    if (selectedRun) {
      const updatedRun = runs.find(r => r.run_id === selectedRun.run_id);
      if (updatedRun && JSON.stringify(updatedRun) !== JSON.stringify(selectedRun)) {
        setSelectedRun(updatedRun);
      }
    }
  }, [runs, selectedRun]);

  const handleClose = () => {
    setSelectedRunType(null);
    setSelectedRun(null);
    setRunName("");
    resetSchema();
    setLogs([]);
    setCreateResult(null);
    closeApp("run-orchestrator");
  };

  const handleSelectRunType = (runType: RunTypeInfo) => {
    setSelectedRunType(runType);
    setRunName(`${runType.label}-${Date.now()}`);
    setSelectedRun(null);
  };

  const handleSelectRun = (run: RunInfo) => {
    setSelectedRun(run);
    setSelectedRunType(null);
    const rt = runTypes.find(t => t.name === run.command);
    if (rt) {
      setSelectedRunType(rt);
    }
  };

  const handleCreateRun = async () => {
    if (!selectedRunType || !runName.trim()) {
      return;
    }

    const now = Date.now();
    if (creatingRef.current || (now - lastCreateTimeRef.current) < 3000) {
      return;
    }

    creatingRef.current = true;
    lastCreateTimeRef.current = now;
    setIsCreating(true);
    setCreateResult(null);

    const requestId = `req_${now}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const result = await createRun(selectedRunType.name, runName, requestId);
      
      if (result.success) {
        setCreateResult({ 
          success: true, 
          message: `Run "${runName}" created successfully! ID: ${result.run_id}` 
        });
        
        setTimeout(() => {
          closeApp("run-orchestrator");
          setSelectedRunType(null);
          setRunName("");
          resetSchema();
          setCreateResult(null);
          setIsCreating(false);
          creatingRef.current = false;
        }, 1500);
      } else {
        setCreateResult({ 
          success: false, 
          message: result.error || "Failed to create run" 
        });
        setIsCreating(false);
        creatingRef.current = false;
      }
    } catch (err) {
      setCreateResult({ 
        success: false, 
        message: String(err) 
      });
      setIsCreating(false);
      creatingRef.current = false;
    }
  };

  const handleControl = (action: "pause" | "resume" | "cancel" | "kill") => {
    if (selectedRun) {
      controlRun(selectedRun.run_id, action);
      setLogs(prev => [...prev, `[${new Date().toISOString()}] ${action.toUpperCase()} command sent`]);
    }
  };

  const handleConfigChange = (name: string, value: unknown) => {
    updateConfigValue(name, value);
  };

  if (state === "minimized") {
    return null;
  }

  const sidebarWidth = collapsed ? 0 : 200;

  const tabs = schema?.tabs || [];
  const parameters = schema?.parameters || [];
  const currentTabParams = parameters.filter(p => p.tab === activeTab);

  const filteredRuns = selectedRunType 
    ? runs.filter(r => r.command === selectedRunType.name)
    : runs;

  return (
    <AppWindow
      appId="run-orchestrator"
      defaultSize={{ width: 1000, height: 700 }}
      onMinimize={() => minimizeApp("run-orchestrator")}
      onClose={handleClose}
      savedPosition={savedPosition}
      onPositionChange={(pos) => updateAppPosition("run-orchestrator", pos)}
      savedSize={savedSize}
      onSizeChange={(size) => updateAppSize("run-orchestrator", size)}
      isMaximized={maximized}
      onMaximize={() => maximizeApp("run-orchestrator")}
      onRestore={() => restoreApp("run-orchestrator")}
      isFocused={focused}
      onFocus={() => focusApp("run-orchestrator")}
      sidebarCollapsed={collapsed}
      onSidebarToggle={toggleSidebar}
    >
      <div className="flex h-full">
        <div
          className="border-r border-border/50 flex flex-col bg-muted/20 transition-all duration-200 overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          {!collapsed && (
            <>
              <div className="p-3 border-b border-border/50">
                <h3 className="font-medium text-sm">
                  {mode === "create" ? "Run Types" : "Runs"}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <img src="/load.svg" alt="Loading" className="h-6 w-6" />
                  </div>
                ) : mode === "create" ? (
                  runTypes.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No types available
                    </div>
                  ) : (
                    runTypes.map((runType) => (
                      <button
                        key={runType.name}
                        onClick={() => handleSelectRunType(runType)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                          selectedRunType?.name === runType.name
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
                          style={{ backgroundColor: `${runType.color}20` }}
                        >
                          <div style={{ color: runType.color }}>
                            {iconMap[runType.icon] || <Play className="h-5 w-5" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{runType.label}</div>
                        </div>
                        {selectedRunType?.name === runType.name && (
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )
                ) : filteredRuns.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No runs available
                  </div>
                ) : (
                  filteredRuns.map((run) => (
                    <button
                      key={run.run_id}
                      onClick={() => handleSelectRun(run)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                        selectedRun?.run_id === run.run_id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0",
                        statusBgColors[run.status]
                      )}>
                        {statusIcons[run.status] || <Clock className={cn("h-4 w-4", statusColors[run.status])} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{run.run_id}</div>
                        <div className="text-xs text-muted-foreground capitalize">{run.status}</div>
                      </div>
                      {selectedRun?.run_id === run.run_id && (
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {mode === "create" && selectedRunType ? (
            <>
              <div className="p-4 border-b border-border/50 bg-muted/10">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${selectedRunType.color}20` }}
                  >
                    <div style={{ color: selectedRunType.color }}>
                      {iconMap[selectedRunType.icon] || <Play className="h-5 w-5" />}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold">{selectedRunType.label}</h2>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedRunType.description}
                    </p>
                  </div>
                </div>
              </div>

              {tabs.length > 1 && (
                <div className="flex border-b border-border/50 bg-muted/5 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => setActiveTab(tab.name)}
                      disabled={!tab.available}
                      className={cn(
                        "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                        activeTab === tab.name
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground",
                        !tab.available && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4">
                {schemaLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeTab === "basic" && (
                      <div className="space-y-2">
                        <Label htmlFor="run-name">Run Name</Label>
                        <Input
                          id="run-name"
                          value={runName}
                          onChange={(e) => setRunName(e.target.value)}
                          placeholder="Enter a name for this run"
                        />
                      </div>
                    )}

                    {currentTabParams.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentTabParams.map((param) => (
                          <div
                            key={param.name}
                            className={cn(
                              "space-y-2",
                              param.widget?.style?.width === "full" && "md:col-span-2"
                            )}
                          >
                            <Label className={param.required ? "after:content-['*'] after:text-red-500" : ""}>
                              {param.name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </Label>
                            <DynamicWidget
                              parameter={convertToDynamicParameter(param)}
                              value={config[param.name]}
                              onChange={handleConfigChange}
                              allValues={config}
                            />
                            {param.description && (
                              <p className="text-xs text-muted-foreground">{param.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        No configuration options for this tab
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border/50 flex flex-col gap-3">
                {createResult && (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    createResult.success 
                      ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  )}>
                    {createResult.success ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span>{createResult.message}</span>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setSelectedRunType(null);
                    resetSchema();
                    setCreateResult(null);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRun} 
                    disabled={!runName.trim() || schemaLoading || isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isCreating ? "Creating..." : "Create Run"}
                  </Button>
                </div>
              </div>
            </>
          ) : mode === "view" && selectedRun ? (
            <>
              <div className="p-4 border-b border-border/50 bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                      statusBgColors[selectedRun.status]
                    )}>
                      {statusIcons[selectedRun.status] || <Terminal className={cn("h-5 w-5", statusColors[selectedRun.status])} />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold font-mono text-sm">{selectedRun.run_id}</h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{selectedRun.status}</Badge>
                        <span className="text-xs text-muted-foreground capitalize">{selectedRun.phase || "init"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {selectedRun.status === "running" && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleControl("pause")}>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleControl("cancel")}>
                          <Square className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {selectedRun.status === "paused" && (
                      <Button variant="secondary" size="sm" onClick={() => handleControl("resume")}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-border/50 bg-muted/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Output Log
                    </span>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="rounded"
                      />
                      Auto-scroll
                    </label>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 font-mono text-xs space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} className="text-muted-foreground">{log}</div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </ScrollArea>
              </div>

              <div className="p-4 border-t border-border/50">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">
                      {selectedRun.created_at ? new Date(selectedRun.created_at).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium capitalize">{selectedRun.command || "Unknown"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PID:</span>
                    <p className="font-medium">{selectedRun.pid || "N/A"}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              {mode === "create" ? (
                <>
                  <Plus className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-sm">Select a run type from the left panel</p>
                </>
              ) : (
                <>
                  <Eye className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-sm">Select a run to view details</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppWindow>
  );
}
