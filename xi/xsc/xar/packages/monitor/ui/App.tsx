import * as React from "react";
import { XARControls } from "@/components/xar/types";
import { XARBridge } from "@/components/xar/bridge";
import { Container } from "@/components/xar/controls/Container";
import { Progress } from "@/components/xar/controls/Progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/xar/controls/Tabs";
import type { SystemStats, GpuDetailedInfo } from "../logic/types";
import { MonitorAPI } from "../logic/api";

interface AppProps {
  appId: string;
  controls: XARControls;
  bridge: XARBridge;
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatSpeed(bytesPerSec: number): string {
  return formatBytes(bytesPerSec) + "/s";
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function StatCard({ label, value, subValue, color }: {
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}) {
  return (
    <Container direction="vertical" gap={8} className="rounded-lg border p-4 flex-1">
      <Container direction="horizontal" gap={8} className="items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold">{value}</span>
      </Container>
      {subValue && <Progress value={0} className="h-2" />}
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
    </Container>
  );
}

function GpuCard({ gpu }: { gpu: GpuDetailedInfo }) {
  const colors = getGpuVendorColor(gpu.vendor);
  const memPercent = gpu.memory_total_gb > 0 ? (gpu.memory_used_gb / gpu.memory_total_gb) * 100 : 0;

  return (
    <Container direction="vertical" gap={8} className="p-3 rounded-md bg-muted/50">
      <Container direction="horizontal" gap={8} className="items-center justify-between">
        <Container direction="horizontal" gap={8} className="items-center">
          <div className={`p-1 rounded ${colors.bg}`}>
            <span className={`text-xs ${colors.text}`}>{getGpuVendorLabel(gpu.vendor)}</span>
          </div>
          <Container direction="vertical" gap={2}>
            <span className="text-xs font-medium truncate max-w-[120px]">{gpu.name}</span>
            <span className={`text-[10px] ${colors.text}`}>{gpu.vendor}</span>
          </Container>
        </Container>
        <span className="text-sm font-semibold">{gpu.utilization.toFixed(0)}%</span>
      </Container>
      <Container direction="horizontal" gap={16} className="text-[10px] text-muted-foreground">
        <span>{gpu.memory_used_gb.toFixed(1)}/{gpu.memory_total_gb.toFixed(1)} GB</span>
        {gpu.temperature > 0 && <span>{gpu.temperature.toFixed(0)}°C</span>}
        {gpu.power_draw > 0 && <span>{gpu.power_draw.toFixed(0)}W</span>}
      </Container>
      <Progress value={memPercent} className="h-1" />
    </Container>
  );
}

function NetworkCard({ stats }: { stats: SystemStats }) {
  return (
    <Container direction="vertical" gap={8} className="rounded-lg border p-4 flex-1">
      <Container direction="horizontal" gap={8} className="items-center mb-2">
        <span className="font-medium">Network</span>
      </Container>
      <Container direction="vertical" gap={8}>
        <Container direction="horizontal" gap={8} className="items-center justify-between p-3 rounded-md bg-muted/50">
          <Container direction="horizontal" gap={8} className="items-center">
            <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/20">
              <svg className="h-3 w-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
            <span className="text-xs font-medium">Upload</span>
          </Container>
          <Container direction="horizontal" gap={8} className="items-center">
            <span className="text-sm font-semibold">{formatSpeed(stats.net_upload_speed)}</span>
            <span className="text-xs text-muted-foreground">({formatBytes(stats.net_bytes_sent)})</span>
          </Container>
        </Container>
        <Container direction="horizontal" gap={8} className="items-center justify-between p-3 rounded-md bg-muted/50">
          <Container direction="horizontal" gap={8} className="items-center">
            <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/20">
              <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
            <span className="text-xs font-medium">Download</span>
          </Container>
          <Container direction="horizontal" gap={8} className="items-center">
            <span className="text-sm font-semibold">{formatSpeed(stats.net_download_speed)}</span>
            <span className="text-xs text-muted-foreground">({formatBytes(stats.net_bytes_recv)})</span>
          </Container>
        </Container>
      </Container>
    </Container>
  );
}

function GpuDetailCard({ gpu }: { gpu: GpuDetailedInfo }) {
  const colors = getGpuVendorColor(gpu.vendor);

  return (
    <Container direction="vertical" gap={0} className="rounded-lg border overflow-hidden">
      <Container direction="horizontal" gap={16} className="items-center justify-between p-4 border-b bg-muted/30">
        <Container direction="horizontal" gap={12} className="items-center">
          <div className={`p-2 rounded-md ${colors.bg}`}>
            <span className={`text-xs ${colors.text}`}>{gpu.vendor}</span>
          </div>
          <Container direction="vertical" gap={4}>
            <span className="font-semibold text-lg">{gpu.name}</span>
            <Container direction="horizontal" gap={8} className="items-center">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors.bg} ${colors.text}`}>{gpu.vendor}</span>
              <span className="text-xs text-muted-foreground">{gpu.vram_gb.toFixed(0)} GB VRAM | {gpu.gpu_type}</span>
            </Container>
          </Container>
        </Container>
        <Container direction="vertical" gap={0} className="items-end">
          <span className="text-3xl font-bold">{gpu.utilization.toFixed(0)}%</span>
          <span className="text-xs text-muted-foreground">GPU Utilization</span>
        </Container>
      </Container>

      <Container direction="vertical" gap={0} className="p-4 border-b">
        <span className="font-medium text-sm mb-3">Hardware Info</span>
        <Container direction="vertical" gap={0}>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">GPU Product</span>
            <span>{gpu.name}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">GPU Type</span>
            <span>{gpu.gpu_type}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Vendor ID</span>
            <span className="font-mono">{gpu.vendor_id || "-"}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Device ID</span>
            <span className="font-mono">{gpu.device_id || "-"}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Subsystem ID</span>
            <span className="font-mono">{gpu.subsys_id || "-"}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Revision</span>
            <span className="font-mono">{gpu.revision || "-"}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Video Processor</span>
            <span>{gpu.video_processor || gpu.name}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Current Resolution</span>
            <span>{gpu.current_resolution || "-"}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Refresh Rate</span>
            <span>{gpu.refresh_rate > 0 ? `${gpu.refresh_rate} Hz` : "-"}</span>
          </Container>
        </Container>
      </Container>

      <Container direction="vertical" gap={0} className="p-4">
        <span className="font-medium text-sm mb-3">Software Info</span>
        <Container direction="vertical" gap={0}>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Driver Version</span>
            <span className="font-mono">{gpu.driver_version || "-"}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Driver Date</span>
            <span>{gpu.driver_date || "-"}</span>
          </Container>
          <Container direction="horizontal" gap={0} className="justify-between py-1 border-b border-dashed border-muted">
            <span className="text-muted-foreground">Status</span>
            <span className={gpu.status === "OK" ? "text-emerald-600 dark:text-emerald-400" : ""}>{gpu.status || "-"}</span>
          </Container>
        </Container>
      </Container>
    </Container>
  );
}

export function App({ appId, controls, bridge }: AppProps) {
  const [stats, setStats] = React.useState<SystemStats | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");

  React.useEffect(() => {
    const api = new MonitorAPI(bridge);

    api.getStats().then((result) => {
      if (result) {
        setStats(result);
      }
    });

    const unsubscribe = api.subscribe((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubscribe();
    };
  }, [bridge]);

  if (!stats) {
    return (
      <Container direction="vertical" gap={16} className="w-full h-full items-center justify-center p-6">
        <span className="text-muted-foreground">Loading system stats...</span>
      </Container>
    );
  }

  const cpuPercent = stats.cpu_percent || 0;
  const memPercent = stats.memory_percent || 0;
  const memUsed = stats.memory_used_gb || 0;
  const memTotal = stats.memory_total_gb || 0;
  const gpuCount = stats.gpu_count || 0;
  const gpus = stats.gpu_details || [];
  const qps = (stats.qps || 0).toFixed(2);
  const uptime = stats.uptime_seconds || 0;
  const totalVram = gpus.reduce((sum, g) => sum + g.memory_total_gb, 0);

  return (
    <Container direction="vertical" gap={0} className="w-full h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 py-0 h-12">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            Performance
          </TabsTrigger>
          <TabsTrigger value="gpu" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            GPU
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-6 mt-0">
          <Container direction="vertical" gap={16}>
            <Container direction="horizontal" gap={16} className="items-stretch">
              <StatCard
                label="CPU Usage"
                value={`${cpuPercent.toFixed(0)}%`}
                subValue={`${stats.cpu_percent.toFixed(1)}%`}
              />
              <StatCard
                label="Memory Usage"
                value={`${memPercent.toFixed(0)}%`}
                subValue={`${memUsed.toFixed(1)} / ${memTotal.toFixed(1)} GB`}
              />
            </Container>

            <Container direction="horizontal" gap={16} className="items-stretch">
              <Container direction="vertical" gap={12} className="flex-1 rounded-lg border p-4">
                <Container direction="horizontal" gap={8} className="items-center">
                  <span className="font-medium">GPU Details</span>
                  <span className="text-sm text-muted-foreground">({gpuCount} detected)</span>
                </Container>
                {gpuCount > 0 ? (
                  <Container direction="vertical" gap={8}>
                    {gpus.map((gpu, idx) => (
                      <GpuCard key={idx} gpu={gpu} />
                    ))}
                  </Container>
                ) : (
                  <Container direction="vertical" gap={8} className="items-center justify-center py-6 text-muted-foreground">
                    <span className="text-xs">No GPU detected</span>
                  </Container>
                )}
              </Container>

              <NetworkCard stats={stats} />
            </Container>

            <Container direction="horizontal" gap={12} className="items-stretch">
              <Container direction="vertical" gap={4} className="flex-1 rounded-lg border p-3 text-center">
                <span className="text-xs text-muted-foreground">QPS</span>
                <span className="text-xl font-semibold">{qps}</span>
              </Container>
              <Container direction="vertical" gap={4} className="flex-1 rounded-lg border p-3 text-center">
                <span className="text-xs text-muted-foreground">Uptime</span>
                <span className="text-xl font-semibold">{formatUptime(uptime)}</span>
              </Container>
              <Container direction="vertical" gap={4} className="flex-1 rounded-lg border p-3 text-center">
                <span className="text-xs text-muted-foreground">Total VRAM</span>
                <span className="text-xl font-semibold">{totalVram.toFixed(1)} GB</span>
              </Container>
            </Container>
          </Container>
        </TabsContent>

        <TabsContent value="performance" className="p-6 mt-0">
          <Container direction="vertical" gap={16} className="items-center justify-center py-12 text-muted-foreground">
            <span className="text-sm">Performance metrics coming soon</span>
            <span className="text-xs">Detailed performance analysis will be available in a future update</span>
          </Container>
        </TabsContent>

        <TabsContent value="gpu" className="p-6 mt-0">
          {gpus.length > 0 ? (
            <Container direction="vertical" gap={24}>
              {gpus.map((gpu, idx) => (
                <GpuDetailCard key={idx} gpu={gpu} />
              ))}
            </Container>
          ) : (
            <Container direction="vertical" gap={16} className="items-center justify-center py-12 text-muted-foreground">
              <span className="text-sm">No GPU detected</span>
              <span className="text-xs">GPU details will be displayed when available</span>
            </Container>
          )}
        </TabsContent>
      </Tabs>
    </Container>
  );
}

export default App;
