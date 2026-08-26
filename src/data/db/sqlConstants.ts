export const DB_TABLE = {
  appSettings: 'app_settings',
  notes: 'notes',
  people: 'people',
  relationships: 'relationships',
  sqliteSequence: 'sqlite_sequence',
} as const;

export type EntityTableName =
  | typeof DB_TABLE.people
  | typeof DB_TABLE.notes
  | typeof DB_TABLE.relationships;

export const PRAGMA_FOREIGN_KEYS_ON_SQL = 'PRAGMA foreign_keys = ON;';
export const PRAGMA_FOREIGN_KEYS_OFF_SQL = 'PRAGMA foreign_keys = OFF;';
export const PRAGMA_JOURNAL_MODE_WAL_SQL = 'PRAGMA journal_mode = WAL;';

export const CREATE_V1_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id_a INTEGER NOT NULL,
    person_id_b INTEGER NOT NULL,
    relationship_type TEXT,
    reverse_relationship_type TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (person_id_a) REFERENCES people(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id_b) REFERENCES people(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_notes_person_id ON notes(person_id);
  CREATE INDEX IF NOT EXISTS idx_relationships_a ON relationships(person_id_a);
  CREATE INDEX IF NOT EXISTS idx_relationships_b ON relationships(person_id_b);
`;

export const CREATE_APP_SETTINGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const NORMALIZE_RELATIONSHIP_DIRECTION_SQL = `
  UPDATE relationships
  SET
    person_id_a = CASE
      WHEN person_id_a < person_id_b THEN person_id_a
      ELSE person_id_b
    END,
    person_id_b = CASE
      WHEN person_id_a < person_id_b THEN person_id_b
      ELSE person_id_a
    END
  WHERE person_id_a <> person_id_b;
`;

export const DELETE_SELF_RELATIONSHIPS_SQL = 'DELETE FROM relationships WHERE person_id_a = person_id_b;';

export const DEDUPE_RELATIONSHIPS_SQL = `
  DELETE FROM relationships
  WHERE id NOT IN (
    SELECT MIN(id)
    FROM relationships
    GROUP BY person_id_a, person_id_b
  );
`;

export const CREATE_UNIQUE_RELATIONSHIP_PAIR_INDEX_SQL = `
  CREATE UNIQUE INDEX IF NOT EXISTS idx_relationships_pair_unique
  ON relationships(person_id_a, person_id_b);
`;

export const ADD_NOTE_UPDATED_AT_COLUMN_SQL = 'ALTER TABLE notes ADD COLUMN updated_at TEXT;';
export const BACKFILL_NOTE_UPDATED_AT_SQL =
  "UPDATE notes SET updated_at = created_at WHERE updated_at IS NULL OR TRIM(updated_at) = '';";

export const ADD_RELATIONSHIP_REVERSE_TYPE_COLUMN_SQL =
  'ALTER TABLE relationships ADD COLUMN reverse_relationship_type TEXT;';