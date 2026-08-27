import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ScrollView } from 'react-native';
import type { UsePeopleScreenModelResult } from '../usePeopleScreenModel';

export type ThemeMode = 'light' | 'dark';
export type ViewMode = 'people' | 'settings';

export interface ThemeTokens {
  appBackground: string;
  panelBackground: string;
  cardBackground: string;
  chipBackground: string;
  selectedChipBackground: string;
  border: string;
  inputBorder: string;
  inputBackground: string;
  inputText: string;
  headingText: string;
  primaryText: string;
  secondaryText: string;
  tertiaryText: string;
  navButton: string;
  navButtonText: string;
}

export interface PeopleScreenUiProps {
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  themeMode: ThemeMode;
  theme: ThemeTokens;
  keyboardLift: number;
  headerTitleLeftPadding: number;
  noteInputMinHeight: number;
  isSavingTheme: boolean;
  isExportingData: boolean;
  isImportingData: boolean;
  isPeopleSortMenuOpen: boolean;
  setIsPeopleSortMenuOpen: Dispatch<SetStateAction<boolean>>;
  isPersonActionsMenuOpen: boolean;
  setIsPersonActionsMenuOpen: Dispatch<SetStateAction<boolean>>;
  expandedRelationshipId: number | null;
  setExpandedRelationshipId: Dispatch<SetStateAction<number | null>>;
  newNoteInputHeight: number;
  setNewNoteInputHeight: Dispatch<SetStateAction<number>>;
  editNoteInputHeight: number;
  setEditNoteInputHeight: Dispatch<SetStateAction<number>>;
  personDetailScrollRef: MutableRefObject<ScrollView | null>;
  addNoteSectionOffsetYRef: MutableRefObject<number>;
  notesSectionOffsetYRef: MutableRefObject<number>;
  relationshipSectionOffsetYRef: MutableRefObject<number>;
  relationshipSearchInputRowOffsetYRef: MutableRefObject<number>;
  hasRelationshipSearchTerm: boolean;
  onFocusPersonDetailSection: (offsetY: number) => void;
  onToggleThemeModePress: () => Promise<void>;
  onExportDataPress: () => Promise<void>;
  onImportDataPress: () => void;
  onConfirmSeedPress: () => void;
  onConfirmDeletePersonPress: () => void;
  onConfirmDeleteNotePress: (noteId: number) => void;
  onConfirmDeleteRelationshipPress: (relationshipId: number) => void;
}

export interface PeopleScreenViewProps {
  model: UsePeopleScreenModelResult;
  ui: PeopleScreenUiProps;
}
