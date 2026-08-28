import {
  compareTimestamps,
  formatLocalDateTime,
  parseStoredTimestamp,
  toComparableTimestamp,
} from '../timestamps';

function toLocalDisplay(utcDate: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${utcDate.getFullYear()}-${pad(utcDate.getMonth() + 1)}-${pad(utcDate.getDate())} ${pad(
    utcDate.getHours()
  )}:${pad(utcDate.getMinutes())}`;
}

describe('parseStoredTimestamp', () => {
  test('reads SQLite and ISO forms as the same instant', () => {
    const sqliteForm = parseStoredTimestamp('2026-01-02 03:04:05');
    const isoForm = parseStoredTimestamp('2026-01-02T03:04:05Z');

    expect(sqliteForm?.getTime()).toBe(Date.UTC(2026, 0, 2, 3, 4, 5));
    expect(isoForm?.getTime()).toBe(sqliteForm?.getTime());
  });

  test('keeps sub-second precision', () => {
    expect(parseStoredTimestamp('2026-01-02 03:04:05.250')?.getTime()).toBe(Date.UTC(2026, 0, 2, 3, 4, 5, 250));
  });

  test('returns null when there is no time component', () => {
    expect(parseStoredTimestamp('2026-01-02')).toBeNull();
    expect(parseStoredTimestamp('not a date')).toBeNull();
  });
});

describe('toComparableTimestamp', () => {
  test('falls back to created_at when updated_at is missing', () => {
    expect(toComparableTimestamp(null, '2026-01-01 10:00:00')).toBe('2026-01-01 10:00:00');
    expect(toComparableTimestamp('   ', '2026-01-01 10:00:00')).toBe('2026-01-01 10:00:00');
  });

  test('normalizes ISO timestamps to the SQLite form', () => {
    expect(toComparableTimestamp('2026-01-01T10:00:00Z', 'x')).toBe('2026-01-01 10:00:00');
  });
});

describe('compareTimestamps', () => {
  test('orders by time regardless of sub-second precision', () => {
    expect(compareTimestamps('2026-01-01 10:00:00.123', '2026-01-01 10:00:00')).toBe(1);
    expect(compareTimestamps('2026-01-01 10:00:01', '2026-01-01 10:00:00.999')).toBe(1);
    expect(compareTimestamps('2026-01-01 10:00:00', '2026-01-01 10:00:00')).toBe(0);
  });

  test('orders SQLite and ISO forms consistently once normalized', () => {
    const sqliteForm = toComparableTimestamp('2026-01-02 09:00:00', 'x');
    const isoForm = toComparableTimestamp('2026-01-01T10:00:00Z', 'x');

    expect(compareTimestamps(sqliteForm, isoForm)).toBe(1);
  });
});

describe('formatLocalDateTime', () => {
  test('renders a stored UTC timestamp in device local time', () => {
    expect(formatLocalDateTime('2026-01-02 03:04:05')).toBe(toLocalDisplay(new Date(Date.UTC(2026, 0, 2, 3, 4, 5))));
  });

  test('renders ISO input the same as the SQLite form', () => {
    expect(formatLocalDateTime('2026-01-02T03:04:05Z')).toBe(formatLocalDateTime('2026-01-02 03:04:05'));
  });

  test('leaves date-only values unshifted', () => {
    expect(formatLocalDateTime('2026-01-02')).toBe('2026-01-02');
  });
});
