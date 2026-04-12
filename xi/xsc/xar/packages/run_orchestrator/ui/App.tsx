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

import * as React from "react";
import type { XARControls } from "@/components/xar/types";
import type { XARBridge } from "@/components/xar/bridge";
import type { Run, RunType, RunState } from "../logic/types";
import { OrchestratorAPI } from "../logic/api";

interface AppProps {
  controls: XARControls;
  bridge: XARBridge;
  appId: string;
}

type OrchestratorMode = "create" | "view";

interface RunTypeInfo {
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface RunInfo {
  run_id: string;
  status: string;
  command?: string;
  phase?: string;
  created_at?: string;
  pid?: number;
  exit_code?: number;
}

const iconMap: Record<string, string> = {
  Brain: "🧠",
  MessageSquare: "💬",
  Download: "📥",
  Gauge: "⚡",
  Package: "📦",
  Play: "▶️",
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

const statusLabels: Record<string, string> = {
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  paused: "Paused",
  pending: "Pending",
  cancelled: "Cancelled",
};

export function App({ controls, bridge, appId }: AppProps) {
  const [mode, setMode] = React.useState<OrchestratorMode>("create");
  const [runTypes, setRunTypes] = React.useState<RunTypeInfo[]>([]);
  const [runs, setRuns] = React.useState<RunInfo[]>([]);
  const [selectedRunType, setSelectedRunType] = React.useState<RunTypeInfo | null>(null);
  const [selectedRun, setSelectedRun] = React.useState<RunInfo | null>(null);
  const [runName, setRunName] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("basic");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createResult, setCreateResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const logsEndRef = React.useRef<HTMLDivElement>(null);
  const creatingRef = React.useRef(false);
  const lastCreateTimeRef = React.useRef(0);

  const api = React.useMemo(() => new OrchestratorAPI(bridge), [bridge]);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [typesData, runsData] = await Promise.all([
          api.listRunTypes(),
          api.listRuns(),
        ]);
        setRunTypes(typesData as RunTypeInfo[]);
        setRuns(runsData as RunInfo[]);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const unsubscribe = bridge.on("run_update", (message) => {
      if (message.payload && typeof message.payload === "object") {
        const payload = message.payload as Record<string, unknown>;
        if (payload.run_id) {
          setRuns((prev) => {
            const idx = prev.findIndex((r) => r.run_id === payload.run_id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...payload } as RunInfo;
              return updated;
            }
            return [...prev, payload as RunInfo];
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [api, bridge]);

  React.useEffect(() => {
    if (mode === "view" && selectedRun) {
      const interval = setInterval(async () => {
        try {
          const run = await api.getRun(selectedRun.run_id);
          if (run) {
            setSelectedRun(run as RunInfo);
            const outputs = await api.getRunOutputs(selectedRun.run_id);
            if (outputs.length > 0) {
              setLogs(outputs.map((o: { timestamp: string; source: string; line: string }) => `[${o.timestamp}] [${o.source}] ${o.line}`));
            }
          }
        } catch (error) {
          console.error("Failed to refresh run:", error);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, selectedRun, api]);

  React.useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const handleSelectRunType = (runType: RunTypeInfo) => {
    setSelectedRunType(runType);
    setRunName(`${runType.label}-${Date.now()}`);
    setSelectedRun(null);
    setMode("create");
  };

  const handleSelectRun = (run: RunInfo) => {
    setSelectedRun(run);
    setSelectedRunType(null);
    setMode("view");
    setLogs([
      `[${new Date().toISOString()}] Run ${run.run_id} loaded`,
      `[${new Date().toISOString()}] Status: ${run.status}`,
    ]);
  };

  const handleCreateRun = async () => {
    if (!selectedRunType || !runName.trim()) {
      return;
    }

    const now = Date.now();
    if (creatingRef.current || now - lastCreateTimeRef.current < 3000) {
      return;
    }

    creatingRef.current = true;
    lastCreateTimeRef.current = now;
    setIsCreating(true);
    setCreateResult(null);

    try {
      const result = await api.createRun(selectedRunType.name, runName);

      if (result.success && result.run_id) {
        setCreateResult({
          success: true,
          message: `Run "${runName}" created successfully! ID: ${result.run_id}`,
        });

        setTimeout(() => {
          setSelectedRunType(null);
          setRunName("");
          setCreateResult(null);
          setIsCreating(false);
          creatingRef.current = false;
        }, 1500);
      } else {
        setCreateResult({
          success: false,
          message: result.error || "Failed to create run",
        });
        setIsCreating(false);
        creatingRef.current = false;
      }
    } catch (error) {
      setCreateResult({
        success: false,
        message: String(error),
      });
      setIsCreating(false);
      creatingRef.current = false;
    }
  };

  const handleControl = async (action: "pause" | "resume" | "cancel" | "kill") => {
    if (selectedRun) {
      try {
        await api.controlRun(selectedRun.run_id, action);
        setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${action.toUpperCase()} command sent`]);
      } catch (error) {
        console.error(`Failed to ${action} run:`, error);
      }
    }
  };

  const handleClose = () => {
    setSelectedRunType(null);
    setSelectedRun(null);
    setRunName("");
    setLogs([]);
    setCreateResult(null);
    controls.close();
  };

  const filteredRuns = selectedRunType
    ? runs.filter((r) => r.command === selectedRunType.name)
    : runs;

  const renderRunTypeItem = (runType: RunTypeInfo, index: number) => {
    const isSelected = selectedRunType?.name === runType.name;
    return (
      <div
        key={runType.name}
        data-index={index}
        className={`run-type-item ${isSelected ? "selected" : ""}`}
      >
        <div className="run-type-icon" style={{ backgroundColor: `${runType.color}20` }}>
          <span style={{ color: runType.color }}>{iconMap[runType.icon] || "▶️"}</span>
        </div>
        <div className="run-type-info">
          <div className="run-type-label">{runType.label}</div>
        </div>
        {isSelected && <span className="selected-indicator">✓</span>}
      </div>
    );
  };

  const renderRunItem = (run: RunInfo, index: number) => {
    const isSelected = selectedRun?.run_id === run.run_id;
    return (
      <div
        key={run.run_id}
        data-index={index}
        className={`run-item ${isSelected ? "selected" : ""}`}
      >
        <div className={`run-status-icon ${statusBgColors[run.status]}`}>
          <span className={statusColors[run.status]}>{statusLabels[run.status]?.[0] || "?"}</span>
        </div>
        <div className="run-info">
          <div className="run-id">{run.run_id}</div>
          <div className="run-status">{run.status}</div>
        </div>
        {isSelected && <span className="selected-indicator">✓</span>}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>{mode === "create" ? "Run Types" : "Runs"}</h3>
          <div className="mode-toggle">
            <button
              className={mode === "create" ? "active" : ""}
              onClick={() => setMode("create")}
            >
              Create
            </button>
            <button
              className={mode === "view" ? "active" : ""}
              onClick={() => setMode("view")}
            >
              View
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : mode === "create" ? (
            runTypes.length === 0 ? (
              <div className="empty-state">No run types available</div>
            ) : (
              <div className="run-types-list">
                {runTypes.map((runType, index) => (
                  <div key={runType.name} onClick={() => handleSelectRunType(runType)}>
                    {renderRunTypeItem(runType, index)}
                  </div>
                ))}
              </div>
            )
          ) : filteredRuns.length === 0 ? (
            <div className="empty-state">No runs available</div>
          ) : (
            <div className="runs-list">
              {filteredRuns.map((run, index) => (
                <div key={run.run_id} onClick={() => handleSelectRun(run)}>
                  {renderRunItem(run, index)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        {mode === "create" && selectedRunType ? (
          <>
            <div className="content-header">
              <div className="run-type-header">
                <div className="run-type-icon large" style={{ backgroundColor: `${selectedRunType.color}20` }}>
                  <span style={{ color: selectedRunType.color }}>{iconMap[selectedRunType.icon] || "▶️"}</span>
                </div>
                <div className="run-type-details">
                  <h2>{selectedRunType.label}</h2>
                  <p className="description">{selectedRunType.description}</p>
                </div>
              </div>
            </div>

            <div className="tabs-container">
              <div className="tabs">
                <button
                  className={activeTab === "basic" ? "active" : ""}
                  onClick={() => setActiveTab("basic")}
                >
                  Basic
                </button>
              </div>
            </div>

            <div className="content-body">
              <div className="form-group">
                <label>Run Name</label>
                <input
                  type="text"
                  value={runName}
                  onChange={(e) => setRunName(e.target.value)}
                  placeholder="Enter run name"
                />
              </div>
            </div>

            <div className="content-footer">
              {createResult && (
                <div className={`result-message ${createResult.success ? "success" : "error"}`}>
                  {createResult.message}
                </div>
              )}
              <div className="button-group">
                <button className="btn-secondary" onClick={() => setSelectedRunType(null)}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleCreateRun}
                  disabled={!runName.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create Run"}
                </button>
              </div>
            </div>
          </>
        ) : mode === "view" && selectedRun ? (
          <>
            <div className="content-header">
              <div className="run-header">
                <div className={`run-status-badge ${statusBgColors[selectedRun.status]}`}>
                  <span className={statusColors[selectedRun.status]}>
                    {statusLabels[selectedRun.status]}
                  </span>
                </div>
                <div className="run-id">{selectedRun.run_id}</div>
                <div className="run-phase">{selectedRun.phase || "init"}</div>
              </div>
              <div className="control-buttons">
                {selectedRun.status === "running" && (
                  <>
                    <button className="btn-secondary" onClick={() => handleControl("pause")}>
                      Pause
                    </button>
                    <button className="btn-secondary" onClick={() => handleControl("cancel")}>
                      Cancel
                    </button>
                  </>
                )}
                {selectedRun.status === "paused" && (
                  <button className="btn-secondary" onClick={() => handleControl("resume")}>
                    Resume
                  </button>
                )}
              </div>
            </div>

            <div className="logs-container">
              <div className="logs-header">
                <span>Output Log</span>
                <label className="auto-scroll">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                  Auto-scroll
                </label>
              </div>
              <div className="logs-content">
                {logs.map((log, i) => (
                  <div key={i} className="log-line">{log}</div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>

            <div className="content-footer info">
              <div className="info-item">
                <span>Created:</span>
                <span>{selectedRun.created_at ? new Date(selectedRun.created_at).toLocaleString() : "N/A"}</span>
              </div>
              <div className="info-item">
                <span>Type:</span>
                <span>{selectedRun.command || "Unknown"}</span>
              </div>
              <div className="info-item">
                <span>PID:</span>
                <span>{selectedRun.pid || "N/A"}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state centered">
            <div className="empty-icon">{mode === "create" ? "➕" : "👁️"}</div>
            <p>{mode === "create" ? "Select a run type from the left panel" : "Select a run to view details"}</p>
          </div>
        )}
      </div>

      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .sidebar {
          width: 200px;
          border-right: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .sidebar-header h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 500;
        }

        .mode-toggle {
          display: flex;
          gap: 4px;
        }

        .mode-toggle button {
          flex: 1;
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
        }

        .mode-toggle button.active {
          background: rgba(0, 0, 0, 0.05);
          font-weight: 500;
        }

        .sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .loading, .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          text-align: center;
          color: rgba(0, 0, 0, 0.5);
          font-size: 14px;
        }

        .empty-state.centered {
          flex: 1;
          flex-direction: column;
        }

        .empty-icon {
          font-size: 48px;
          opacity: 0.3;
          margin-bottom: 16px;
        }

        .run-type-item, .run-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .run-type-item:hover, .run-item:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .run-type-item.selected, .run-item.selected {
          background: rgba(0, 0, 0, 0.08);
        }

        .run-type-icon, .run-status-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .run-type-icon.large {
          width: 40px;
          height: 40px;
          font-size: 18px;
        }

        .run-type-info, .run-info {
          flex: 1;
          min-width: 0;
        }

        .run-type-label, .run-id {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .run-status {
          font-size: 11px;
          color: rgba(0, 0, 0, 0.5);
          text-transform: capitalize;
        }

        .selected-indicator {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.5);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .content-header {
          padding: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          background: rgba(0, 0, 0, 0.02);
        }

        .run-type-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .run-type-details h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .run-type-details .description {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .run-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .run-status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          text-transform: capitalize;
        }

        .run-header .run-id {
          font-family: monospace;
          font-size: 13px;
        }

        .run-phase {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.5);
          text-transform: capitalize;
        }

        .control-buttons {
          display: flex;
          gap: 4px;
          margin-top: 12px;
        }

        .tabs-container {
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          background: rgba(0, 0, 0, 0.01);
        }

        .tabs {
          display: flex;
        }

        .tabs button {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          background: transparent;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          color: rgba(0, 0, 0, 0.5);
        }

        .tabs button.active {
          color: inherit;
          border-bottom-color: currentColor;
        }

        .content-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 8px 12px;
          font-size: 14px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 6px;
          outline: none;
          box-sizing: border-box;
        }

        .form-group input:focus {
          border-color: rgba(0, 0, 0, 0.2);
        }

        .logs-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          background: rgba(0, 0, 0, 0.01);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(0, 0, 0, 0.5);
        }

        .auto-scroll {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          text-transform: none;
          letter-spacing: normal;
        }

        .logs-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          font-family: monospace;
          font-size: 12px;
        }

        .log-line {
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 4px;
        }

        .content-footer {
          padding: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .content-footer.info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }

        .info-item span:first-child {
          color: rgba(0, 0, 0, 0.5);
        }

        .info-item span:last-child {
          font-weight: 500;
        }

        .result-message {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .result-message.success {
          background: rgba(34, 197, 94, 0.1);
          color: rgb(34, 197, 94);
        }

        .result-message.error {
          background: rgba(239, 68, 68, 0.1);
          color: rgb(239, 68, 68);
        }

        .button-group {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .btn-primary, .btn-secondary {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .btn-primary {
          background: #000;
          color: #fff;
          border: none;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .btn-secondary:hover {
          background: rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}

export default App;
