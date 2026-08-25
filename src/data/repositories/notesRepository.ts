import { getDatabase } from '../db/client';
import type { Note } from '../db/types';
import { requireEntityExistsById, requireRow, requireTrimmedText } from './repositoryUtils';
import {
  DELETE_NOTE_BY_ID_SQL,
  INSERT_NOTE_SQL,
  LIST_NOTES_BY_PERSON_NEWEST_FIRST_SQL,
  SELECT_NOTE_BY_ID_SQL,
  UPDATE_NOTE_SQL,
} from './sqlQueries';

export async function addNote(personId: number, content: string): Promise<Note> {
  const db = await getDatabase();
  const trimmedContent = requireTrimmedText(content, 'Note content cannot be empty.');

  await requireEntityExistsById(db, 'people', personId, `Person with id ${personId} does not exist.`);

  const result = await db.runAsync(INSERT_NOTE_SQL, personId, trimmedContent);
  return requireRow(
    await db.getFirstAsync<Note>(SELECT_NOTE_BY_ID_SQL, result.lastInsertRowId),
    'Failed to create note.'
  );
}

export async function listNotesByPersonNewestFirst(personId: number): Promise<Note[]> {
  const db = await getDatabase();

  return db.getAllAsync<Note>(LIST_NOTES_BY_PERSON_NEWEST_FIRST_SQL, personId);
}

export async function updateNote(noteId: number, content: string): Promise<Note> {
  const db = await getDatabase();
  const trimmedContent = requireTrimmedText(content, 'Note content cannot be empty.');

  await requireEntityExistsById(db, 'notes', noteId, `Note with id ${noteId} does not exist.`);

  await db.runAsync(UPDATE_NOTE_SQL, trimmedContent, noteId);
  return requireRow(
    await db.getFirstAsync<Note>(SELECT_NOTE_BY_ID_SQL, noteId),
    'Failed to update note.'
  );
}

export async function deleteNote(noteId: number): Promise<void> {
  const db = await getDatabase();
  await requireEntityExistsById(db, 'notes', noteId, `Note with id ${noteId} does not exist.`);

  await db.runAsync(DELETE_NOTE_BY_ID_SQL, noteId);
}
