import { createRelationship, deleteRelationship, listRelationshipsForPerson } from '../relationshipsRepository';
import { createMockDb } from './repositoryTestUtils';

jest.mock('../../db/client', () => ({
  getDatabase: jest.fn(),
}));

const { getDatabase } = jest.requireMock('../../db/client') as { getDatabase: jest.Mock };

describe('relationshipsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects self-relationship creation', async () => {
    await expect(createRelationship(1, 1, 'friend')).rejects.toThrow('Cannot create a relationship to the same person.');
  });

  test('requires both people to exist', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 1 }]);
    getDatabase.mockResolvedValue(db);

    await expect(createRelationship(1, 2, 'friend')).rejects.toThrow('Both people must exist before creating a relationship.');
  });

  test('updates existing relationship if pair already exists', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    db.getFirstAsync
      .mockResolvedValueOnce({ id: 5 })
      .mockResolvedValueOnce({ id: 5, person_id_a: 1, person_id_b: 2, relationship_type: 'updated', created_at: 'x' });
    getDatabase.mockResolvedValue(db);

    const row = await createRelationship(2, 1, 'updated');
    expect(row.id).toBe(5);
    expect(db.runAsync).toHaveBeenCalledTimes(1);
  });

  test('creates new relationship when none exists', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    db.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 6, person_id_a: 1, person_id_b: 2, relationship_type: null, created_at: 'x' });
    db.runAsync.mockResolvedValue({ lastInsertRowId: 6 });
    getDatabase.mockResolvedValue(db);

    const row = await createRelationship(1, 2, null);
    expect(row.id).toBe(6);
  });

  test('lists relationships by person', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 7 }]);
    getDatabase.mockResolvedValue(db);

    await expect(listRelationshipsForPerson(1)).resolves.toEqual([{ id: 7 }]);
  });

  test('delete validates existence then deletes', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue({ id: 9 });
    getDatabase.mockResolvedValue(db);

    await deleteRelationship(9);
    expect(db.runAsync).toHaveBeenCalledTimes(1);
  });
});
