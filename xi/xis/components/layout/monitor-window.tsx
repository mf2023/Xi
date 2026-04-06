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

import { useEffect } from "react";
import { useMonitorStore } from "@/lib/stores";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Cpu,
  MemoryStick,
  Server,
  Network,
  Gauge,
  Zap,
  Thermometer,
  Battery,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApps } from "./apps-context";
import { AppWindow } from "./app-window";
import { useI18n } from "@/lib/i18n";

interface MonitorWindowProps {
  state: "minimized" | "normal" | "maximized";
}

interface GpuInfo {
  vendor: string;
  name: string;
  utilization: number;
  memory_used_gb: number;
  memory_total_gb: number;
  temperature: number;
  power_draw: number;
  driver_version: string;
}

function getGpuVendorColor(vendor: string): { bg: string; text: string; bar: string } {
  switch (vendor.toLowerCase()) {
    case "nvidia":
      return { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", bar: "bg-green-500" };
    case "amd":
      return { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", bar: "bg-red-500" };
    case "intel":
      return { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" };
    default:
      return { bg: "bg-violet-100 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500" };
  }
}

function getGpuVendorLabel(vendor: string): string {
  switch (vendor.toLowerCase()) {
    case "nvidia":
      return "NVIDIA";
    case "amd":
      return "AMD";
    case "intel":
      return "Intel";
    default:
      return vendor.toUpperCase();
  }
}

export function MonitorWindow({ state }: MonitorWindowProps) {
  const { t } = useI18n();
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
  } = useApps();
  const savedPosition = getAppPosition("monitor");
  const savedSize = getAppSize("monitor");
  const maximized = isAppMaximized("monitor");
  const focused = isAppFocused("monitor");

  const { stats, isWsConnected, connectWebSocket, disconnectWebSocket } = useMonitorStore();

  useEffect(() => {
    if (!isWsConnected) {
      connectWebSocket();
    }
    return () => {
      disconnectWebSocket();
    };
  }, [isWsConnected, connectWebSocket, disconnectWebSocket]);

  const cpuPercent = stats?.cpu_percent || 0;
  const memPercent = stats?.memory_percent || 0;
  const memUsed = stats?.memory_used_gb || 0;
  const memTotal = stats?.memory_total_gb || 0;
  const gpuCount = stats?.gpu_count || 0;
  const gpuVendors = stats?.gpu_vendors || [];
  const gpuNames = stats?.gpu_names || [];
  const gpuUtils = stats?.gpu_utilization || [];
  const gpuMemUsed = stats?.gpu_memory_used || [];
  const gpuMemTotal = stats?.gpu_memory_total || [];
  const gpuTemps = stats?.gpu_temperatures || [];
  const gpuPower = stats?.gpu_power_draw || [];
  const gpuDriverVersions = stats?.gpu_driver_versions || [];
  const qps = (stats?.qps || 0).toFixed(2);
  const uptime = stats?.uptime_seconds || 0;
  const netBytesSent = stats?.net_bytes_sent || 0;
  const netBytesRecv = stats?.net_bytes_recv || 0;
  const netUploadSpeed = stats?.net_upload_speed || 0;
  const netDownloadSpeed = stats?.net_download_speed || 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number) => {
    return formatBytes(bytesPerSec) + "/s";
  };

  const gpus: GpuInfo[] = [];
  for (let i = 0; i < gpuCount; i++) {
    gpus.push({
      vendor: gpuVendors[i] || "unknown",
      name: gpuNames[i] || `GPU ${i}`,
      utilization: gpuUtils[i] || 0,
      memory_used_gb: gpuMemUsed[i] || 0,
      memory_total_gb: gpuMemTotal[i] || 0,
      temperature: gpuTemps[i] || 0,
      power_draw: gpuPower[i] || 0,
      driver_version: gpuDriverVersions[i] || "",
    });
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (state === "minimized") {
    return null;
  }

  return (
    <AppWindow
      appId="monitor"
      title={t("monitor.title")}
      icon={<Activity className="h-5 w-5 text-primary" />}
      defaultSize={{ width: 900, height: 600 }}
      onMinimize={() => minimizeApp("monitor")}
      onClose={() => closeApp("monitor")}
      savedPosition={savedPosition}
      onPositionChange={(pos) => updateAppPosition("monitor", pos)}
      savedSize={savedSize}
      onSizeChange={(size) => updateAppSize("monitor", size)}
      isMaximized={maximized}
      onMaximize={() => maximizeApp("monitor")}
      onRestore={() => restoreApp("monitor")}
      isFocused={focused}
      onFocus={() => focusApp("monitor")}
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 py-0 h-12">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            <Cpu className="h-4 w-4 mr-2" />
            {t("monitor.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            <Activity className="h-4 w-4 mr-2" />
            {t("monitor.tabs.performance")}
          </TabsTrigger>
          <TabsTrigger value="gpu" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            <Server className="h-4 w-4 mr-2" />
            {t("monitor.tabs.gpu")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-6 mt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/20">
                    <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{t("monitor.cpuUsage")}</span>
                </div>
                <span className="text-2xl font-bold">{cpuPercent.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="progress-bar progress-bar--emerald"
                  style={{ '--progress-width': `${cpuPercent}%` } as React.CSSProperties}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("monitor.coresAvailable", { count: navigator.hardwareConcurrency || 8 })}</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/20">
                    <MemoryStick className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{t("monitor.memoryUsage")}</span>
                </div>
                <span className="text-2xl font-bold">{memPercent.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="progress-bar progress-bar--amber"
                  style={{ '--progress-width': `${memPercent}%` } as React.CSSProperties}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("monitor.gbUsed", { used: memUsed.toFixed(1), total: memTotal.toFixed(1) })}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t("monitor.gpuDetails")}</span>
                <span className="text-sm text-muted-foreground">({gpuCount} {t("monitor.detected")})</span>
              </div>
              {gpuCount > 0 ? (
                <div className="space-y-2">
                  {gpus.map((gpu, idx) => {
                    const colors = getGpuVendorColor(gpu.vendor);
                    const memPercent = gpu.memory_total_gb > 0 ? (gpu.memory_used_gb / gpu.memory_total_gb) * 100 : 0;
                    return (
                      <div key={idx} className="p-2 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1 rounded", colors.bg)}>
                              <Server className={cn("h-3 w-3", colors.text)} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium truncate max-w-[120px]">{gpu.name}</span>
                              <span className={cn("text-[10px]", colors.text)}>{getGpuVendorLabel(gpu.vendor)}</span>
                            </div>
                          </div>
                          <span className="text-sm font-semibold">{gpu.utilization.toFixed(0)}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MemoryStick className="h-2.5 w-2.5" />
                            <span>{gpu.memory_used_gb.toFixed(1)}/{gpu.memory_total_gb.toFixed(1)} GB</span>
                          </div>
                          {gpu.temperature > 0 && (
                            <div className="flex items-center gap-1">
                              <Thermometer className="h-2.5 w-2.5" />
                              <span>{gpu.temperature.toFixed(0)}°C</span>
                            </div>
                          )}
                          {gpu.power_draw > 0 && (
                            <div className="flex items-center gap-1">
                              <Battery className="h-2.5 w-2.5" />
                              <span>{gpu.power_draw.toFixed(0)}W</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("progress-bar", colors.bar)}
                            style={{ '--progress-width': `${memPercent}%` } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Server className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-xs">{t("monitor.noGpu")}</p>
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t("monitor.network")}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/20">
                      <svg className="h-3 w-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">{t("monitor.upload")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{formatSpeed(netUploadSpeed)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({formatBytes(netBytesSent)})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/20">
                      <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">{t("monitor.download")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{formatSpeed(netDownloadSpeed)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({formatBytes(netBytesRecv)})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-sky-100 dark:bg-sky-900/20">
                      <Zap className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="text-xs font-medium">{t("monitor.apiCalls")}</span>
                  </div>
                  <span className="text-sm font-semibold">{stats?.request_count || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Zap className="h-3 w-3" />
                <span className="text-xs">{t("monitor.qps")}</span>
              </div>
              <p className="text-xl font-semibold">{qps}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Gauge className="h-3 w-3" />
                <span className="text-xs">{t("monitor.uptime")}</span>
              </div>
              <p className="text-xl font-semibold">{formatUptime(uptime)}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <MemoryStick className="h-3 w-3" />
                <span className="text-xs">{t("monitor.totalVram")}</span>
              </div>
              <p className="text-xl font-semibold">{gpus.reduce((sum, g) => sum + g.memory_total_gb, 0).toFixed(1)} GB</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="p-6 mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">{t("monitor.performanceComingSoon")}</p>
            <p className="text-xs mt-1">{t("monitor.performanceDesc")}</p>
          </div>
        </TabsContent>

        <TabsContent value="gpu" className="p-6 mt-0">
          {stats?.gpu_details && stats.gpu_details.length > 0 ? (
            <div className="space-y-6">
              {stats.gpu_details.map((gpu, idx) => {
                const colors = getGpuVendorColor(gpu.vendor);
                
                return (
                  <div key={idx} className="rounded-lg border">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-md", colors.bg)}>
                          <Server className={cn("h-5 w-5", colors.text)} />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{gpu.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn("text-xs px-2 py-0.5 rounded font-medium", colors.bg, colors.text)}>
                              {gpu.vendor}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {gpu.vram_gb.toFixed(0)} GB VRAM | {gpu.gpu_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold">{gpu.utilization.toFixed(0)}%</span>
                        <div className="text-xs text-muted-foreground">{t("monitor.gpuUtilization")}</div>
                      </div>
                    </div>
                    
                    {/* Hardware Info Section */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">{t("monitor.hardwareInfo")}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.gpuProduct")}</span>
                          <span>{gpu.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.gpuType")}</span>
                          <span>{gpu.gpu_type}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.vendorId")}</span>
                          <span className="font-mono">{gpu.vendor_id || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.deviceId")}</span>
                          <span className="font-mono">{gpu.device_id || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.subsysId")}</span>
                          <span className="font-mono">{gpu.subsys_id || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.revision")}</span>
                          <span className="font-mono">{gpu.revision || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.videoProcessor")}</span>
                          <span>{gpu.video_processor || gpu.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.videoArchitecture")}</span>
                          <span>{gpu.video_architecture || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.currentResolution")}</span>
                          <span>{gpu.current_resolution || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.refreshRate")}</span>
                          <span>{gpu.refresh_rate > 0 ? `${gpu.refresh_rate} Hz` : "-"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Software Info Section */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">{t("monitor.softwareInfo")}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.driverVersion")}</span>
                          <span className="font-mono">{gpu.driver_version || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.driverDate")}</span>
                          <span>{gpu.driver_date || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">{t("monitor.status")}</span>
                          <span className={cn(
                            gpu.status === "OK" ? "text-emerald-600 dark:text-emerald-400" : ""
                          )}>{gpu.status || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Server className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">{t("monitor.noGpu")}</p>
              <p className="text-xs mt-1">{t("monitor.noGpuDesc")}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppWindow>
  );
}
