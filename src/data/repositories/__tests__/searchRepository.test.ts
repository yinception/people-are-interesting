import { searchPeopleAndNotes } from '../searchRepository';
import { createMockDb } from './repositoryTestUtils';

jest.mock('../../db/client', () => ({
  getDatabase: jest.fn(),
}));

const { getDatabase } = jest.requireMock('../../db/client') as { getDatabase: jest.Mock };

describe('searchRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns empty array on blank term', async () => {
    await expect(searchPeopleAndNotes('   ')).resolves.toEqual([]);
  });

  test('queries db for non-empty term', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValue([{ person_id: 1, person_name: 'A', matched_note_count: 2 }]);
    getDatabase.mockResolvedValue(db);

    const rows = await searchPeopleAndNotes('alex');
    expect(rows).toEqual([{ person_id: 1, person_name: 'A', matched_note_count: 2 }]);
    expect(db.getAllAsync).toHaveBeenCalledTimes(1);
  });
});
