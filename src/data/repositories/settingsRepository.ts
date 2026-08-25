import { getDatabase } from '../db/client';
import { SELECT_APP_SETTING_BY_KEY_SQL, UPSERT_APP_SETTING_SQL } from './sqlQueries';

export type ThemeModeSetting = 'light' | 'dark';

const THEME_MODE_KEY = 'theme_mode';

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
