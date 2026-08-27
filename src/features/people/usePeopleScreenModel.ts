import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addNote,
  createPerson,
  createRelationship,
  deletePerson,
  deleteRelationship,
  deleteNote,
  initializeDatabase,
  listNotesByPersonNewestFirst,
  listPeopleWithLatestNote,
  listRelationshipsForPerson,
  getPeopleSortSetting,
  searchPeopleAndNotes,
  seedSampleData,
  setPeopleSortSetting,
  updatePersonName,
  updateNote,
  type Note,
  type PersonSearchResult,
  type PersonWithLatestNote,
  type Relationship,
} from '../../data/database';

import { resolveRelationshipDirection } from './relationshipDirection';

export type PeopleSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'created_at_asc'
  | 'created_at_desc'
  | 'last_modified_asc'
  | 'last_modified_desc';

interface RelationshipViewItem {
  createdAt: string;
  id: number;
  otherPersonId: number;
  otherPersonName: string;
  /** How the other person relates to the selected person. */
  otherPersonRelationshipType: string | null;
  /** How the selected person relates to the other person. */
  selectedPersonRelationshipType: string | null;
}

export interface UsePeopleScreenModelResult {
  canAddNote: boolean;
  canCreatePerson: boolean;
  canSaveEditedPersonName: boolean;
  canSaveEditedNote: boolean;
  canSaveRelationship: boolean;
  editingPersonName: string;
  editingNoteContent: string;
  editingNoteId: number | null;
  editingRelationshipId: number | null;
  error: string | null;
  expandedNoteId: number | null;
  hasActiveSearch: boolean;
  isAddingNote: boolean;
  isCreating: boolean;
  isCreatingRelationship: boolean;
  isDeletingPerson: boolean;
  isDeletingRelationship: boolean;
  isDeletingNote: boolean;
  isEditingPersonName: boolean;
  isPersonNameEditMode: boolean;
  isEditingNote: boolean;
  isDatabaseReady: boolean;
  isLoading: boolean;
  isLoadingDetails: boolean;
  isSearching: boolean;
  isSeeding: boolean;
  matchedNoteCountByPersonId: Map<number, number>;
  newNoteContent: string;
  newPersonName: string;
  onBackFromPersonDetailPress: () => void;
  onCancelEditNotePress: () => void;
  onCancelEditPersonNamePress: () => void;
  onCancelEditRelationshipPress: () => void;
  onClearSearchPress: () => void;
  onCreatePersonPress: () => Promise<void>;
  onCreateRelationshipPress: () => Promise<void>;
  onDeletePersonPress: () => Promise<void>;
  onDeleteNotePress: (noteId: number) => Promise<void>;
  onDeleteRelationshipPress: (relationshipId: number) => Promise<void>;
  onPersonPress: (personId: number) => void;
  onRefreshDataPress: () => Promise<void>;
  onSaveEditedPersonNamePress: () => Promise<void>;
  onSaveEditedNotePress: () => Promise<void>;
  onSeedPress: () => Promise<void>;
  onSelectRelationshipCandidatePress: (personId: number | null) => void;
  onStartEditPersonNamePress: () => void;
  onStartEditNotePress: (note: Note) => void;
  onSubmitNewNotePress: () => Promise<void>;
  onStartEditRelationshipPress: (relationship: RelationshipViewItem) => void;
  onToggleNoteExpanded: (noteId: number) => void;
  peopleCountLabel: string;
  relationshipCandidates: PersonWithLatestNote[];
  relationshipSearchTerm: string;
  relationshipItems: RelationshipViewItem[];
  relationshipTypeInput: string;
  reverseRelationshipTypeInput: string;
  selectedPeopleSortOption: PeopleSortOption;
  searchTerm: string;
  selectedPerson: PersonWithLatestNote | null;
  selectedRelationshipTargetId: number | null;
  setEditingPersonName: (value: string) => void;
  setEditingNoteContent: (value: string) => void;
  setNewNoteContent: (value: string) => void;
  setNewPersonName: (name: string) => void;
  setRelationshipTypeInput: (value: string) => void;
  setReverseRelationshipTypeInput: (value: string) => void;
  setSelectedPeopleSortOption: (option: PeopleSortOption) => void;
  setRelationshipSearchTerm: (term: string) => void;
  setSearchTerm: (term: string) => void;
  setSelectedRelationshipTargetId: (personId: number | null) => void;
  timelineNotes: Note[];
  visiblePeople: PersonWithLatestNote[];
}

export function usePeopleScreenModel(): UsePeopleScreenModelResult {
  const [people, setPeople] = useState<PersonWithLatestNote[]>([]);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isCreatingRelationship, setIsCreatingRelationship] = useState(false);
  const [isDeletingPerson, setIsDeletingPerson] = useState(false);
  const [isEditingPersonName, setIsEditingPersonName] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [isDeletingRelationship, setIsDeletingRelationship] = useState(false);

  const [editingPersonName, setEditingPersonName] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipSearchTerm, setRelationshipSearchTerm] = useState('');
  const [relationshipTypeInput, setRelationshipTypeInput] = useState('');
  const [reverseRelationshipTypeInput, setReverseRelationshipTypeInput] = useState('');
  const [selectedPeopleSortOption, setSelectedPeopleSortOptionState] =
    useState<PeopleSortOption>('last_modified_desc');

  const [searchResults, setSearchResults] = useState<PersonSearchResult[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedRelationshipTargetId, setSelectedRelationshipTargetId] = useState<number | null>(null);
  const [editingRelationshipId, setEditingRelationshipId] = useState<number | null>(null);
  const [timelineNotes, setTimelineNotes] = useState<Note[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isPersonNameEditMode, setIsPersonNameEditMode] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPeople = useCallback(async () => {
    setError(null);
    const rows = await listPeopleWithLatestNote();
    setPeople(rows);

    if (selectedPersonId && !rows.some((person) => person.id === selectedPersonId)) {
      setSelectedPersonId(null);
      setTimelineNotes([]);
      setRelationships([]);
      setSelectedRelationshipTargetId(null);
      setEditingRelationshipId(null);
      setRelationshipSearchTerm('');
      setRelationshipTypeInput('');
      setReverseRelationshipTypeInput('');
      setEditingNoteId(null);
      setEditingNoteContent('');
      setIsPersonNameEditMode(false);
      setEditingPersonName('');
    }
  }, [selectedPersonId]);

  const loadSelectedPersonDetails = useCallback(async (personId: number) => {
    setIsLoadingDetails(true);
    try {
      const [notesRows, relationshipRows] = await Promise.all([
        listNotesByPersonNewestFirst(personId),
        listRelationshipsForPerson(personId),
      ]);
      setTimelineNotes(notesRows);
      setRelationships(relationshipRows);
      setExpandedNoteId(null);
      setEditingNoteId(null);
      setEditingNoteContent('');
      setIsPersonNameEditMode(false);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    async function setup() {
      try {
        await initializeDatabase();
        setIsDatabaseReady(true);

        const savedSort = await getPeopleSortSetting();
        if (savedSort) {
          setSelectedPeopleSortOptionState(savedSort);
        }
        await loadPeople();
      } catch (setupError) {
        setError(setupError instanceof Error ? setupError.message : 'Unknown setup error');
      } finally {
        setIsLoading(false);
      }
    }

    setup();
  }, [loadPeople]);

  const setSelectedPeopleSortOption = useCallback((option: PeopleSortOption) => {
    setSelectedPeopleSortOptionState(option);
    void setPeopleSortSetting(option).catch(() => {
      // Keep local state update even if persistence fails.
    });
  }, []);

  useEffect(() => {
    const trimmedTerm = searchTerm.trim();

    if (!trimmedTerm) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const rows = await searchPeopleAndNotes(trimmedTerm);
        setSearchResults(rows);
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : 'Unknown search error');
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const hasActiveSearch = searchTerm.trim().length > 0;
  const canCreatePerson = newPersonName.trim().length > 0;
  const canSaveEditedPersonName = editingPersonName.trim().length > 0 && selectedPersonId !== null;
  const canAddNote = newNoteContent.trim().length > 0 && selectedPersonId !== null;
  const canSaveEditedNote = editingNoteContent.trim().length > 0 && editingNoteId !== null;
  const canSaveRelationship = selectedPersonId !== null && selectedRelationshipTargetId !== null;

  const matchedNoteCountByPersonId = useMemo(
    () => new Map(searchResults.map((result) => [result.person_id, result.matched_note_count])),
    [searchResults]
  );

  const visiblePeople = useMemo(() => {
    const filteredPeople = hasActiveSearch
      ? (() => {
          const matchedIds = new Set(searchResults.map((result) => result.person_id));
          return people.filter((person) => matchedIds.has(person.id));
        })()
      : people;

    const sortedPeople = [...filteredPeople];

    sortedPeople.sort((left, right) => {
      const leftLastModified = left.latest_note_created_at ?? left.created_at;
      const rightLastModified = right.latest_note_created_at ?? right.created_at;

      switch (selectedPeopleSortOption) {
        case 'name_asc':
          return left.name.localeCompare(right.name) || left.id - right.id;
        case 'name_desc':
          return right.name.localeCompare(left.name) || right.id - left.id;
        case 'created_at_asc':
          return left.created_at.localeCompare(right.created_at) || left.id - right.id;
        case 'created_at_desc':
          return right.created_at.localeCompare(left.created_at) || right.id - left.id;
        case 'last_modified_asc':
          return leftLastModified.localeCompare(rightLastModified) || left.id - right.id;
        case 'last_modified_desc':
          return rightLastModified.localeCompare(leftLastModified) || right.id - left.id;
        default:
          return 0;
      }
    });

    return sortedPeople;
  }, [hasActiveSearch, people, searchResults, selectedPeopleSortOption]);

  const peopleCountLabel = hasActiveSearch
    ? `${visiblePeople.length} / ${people.length}`
    : `${visiblePeople.length}`;

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId) ?? null,
    [people, selectedPersonId]
  );

  const relationshipCandidates = useMemo(
    () => people.filter((person) => person.id !== selectedPersonId),
    [people, selectedPersonId]
  );

  const filteredRelationshipCandidates = useMemo(() => {
    const trimmedTerm = relationshipSearchTerm.trim().toLowerCase();
    if (!trimmedTerm) {
      return [];
    }

    return relationshipCandidates.filter((person) => person.name.toLowerCase().includes(trimmedTerm));
  }, [relationshipCandidates, relationshipSearchTerm]);

  const relationshipItems = useMemo<RelationshipViewItem[]>(() => {
    if (!selectedPersonId) {
      return [];
    }

    const personNameById = new Map(people.map((person) => [person.id, person.name]));

    return relationships.map((relationship) => {
      const direction = resolveRelationshipDirection(relationship, selectedPersonId);

      return {
        createdAt: relationship.created_at,
        id: relationship.id,
        otherPersonName: personNameById.get(direction.otherPersonId) ?? `Person #${direction.otherPersonId}`,
        ...direction,
      };
    });
  }, [people, relationships, selectedPersonId]);

  const refreshSearchIfNeeded = useCallback(async () => {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      return;
    }

    const rows = await searchPeopleAndNotes(trimmedTerm);
    setSearchResults(rows);
  }, [searchTerm]);

  const onCreatePersonPress = useCallback(async () => {
    try {
      setIsCreating(true);
      setError(null);
      const createdPerson = await createPerson(newPersonName);
      setSelectedPersonId(createdPerson.id);
      setSelectedRelationshipTargetId(null);
      setRelationshipTypeInput('');
      setReverseRelationshipTypeInput('');
      setNewNoteContent('');
      setNewPersonName('');
      await Promise.all([
        loadPeople(),
        loadSelectedPersonDetails(createdPerson.id),
        refreshSearchIfNeeded(),
      ]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unknown create error');
    } finally {
      setIsCreating(false);
    }
  }, [loadPeople, loadSelectedPersonDetails, newPersonName, refreshSearchIfNeeded]);

  const onSeedPress = useCallback(async () => {
    try {
      setIsSeeding(true);
      setError(null);
      await seedSampleData();
      await loadPeople();
      await refreshSearchIfNeeded();
      if (selectedPersonId) {
        await loadSelectedPersonDetails(selectedPersonId);
      }
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : 'Unknown seed error');
    } finally {
      setIsSeeding(false);
    }
  }, [loadPeople, loadSelectedPersonDetails, refreshSearchIfNeeded, selectedPersonId]);

  const onSubmitNewNotePress = useCallback(async () => {
    if (!selectedPersonId) {
      return;
    }

    try {
      setIsAddingNote(true);
      setError(null);
      await addNote(selectedPersonId, newNoteContent);
      setNewNoteContent('');
      await Promise.all([loadPeople(), loadSelectedPersonDetails(selectedPersonId), refreshSearchIfNeeded()]);
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : 'Unknown note error');
    } finally {
      setIsAddingNote(false);
    }
  }, [loadPeople, loadSelectedPersonDetails, newNoteContent, refreshSearchIfNeeded, selectedPersonId]);

  const onStartEditNotePress = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  }, []);

  const onCancelEditNotePress = useCallback(() => {
    setEditingNoteId(null);
    setEditingNoteContent('');
    setExpandedNoteId(null);
  }, []);

  const onSaveEditedNotePress = useCallback(async () => {
    if (!editingNoteId || !selectedPersonId) {
      return;
    }

    try {
      setIsEditingNote(true);
      setError(null);
      await updateNote(editingNoteId, editingNoteContent);
      setEditingNoteId(null);
      setEditingNoteContent('');
      await Promise.all([loadPeople(), loadSelectedPersonDetails(selectedPersonId), refreshSearchIfNeeded()]);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unknown update note error');
    } finally {
      setIsEditingNote(false);
    }
  }, [editingNoteContent, editingNoteId, loadPeople, loadSelectedPersonDetails, refreshSearchIfNeeded, selectedPersonId]);

  const onStartEditPersonNamePress = useCallback(() => {
    if (!selectedPerson) {
      return;
    }

    setEditingPersonName(selectedPerson.name);
    setIsPersonNameEditMode(true);
  }, [selectedPerson]);

  const onCancelEditPersonNamePress = useCallback(() => {
    setIsPersonNameEditMode(false);
    setEditingPersonName('');
  }, []);

  const onSaveEditedPersonNamePress = useCallback(async () => {
    if (!selectedPersonId) {
      return;
    }

    try {
      setIsEditingPersonName(true);
      setError(null);
      await updatePersonName(selectedPersonId, editingPersonName);
      setIsPersonNameEditMode(false);
      setEditingPersonName('');
      await Promise.all([loadPeople(), loadSelectedPersonDetails(selectedPersonId), refreshSearchIfNeeded()]);
    } catch (updatePersonError) {
      setError(updatePersonError instanceof Error ? updatePersonError.message : 'Unknown update person error');
    } finally {
      setIsEditingPersonName(false);
    }
  }, [editingPersonName, loadPeople, loadSelectedPersonDetails, refreshSearchIfNeeded, selectedPersonId]);

  const onDeletePersonPress = useCallback(async () => {
    if (!selectedPersonId) {
      return;
    }

    try {
      setIsDeletingPerson(true);
      setError(null);
      await deletePerson(selectedPersonId);

      setSelectedPersonId(null);
      setSelectedRelationshipTargetId(null);
      setEditingRelationshipId(null);
      setRelationshipTypeInput('');
      setReverseRelationshipTypeInput('');
      setNewNoteContent('');
      setEditingNoteId(null);
      setEditingNoteContent('');
      setIsPersonNameEditMode(false);
      setEditingPersonName('');
      setExpandedNoteId(null);
      setTimelineNotes([]);
      setRelationships([]);

      await Promise.all([loadPeople(), refreshSearchIfNeeded()]);
    } catch (deletePersonError) {
      setError(deletePersonError instanceof Error ? deletePersonError.message : 'Unknown delete person error');
    } finally {
      setIsDeletingPerson(false);
    }
  }, [loadPeople, refreshSearchIfNeeded, selectedPersonId]);

  const onDeleteNotePress = useCallback(
    async (noteId: number) => {
      if (!selectedPersonId) {
        return;
      }

      try {
        setIsDeletingNote(true);
        setError(null);
        await deleteNote(noteId);

        if (editingNoteId === noteId) {
          setEditingNoteId(null);
          setEditingNoteContent('');
        }

        setExpandedNoteId((current) => (current === noteId ? null : current));
        await Promise.all([loadPeople(), loadSelectedPersonDetails(selectedPersonId), refreshSearchIfNeeded()]);
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Unknown delete note error');
      } finally {
        setIsDeletingNote(false);
      }
    },
    [editingNoteId, loadPeople, loadSelectedPersonDetails, refreshSearchIfNeeded, selectedPersonId]
  );

  const onCreateRelationshipPress = useCallback(async () => {
    if (!selectedPersonId || !selectedRelationshipTargetId) {
      return;
    }

    try {
      setIsCreatingRelationship(true);
      setError(null);
      await createRelationship(selectedPersonId, selectedRelationshipTargetId, {
        relationshipType: relationshipTypeInput,
        reverseRelationshipType: reverseRelationshipTypeInput,
      });
      setRelationshipTypeInput('');
      setReverseRelationshipTypeInput('');
      setRelationshipSearchTerm('');
      setSelectedRelationshipTargetId(null);
      setEditingRelationshipId(null);
      await loadSelectedPersonDetails(selectedPersonId);
    } catch (relationshipError) {
      setError(relationshipError instanceof Error ? relationshipError.message : 'Unknown relationship error');
    } finally {
      setIsCreatingRelationship(false);
    }
  }, [
    loadSelectedPersonDetails,
    relationshipTypeInput,
    reverseRelationshipTypeInput,
    selectedPersonId,
    selectedRelationshipTargetId,
  ]);

  const onStartEditRelationshipPress = useCallback((relationship: RelationshipViewItem) => {
    setEditingRelationshipId(relationship.id);
    setSelectedRelationshipTargetId(relationship.otherPersonId);
    setRelationshipTypeInput(relationship.otherPersonRelationshipType ?? '');
    setReverseRelationshipTypeInput(relationship.selectedPersonRelationshipType ?? '');
    setRelationshipSearchTerm('');
  }, []);

  const onCancelEditRelationshipPress = useCallback(() => {
    setEditingRelationshipId(null);
    setSelectedRelationshipTargetId(null);
    setRelationshipTypeInput('');
    setReverseRelationshipTypeInput('');
  }, []);

  const onSelectRelationshipCandidatePress = useCallback((personId: number | null) => {
    setEditingRelationshipId(null);
    setSelectedRelationshipTargetId(personId);
    setRelationshipTypeInput('');
    setReverseRelationshipTypeInput('');
  }, []);

  const onDeleteRelationshipPress = useCallback(
    async (relationshipId: number) => {
      if (!selectedPersonId) {
        return;
      }

      try {
        setIsDeletingRelationship(true);
        setError(null);
        await deleteRelationship(relationshipId);
        await loadSelectedPersonDetails(selectedPersonId);
      } catch (deleteRelationshipError) {
        setError(
          deleteRelationshipError instanceof Error
            ? deleteRelationshipError.message
            : 'Unknown delete relationship error'
        );
      } finally {
        setIsDeletingRelationship(false);
      }
    },
    [loadSelectedPersonDetails, selectedPersonId]
  );

  const onPersonPress = useCallback(
    (personId: number) => {
      setSelectedPersonId(personId);
      setSelectedRelationshipTargetId(null);
      setEditingRelationshipId(null);
      setRelationshipTypeInput('');
      setReverseRelationshipTypeInput('');
      setRelationshipSearchTerm('');
      setNewNoteContent('');
      setIsPersonNameEditMode(false);
      setEditingPersonName('');
      void loadSelectedPersonDetails(personId);
    },
    [loadSelectedPersonDetails]
  );

  const onRefreshDataPress = useCallback(async () => {
    await loadPeople();
    await refreshSearchIfNeeded();

    if (selectedPersonId) {
      await loadSelectedPersonDetails(selectedPersonId);
    }
  }, [loadPeople, loadSelectedPersonDetails, refreshSearchIfNeeded, selectedPersonId]);

  const onBackFromPersonDetailPress = useCallback(() => {
    setSelectedPersonId(null);
    setSelectedRelationshipTargetId(null);
    setEditingRelationshipId(null);
    setRelationshipSearchTerm('');
    setRelationshipTypeInput('');
    setReverseRelationshipTypeInput('');
    setNewNoteContent('');
    setEditingNoteId(null);
    setEditingNoteContent('');
    setIsPersonNameEditMode(false);
    setEditingPersonName('');
    setExpandedNoteId(null);
    setTimelineNotes([]);
    setRelationships([]);
  }, []);

  const onToggleNoteExpanded = useCallback((noteId: number) => {
    setExpandedNoteId((current) => (current === noteId ? null : noteId));
  }, []);

  const onClearSearchPress = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  return {
    canAddNote,
    canCreatePerson,
    canSaveEditedPersonName,
    canSaveEditedNote,
    canSaveRelationship,
    editingPersonName,
    editingNoteContent,
    editingNoteId,
    editingRelationshipId,
    error,
    expandedNoteId,
    hasActiveSearch,
    isAddingNote,
    isCreating,
    isCreatingRelationship,
    isDeletingPerson,
    isDeletingRelationship,
    isDeletingNote,
    isEditingPersonName,
    isPersonNameEditMode,
    isEditingNote,
    isDatabaseReady,
    isLoading,
    isLoadingDetails,
    isSearching,
    isSeeding,
    matchedNoteCountByPersonId,
    newNoteContent,
    newPersonName,
    onBackFromPersonDetailPress,
    onCancelEditNotePress,
    onCancelEditPersonNamePress,
    onCancelEditRelationshipPress,
    onClearSearchPress,
    onCreatePersonPress,
    onCreateRelationshipPress,
    onDeletePersonPress,
    onDeleteNotePress,
    onDeleteRelationshipPress,
    onPersonPress,
    onRefreshDataPress,
    onSaveEditedPersonNamePress,
    onSaveEditedNotePress,
    onSeedPress,
    onSelectRelationshipCandidatePress,
    onStartEditPersonNamePress,
    onStartEditNotePress,
    onSubmitNewNotePress,
    onStartEditRelationshipPress,
    onToggleNoteExpanded,
    peopleCountLabel,
    relationshipCandidates: filteredRelationshipCandidates,
    relationshipSearchTerm,
    relationshipItems,
    relationshipTypeInput,
    reverseRelationshipTypeInput,
    selectedPeopleSortOption,
    searchTerm,
    selectedPerson,
    selectedRelationshipTargetId,
    setEditingPersonName,
    setEditingNoteContent,
    setNewNoteContent,
    setNewPersonName,
    setRelationshipSearchTerm,
    setRelationshipTypeInput,
    setReverseRelationshipTypeInput,
    setSelectedPeopleSortOption,
    setSearchTerm,
    setSelectedRelationshipTargetId,
    timelineNotes,
    visiblePeople,
  };
}
