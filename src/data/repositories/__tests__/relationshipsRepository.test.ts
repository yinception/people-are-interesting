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
    await expect(createRelationship(1, 1, { relationshipType: 'friend' })).rejects.toThrow(
      'Cannot create a relationship to the same person.'
    );
  });

  test('requires both people to exist', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 1 }]);
    getDatabase.mockResolvedValue(db);

    await expect(createRelationship(1, 2, { relationshipType: 'friend' })).rejects.toThrow('Both people must exist before creating a relationship.');
  });

  test('updates existing relationship if pair already exists', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    db.getFirstAsync
      .mockResolvedValueOnce({ id: 5 })
      .mockResolvedValueOnce({
        id: 5,
        person_id_a: 1,
        person_id_b: 2,
        relationship_type: 'updated',
        reverse_relationship_type: 'reverse updated',
        created_at: 'x',
      });
    getDatabase.mockResolvedValue(db);

    const row = await createRelationship(2, 1, {
      relationshipType: 'reverse updated',
      reverseRelationshipType: 'updated',
    });
    expect(row.id).toBe(5);
    expect(db.runAsync).toHaveBeenCalledTimes(1);

    const [, storedType, storedReverseType, relationshipId] = db.runAsync.mock.calls[0];
    expect(storedType).toBe('updated');
    expect(storedReverseType).toBe('reverse updated');
    expect(relationshipId).toBe(5);
  });

  test('creates new relationship when none exists', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    db.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 6,
        person_id_a: 1,
        person_id_b: 2,
        relationship_type: null,
        reverse_relationship_type: null,
        created_at: 'x',
      });
    db.runAsync.mockResolvedValue({ lastInsertRowId: 6 });
    getDatabase.mockResolvedValue(db);

    const row = await createRelationship(1, 2, {});
    expect(row.id).toBe(6);

    const [, , , storedType, storedReverseType] = db.runAsync.mock.calls[0];
    expect(storedType).toBeNull();
    expect(storedReverseType).toBeNull();
  });

  test('stores both labels in canonical pair order', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    db.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 8,
        person_id_a: 1,
        person_id_b: 2,
        relationship_type: 'mentee',
        reverse_relationship_type: 'mentor',
        created_at: 'x',
      });
    db.runAsync.mockResolvedValue({ lastInsertRowId: 8 });
    getDatabase.mockResolvedValue(db);

    await createRelationship(2, 1, { relationshipType: 'mentor', reverseRelationshipType: 'mentee' });

    const [, leftId, rightId, storedType, storedReverseType] = db.runAsync.mock.calls[0];
    expect(leftId).toBe(1);
    expect(rightId).toBe(2);
    expect(storedType).toBe('mentee');
    expect(storedReverseType).toBe('mentor');
  });

  test('trims labels and keeps a blank label null', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    db.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 9,
        person_id_a: 1,
        person_id_b: 2,
        relationship_type: 'friend',
        reverse_relationship_type: null,
        created_at: 'x',
      });
    db.runAsync.mockResolvedValue({ lastInsertRowId: 9 });
    getDatabase.mockResolvedValue(db);

    await createRelationship(1, 2, { relationshipType: '  friend  ', reverseRelationshipType: '   ' });

    const [, , , storedType, storedReverseType] = db.runAsync.mock.calls[0];
    expect(storedType).toBe('friend');
    expect(storedReverseType).toBeNull();
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
