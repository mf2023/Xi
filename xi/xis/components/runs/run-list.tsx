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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Square,
  Brain,
  MessageSquare,
  Download,
  Gauge,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import type { RunInfo, RunStatus } from "@/types/training";

export interface RunListProps {
  runs: RunInfo[];
  isLoading?: boolean;
  isWsConnected?: boolean;
  error?: string | null;
  showStats?: boolean;
  showTabs?: boolean;
  activeTab?: RunStatus | "all";
  onTabChange?: (tab: RunStatus | "all") => void;
  onControl?: (runId: string, action: "pause" | "resume" | "cancel" | "kill") => void;
  onView?: (runId: string) => void;
  onNewRun?: () => void;
  newRunLabel?: string;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  filterType?: string;
  title?: string;
  showHeaderButton?: boolean;
  headerButtonLabel?: string;
  onHeaderButtonClick?: () => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  running: <div className="run-list__status-dot run-list__status-dot--running" />,
  completed: <CheckCircle className="h-4 w-4 text-blue-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  paused: <Pause className="h-4 w-4 text-yellow-500" />,
  pending: <Clock className="h-4 w-4 text-gray-500" />,
  cancelled: <XCircle className="h-4 w-4 text-gray-500" />,
};

const statusBadges: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  running: "default",
  completed: "secondary",
  failed: "destructive",
  paused: "outline",
  pending: "outline",
  cancelled: "outline",
};

const commandIcons: Record<string, React.ReactNode> = {
  train: <Brain className="h-4 w-4" />,
  serve: <MessageSquare className="h-4 w-4" />,
  inference: <MessageSquare className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
  benchmark: <Gauge className="h-4 w-4" />,
  install: <Package className="h-4 w-4" />,
};

const commandLabels: Record<string, string> = {
  train: "Training",
  serve: "Inference",
  inference: "Inference",
  download: "Download",
  benchmark: "Benchmark",
  install: "Install",
  monitor: "Monitor",
  test: "Test",
  dev: "Dev",
};

export function RunList({
  runs,
  isLoading = false,
  isWsConnected = true,
  error = null,
  showStats = true,
  showTabs = false,
  activeTab = "all",
  onTabChange,
  onControl,
  onView,
  onNewRun,
  newRunLabel = "New Run",
  emptyIcon,
  emptyTitle = "No runs found",
  filterType,
  title = "All Runs",
  showHeaderButton = false,
  headerButtonLabel = "View All",
  onHeaderButtonClick,
}: RunListProps) {
  const filteredRuns = runs.filter((r) => {
    if (filterType && r.command !== filterType) {
      return false;
    }
    if (activeTab !== "all" && r.status !== activeTab) {
      return false;
    }
    return true;
  });

  const stats = {
    total: runs.length,
    running: runs.filter((r) => r.status === "running").length,
    completed: runs.filter((r) => r.status === "completed").length,
    failed: runs.filter((r) => r.status === "failed").length,
    paused: runs.filter((r) => r.status === "paused").length,
  };

  const tabs: { value: RunStatus | "all"; label: string; count: number }[] = [
    { value: "all", label: "All", count: stats.total },
    { value: "running", label: "Running", count: stats.running },
    { value: "completed", label: "Completed", count: stats.completed },
    { value: "failed", label: "Failed", count: stats.failed },
  ];

  const getStatusIcon = (status: string) => statusIcons[status] || <Clock className="h-4 w-4 text-gray-500" />;
  const getStatusBadge = (status: string) => statusBadges[status] || "outline";
  const getCommandIcon = (command: string) => commandIcons[command] || <Play className="h-4 w-4" />;
  const getCommandLabel = (command: string) => commandLabels[command] || command || "Run";

  const renderContent = () => {
    if (!isWsConnected && !isLoading) {
      return (
        <div className="run-list__empty">
          {error ? (
            <>
              <XCircle className="run-list__empty-icon run-list__empty-icon--error" />
              <p className="run-list__empty-text run-list__empty-text--error">{error}</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Retry Connection
              </Button>
            </>
          ) : (
            <>
              <img src="/load.svg" alt="Connecting" className="run-list__empty-icon" />
              <span className="run-list__empty-text">Connecting to service...</span>
            </>
          )}
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="run-list__empty">
          <img src="/load.svg" alt="Loading" className="run-list__empty-icon" />
          <span className="run-list__empty-text">Loading runs...</span>
        </div>
      );
    }

    if (filteredRuns.length === 0) {
      return (
        <div className="run-list__empty">
          {emptyIcon || <Play className="run-list__empty-icon" />}
          <p className="run-list__empty-text">{emptyTitle}</p>
          {onNewRun && (
            <Button variant="secondary" onClick={onNewRun}>
              <Play className="mr-2 h-4 w-4" />
              {newRunLabel}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="run-list__content">
        <div className="run-list__header">
          <div className="run-list__col run-list__col--status">Status</div>
          <div className="run-list__col run-list__col--id">Run ID</div>
          <div className="run-list__col run-list__col--name">Name</div>
          <div className="run-list__col run-list__col--command">Command</div>
          <div className="run-list__col run-list__col--phase">Phase</div>
          <div className="run-list__col run-list__col--time">Created</div>
          <div className="run-list__col run-list__col--actions">Actions</div>
        </div>
        <div className="run-list__body">
          {filteredRuns.map((run) => (
            <div key={run.run_id} className="run-list__item">
              <div className="run-list__col run-list__col--status">
                <div className="run-list__status">
                  {getStatusIcon(run.status)}
                  <Badge variant={getStatusBadge(run.status)} className="run-list__badge">
                    {run.status}
                  </Badge>
                </div>
              </div>
              <div className="run-list__col run-list__col--id">
                <span className="run-list__id">{run.run_id}</span>
              </div>
              <div className="run-list__col run-list__col--name">
                <span className="run-list__name">{run.name || "-"}</span>
              </div>
              <div className="run-list__col run-list__col--command">
                <div className="run-list__command">
                  {getCommandIcon(run.command || "run")}
                  <span>{getCommandLabel(run.command || "run")}</span>
                </div>
              </div>
              <div className="run-list__col run-list__col--phase">
                <span className="run-list__phase">{run.phase || "init"}</span>
              </div>
              <div className="run-list__col run-list__col--time">
                <span className="run-list__time">
                  {run.created_at ? new Date(run.created_at).toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="run-list__col run-list__col--actions">
                <div className="run-list__actions">
                  {run.status === "running" && onControl && (
                    <button
                      className="run-list__action run-list__action--warning"
                      onClick={() => onControl(run.run_id, "pause")}
                      title="Pause"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {run.status === "paused" && onControl && (
                    <button
                      className="run-list__action run-list__action--success"
                      onClick={() => onControl(run.run_id, "resume")}
                      title="Resume"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {(run.status === "running" || run.status === "paused") && onControl && (
                    <button
                      className="run-list__action run-list__action--danger"
                      onClick={() => onControl(run.run_id, "cancel")}
                      title="Cancel"
                    >
                      <Square className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {run.status === "completed" && (
                    <button
                      className="run-list__action run-list__action--muted"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onView && (
                    <button
                      className="run-list__action run-list__action--primary"
                      onClick={() => onView(run.run_id)}
                      title="View Details"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="run-list">
      {showStats && (
        <div className="run-list__stats">
          <div className="run-list__stat">
            <div className="run-list__stat-header">
              <span className="run-list__stat-label">Total</span>
              <Play className="run-list__stat-icon run-list__stat-icon--primary" />
            </div>
            <span className="run-list__stat-value">{stats.total}</span>
          </div>
          <div className="run-list__stat">
            <div className="run-list__stat-header">
              <span className="run-list__stat-label">Running</span>
              <img src="/load.svg" alt="Running" className="run-list__stat-icon run-list__stat-icon--running" />
            </div>
            <span className="run-list__stat-value run-list__stat-value--running">{stats.running}</span>
          </div>
          <div className="run-list__stat">
            <div className="run-list__stat-header">
              <span className="run-list__stat-label">Completed</span>
              <CheckCircle className="run-list__stat-icon run-list__stat-icon--completed" />
            </div>
            <span className="run-list__stat-value run-list__stat-value--completed">{stats.completed}</span>
          </div>
          <div className="run-list__stat">
            <div className="run-list__stat-header">
              <span className="run-list__stat-label">Paused</span>
              <Pause className="run-list__stat-icon run-list__stat-icon--paused" />
            </div>
            <span className="run-list__stat-value run-list__stat-value--paused">{stats.paused}</span>
          </div>
          <div className="run-list__stat">
            <div className="run-list__stat-header">
              <span className="run-list__stat-label">Failed</span>
              <XCircle className="run-list__stat-icon run-list__stat-icon--failed" />
            </div>
            <span className="run-list__stat-value run-list__stat-value--failed">{stats.failed}</span>
          </div>
        </div>
      )}

      {showTabs && (
        <div className="run-list__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`run-list__tab ${activeTab === tab.value ? "run-list__tab--active" : ""}`}
              onClick={() => onTabChange?.(tab.value)}
            >
              {tab.label}
              <span className="run-list__tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      <CardHeader className="run-list__header-wrapper">
        <div className="run-list__header-title">
          <CardTitle>{title}</CardTitle>
          {showHeaderButton && onHeaderButtonClick && (
            <Button variant="secondary" size="sm" onClick={onHeaderButtonClick}>
              {headerButtonLabel}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="run-list__content-wrapper">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
