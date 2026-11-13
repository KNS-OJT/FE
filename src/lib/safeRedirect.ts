/** Chống open redirect: chỉ nhận đường dẫn nội bộ "/xxx". */
export function safeRedirect(target: unknown, fallback = '/'): string {
  if (typeof target !== 'string' || !target.startsWith('/')) return fallback;
  if (target.startsWith('//') || target.startsWith('/\\') || [...target].some((c) => c.charCodeAt(0) < 32)) return fallback;
  return target;
}
