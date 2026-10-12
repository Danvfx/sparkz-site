// Google Forms submission. no-cors means the response is unreadable, so success = the request completed without throwing.
export async function postGoogleForm(action, entryMap, data) {
  const body = new URLSearchParams();
  for (const [key, entry] of Object.entries(entryMap)) {
    if (entry && data[key] !== undefined && data[key] !== '') body.append(entry, String(data[key]));
  }
  await fetch(action, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
}
export const isConfigured = (cfg) => !!(cfg.ACTION && Object.values(cfg.ENTRY).some(Boolean));
