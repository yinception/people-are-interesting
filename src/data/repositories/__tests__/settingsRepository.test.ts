import {
  getPeopleSortSetting,
  getThemeModeSetting,
  setPeopleSortSetting,
  setThemeModeSetting,
} from '../settingsRepository';
import { createMockDb } from './repositoryTestUtils';

jest.mock('../../db/client', () => ({
  getDatabase: jest.fn(),
}));

const { getDatabase } = jest.requireMock('../../db/client') as { getDatabase: jest.Mock };

describe('settingsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns null when setting is missing', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue(null);
    getDatabase.mockResolvedValue(db);

    await expect(getThemeModeSetting()).resolves.toBeNull();
  });

  test('returns null for invalid setting values', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue({ key: 'theme_mode', value: 'other' });
    getDatabase.mockResolvedValue(db);

    await expect(getThemeModeSetting()).resolves.toBeNull();
  });

  test('returns valid theme mode values', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue({ key: 'theme_mode', value: 'dark' });
    getDatabase.mockResolvedValue(db);

    await expect(getThemeModeSetting()).resolves.toBe('dark');
  });

  test('upserts theme mode', async () => {
    const db = createMockDb();
    getDatabase.mockResolvedValue(db);

    await setThemeModeSetting('light');
    expect(db.runAsync).toHaveBeenCalledTimes(1);
  });

  test('returns null for missing people sort setting', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue(null);
    getDatabase.mockResolvedValue(db);

    await expect(getPeopleSortSetting()).resolves.toBeNull();
  });

  test('returns null for invalid people sort setting', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue({ key: 'people_sort', value: 'random' });
    getDatabase.mockResolvedValue(db);

    await expect(getPeopleSortSetting()).resolves.toBeNull();
  });

  test('returns valid people sort setting', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValue({ key: 'people_sort', value: 'name_asc' });
    getDatabase.mockResolvedValue(db);

    await expect(getPeopleSortSetting()).resolves.toBe('name_asc');
  });

  test('upserts people sort setting', async () => {
    const db = createMockDb();
    getDatabase.mockResolvedValue(db);

    await setPeopleSortSetting('last_modified_desc');
    expect(db.runAsync).toHaveBeenCalledTimes(1);
  });
});
