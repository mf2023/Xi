import type { XARMessage } from "@/components/xar/types";
import type { XARBridge } from "@/components/xar/bridge";
import type { SystemStats } from "./types";

type StatsCallback = (stats: SystemStats) => void;

export class MonitorAPI {
  private bridge: XARBridge;
  private statsCallback: StatsCallback | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(bridge: XARBridge) {
    this.bridge = bridge;
  }

  async getStats(): Promise<SystemStats | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 5000);

      const cleanup = () => {
        clearTimeout(timeout);
      };

      const handler = (msg: XARMessage) => {
        if (msg.type === "monitor:stats" && msg.payload) {
          cleanup();
          cleanup = () => {};
          resolve(msg.payload as SystemStats);
        }
      };

      this.bridge.on("monitor:stats", handler);
      this.bridge.send({
        type: "monitor:getStats",
        payload: null,
        target: "monitor",
      });

      setTimeout(cleanup, 100);
    });
  }

  subscribe(callback: StatsCallback): () => void {
    this.statsCallback = callback;

    this.unsubscribe = this.bridge.on("monitor:stats", (msg: XARMessage) => {
      if (msg.type === "monitor:stats" && msg.payload && this.statsCallback) {
        this.statsCallback(msg.payload as SystemStats);
      }
    });

    this.bridge.send({
      type: "monitor:subscribe",
      payload: { interval: 2000 },
      target: "monitor",
    });

    return () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.statsCallback = null;
      this.bridge.send({
        type: "monitor:unsubscribe",
        payload: null,
        target: "monitor",
      });
    };
  }

  unsubscribe(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.statsCallback) {
      this.statsCallback = null;
    }
    this.bridge.send({
      type: "monitor:unsubscribe",
      payload: null,
      target: "monitor",
    });
  }
}
