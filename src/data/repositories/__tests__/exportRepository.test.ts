import { exportAllDataAsCsv, importAllDataFromCsv } from '../exportRepository';
import { createMockDb, createMockTxn } from './repositoryTestUtils';

jest.mock('../../db/client', () => ({
  getDatabase: jest.fn(),
}));

const { getDatabase } = jest.requireMock('../../db/client') as { getDatabase: jest.Mock };

describe('exportRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exportAllDataAsCsv builds CSV with all record types', async () => {
    const db = createMockDb();
    db.getAllAsync
      .mockResolvedValueOnce([{ id: 1, name: 'Alex', created_at: '2026-01-01' }])
      .mockResolvedValueOnce([{ id: 2, person_id: 1, content: 'Hi', created_at: '2026-01-01', updated_at: '2026-01-02' }])
      .mockResolvedValueOnce([{ id: 3, person_id_a: 1, person_id_b: 2, relationship_type: 'friend', created_at: '2026-01-03' }])
      .mockResolvedValueOnce([{ key: 'theme_mode', value: 'dark' }]);
    getDatabase.mockResolvedValue(db);

    const csv = await exportAllDataAsCsv();
    expect(csv).toContain('record_type,id,name');
    expect(csv).toContain('person,1,Alex');
    expect(csv).toContain('note,2,,1,Hi');
    expect(csv).toContain('relationship,3,,,');
    expect(csv).toContain('app_setting,,,,,,,,theme_mode,dark');
  });

  test('importAllDataFromCsv rejects empty CSV', async () => {
    await expect(importAllDataFromCsv('')).rejects.toThrow('CSV is empty.');
  });

  test('importAllDataFromCsv validates required columns', async () => {
    await expect(importAllDataFromCsv('record_type\nperson\n')).rejects.toThrow('missing "id" column');
  });

  test('importAllDataFromCsv imports rows and normalizes relationship direction', async () => {
    const db = createMockDb();
    const txn = createMockTxn();
    db.withExclusiveTransactionAsync.mockImplementation(async (callback: (txn: any) => Promise<void>) => callback(txn));
    getDatabase.mockResolvedValue(db);

    const csv = [
      'record_type,id,name,person_id,content,person_id_a,person_id_b,relationship_type,key,value,created_at,updated_at',
      'person,1,Alex,,,,,,,,2026-01-01,',
      'person,2,Blair,,,,,,,,2026-01-01,',
      'relationship,10,,,,2,1,friend,,,2026-01-03,',
    ].join('\n');

    const summary = await importAllDataFromCsv(csv);
    expect(summary).toEqual({ notes: 0, people: 2, relationships: 1, settings: 0 });

    const relationshipInsertCall = txn.runAsync.mock.calls.find((call: unknown[]) =>
      String(call[0]).includes('INSERT INTO relationships')
    );

    expect(relationshipInsertCall).toBeDefined();
    expect(relationshipInsertCall?.[2]).toBe(1);
    expect(relationshipInsertCall?.[3]).toBe(2);
  });
});
