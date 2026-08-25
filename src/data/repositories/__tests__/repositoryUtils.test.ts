import { requireEntityExistsById, requireRow, requireTrimmedText, normalizeRelationshipPair, createRelationshipPairKey } from '../repositoryUtils';

describe('repositoryUtils', () => {
  test('requireTrimmedText trims and validates', () => {
    expect(requireTrimmedText('  hi ', 'empty')).toBe('hi');
    expect(() => requireTrimmedText('   ', 'empty')).toThrow('empty');
  });

  test('relationship pair helpers normalize ids and keys', () => {
    expect(normalizeRelationshipPair(9, 2)).toEqual([2, 9]);
    expect(createRelationshipPairKey(9, 2)).toBe('2:9');
  });

  test('requireRow enforces non-null results', () => {
    expect(requireRow({ id: 1 }, 'missing')).toEqual({ id: 1 });
    expect(() => requireRow(null, 'missing')).toThrow('missing');
  });

  test('requireEntityExistsById checks id lookup', async () => {
    const db = { getFirstAsync: jest.fn().mockResolvedValue({ id: 1 }) } as any;
    await expect(requireEntityExistsById(db, 'people', 1, 'missing')).resolves.toBeUndefined();

    db.getFirstAsync.mockResolvedValueOnce(null);
    await expect(requireEntityExistsById(db, 'people', 2, 'missing')).rejects.toThrow('missing');
  });
});
