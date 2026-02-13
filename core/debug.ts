let _debug = !!process.env.SKILLBOTS_DEBUG;

export function isDebug(): boolean { return _debug; }
export function toggleDebug(): boolean { _debug = !_debug; return _debug; }

/** Conditional debug logger. Only prints when debug mode is on. */
export function dbg(label: string, data?: unknown): void {
  if (!_debug) return;
  const prefix = `\x1b[90m[DBG ${label}]\x1b[0m`;
  if (data === undefined) { console.error(prefix); return; }
  const str = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  console.error(`${prefix} ${str.length > 2000 ? str.slice(0, 2000) + "...(truncated)" : str}`);
}
