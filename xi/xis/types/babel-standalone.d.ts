declare module '@babel/standalone' {
  export interface TransformResult {
    code?: string;
    map?: object;
    ast?: object;
  }

  export interface CompileOptions {
    presets?: string[];
    plugins?: string[];
    filename?: string;
    sourceType?: string;
    [key: string]: unknown;
  }

  export function compile(code: string, options?: CompileOptions): TransformResult;
}
