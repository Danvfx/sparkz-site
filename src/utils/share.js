// Clipboard and Web Share, always wrapped in try/catch with a visible fallback (a selectable text field).
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
export async function shareLink({ title, text, url }) {
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return 'shared'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  return (await copyText(url)) ? 'copied' : 'manual';
}
