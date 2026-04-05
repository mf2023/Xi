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
import type { RunInfo } from "@/types";
import { PiscesL1RunsWS, runsWS, type RunsServerMessage, type RunTypeInfo, type RunTypeSchema, type RunTypeParameter } from "@/lib/api/runs-ws";

const pendingRequests: Map<string, { resolve: (value: { success: boolean; run_id?: string; error?: string }) => void; timeout: NodeJS.Timeout }> = new Map();
let connectingRef = false;
let wsInstance: PiscesL1RunsWS | null = null;
let isCreatingRun = false;
let lastCreateRunTime = 0;
const runOutputsStore: Map<string, { line: string; source: string; timestamp: string }[]> = new Map();

interface RunsState {
  runs: RunInfo[];
  runTypes: RunTypeInfo[];
  schema: RunTypeSchema | null;
  schemaLoading: boolean;
  config: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;
  ws: PiscesL1RunsWS | null;
  isWsConnected: boolean;
  lastCreatedRun: { run_id: string; run_type: string; name: string } | null;
  runOutputs: Map<string, { line: string; source: string; timestamp: string }[]>;

  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  controlRun: (runId: string, action: "pause" | "resume" | "cancel" | "kill") => void;
  getRunTypes: () => void;
  getSchema: (runType: string) => void;
  setConfig: (config: Record<string, unknown>) => void;
  updateConfigValue: (name: string, value: unknown) => void;
  createRun: (runType: string, name: string, runId?: string) => Promise<{ success: boolean; run_id?: string; error?: string }>;
  resetSchema: () => void;
  clearLastCreatedRun: () => void;
  getRunOutputs: (runId: string) => { line: string; source: string; timestamp: string }[];
  clearRunOutputs: (runId: string) => void;
}

export const useRunsStore = create<RunsState>((set, get) => ({
  runs: [],
  runTypes: [],
  schema: null,
  schemaLoading: false,
  config: {},
  isLoading: false,
  error: null,
  ws: null,
  isWsConnected: false,
  lastCreatedRun: null,
  runOutputs: new Map<string, { line: string; source: string; timestamp: string }[]>(),

  connectWebSocket: async () => {
    const existingWs = get().ws;
    console.log(`[RunsStore] connectWebSocket called: existingWs=${!!existingWs}, existingWsConnected=${existingWs?.isConnected}, connectingRef=${connectingRef}, wsInstance=${!!wsInstance}`);
    
    if (existingWs && existingWs.isConnected) {
      console.log(`[RunsStore] WebSocket already connected, returning`);
      return;
    }

    if (connectingRef && wsInstance) {
      console.log(`[RunsStore] Connection in progress, setting existing wsInstance`);
      set({ ws: wsInstance });
      return;
    }

    console.log(`[RunsStore] Creating new WebSocket connection`);
    connectingRef = true;
    const ws = new PiscesL1RunsWS();
    wsInstance = ws;

    ws.onConnect(() => {
      set({ isWsConnected: true, error: null, ws });
      ws.getRuns();
      ws.getRunTypes();
    });

    ws.onDisconnect(() => {
      set({ isWsConnected: false });
    });

    ws.on("runs_list", (msg: RunsServerMessage) => {
      if (msg.type === "runs_list") {
        set({ runs: msg.runs, isLoading: false });
      }
    });

    ws.on("runs_update", (msg: RunsServerMessage) => {
      if (msg.type === "runs_update") {
        set({ runs: msg.runs });
      }
    });

    ws.on("run_update", (msg: RunsServerMessage) => {
      if (msg.type === "run_update") {
        set((state) => ({
          runs: state.runs.map((r) =>
            r.run_id === msg.run.run_id ? { ...r, ...msg.run } : r
          ),
        }));
      }
    });

    ws.on("run_types", (msg: RunsServerMessage) => {
      if (msg.type === "run_types") {
        set({ runTypes: msg.run_types.filter(rt => rt.enabled) });
      }
    });

    ws.on("schema", (msg: RunsServerMessage) => {
      if (msg.type === "schema") {
        const defaultConfig: Record<string, unknown> = {};
        msg.parameters.forEach((param: RunTypeParameter) => {
          if (param.default !== undefined && param.default !== null) {
            defaultConfig[param.name] = param.default;
          }
        });
        set({ schema: msg as RunTypeSchema, schemaLoading: false, config: defaultConfig });
      }
    });

    ws.on("run_created", (msg: RunsServerMessage) => {
      if (msg.type === "run_created") {
        isCreatingRun = false;
        
        set({ 
          schema: null, 
          config: {},
          lastCreatedRun: {
            run_id: msg.run_id,
            run_type: msg.run_type,
            name: msg.name,
          }
        });
        
        ws.getRuns();
        
        const key = msg.request_id || msg.run_id;
        const pending = pendingRequests.get(key);
        if (pending) {
          clearTimeout(pending.timeout);
          pendingRequests.delete(key);
          pending.resolve({ success: true, run_id: msg.run_id });
        }
      }
    });

    ws.on("error", (msg: RunsServerMessage) => {
      if (msg.type === "error") {
        isCreatingRun = false;
        set({ error: msg.message, schemaLoading: false });
      }
    });

    ws.on("output", (msg: RunsServerMessage) => {
      if (msg.type === "output") {
        const runId = msg.run_id;
        if (runId) {
          const existing = runOutputsStore.get(runId) || [];
          const newOutput = {
            line: msg.line,
            source: msg.source,
            timestamp: msg.timestamp,
          };
          runOutputsStore.set(runId, [...existing.slice(-499), newOutput]);
        }
      }
    });

    ws.on("run_completed", (msg: RunsServerMessage) => {
      if (msg.type === "run_completed") {
        const runId = msg.run_id;
        if (runId && msg.exit_code !== 0) {
          const existing = runOutputsStore.get(runId) || [];
          runOutputsStore.set(runId, [...existing, {
            line: `Process exited with code ${msg.exit_code}`,
            source: "system",
            timestamp: msg.timestamp,
          }]);
        }
      }
    });

    try {
        set({ isLoading: true });
      await ws.connect();
      set({ ws });
      connectingRef = false;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      connectingRef = false;
    }
  },

  disconnectWebSocket: () => {
    const ws = get().ws;
    if (ws) {
      ws.disconnect();
      set({ ws: null, isWsConnected: false });
    }
  },

  controlRun: (runId, action) => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      ws.control(runId, action);
    } else {
      set({ error: "WebSocket not connected" });
    }
  },

  getRunTypes: () => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      ws.getRunTypes();
    }
  },

  getSchema: (runType: string) => {
    const ws = get().ws;
    if (ws && ws.isConnected) {
      set({ schemaLoading: true, schema: null });
      ws.getSchema(runType);
    }
  },

  setConfig: (config: Record<string, unknown>) => {
    set({ config });
  },

  updateConfigValue: (name: string, value: unknown) => {
    set((state) => ({
      config: { ...state.config, [name]: value },
    }));
  },

  createRun: (runType: string, name: string, requestId?: string): Promise<{ success: boolean; run_id?: string; error?: string }> => {
    return new Promise((resolve) => {
      const now = Date.now();
      
      console.log(`[RunsStore] createRun called: requestId=${requestId}, isCreatingRun=${isCreatingRun}, lastCreateRunTime=${lastCreateRunTime}, now=${now}`);
      
      if (isCreatingRun || (now - lastCreateRunTime) < 3000) {
        console.log(`[RunsStore] Duplicate create request blocked`);
        resolve({ success: false, error: "A run is already being created" });
        return;
      }
      
      const ws = get().ws;
      const config = get().config;
      
      if (!ws || !ws.isConnected) {
        resolve({ success: false, error: "WebSocket not connected" });
        return;
      }

      const reqId = requestId || `auto_${now}_${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`[RunsStore] Using reqId: ${reqId}`);
      
      if (pendingRequests.has(reqId)) {
        console.log(`[RunsStore] Duplicate request detected: ${reqId}, returning existing promise`);
        const existing = pendingRequests.get(reqId)!;
        existing.resolve({ success: true, run_id: undefined });
        return;
      }

      isCreatingRun = true;
      lastCreateRunTime = now;

      const timeout = setTimeout(() => {
        pendingRequests.delete(reqId);
        isCreatingRun = false;
        resolve({ success: false, error: "Timeout waiting for response" });
      }, 30000);

      pendingRequests.set(reqId, { resolve, timeout });

      console.log(`[RunsStore] Sending createRun to WebSocket: reqId=${reqId}`);
      ws.createRun(runType, name, config, reqId);
    });
  },

  resetSchema: () => {
    set({ schema: null, config: {}, schemaLoading: false });
  },

  clearLastCreatedRun: () => {
    set({ lastCreatedRun: null });
  },

  getRunOutputs: (runId: string) => {
    return runOutputsStore.get(runId) || [];
  },

  clearRunOutputs: (runId: string) => {
    runOutputsStore.delete(runId);
  },
}));
