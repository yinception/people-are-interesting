import { getDatabase } from '../db/client';
import { DB_TABLE, PRAGMA_FOREIGN_KEYS_OFF_SQL, PRAGMA_FOREIGN_KEYS_ON_SQL } from '../db/sqlConstants';
import { getCell, parseCsv, parseIntegerField, requireColumnIndex, toCsvRow } from './csvUtils';
import { normalizeRelationshipPair } from './repositoryUtils';

interface PersonRow {
  id: number;
  name: string;
  created_at: string;
}

interface NoteRow {
  id: number;
  person_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface RelationshipRow {
  id: number;
  person_id_a: number;
  person_id_b: number;
  relationship_type: string | null;
  created_at: string;
}

interface AppSettingRow {
  key: string;
  value: string;
}

interface ImportSummary {
  notes: number;
  people: number;
  relationships: number;
  settings: number;
}

const CSV_RECORD_TYPE = {
  appSetting: 'app_setting',
  note: 'note',
  person: 'person',
  relationship: 'relationship',
} as const;

const CSV_HEADER_COLUMNS: string[] = [
  'record_type',
  'id',
  'name',
  'person_id',
  'content',
  'person_id_a',
  'person_id_b',
  'relationship_type',
  'key',
  'value',
  'created_at',
  'updated_at',
];

export async function importAllDataFromCsv(csvText: string): Promise<ImportSummary> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    throw new Error('CSV is empty.');
  }

  const headerRow = rows[0].map((column) => column.trim());
  const columnByName = new Map(headerRow.map((columnName, index) => [columnName, index]));

  const recordTypeIndex = requireColumnIndex(columnByName, 'record_type');
  const idIndex = requireColumnIndex(columnByName, 'id');
  const nameIndex = requireColumnIndex(columnByName, 'name');
  const personIdIndex = requireColumnIndex(columnByName, 'person_id');
  const contentIndex = requireColumnIndex(columnByName, 'content');
  const personIdAIndex = requireColumnIndex(columnByName, 'person_id_a');
  const personIdBIndex = requireColumnIndex(columnByName, 'person_id_b');
  const relationshipTypeIndex = requireColumnIndex(columnByName, 'relationship_type');
  const keyIndex = requireColumnIndex(columnByName, 'key');
  const valueIndex = requireColumnIndex(columnByName, 'value');
  const createdAtIndex = requireColumnIndex(columnByName, 'created_at');
  const updatedAtIndex = columnByName.get('updated_at');

  const people: PersonRow[] = [];
  const notes: NoteRow[] = [];
  const relationships: RelationshipRow[] = [];
  const settings: AppSettingRow[] = [];

  rows.slice(1).forEach((row, rowOffset) => {
    const lineNumber = rowOffset + 2;
    const recordType = getCell(row, recordTypeIndex).trim();

    if (!recordType) {
      return;
    }

    if (recordType === CSV_RECORD_TYPE.person) {
      const id = parseIntegerField(getCell(row, idIndex), `id at line ${lineNumber}`);
      const name = getCell(row, nameIndex);
      const createdAt = getCell(row, createdAtIndex);

      if (!name.trim() || !createdAt.trim()) {
        throw new Error(`Invalid person row at line ${lineNumber}.`);
      }

      people.push({ created_at: createdAt, id, name });
      return;
    }

    if (recordType === CSV_RECORD_TYPE.note) {
      const id = parseIntegerField(getCell(row, idIndex), `id at line ${lineNumber}`);
      const personId = parseIntegerField(getCell(row, personIdIndex), `person_id at line ${lineNumber}`);
      const content = getCell(row, contentIndex);
      const createdAt = getCell(row, createdAtIndex);
      const rawUpdatedAt = updatedAtIndex === undefined ? createdAt : getCell(row, updatedAtIndex);
      const updatedAt = rawUpdatedAt.trim() ? rawUpdatedAt : createdAt;

      if (!content.trim() || !createdAt.trim()) {
        throw new Error(`Invalid note row at line ${lineNumber}.`);
      }

      notes.push({ content, created_at: createdAt, id, person_id: personId, updated_at: updatedAt });
      return;
    }

    if (recordType === CSV_RECORD_TYPE.relationship) {
      const id = parseIntegerField(getCell(row, idIndex), `id at line ${lineNumber}`);
      const personIdA = parseIntegerField(getCell(row, personIdAIndex), `person_id_a at line ${lineNumber}`);
      const personIdB = parseIntegerField(getCell(row, personIdBIndex), `person_id_b at line ${lineNumber}`);
      const relationshipType = getCell(row, relationshipTypeIndex) || null;
      const createdAt = getCell(row, createdAtIndex);

      if (!createdAt.trim()) {
        throw new Error(`Invalid relationship row at line ${lineNumber}.`);
      }

      const [leftId, rightId] = normalizeRelationshipPair(personIdA, personIdB);
      if (leftId === rightId) {
        throw new Error(`Invalid self-relationship at line ${lineNumber}.`);
      }

      relationships.push({
        created_at: createdAt,
        id,
        person_id_a: leftId,
        person_id_b: rightId,
        relationship_type: relationshipType,
      });
      return;
    }

    if (recordType === CSV_RECORD_TYPE.appSetting) {
      const key = getCell(row, keyIndex);
      const value = getCell(row, valueIndex);
      if (!key.trim()) {
        throw new Error(`Invalid app_setting row at line ${lineNumber}.`);
      }

      settings.push({ key, value });
      return;
    }

    throw new Error(`Unsupported record_type "${recordType}" at line ${lineNumber}.`);
  });

  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(PRAGMA_FOREIGN_KEYS_OFF_SQL);

    await txn.runAsync(`DELETE FROM ${DB_TABLE.relationships}`);
    await txn.runAsync(`DELETE FROM ${DB_TABLE.notes}`);
    await txn.runAsync(`DELETE FROM ${DB_TABLE.people}`);
    await txn.runAsync(`DELETE FROM ${DB_TABLE.appSettings}`);

    for (const person of people) {
      await txn.runAsync(
        'INSERT INTO people (id, name, created_at) VALUES (?, ?, ?)',
        person.id,
        person.name,
        person.created_at
      );
    }

    for (const note of notes) {
      await txn.runAsync(
        'INSERT INTO notes (id, person_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        note.id,
        note.person_id,
        note.content,
        note.created_at,
        note.updated_at
      );
    }

    for (const relationship of relationships) {
      await txn.runAsync(
        'INSERT INTO relationships (id, person_id_a, person_id_b, relationship_type, created_at) VALUES (?, ?, ?, ?, ?)',
        relationship.id,
        relationship.person_id_a,
        relationship.person_id_b,
        relationship.relationship_type,
        relationship.created_at
      );
    }

    for (const setting of settings) {
      await txn.runAsync(
        "INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
        setting.key,
        setting.value
      );
    }

    const maxPersonId = people.reduce((maxId, person) => Math.max(maxId, person.id), 0);
    const maxNoteId = notes.reduce((maxId, note) => Math.max(maxId, note.id), 0);
    const maxRelationshipId = relationships.reduce((maxId, relationship) => Math.max(maxId, relationship.id), 0);

    await txn.runAsync(
      `DELETE FROM ${DB_TABLE.sqliteSequence} WHERE name IN ('${DB_TABLE.people}', '${DB_TABLE.notes}', '${DB_TABLE.relationships}')`
    );

    if (maxPersonId > 0) {
      await txn.runAsync(
        `INSERT INTO ${DB_TABLE.sqliteSequence} (name, seq) VALUES ('${DB_TABLE.people}', ?)`,
        maxPersonId
      );
    }

    if (maxNoteId > 0) {
      await txn.runAsync(
        `INSERT INTO ${DB_TABLE.sqliteSequence} (name, seq) VALUES ('${DB_TABLE.notes}', ?)`,
        maxNoteId
      );
    }

    if (maxRelationshipId > 0) {
      await txn.runAsync(
        `INSERT INTO ${DB_TABLE.sqliteSequence} (name, seq) VALUES ('${DB_TABLE.relationships}', ?)`,
        maxRelationshipId
      );
    }

    await txn.runAsync(PRAGMA_FOREIGN_KEYS_ON_SQL);
  });

  return {
    notes: notes.length,
    people: people.length,
    relationships: relationships.length,
    settings: settings.length,
  };
}

export async function exportAllDataAsCsv(): Promise<string> {
  const db = await getDatabase();

  const [people, notes, relationships, settings] = await Promise.all([
    db.getAllAsync<PersonRow>(`SELECT id, name, created_at FROM ${DB_TABLE.people} ORDER BY id ASC`),
    db.getAllAsync<NoteRow>(
      `SELECT id, person_id, content, created_at, updated_at FROM ${DB_TABLE.notes} ORDER BY id ASC`
    ),
    db.getAllAsync<RelationshipRow>(
      `SELECT id, person_id_a, person_id_b, relationship_type, created_at FROM ${DB_TABLE.relationships} ORDER BY id ASC`
    ),
    db.getAllAsync<AppSettingRow>(`SELECT key, value FROM ${DB_TABLE.appSettings} ORDER BY key ASC`),
  ]);

  const rows: string[] = [
    toCsvRow([...CSV_HEADER_COLUMNS]),
  ];

  people.forEach((person) => {
    rows.push(
      toCsvRow([
        CSV_RECORD_TYPE.person,
        person.id,
        person.name,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        person.created_at,
        null,
      ])
    );
  });

  notes.forEach((note) => {
    rows.push(
      toCsvRow([
        CSV_RECORD_TYPE.note,
        note.id,
        null,
        note.person_id,
        note.content,
        null,
        null,
        null,
        null,
        null,
        note.created_at,
        note.updated_at,
      ])
    );
  });

  relationships.forEach((relationship) => {
    rows.push(
      toCsvRow([
        CSV_RECORD_TYPE.relationship,
        relationship.id,
        null,
        null,
        null,
        relationship.person_id_a,
        relationship.person_id_b,
        relationship.relationship_type,
        null,
        null,
        relationship.created_at,
        null,
      ])
    );
  });

  settings.forEach((setting) => {
    rows.push(
      toCsvRow([
        CSV_RECORD_TYPE.appSetting,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        setting.key,
        setting.value,
        null,
        null,
      ])
    );
  });

  return `${rows.join('\n')}\n`;
}