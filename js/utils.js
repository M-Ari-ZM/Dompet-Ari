/**
 * Date and Currency Utilities
 */

/**
 * Format integer/float to Indonesian Rupiah currency string
 * e.g. 50000 -> "Rp 50.000"
 */
export function formatRupiah(amount) {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  return formatted;
}

/**
 * Get start and end dates of the current week (Monday to Sunday)
 */
export function getCurrentWeekRange(referenceDate = new Date()) {
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday ...
  // Normalize Monday as day 1, Sunday as day 7
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday,
    end: sunday,
    startStr: toLocalDateString(monday),
    endStr: toLocalDateString(sunday)
  };
}

/**
 * Format date string (YYYY-MM-DD) to friendly Indonesian date
 * e.g. "2026-10-23" -> "23 Okt 2026"
 */
export function formatFriendlyDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

/**
 * Format date range for UI banner
 */
export function formatWeekRangeDisplay(start, end) {
  const startFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(start);
  const endFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(end);
  return `${startFmt} - ${endFmt}`;
}

/**
 * Format a local Date object to 'YYYY-MM-DD' string without UTC conversion
 */
function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Check if a date string falls inside a date range
 */
export function isDateWithinRange(dateStr, startStr, endStr) {
  return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Get the week-of-month (1–5) for a given YYYY-MM-DD string.
 * Week 1 = days 1–7, Week 2 = days 8–14, etc.
 */
export function getWeekOfMonth(dateStr) {
  if (!dateStr) return null;
  const day = parseInt(dateStr.split('-')[2], 10);
  return Math.ceil(day / 7);
}

/**
 * Get the JS day-of-week (0=Sunday, 1=Monday … 6=Saturday)
 * from a YYYY-MM-DD string, interpreted in LOCAL time.
 */
export function getDayOfWeek(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/**
 * Extract all unique years from a list of transactions, sorted descending.
 */
export function extractYears(transactions) {
  const years = new Set(transactions.map(t => t.date?.slice(0, 4)).filter(Boolean));
  return [...years].sort((a, b) => b - a);
}
