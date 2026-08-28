const TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?)?/;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Stored timestamps are UTC, in SQLite's "YYYY-MM-DD HH:MM:SS[.mmm]" form or ISO. */
export function parseStoredTimestamp(storedTimestamp: string): Date | null {
  const match = TIMESTAMP_PATTERN.exec(storedTimestamp.trim());
  if (!match) {
    return null;
  }

  const [, year, month, day, hours, minutes, seconds = '0', milliseconds = '0'] = match;
  if (hours === undefined || minutes === undefined) {
    return null;
  }

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
      Number(milliseconds.padEnd(3, '0'))
    )
  );
}

/** Puts SQLite and ISO forms into one shape so they sort against each other as plain strings. */
export function toComparableTimestamp(value: string | null | undefined, fallback: string): string {
  const raw = (value ?? '').trim() || fallback.trim();

  return raw.replace('T', ' ').replace(/Z$/, '');
}

export function compareTimestamps(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

/** Renders a stored UTC timestamp in the device's local time. */
export function formatLocalDateTime(storedTimestamp: string): string {
  const trimmed = storedTimestamp.trim();
  const date = parseStoredTimestamp(trimmed);

  if (!date) {
    // Date-only values carry no time to shift, so they are shown as stored.
    return trimmed.slice(0, 10);
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}
