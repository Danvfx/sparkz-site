// Break-slot cutoff countdown. Times are Asia/Manila wall-clock times, weekdays only.
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});
function manilaWall(now) {
  const p = Object.fromEntries(fmt.formatToParts(now).filter((x) => x.type !== 'literal').map((x) => [x.type, +x.value]));
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return { p, offset: wall - Math.floor(now.getTime() / 1000) * 1000 }; // wall-clock minus real time
}

/** Next pre-order cutoff (break start minus cutoffMinutes) that is still in the future, or null. */
export function nextCutoff(slots, cutoffMinutes, now = new Date()) {
  if (!slots?.length) return null;
  const { p, offset } = manilaWall(now);
  for (let add = 0; add < 8; add++) {
    const day = new Date(Date.UTC(p.year, p.month - 1, p.day + add));
    const dow = day.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
    for (const s of sorted) {
      const [hh, mm] = s.start.split(':').map(Number);
      const cutoffWall = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hh, mm) - cutoffMinutes * 60000;
      const ms = cutoffWall - offset - now.getTime();
      if (ms > 0) return { slot: s, ms };
    }
  }
  return null;
}
export const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const two = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${two(m)}:${two(sec)}`;
};
