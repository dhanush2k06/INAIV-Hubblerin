/**
 * Event dates are stored as display strings in Firestore, e.g. "July 18, 2026"
 * or "December 5, 2026" (see seed.ts / sql schema). This module provides a
 * small parser so those human-readable dates can be compared with "now".
 */

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

/**
 * Parse a "Month DD, YYYY" (optionally with a time suffix or single-digit day)
 * string into a Date at the END of that day (11:59:59.999pm local time), so an
 * event is considered "over" only after its date fully passes.
 *
 * Falls back to native Date parsing, then to epoch 0 if unparseable.
 */
export function parseEventDate(value: string | null | undefined): number {
  if (!value) return 0

  const trimmed = value.trim()

  // Try "Month DD, YYYY"
  const match = trimmed.match(
    /^([a-zA-Z]+)\s+(\d{1,2})(?:\s*,)?\s+(\d{4})/,
  )
  if (match) {
    const month = MONTHS[match[1].toLowerCase()]
    const day = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)
    if (month !== undefined && day >= 1 && day <= 31 && year >= 1970) {
      // End of the event day (just before midnight next day).
      return new Date(year, month, day + 1).getTime() - 1
    }
  }

  // Fallback: let the runtime try to parse it.
  const parsed = new Date(trimmed).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * Returns true when the event's end date has fully passed (i.e. the event day
 * is gone). Uses `now` (defaults to current time) for deterministic testing.
 */
export function isEventOver(
  endDate: string | null | undefined,
  now: number = Date.now(),
): boolean {
  return parseEventDate(endDate) < now
}

