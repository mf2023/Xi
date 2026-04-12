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

import type { XARBridge } from "@/components/xar/bridge";
import type {
  Run,
  RunType,
  RunOutput,
  CreateRunResponse,
  ControlRunResponse,
} from "./types";

export class OrchestratorAPI {
  private bridge: XARBridge;
  private pendingRequests: Map<string, {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();

  constructor(bridge: XARBridge) {
    this.bridge = bridge;
    this.setupMessageHandler();
  }

  private setupMessageHandler(): void {
    this.bridge.on("*", (message) => {
      if (message.id && this.pendingRequests.has(message.id)) {
        const pending = this.pendingRequests.get(message.id)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if (message.type === "error") {
          pending.reject(message.payload);
        } else {
          pending.resolve(message.payload);
        }
      }
    });
  }

  private async sendRequest<T>(type: string, payload: unknown, timeout = 10000): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const timeoutHandle = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${type} timed out`));
        }
      }, timeout);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: timeoutHandle,
      });

      this.bridge.send({
        type,
        payload,
        id,
        timestamp: Date.now(),
      });
    });
  }

  async listRuns(): Promise<Run[]> {
    try {
      const response = await this.sendRequest<{ runs: Run[] }>("list_runs", {});
      return response.runs || [];
    } catch (error) {
      console.error("Failed to list runs:", error);
      return [];
    }
  }

  async getRun(runId: string): Promise<Run | null> {
    try {
      const response = await this.sendRequest<{ run: Run }>("get_run", { run_id: runId });
      return response.run || null;
    } catch (error) {
      console.error("Failed to get run:", error);
      return null;
    }
  }

  async listRunTypes(): Promise<RunType[]> {
    try {
      const response = await this.sendRequest<{ run_types: RunType[] }>("list_run_types", {});
      return response.run_types || [];
    } catch (error) {
      console.error("Failed to list run types:", error);
      return [];
    }
  }

  async createRun(runType: string, name: string, config?: Record<string, unknown>): Promise<CreateRunResponse> {
    try {
      const response = await this.sendRequest<CreateRunResponse>("create_run", {
        run_type: runType,
        name,
        config,
      });
      return response;
    } catch (error) {
      console.error("Failed to create run:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  async controlRun(runId: string, action: "pause" | "resume" | "cancel" | "kill"): Promise<ControlRunResponse> {
    try {
      const response = await this.sendRequest<ControlRunResponse>("control_run", {
        run_id: runId,
        action,
      });
      return response;
    } catch (error) {
      console.error(`Failed to ${action} run:`, error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  async getRunOutputs(runId: string): Promise<RunOutput[]> {
    try {
      const response = await this.sendRequest<{ outputs: RunOutput[] }>("get_run_outputs", {
        run_id: runId,
      });
      return response.outputs || [];
    } catch (error) {
      console.error("Failed to get run outputs:", error);
      return [];
    }
  }

  async deleteRun(runId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.sendRequest<{ success: boolean; error?: string }>("delete_run", {
        run_id: runId,
      });
      return response;
    } catch (error) {
      console.error("Failed to delete run:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}
