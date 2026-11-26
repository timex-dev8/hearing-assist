export function formatTime(ms: number) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0');
}
export function spokenTime(ms: number) {
  const sec = Math.floor(ms / 1000), h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
  const part = (n: number, unit: string) => n + ' ' + unit + (n === 1 ? '' : 's');
  return [h && part(h, 'hour'), m && part(m, 'minute'), (s || (!h && !m)) && part(s, 'second')].filter(Boolean).join(' ');
}
export const formatDate = (time: number) => new Date(time).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

const DAY = 86_400_000;
/** Today, Yesterday, Previous 7 Days, or the month. */
export function dayBucket(time: number, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (time >= today) return 'Today';
  if (time >= today - DAY) return 'Yesterday';
  if (time >= today - 6 * DAY) return 'Previous 7 Days';
  return new Date(time).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
/** Short "when" for a list row: a time today/yesterday, otherwise a date. */
export function shortWhen(time: number) {
  const b = dayBucket(time);
  return b === 'Today' || b === 'Yesterday'
    ? (b === 'Yesterday' ? 'Yesterday ' : '') + new Date(time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
