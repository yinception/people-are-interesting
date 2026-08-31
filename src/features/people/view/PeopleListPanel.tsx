import { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import type { UsePeopleScreenModelResult } from '../usePeopleScreenModel';
import { DROPDOWN_MENU_ELEVATION, LAYER_Z_INDEX, MENU_MODAL_BACKDROP_COLOR, getPlaceholderTextColor } from '../constants';
import { AnimatedPressable } from './AnimatedPressable';
import { FadeModal } from './FadeModal';
import { PersonListRow } from './PersonListRow';
import type { PeopleScreenUiProps } from './types';
import { useAnchoredMenu } from './useAnchoredMenu';

const PEOPLE_SORT_OPTIONS: { label: string; value: UsePeopleScreenModelResult['selectedPeopleSortOption'] }[] = [
  { label: 'A-Z', value: 'name_asc' },
  { label: 'Z-A', value: 'name_desc' },
  { label: 'Created Old-New', value: 'created_at_asc' },
  { label: 'Created New-Old', value: 'created_at_desc' },
  { label: 'Modified Old-New', value: 'last_modified_asc' },
  { label: 'Modified New-Old', value: 'last_modified_desc' },
];

interface PeopleListPanelProps {
  model: Pick<
    UsePeopleScreenModelResult,
    | 'searchTerm'
    | 'setSearchTerm'
    | 'isLoading'
    | 'onClearSearchPress'
    | 'hasActiveSearch'
    | 'peopleCountLabel'
    | 'isSearching'
    | 'selectedPeopleSortOption'
    | 'setSelectedPeopleSortOption'
    | 'visiblePeople'
    | 'onPersonPress'
    | 'matchedNoteCountByPersonId'
    | 'newPersonName'
    | 'setNewPersonName'
    | 'isCreating'
    | 'canCreatePerson'
    | 'onCreatePersonPress'
  >;
  ui: Pick<
    PeopleScreenUiProps,
    | 'theme'
    | 'themeMode'
    | 'keyboardLift'
    | 'isPeopleSortMenuOpen'
    | 'setIsPeopleSortMenuOpen'
  >;
}

const SORT_MENU_WIDTH = 192;
const SORT_MENU_MARGIN = 8;
const SORT_MENU_TOP_OFFSET = 6;

export function PeopleListPanel({ model, ui }: PeopleListPanelProps) {
  const {
    closeMenu: closeSortMenu,
    toggleMenu: toggleSortMenu,
    onTriggerLayout: onSortTriggerLayout,
    menuLeft,
    menuTop,
  } = useAnchoredMenu({
    isOpen: ui.isPeopleSortMenuOpen,
    setIsOpen: ui.setIsPeopleSortMenuOpen,
    menuWidth: SORT_MENU_WIDTH,
    menuMargin: SORT_MENU_MARGIN,
    menuTopOffset: SORT_MENU_TOP_OFFSET,
  });

  const peopleListScrollRef = useRef<ScrollView | null>(null);

  // Search is debounced, so also reset once results land or a smooth scroll would be cut short.
  useEffect(() => {
    peopleListScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [model.searchTerm, model.isSearching]);

  return (
    <View className="relative flex-1">
      <View className={`mb-3 rounded-2xl border p-3 ${ui.theme.border} ${ui.theme.cardBackground}`}>
        <Text className={`text-sm font-semibold uppercase tracking-wide ${ui.theme.tertiaryText}`}>Search</Text>
        <View className="mt-2 flex-row gap-2">
          <TextInput
            value={model.searchTerm}
            onChangeText={model.setSearchTerm}
            placeholder="Search names or notes"
            placeholderTextColor={getPlaceholderTextColor(ui.themeMode)}
            editable={!model.isLoading}
            className={`flex-1 rounded-xl border px-3 py-2 ${ui.theme.inputBorder} ${ui.theme.inputBackground} ${ui.theme.inputText}`}
          />
          <AnimatedPressable
            accessibilityRole="button"
            onPress={model.onClearSearchPress}
            disabled={model.isLoading || !model.hasActiveSearch}
            className={`h-11 items-center justify-center rounded-xl px-3 ${
              model.isLoading || !model.hasActiveSearch ? 'bg-slate-400' : ui.theme.navButton
            }`}
          >
            <Text className={`font-semibold ${ui.theme.navButtonText}`}>Clear</Text>
          </AnimatedPressable>
        </View>
      </View>

      <View className="mb-3 flex-row items-center justify-between" style={{ zIndex: LAYER_Z_INDEX.headerRow }}>
        <Text className={`text-lg font-semibold ${ui.theme.headingText}`}>People ({model.peopleCountLabel})</Text>
        <View className="relative flex-row items-center gap-2" style={{ zIndex: LAYER_Z_INDEX.dropdownTriggerContainer }}>
          {model.isSearching ? <Text className={ui.theme.secondaryText}>Searching...</Text> : null}
          <View onLayout={onSortTriggerLayout}>
            <AnimatedPressable
              accessibilityRole="button"
              onPress={toggleSortMenu}
              className={`flex-row items-center rounded-lg px-3 py-2 ${ui.theme.navButton}`}
            >
              <Text className={`font-semibold ${ui.theme.navButtonText}`}>≡</Text>
              <Text className={`ml-1 font-semibold ${ui.theme.navButtonText}`}>▾</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>

      <ScrollView
        ref={peopleListScrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 12 + ui.keyboardLift }}
      >
        {model.isLoading ? (
          <View className="mb-4 flex-row items-center gap-2">
            <ActivityIndicator />
            <Text className={ui.theme.secondaryText}>Initializing local database...</Text>
          </View>
        ) : (
          <View>
            {model.visiblePeople.length === 0 ? (
              model.hasActiveSearch ? (
                <Text className={`mb-4 ${ui.theme.tertiaryText}`}>No matches found for this search.</Text>
              ) : (
                <Text className={`mb-4 ${ui.theme.tertiaryText}`}>No people yet. Add a person below.</Text>
              )
            ) : (
              model.visiblePeople.map((person) => (
                <PersonListRow
                  key={person.id}
                  person={person}
                  theme={ui.theme}
                  matchedNoteCount={
                    model.hasActiveSearch ? model.matchedNoteCountByPersonId.get(person.id) ?? 0 : null
                  }
                  onPress={model.onPersonPress}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <View className={`mt-3 rounded-2xl border p-3 ${ui.theme.border} ${ui.theme.cardBackground}`}>
        <Text className={`text-sm font-semibold uppercase tracking-wide ${ui.theme.tertiaryText}`}>Create person</Text>
        <View className="mt-2 flex-row gap-2">
          <TextInput
            value={model.newPersonName}
            onChangeText={model.setNewPersonName}
            placeholder="Enter a name"
            placeholderTextColor={getPlaceholderTextColor(ui.themeMode)}
            editable={!model.isLoading && !model.isCreating}
            returnKeyType="done"
            onSubmitEditing={model.onCreatePersonPress}
            className={`flex-1 rounded-xl border px-3 py-2 ${ui.theme.inputBorder} ${ui.theme.inputBackground} ${ui.theme.inputText}`}
          />
          <AnimatedPressable
            accessibilityRole="button"
            disabled={model.isLoading || model.isCreating || !model.canCreatePerson}
            onPress={model.onCreatePersonPress}
            className={`h-11 items-center justify-center rounded-xl px-4 ${
              model.isLoading || model.isCreating || !model.canCreatePerson ? 'bg-slate-400' : 'bg-emerald-600'
            }`}
          >
            <Text className="font-semibold text-white">{model.isCreating ? 'Adding...' : 'Add'}</Text>
          </AnimatedPressable>
        </View>
      </View>

      <FadeModal
        visible={ui.isPeopleSortMenuOpen}
        backdropColor={MENU_MODAL_BACKDROP_COLOR[ui.themeMode]}
        backdropAccessibilityLabel="Close sort menu"
        onRequestClose={closeSortMenu}
      >
        <View pointerEvents="box-none" className="flex-1">
          <View
            className={`absolute rounded-lg border ${ui.theme.border} ${ui.theme.cardBackground}`}
            style={{
              left: menuLeft,
              top: menuTop,
              width: SORT_MENU_WIDTH,
              zIndex: LAYER_Z_INDEX.dropdownMenu,
              elevation: DROPDOWN_MENU_ELEVATION,
            }}
          >
            {PEOPLE_SORT_OPTIONS.map((option) => {
              const isSelected = model.selectedPeopleSortOption === option.value;
              return (
                <AnimatedPressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => {
                    model.setSelectedPeopleSortOption(option.value);
                    closeSortMenu();
                    peopleListScrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                  className={`px-3 py-2 ${isSelected ? ui.theme.selectedChipBackground : ''}`}
                >
                  <Text className={isSelected ? 'font-semibold text-white' : ui.theme.primaryText}>{option.label}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>
      </FadeModal>
    </View>
  );
}
