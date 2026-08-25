import { createPerson, deletePerson, listPeopleWithLatestNote, updatePersonName } from '../peopleRepository';
import { createMockDb } from './repositoryTestUtils';

jest.mock('../../db/client', () => ({
  getDatabase: jest.fn(),
}));

const { getDatabase } = jest.requireMock('../../db/client') as { getDatabase: jest.Mock };

describe('peopleRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createPerson validates name', async () => {
    await expect(createPerson('   ')).rejects.toThrow('Name cannot be empty.');
  });

  test('createPerson inserts and returns row', async () => {
    const db = createMockDb();
    db.runAsync.mockResolvedValue({ lastInsertRowId: 7 });
    db.getFirstAsync.mockResolvedValue({ id: 7, name: 'Alice', created_at: 'now' });
    getDatabase.mockResolvedValue(db);

    await expect(createPerson('Alice')).resolves.toEqual({ id: 7, name: 'Alice', created_at: 'now' });
    expect(db.runAsync).toHaveBeenCalled();
  });

  test('listPeopleWithLatestNote delegates to query', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 1, name: 'A' }]);
    getDatabase.mockResolvedValue(db);

    const rows = await listPeopleWithLatestNote();
    expect(rows).toEqual([{ id: 1, name: 'A' }]);
    expect(db.getAllAsync).toHaveBeenCalledTimes(1);
  });

  test('updatePersonName validates existence and returns updated row', async () => {
    const db = createMockDb();
    db.getFirstAsync
      .mockResolvedValueOnce({ id: 9 })
      .mockResolvedValueOnce({ id: 9, name: 'Renamed', created_at: 'now' });
    getDatabase.mockResolvedValue(db);

    const row = await updatePersonName(9, 'Renamed');
    expect(row).toEqual({ id: 9, name: 'Renamed', created_at: 'now' });
  });

  test('deletePerson validates existence and deletes', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue({ id: 3 });
    getDatabase.mockResolvedValue(db);

    await deletePerson(3);
    expect(db.runAsync).toHaveBeenCalledTimes(1);
  });
});
