import { getDatabase } from '../db/client';
import { SELECT_APP_SETTING_BY_KEY_SQL, UPSERT_APP_SETTING_SQL } from './sqlQueries';

export type ThemeModeSetting = 'light' | 'dark';
export type PeopleSortSetting =
  | 'name_asc'
  | 'name_desc'
  | 'created_at_asc'
  | 'created_at_desc'
  | 'last_modified_asc'
  | 'last_modified_desc';

const THEME_MODE_KEY = 'theme_mode';
const PEOPLE_SORT_KEY = 'people_sort';
const PEOPLE_SORT_VALUES: ReadonlyArray<PeopleSortSetting> = [
  'name_asc',
  'name_desc',
  'created_at_asc',
  'created_at_desc',
  'last_modified_asc',
  'last_modified_desc',
];

interface AppSettingRow {
  key: string;
  value: string;
}

export async function getThemeModeSetting(): Promise<ThemeModeSetting | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AppSettingRow>(SELECT_APP_SETTING_BY_KEY_SQL, THEME_MODE_KEY);

  if (!row) {
    return null;
  }

  if (row.value === 'light' || row.value === 'dark') {
    return row.value;
  }

  return null;
}

export async function setThemeModeSetting(mode: ThemeModeSetting): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(UPSERT_APP_SETTING_SQL, THEME_MODE_KEY, mode);
}

export async function getPeopleSortSetting(): Promise<PeopleSortSetting | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AppSettingRow>(SELECT_APP_SETTING_BY_KEY_SQL, PEOPLE_SORT_KEY);

  if (!row) {
    return null;
  }

  if (PEOPLE_SORT_VALUES.includes(row.value as PeopleSortSetting)) {
    return row.value as PeopleSortSetting;
  }

  return null;
}

export async function setPeopleSortSetting(option: PeopleSortSetting): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(UPSERT_APP_SETTING_SQL, PEOPLE_SORT_KEY, option);
}
