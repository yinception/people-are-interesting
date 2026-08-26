import { DB_TABLE } from '../db/sqlConstants';

export const INSERT_PERSON_SQL = `INSERT INTO ${DB_TABLE.people} (name) VALUES (?)`;
export const SELECT_PERSON_BY_ID_SQL = `SELECT * FROM ${DB_TABLE.people} WHERE id = ?`;
export const UPDATE_PERSON_NAME_SQL = `UPDATE ${DB_TABLE.people} SET name = ? WHERE id = ?`;
export const DELETE_PERSON_BY_ID_SQL = `DELETE FROM ${DB_TABLE.people} WHERE id = ?`;

export const LIST_PEOPLE_WITH_LATEST_NOTE_SQL = `
  SELECT
    p.id,
    p.name,
    p.created_at,
    (
      SELECT n.content
      FROM notes n
      WHERE n.person_id = p.id
      ORDER BY n.created_at ASC, n.id ASC
      LIMIT 1
    ) AS latest_note_content,
    (
      SELECT n.created_at
      FROM notes n
      WHERE n.person_id = p.id
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT 1
    ) AS latest_note_created_at
  FROM people p
  ORDER BY
    COALESCE(
      (
        SELECT n.created_at
        FROM notes n
        WHERE n.person_id = p.id
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT 1
      ),
      p.created_at
    ) DESC,
    p.id DESC
`;

export const INSERT_NOTE_SQL =
  `INSERT INTO ${DB_TABLE.notes} (person_id, content, updated_at) VALUES (?, ?, datetime('now'))`;
export const SELECT_NOTE_BY_ID_SQL = `SELECT * FROM ${DB_TABLE.notes} WHERE id = ?`;
export const UPDATE_NOTE_SQL =
  `UPDATE ${DB_TABLE.notes} SET content = ?, updated_at = datetime('now') WHERE id = ?`;
export const DELETE_NOTE_BY_ID_SQL = `DELETE FROM ${DB_TABLE.notes} WHERE id = ?`;
export const LIST_NOTES_BY_PERSON_NEWEST_FIRST_SQL =
  `SELECT * FROM ${DB_TABLE.notes} WHERE person_id = ? ORDER BY created_at DESC, id DESC`;

export const SELECT_PEOPLE_BY_IDS_SQL = `SELECT id FROM ${DB_TABLE.people} WHERE id IN (?, ?)`;
export const SELECT_RELATIONSHIP_ID_BY_PAIR_SQL =
  `SELECT id FROM ${DB_TABLE.relationships} WHERE person_id_a = ? AND person_id_b = ?`;
export const SELECT_RELATIONSHIP_BY_ID_SQL = `SELECT * FROM ${DB_TABLE.relationships} WHERE id = ?`;
export const UPDATE_RELATIONSHIP_TYPES_SQL =
  `UPDATE ${DB_TABLE.relationships} SET relationship_type = ?, reverse_relationship_type = ? WHERE id = ?`;
export const INSERT_RELATIONSHIP_SQL =
  `INSERT INTO ${DB_TABLE.relationships} (person_id_a, person_id_b, relationship_type, reverse_relationship_type) VALUES (?, ?, ?, ?)`;
export const DELETE_RELATIONSHIP_BY_ID_SQL = `DELETE FROM ${DB_TABLE.relationships} WHERE id = ?`;
export const LIST_RELATIONSHIPS_FOR_PERSON_BY_CREATED_SQL = `
  SELECT *
  FROM ${DB_TABLE.relationships}
  WHERE person_id_a = ? OR person_id_b = ?
  ORDER BY created_at ASC, id ASC
`;

export const SEARCH_PEOPLE_AND_NOTES_SQL = `
  SELECT
    p.id AS person_id,
    p.name AS person_name,
    SUM(CASE WHEN n.content LIKE ? THEN 1 ELSE 0 END) AS matched_note_count
  FROM ${DB_TABLE.people} p
  LEFT JOIN ${DB_TABLE.notes} n ON n.person_id = p.id
  WHERE p.name LIKE ? OR n.content LIKE ?
  GROUP BY p.id, p.name
  ORDER BY p.name COLLATE NOCASE ASC, p.id ASC
`;

export const SELECT_APP_SETTING_BY_KEY_SQL =
  `SELECT key, value FROM ${DB_TABLE.appSettings} WHERE key = ?`;
export const UPSERT_APP_SETTING_SQL = `
  INSERT INTO ${DB_TABLE.appSettings} (key, value)
  VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = datetime('now')
`;