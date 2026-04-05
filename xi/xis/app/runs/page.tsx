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

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play } from "lucide-react";
import { useRunsStore } from "@/lib/stores";
import { useApps } from "@/components/layout/apps-context";
import { RunList } from "@/components/runs/run-list";
import type { RunStatus } from "@/types/training";

export default function RunsPage() {
  const { runs, isLoading, isWsConnected, connectWebSocket, controlRun } = useRunsStore();
  const { openAppWithParams } = useApps();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<RunStatus | "all">("all");

  useEffect(() => {
    if (!isWsConnected) {
      connectWebSocket();
    }
  }, [isWsConnected, connectWebSocket]);

  useEffect(() => {
    if (hasAutoOpened) return;

    const createMode = searchParams.get("create") === "true";
    const viewRunId = searchParams.get("view");

    if (createMode || viewRunId) {
      setHasAutoOpened(true);
      router.replace("/runs");
      
      setTimeout(() => {
        if (viewRunId) {
          openAppWithParams("run-orchestrator", { mode: "view", runId: viewRunId });
        } else if (createMode) {
          openAppWithParams("run-orchestrator", { mode: "create" });
        }
      }, 100);
    }
  }, [searchParams, hasAutoOpened, router, openAppWithParams]);

  const handleViewRun = (runId: string) => {
    openAppWithParams("run-orchestrator", { mode: "view", runId });
  };

  return (
    <ScrollArea className="h-full">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Runs</h1>
          <Button variant="secondary" onClick={() => openAppWithParams("run-orchestrator", { mode: "create" })}>
            <Play className="mr-2 h-4 w-4" />
            New Run
          </Button>
        </div>

        <RunList
          runs={runs}
          isLoading={isLoading}
          isWsConnected={isWsConnected}
          showStats={true}
          showTabs={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onControl={controlRun}
          onView={handleViewRun}
          emptyTitle="No runs yet"
          title="All Runs"
        />
      </div>
    </ScrollArea>
  );
}
