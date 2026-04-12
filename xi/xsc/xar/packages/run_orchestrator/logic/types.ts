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

export interface Run {
  run_id: string;
  name?: string;
  status: RunState;
  command?: string;
  phase?: string;
  created_at?: string;
  updated_at?: string;
  started_at?: string;
  completed_at?: string;
  pid?: number;
  exit_code?: number;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RunType {
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
  parameters?: RunTypeParameter[];
  tabs?: RunTypeTab[];
}

export interface RunTypeParameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  default?: string | number | boolean | null;
  options?: string[];
  min?: number;
  max?: number;
  source?: string;
  source_type?: string;
  filter?: Record<string, unknown>;
  available?: boolean;
  unavailable_reason?: string;
  tab?: string;
  widget?: {
    type: string;
    style?: {
      width?: "full" | "half" | "auto";
      placeholder?: string;
    };
    props?: Record<string, unknown>;
  };
}

export interface RunTypeTab {
  name: string;
  label: string;
  available: boolean;
}

export type RunState =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export interface RunOutput {
  timestamp: string;
  source: string;
  line: string;
}

export interface CreateRunRequest {
  run_type: string;
  name: string;
  config?: Record<string, unknown>;
}

export interface CreateRunResponse {
  success: boolean;
  run_id?: string;
  error?: string;
}

export interface ControlRunRequest {
  action: "start" | "pause" | "resume" | "cancel" | "kill";
}

export interface ControlRunResponse {
  success: boolean;
  error?: string;
}
