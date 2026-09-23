import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportAllDataAsCsv, getThemeModeSetting, importAllDataFromCsv, setThemeModeSetting } from '../../data/database';
import { PeopleScreenView } from './PeopleScreenView';
import { pickCsvFile, saveCsvExport } from './csvFile';
import { confirmAction, showAlert } from './dialogs';
import { APP_MAX_WIDTH, UI_LAYOUT } from './constants';
import { usePeopleScreenModel } from '../../features/people/usePeopleScreenModel';
import type { ThemeMode, ThemeTokens, ViewMode } from './view/types';

const THEME: Record<ThemeMode, ThemeTokens> = {
  dark: {
    appBackground: 'bg-slate-950',
    panelBackground: 'bg-slate-900',
    cardBackground: 'bg-slate-900',
    chipBackground: 'bg-slate-700',
    selectedChipBackground: 'bg-emerald-600',
    border: 'border-slate-700',
    divider: 'border-slate-600',
    inputBorder: 'border-slate-600',
    inputBackground: 'bg-slate-800',
    inputText: 'text-slate-100',
    headingText: 'text-slate-100',
    primaryText: 'text-slate-100',
    secondaryText: 'text-slate-300',
    tertiaryText: 'text-slate-400',
    navButton: 'bg-slate-800',
    navButtonText: 'text-slate-100',
  },
  light: {
    appBackground: 'bg-slate-100',
    panelBackground: 'bg-white',
    cardBackground: 'bg-white',
    chipBackground: 'bg-slate-200',
    selectedChipBackground: 'bg-emerald-600',
    border: 'border-slate-200',
    divider: 'border-slate-300',
    inputBorder: 'border-slate-300',
    inputBackground: 'bg-white',
    inputText: 'text-slate-900',
    headingText: 'text-slate-900',
    primaryText: 'text-slate-800',
    secondaryText: 'text-slate-600',
    tertiaryText: 'text-slate-500',
    navButton: 'bg-slate-200',
    navButtonText: 'text-slate-700',
  },
};

export function PeopleScreen() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isImportingData, setIsImportingData] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('people');
  const [isPersonActionsMenuOpen, setIsPersonActionsMenuOpen] = useState(false);
  const [isPeopleSortMenuOpen, setIsPeopleSortMenuOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [expandedRelationshipId, setExpandedRelationshipId] = useState<number | null>(null);
  const [newNoteInputHeight, setNewNoteInputHeight] = useState<number>(UI_LAYOUT.noteInputMinHeight);
  const [editNoteInputHeight, setEditNoteInputHeight] = useState<number>(UI_LAYOUT.noteInputMinHeight);
  const personDetailScrollRef = useRef<ScrollView | null>(null);
  const focusedSectionOffsetYRef = useRef<number | null>(null);
  const addNoteSectionOffsetYRef = useRef(0);
  const notesSectionOffsetYRef = useRef(0);
  const relationshipSectionOffsetYRef = useRef(0);
  const relationshipSearchInputRowOffsetYRef = useRef(0);
  const insets = useSafeAreaInsets();

  const {
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
    hasMoreRelationshipCandidates,
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
    onDeleteRelationshipPress,
    onDeleteNotePress,
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
    relationshipCandidates,
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
  } = usePeopleScreenModel();

  const hasRelationshipSearchTerm = relationshipSearchTerm.trim().length > 0;

  const theme = useMemo(() => THEME[themeMode], [themeMode]);

  useEffect(() => {
    if (!isDatabaseReady) {
      return;
    }

    let isMounted = true;

    async function loadThemeSetting() {
      try {
        const savedTheme = await getThemeModeSetting();
        if (isMounted && savedTheme) {
          setThemeMode(savedTheme);
        }
      } catch {
        // Keep default light theme if setting load fails.
      }
    }

    void loadThemeSetting();

    return () => {
      isMounted = false;
    };
  }, [isDatabaseReady]);

  const onToggleThemeModePress = useCallback(async () => {
    const previousTheme = themeMode;
    const nextTheme: ThemeMode = themeMode === 'light' ? 'dark' : 'light';

    setThemeMode(nextTheme);
    setIsSavingTheme(true);

    try {
      await setThemeModeSetting(nextTheme);
    } catch {
      setThemeMode(previousTheme);
    } finally {
      setIsSavingTheme(false);
    }
  }, [themeMode]);

  const onExportDataPress = useCallback(async () => {
    try {
      setIsExportingData(true);

      const savedFilePath = await saveCsvExport(await exportAllDataAsCsv());

      if (savedFilePath) {
        showAlert('Export complete', `CSV saved to:\n${savedFilePath}`);
      }
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : 'Unknown export error';
      showAlert('Export failed', message);
    } finally {
      setIsExportingData(false);
    }
  }, []);

  const onImportDataPress = useCallback(() => {
    void (async () => {
      const confirmed = await confirmAction({
        title: 'Import CSV?',
        message:
          'This will replace all local people, notes, relationships, and settings with data from the selected CSV file.',
        confirmLabel: 'Import',
        destructive: true,
      });

      if (!confirmed) {
        return;
      }

      try {
        setIsImportingData(true);

        const csvText = await pickCsvFile();

        if (csvText === null) {
          return;
        }

        const summary = await importAllDataFromCsv(csvText);
        await onRefreshDataPress();

        const importedTheme = await getThemeModeSetting();
        if (importedTheme) {
          setThemeMode(importedTheme);
        }

        showAlert(
          'Import complete',
          `Imported ${summary.people} people, ${summary.notes} notes, ${summary.relationships} relationships, and ${summary.settings} settings.`
        );
      } catch (importError) {
        const message = importError instanceof Error ? importError.message : 'Unknown import error';

        if (message.toLowerCase().includes('native module') || message.toLowerCase().includes('document picker')) {
          showAlert(
            'Import unavailable',
            'File import is unavailable in this installed app binary. Install the latest rebuilt development client and try again.'
          );
          return;
        }

        showAlert('Import failed', message);
      } finally {
        setIsImportingData(false);
      }
    })();
  }, [onRefreshDataPress]);

  const scrollPersonDetailSectionToTop = useCallback((offsetY: number) => {
    personDetailScrollRef.current?.scrollTo({
      y: Math.max(0, offsetY),
      animated: true,
    });
  }, []);

  const onFocusPersonDetailSection = useCallback(
    (offsetY: number) => {
      focusedSectionOffsetYRef.current = offsetY;

      // Browsers already scroll focused fields into view, and there is no keyboard inset to
      // compensate for, so forcing the section to the top only overshoots to the scroll end.
      if (Platform.OS === 'web') {
        return;
      }

      requestAnimationFrame(() => {
        scrollPersonDetailSectionToTop(offsetY);
      });
    },
    [scrollPersonDetailSectionToTop]
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);

      if (focusedSectionOffsetYRef.current !== null) {
        requestAnimationFrame(() => {
          scrollPersonDetailSectionToTop(focusedSectionOffsetYRef.current ?? 0);
        });
      }
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      // Android's back button hides the keyboard without clearing React Native's focused input.
      Keyboard.dismiss();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollPersonDetailSectionToTop]);

  useEffect(() => {
    setIsPersonActionsMenuOpen(false);
  }, [selectedPerson?.id, isPersonNameEditMode]);

  useEffect(() => {
    if (selectedPerson) {
      setIsPeopleSortMenuOpen(false);
    }
  }, [selectedPerson]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const onHardwareBackPress = () => {
      if (selectedPerson) {
        onBackFromPersonDetailPress();
        return true;
      }

      if (viewMode === 'settings') {
        setViewMode('people');
        return true;
      }

      void confirmAction({
        title: 'Close app?',
        message: 'Are you sure you want to close People Are Interesting?',
        confirmLabel: 'Close',
        destructive: true,
      }).then((confirmed) => {
        if (confirmed) {
          BackHandler.exitApp();
        }
      });

      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);

    return () => {
      subscription.remove();
    };
  }, [onBackFromPersonDetailPress, selectedPerson, viewMode]);

  useEffect(() => {
    setExpandedRelationshipId(null);
  }, [selectedPerson?.id, relationshipItems.length]);

  useEffect(() => {
    if (editingNoteId === null) {
      setEditNoteInputHeight(UI_LAYOUT.noteInputMinHeight);
    }
  }, [editingNoteId]);

  // Saving a note clears the text without firing a change event, so reset the grown input here.
  useEffect(() => {
    if (newNoteContent.length === 0) {
      setNewNoteInputHeight(UI_LAYOUT.noteInputMinHeight);
    }
  }, [newNoteContent]);

  const keyboardLift =
    keyboardHeight > 0
      ? Math.max(0, keyboardHeight - insets.bottom + UI_LAYOUT.globalKeyboardLiftOffset)
      : 0;

  const onConfirmDeletePersonPress = useCallback(() => {
    if (!selectedPerson) {
      return;
    }

    void confirmAction({
      title: 'Delete person?',
      message: `This will permanently delete ${selectedPerson.name} and all related notes and relationships.`,
      confirmLabel: 'Delete',
      destructive: true,
    }).then((confirmed) => {
      if (confirmed) {
        void onDeletePersonPress();
      }
    });
  }, [onDeletePersonPress, selectedPerson]);

  const onConfirmDeleteNotePress = useCallback(
    (noteId: number) => {
      void confirmAction({
        title: 'Delete note?',
        message: 'This note will be permanently deleted.',
        confirmLabel: 'Delete',
        destructive: true,
      }).then((confirmed) => {
        if (confirmed) {
          void onDeleteNotePress(noteId);
        }
      });
    },
    [onDeleteNotePress]
  );

  const onConfirmDeleteRelationshipPress = useCallback(
    (relationshipId: number) => {
      void confirmAction({
        title: 'Delete relationship?',
        message: 'This relationship will be permanently deleted.',
        confirmLabel: 'Delete',
        destructive: true,
      }).then((confirmed) => {
        if (confirmed) {
          void onDeleteRelationshipPress(relationshipId);
        }
      });
    },
    [onDeleteRelationshipPress]
  );

  const onConfirmSeedPress = useCallback(() => {
    void confirmAction({
      title: 'Create sample data?',
      message: 'This will add randomized people, notes, and relationships to your local database.',
      confirmLabel: 'Create',
    }).then((confirmed) => {
      if (confirmed) {
        void onSeedPress();
      }
    });
  }, [onSeedPress]);

  return (
    <SafeAreaView className={`flex-1 ${theme.appBackground}`} edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View
          className="w-full flex-1 self-center px-2"
          style={{
            maxWidth: APP_MAX_WIDTH,
            paddingBottom: insets.bottom + UI_LAYOUT.bottomExtraPadding + keyboardLift,
          }}
        >
          <PeopleScreenView
            model={{
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
              hasMoreRelationshipCandidates,
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
              relationshipCandidates,
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
            }}
            ui={{
              viewMode,
              setViewMode,
              themeMode,
              theme,
              keyboardLift,
              headerTitleLeftPadding: UI_LAYOUT.headerTitleLeftPadding,
              noteInputMinHeight: UI_LAYOUT.noteInputMinHeight,
              isSavingTheme,
              isExportingData,
              isImportingData,
              isPeopleSortMenuOpen,
              setIsPeopleSortMenuOpen,
              isPersonActionsMenuOpen,
              setIsPersonActionsMenuOpen,
              expandedRelationshipId,
              setExpandedRelationshipId,
              newNoteInputHeight,
              setNewNoteInputHeight,
              editNoteInputHeight,
              setEditNoteInputHeight,
              personDetailScrollRef,
              addNoteSectionOffsetYRef,
              notesSectionOffsetYRef,
              relationshipSectionOffsetYRef,
              relationshipSearchInputRowOffsetYRef,
              hasRelationshipSearchTerm,
              onFocusPersonDetailSection,
              onToggleThemeModePress,
              onExportDataPress,
              onImportDataPress,
              onConfirmSeedPress,
              onConfirmDeletePersonPress,
              onConfirmDeleteNotePress,
              onConfirmDeleteRelationshipPress,
            }}
          />
        </View>
      </KeyboardAvoidingView>

      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}
