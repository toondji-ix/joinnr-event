/** Parse this API's single strong version validator, not general HTTP ETag syntax. */
export type ResourceVersion =
  | { readonly kind: 'missing' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'version'; readonly version: number };

export function parseResourceVersion(value: unknown): ResourceVersion {
  if (value === undefined) return { kind: 'missing' };
  if (typeof value !== 'string' || !/^"[1-9][0-9]{0,15}"$/.test(value)) {
    return { kind: 'invalid' };
  }
  const version = Number(value.slice(1, -1));
  return Number.isSafeInteger(version) ? { kind: 'version', version } : { kind: 'invalid' };
}
