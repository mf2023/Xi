export interface GpuDetailedInfo {
  index: number;
  vendor: string;
  name: string;
  gpu_type: string;
  vram_gb: number;
  shared_memory_gb: number;
  driver_version: string;
  driver_date: string;
  device_id: string;
  vendor_id: string;
  subsys_id: string;
  revision: string;
  video_processor: string;
  current_resolution: string;
  refresh_rate: number;
  video_architecture: string;
  status: string;
  utilization: number;
  memory_used_gb: number;
  memory_total_gb: number;
  temperature: number;
  power_draw: number;
}

export interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  gpu_count: number;
  gpu_utilization: number[];
  gpu_memory_used: number[];
  gpu_memory_total: number[];
  gpu_vendors: string[];
  gpu_names: string[];
  gpu_temperatures: number[];
  gpu_power_draw: number[];
  gpu_driver_versions: string[];
  gpu_details: GpuDetailedInfo[];
  uptime_seconds: number;
  request_count: number;
  qps: number;
  net_bytes_sent: number;
  net_bytes_recv: number;
  net_upload_speed: number;
  net_download_speed: number;
}

export interface GPUStats {
  id: number;
  name: string;
  utilization: number;
  memory_used: number;
  memory_total: number;
  temperature: number;
  power_draw: number;
  power_limit: number;
}

export interface MemoryStats {
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface CPUStats {
  percent_total: number;
  percent_per_core: number[];
  count: number;
}

export interface NetworkStats {
  bytes_sent: number;
  bytes_recv: number;
  upload_speed: number;
  download_speed: number;
}
