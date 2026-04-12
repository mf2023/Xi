import { compile, TransformResult } from '@babel/standalone';

export function compileTSX(code: string): TransformResult {
  return compile(code, {
    presets: ['react', 'typescript'],
    filename: 'component.tsx',
  });
}
