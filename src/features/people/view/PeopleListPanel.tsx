import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { UsePeopleScreenModelResult } from '../usePeopleScreenModel';
import { DROPDOWN_MENU_ELEVATION, LAYER_Z_INDEX, getPlaceholderTextColor } from '../constants';
import { AnimatedPressable } from './AnimatedPressable';
import type { PeopleScreenUiProps } from './types';

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

export function PeopleListPanel({ model, ui }: PeopleListPanelProps) {
  return (
    <View className="relative flex-1">
      {ui.isPeopleSortMenuOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sort menu"
          onPress={() => ui.setIsPeopleSortMenuOpen(false)}
          className="absolute inset-0"
          style={{ zIndex: LAYER_Z_INDEX.overlayDismiss }}
        />
      ) : null}

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

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 12 + ui.keyboardLift }}
      >
        <View className="mb-3 mt-4 flex-row items-center justify-between" style={{ zIndex: LAYER_Z_INDEX.headerRow }}>
          <Text className={`text-lg font-semibold ${ui.theme.headingText}`}>People ({model.peopleCountLabel})</Text>
          <View className="relative flex-row items-center gap-2" style={{ zIndex: LAYER_Z_INDEX.dropdownTriggerContainer }}>
            {model.isSearching ? <Text className={ui.theme.secondaryText}>Searching...</Text> : null}
            <AnimatedPressable
              accessibilityRole="button"
              onPress={() => ui.setIsPeopleSortMenuOpen((current) => !current)}
              className={`flex-row items-center rounded-lg px-3 py-2 ${ui.theme.navButton}`}
            >
              <Text className={`font-semibold ${ui.theme.navButtonText}`}>≡</Text>
              <Text className={`ml-1 font-semibold ${ui.theme.navButtonText}`}>▾</Text>
            </AnimatedPressable>

            {ui.isPeopleSortMenuOpen ? (
              <View
                className={`absolute right-0 top-11 w-48 rounded-lg border ${ui.theme.border} ${ui.theme.cardBackground}`}
                style={{ zIndex: LAYER_Z_INDEX.dropdownMenu, elevation: DROPDOWN_MENU_ELEVATION }}
              >
                {PEOPLE_SORT_OPTIONS.map((option) => {
                  const isSelected = model.selectedPeopleSortOption === option.value;
                  return (
                    <AnimatedPressable
                      key={option.value}
                      accessibilityRole="button"
                      onPress={() => {
                        model.setSelectedPeopleSortOption(option.value);
                        ui.setIsPeopleSortMenuOpen(false);
                      }}
                      className={`px-3 py-2 ${isSelected ? ui.theme.selectedChipBackground : ''}`}
                    >
                      <Text className={isSelected ? 'font-semibold text-white' : ui.theme.primaryText}>{option.label}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>

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
                <AnimatedPressable
                  className={`mb-2 rounded-xl border p-3 ${ui.theme.border}`}
                  key={person.id}
                  onPress={() => model.onPersonPress(person.id)}
                >
                  <Text className={`text-base font-semibold ${ui.theme.primaryText}`}>{person.name}</Text>
                  <Text className={`mt-1 ${ui.theme.secondaryText}`} numberOfLines={1} ellipsizeMode="tail">
                    {person.latest_note_content ?? 'No notes yet'}
                  </Text>
                  {model.hasActiveSearch ? (
                    <Text className={`mt-1 text-xs ${ui.theme.tertiaryText}`}>
                      Matched notes: {model.matchedNoteCountByPersonId.get(person.id) ?? 0}
                    </Text>
                  ) : null}
                </AnimatedPressable>
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
    </View>
  );
}
