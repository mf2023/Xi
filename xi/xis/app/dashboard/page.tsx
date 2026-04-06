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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Brain,
  Cpu,
  MessageSquare,
  Play,
  Plus,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRunsStore } from "@/lib/stores";
import { useMonitorStore } from "@/lib/stores/monitor-store";
import { useApps } from "@/components/layout/apps-context";
import { useEffect } from "react";
import { RunList } from "@/components/runs/run-list";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const { runs, isLoading: runsLoading, connectWebSocket: connectRunsWs, controlRun } = useRunsStore();
  const { stats, connectWebSocket: connectMonitorWs } = useMonitorStore();
  const { openApp } = useApps();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    connectRunsWs();
    connectMonitorWs();
  }, [connectRunsWs, connectMonitorWs]);

  const systemStats = stats;

  const handleViewRun = (runId: string) => {
    router.push(`/runs?view=${runId}`);
  };

  const handleInferenceClick = () => {
    openApp("inference");
  };

  return (
    <ScrollArea className="h-full">
      <div className="page-container">
        <div className="page-grid page-grid--2col">
          <Card className="card--hover" asChild>
            <Link href="/training?create=true">
              <CardHeader>
                <div className="page-header">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{t("dashboard.training")}</CardTitle>
                    </div>
                  </div>
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="page-stats">
                  <div className="page-stats__item">
                    <Play className="h-4 w-4" />
                    <span>{runs.filter((r) => r.status === "running").length || 0} {t("dashboard.active")}</span>
                  </div>
                  <div className="page-stats__item">
                    <span>{runs.length || 0} {t("dashboard.totalRuns")}</span>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="card--hover cursor-pointer" onClick={handleInferenceClick}>
            <CardHeader>
              <div className="page-header">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t("dashboard.inference")}</CardTitle>
                  </div>
                </div>
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="page-stats">
                <div className="page-stats__item">
                  <Activity className="h-4 w-4" />
                  <span>{t("dashboard.qps")}: {((systemStats?.qps as number) || 0).toFixed(2)}</span>
                </div>
                <div className="page-stats__item">
                  <Cpu className="h-4 w-4" />
                  <span>{(systemStats?.gpu_count as number) || 0} {t("dashboard.gpus")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <RunList
          runs={runs}
          isLoading={runsLoading}
          isWsConnected={true}
          showStats={false}
          showTabs={false}
          onControl={controlRun}
          onView={handleViewRun}
          emptyTitle={t("runs.noRuns")}
          title={t("runs.recentRuns")}
          showHeaderButton={true}
          headerButtonLabel={t("runs.viewAll")}
          onHeaderButtonClick={() => router.push("/runs")}
        />
      </div>
    </ScrollArea>
  );
}
