export { initializeDatabase } from './db/migrations';
export { runMigrationHarness } from './db/migrationHarness';

export type {
  Note,
  Person,
  PersonSearchResult,
  PersonWithLatestNote,
  Relationship,
} from './db/types';

export { seedSampleData } from './repositories/devRepository';
export { exportAllDataAsCsv, importAllDataFromCsv } from './repositories/exportRepository';
export { addNote, deleteNote, listNotesByPersonNewestFirst, updateNote } from './repositories/notesRepository';
export { createPerson, deletePerson, listPeopleWithLatestNote, updatePersonName } from './repositories/peopleRepository';
export { createRelationship, deleteRelationship, listRelationshipsForPerson } from './repositories/relationshipsRepository';
export type { RelationshipTypeLabels } from './repositories/relationshipsRepository';
export { searchPeopleAndNotes } from './repositories/searchRepository';
export {
  getPeopleSortSetting,
  getThemeModeSetting,
  setPeopleSortSetting,
  setThemeModeSetting,
  type PeopleSortSetting,
  type ThemeModeSetting,
} from './repositories/settingsRepository';
