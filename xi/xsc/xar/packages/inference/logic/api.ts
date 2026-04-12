import type { InferenceResponse, StreamChunk, Message } from "./types";

export interface XARBridge {
  send(event: string, data: unknown): void;
  onAppEvent(event: string, callback: (data: unknown) => void): () => void;
}

export class InferenceAPI {
  private bridge: XARBridge;
  private messageCallback: ((message: Message) => void) | null = null;
  private streamCallback: ((chunk: StreamChunk) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;

  constructor(bridge: XARBridge) {
    this.bridge = bridge;
    this.setupListeners();
  }

  private setupListeners() {
    this.bridge.onAppEvent("inference.message", (data) => {
      if (this.messageCallback) {
        this.messageCallback(data as Message);
      }
    });

    this.bridge.onAppEvent("inference.stream", (data) => {
      if (this.streamCallback) {
        this.streamCallback(data as StreamChunk);
      }
    });

    this.bridge.onAppEvent("inference.error", (data) => {
      if (this.errorCallback) {
        const errorData = data as { message: string };
        this.errorCallback(new Error(errorData.message));
      }
    });
  }

  onMessage(callback: (message: Message) => void) {
    this.messageCallback = callback;
  }

  onStream(callback: (chunk: StreamChunk) => void) {
    this.streamCallback = callback;
  }

  onError(callback: (error: Error) => void) {
    this.errorCallback = callback;
  }

  sendMessage(content: string, model: string = "Qwen3-Max"): void {
    this.bridge.send("inference.send", {
      content,
      model,
      timestamp: Date.now(),
    });
  }

  abort(): void {
    this.bridge.send("inference.abort", {});
  }

  selectModel(model: string): void {
    this.bridge.send("inference.selectModel", { model });
  }

  clearHistory(): void {
    this.bridge.send("inference.clearHistory", {});
  }
}
