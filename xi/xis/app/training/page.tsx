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

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Plus } from "lucide-react";
import { useRunsStore } from "@/lib/stores";
import { useApps } from "@/components/layout/apps-context";
import { RunList } from "@/components/runs/run-list";
import type { RunStatus } from "@/types/training";
import { useI18n } from "@/lib/i18n";

export default function TrainingPage() {
  const { t } = useI18n();
  const { runs, isLoading, isWsConnected, error, connectWebSocket, controlRun } = useRunsStore();
  const { openAppWithParams } = useApps();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<RunStatus | "all">("all");

  useEffect(() => {
    if (!isWsConnected && !error) {
      connectWebSocket();
    }
  }, [isWsConnected, error, connectWebSocket]);

  useEffect(() => {
    if (!hasAutoOpened && searchParams.get("create") === "true") {
      setHasAutoOpened(true);
      router.replace("/training");
      setTimeout(() => {
        openAppWithParams("run-orchestrator", { mode: "create", runType: "train" });
      }, 100);
    }
  }, [searchParams, hasAutoOpened, router, openAppWithParams]);

  const trainingRuns = runs.filter((run) => run.command === "train");

  const handleViewRun = (runId: string) => {
    openAppWithParams("run-orchestrator", { mode: "view", runId });
  };

  return (
    <ScrollArea className="h-full">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{t("trainingPage.title")}</h1>
          <Button variant="secondary" onClick={() => openAppWithParams("run-orchestrator", { mode: "create", runType: "train" })}>
            <Plus className="mr-2 h-4 w-4" />
            {t("trainingPage.newTraining")}
          </Button>
        </div>

        <RunList
          runs={trainingRuns}
          isLoading={isLoading}
          isWsConnected={isWsConnected}
          error={error}
          showStats={true}
          showTabs={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onControl={controlRun}
          onView={handleViewRun}
          emptyIcon={<Brain className="run-list__empty-icon" />}
          emptyTitle={t("trainingPage.noTrainingRuns")}
          title={t("trainingPage.trainingRuns")}
          filterType="train"
        />
      </div>
    </ScrollArea>
  );
}
