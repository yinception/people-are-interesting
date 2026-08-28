import { addNote, deleteNote, listNotesByPersonNewestFirst, updateNote } from '../notesRepository';
import { createMockDb, getTouchedPersonIds } from './repositoryTestUtils';

jest.mock('../../db/client', () => ({
  getDatabase: jest.fn(),
}));

const { getDatabase } = jest.requireMock('../../db/client') as { getDatabase: jest.Mock };

describe('notesRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('addNote validates content and person existence', async () => {
    await expect(addNote(1, '  ')).rejects.toThrow('Note content cannot be empty.');

    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue(null);
    getDatabase.mockResolvedValue(db);
    await expect(addNote(1, 'hello')).rejects.toThrow('Person with id 1 does not exist.');
  });

  test('addNote inserts and returns created row', async () => {
    const db = createMockDb();
    db.getFirstAsync
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 10, person_id: 1, content: 'c', created_at: 'x', updated_at: 'x' });
    db.runAsync.mockResolvedValue({ lastInsertRowId: 10 });
    getDatabase.mockResolvedValue(db);

    const note = await addNote(1, 'c');
    expect(note.id).toBe(10);
    expect(getTouchedPersonIds(db)).toEqual([1]);
  });

  test('listNotesByPersonNewestFirst returns db rows', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ id: 2 }]);
    getDatabase.mockResolvedValue(db);

    await expect(listNotesByPersonNewestFirst(1)).resolves.toEqual([{ id: 2 }]);
  });

  test('updateNote updates and returns row', async () => {
    const db = createMockDb();
    db.getFirstAsync
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 1, person_id: 1, content: 'next', created_at: 'x', updated_at: 'y' });
    getDatabase.mockResolvedValue(db);

    const row = await updateNote(1, 'next');
    expect(row.content).toBe('next');
    expect(getTouchedPersonIds(db)).toEqual([1]);
  });

  test('deleteNote removes the note and touches its person', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue({ id: 2, person_id: 7, content: 'c', created_at: 'x', updated_at: 'x' });
    getDatabase.mockResolvedValue(db);

    await deleteNote(2);

    expect(db.runAsync).toHaveBeenCalledTimes(2);
    expect(getTouchedPersonIds(db)).toEqual([7]);
  });

  test('deleteNote rejects a missing note', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue(null);
    getDatabase.mockResolvedValue(db);

    await expect(deleteNote(2)).rejects.toThrow('Note with id 2 does not exist.');
    expect(db.runAsync).not.toHaveBeenCalled();
  });
});
