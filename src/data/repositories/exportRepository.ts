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
  reverse_relationship_type: string | null;
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

const CSV_HEADER_COLUMNS = [
  'record_type',
  'id',
  'name',
  'person_id',
  'content',
  'person_id_a',
  'person_id_b',
  'relationship_type',
  'reverse_relationship_type',
  'key',
  'value',
  'created_at',
  'updated_at',
] as const;

type CsvColumn = (typeof CSV_HEADER_COLUMNS)[number];
type CsvCellReader = (row: string[], column: CsvColumn) => string;

// Columns added after the first release stay optional so older exports still import.
const REQUIRED_CSV_COLUMNS: CsvColumn[] = [
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
];

interface ParsedCsvData {
  people: PersonRow[];
  notes: NoteRow[];
  relationships: RelationshipRow[];
  settings: AppSettingRow[];
}

function createCellReader(headerRow: string[]): CsvCellReader {
  const columnByName = new Map(headerRow.map((columnName, index) => [columnName.trim(), index]));
  REQUIRED_CSV_COLUMNS.forEach((column) => requireColumnIndex(columnByName, column));

  return (row, column) => {
    const index = columnByName.get(column);
    return index === undefined ? '' : getCell(row, index);
  };
}

function parsePersonRow(readCell: CsvCellReader, row: string[], lineNumber: number): PersonRow {
  const id = parseIntegerField(readCell(row, 'id'), `id at line ${lineNumber}`);
  const name = readCell(row, 'name');
  const createdAt = readCell(row, 'created_at');

  if (!name.trim() || !createdAt.trim()) {
    throw new Error(`Invalid person row at line ${lineNumber}.`);
  }

  return { created_at: createdAt, id, name };
}

function parseNoteRow(readCell: CsvCellReader, row: string[], lineNumber: number): NoteRow {
  const id = parseIntegerField(readCell(row, 'id'), `id at line ${lineNumber}`);
  const personId = parseIntegerField(readCell(row, 'person_id'), `person_id at line ${lineNumber}`);
  const content = readCell(row, 'content');
  const createdAt = readCell(row, 'created_at');
  const updatedAt = readCell(row, 'updated_at');

  if (!content.trim() || !createdAt.trim()) {
    throw new Error(`Invalid note row at line ${lineNumber}.`);
  }

  return {
    content,
    created_at: createdAt,
    id,
    person_id: personId,
    updated_at: updatedAt.trim() ? updatedAt : createdAt,
  };
}

function parseRelationshipRow(readCell: CsvCellReader, row: string[], lineNumber: number): RelationshipRow {
  const id = parseIntegerField(readCell(row, 'id'), `id at line ${lineNumber}`);
  const personIdA = parseIntegerField(readCell(row, 'person_id_a'), `person_id_a at line ${lineNumber}`);
  const personIdB = parseIntegerField(readCell(row, 'person_id_b'), `person_id_b at line ${lineNumber}`);
  const relationshipType = readCell(row, 'relationship_type') || null;
  const reverseRelationshipType = readCell(row, 'reverse_relationship_type') || null;
  const createdAt = readCell(row, 'created_at');

  if (!createdAt.trim()) {
    throw new Error(`Invalid relationship row at line ${lineNumber}.`);
  }

  const [leftId, rightId] = normalizeRelationshipPair(personIdA, personIdB);
  if (leftId === rightId) {
    throw new Error(`Invalid self-relationship at line ${lineNumber}.`);
  }

  // Labels are direction-specific, so they swap with the pair.
  const isPairSwapped = leftId !== personIdA;

  return {
    created_at: createdAt,
    id,
    person_id_a: leftId,
    person_id_b: rightId,
    relationship_type: isPairSwapped ? reverseRelationshipType : relationshipType,
    reverse_relationship_type: isPairSwapped ? relationshipType : reverseRelationshipType,
  };
}

function parseAppSettingRow(readCell: CsvCellReader, row: string[], lineNumber: number): AppSettingRow {
  const key = readCell(row, 'key');
  const value = readCell(row, 'value');

  if (!key.trim()) {
    throw new Error(`Invalid app_setting row at line ${lineNumber}.`);
  }

  return { key, value };
}

function parseImportCsv(csvText: string): ParsedCsvData {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    throw new Error('CSV is empty.');
  }

  const readCell = createCellReader(rows[0]);
  const data: ParsedCsvData = { notes: [], people: [], relationships: [], settings: [] };

  rows.slice(1).forEach((row, rowOffset) => {
    const lineNumber = rowOffset + 2;
    const recordType = readCell(row, 'record_type').trim();

    switch (recordType) {
      case '':
        return;
      case CSV_RECORD_TYPE.person:
        data.people.push(parsePersonRow(readCell, row, lineNumber));
        return;
      case CSV_RECORD_TYPE.note:
        data.notes.push(parseNoteRow(readCell, row, lineNumber));
        return;
      case CSV_RECORD_TYPE.relationship:
        data.relationships.push(parseRelationshipRow(readCell, row, lineNumber));
        return;
      case CSV_RECORD_TYPE.appSetting:
        data.settings.push(parseAppSettingRow(readCell, row, lineNumber));
        return;
      default:
        throw new Error(`Unsupported record_type "${recordType}" at line ${lineNumber}.`);
    }
  });

  return data;
}

async function replaceAllData({ people, notes, relationships, settings }: ParsedCsvData): Promise<void> {
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
        'INSERT INTO relationships (id, person_id_a, person_id_b, relationship_type, reverse_relationship_type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        relationship.id,
        relationship.person_id_a,
        relationship.person_id_b,
        relationship.relationship_type,
        relationship.reverse_relationship_type,
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
}

function toCsvRecord(values: Partial<Record<CsvColumn, string | number | null>>): string {
  return toCsvRow(CSV_HEADER_COLUMNS.map((column) => values[column] ?? null));
}

export async function importAllDataFromCsv(csvText: string): Promise<ImportSummary> {
  const data = parseImportCsv(csvText);
  await replaceAllData(data);

  return {
    notes: data.notes.length,
    people: data.people.length,
    relationships: data.relationships.length,
    settings: data.settings.length,
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
      `SELECT id, person_id_a, person_id_b, relationship_type, reverse_relationship_type, created_at FROM ${DB_TABLE.relationships} ORDER BY id ASC`
    ),
    db.getAllAsync<AppSettingRow>(`SELECT key, value FROM ${DB_TABLE.appSettings} ORDER BY key ASC`),
  ]);

  const rows: string[] = [toCsvRow([...CSV_HEADER_COLUMNS])];

  people.forEach((person) => {
    rows.push(
      toCsvRecord({
        record_type: CSV_RECORD_TYPE.person,
        id: person.id,
        name: person.name,
        created_at: person.created_at,
      })
    );
  });

  notes.forEach((note) => {
    rows.push(
      toCsvRecord({
        record_type: CSV_RECORD_TYPE.note,
        id: note.id,
        person_id: note.person_id,
        content: note.content,
        created_at: note.created_at,
        updated_at: note.updated_at,
      })
    );
  });

  relationships.forEach((relationship) => {
    rows.push(
      toCsvRecord({
        record_type: CSV_RECORD_TYPE.relationship,
        id: relationship.id,
        person_id_a: relationship.person_id_a,
        person_id_b: relationship.person_id_b,
        relationship_type: relationship.relationship_type,
        reverse_relationship_type: relationship.reverse_relationship_type,
        created_at: relationship.created_at,
      })
    );
  });

  settings.forEach((setting) => {
    rows.push(
      toCsvRecord({
        record_type: CSV_RECORD_TYPE.appSetting,
        key: setting.key,
        value: setting.value,
      })
    );
  });

  return `${rows.join('\n')}\n`;
}