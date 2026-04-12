export function evalCode(code: string, context: Record<string, unknown> = {}): unknown {
  const ctxKeys = Object.keys(context);
  const ctxValues = Object.values(context);

  const fn = new Function(
    'createElement',
    'React',
    ...ctxKeys,
    `${code}; return Component;`
  );

  return fn(
    (type: string, props: object) => ({ type, props }),
    context['React'],
    ...ctxValues
  );
}
