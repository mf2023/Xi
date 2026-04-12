import { createRoot, Root } from 'react-dom/client';
import { compileTSX } from './compiler';
import { evalCode } from './evaluator';
import * as React from 'react';

interface CachedApp {
  Component: unknown;
  root: Root | null;
}

interface ImportRegistry {
  [name: string]: unknown;
}

export class TSXRunner {
  private cache: Map<string, CachedApp> = new Map();
  private imports: ImportRegistry = {};

  load(appId: string, appData: { code: string }): void {
    const result = compileTSX(appData.code);
    if (result.code) {
      const Component = evalCode(result.code, {
        React,
        createElement: React.createElement,
        ...this.imports,
      });
      this.cache.set(appId, { Component, root: null });
    }
  }

  render(appId: string, container: HTMLElement, props: object): void {
    const cached = this.cache.get(appId);
    if (!cached) {
      throw new Error(`App ${appId} not loaded`);
    }

    const root = createRoot(container);
    cached.root = root;

    root.render(React.createElement(cached.Component as React.ComponentType, props));
  }

  unmount(appId: string): void {
    const cached = this.cache.get(appId);
    if (cached?.root) {
      cached.root.unmount();
      cached.root = null;
    }
  }

  registerImport(name: string, module: unknown): void {
    this.imports[name] = module;
  }
}
