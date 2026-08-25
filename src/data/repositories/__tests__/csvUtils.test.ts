import {
  escapeCsvValue,
  getCell,
  parseCsv,
  parseIntegerField,
  requireColumnIndex,
  toCsvRow,
} from '../csvUtils';

describe('csvUtils', () => {
  test('escapeCsvValue handles plain and quoted values', () => {
    expect(escapeCsvValue('hello')).toBe('hello');
    expect(escapeCsvValue('a,b')).toBe('"a,b"');
    expect(escapeCsvValue('a"b')).toBe('"a""b"');
    expect(escapeCsvValue(null)).toBe('');
  });

  test('toCsvRow joins escaped columns', () => {
    expect(toCsvRow(['person', 1, 'A,B'])).toBe('person,1,"A,B"');
  });

  test('parseCsv handles escaped quotes and commas', () => {
    const rows = parseCsv('a,b\n"x,y","say ""hi"""\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['x,y', 'say "hi"'],
    ]);
  });

  test('column helpers return and validate indices', () => {
    const columns = new Map<string, number>([
      ['record_type', 0],
      ['id', 1],
    ]);

    expect(requireColumnIndex(columns, 'id')).toBe(1);
    expect(() => requireColumnIndex(columns, 'missing')).toThrow('missing "missing" column');
    expect(getCell(['x'], 1)).toBe('');
  });

  test('parseIntegerField validates numbers', () => {
    expect(parseIntegerField('42', 'id')).toBe(42);
    expect(() => parseIntegerField('abc', 'id')).toThrow('Invalid integer value for id');
  });
});
