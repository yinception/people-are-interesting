import { useRef } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { PersonListItem } from '../../../data/database';
import type { UsePeopleScreenModelResult } from '../usePeopleScreenModel';
import { MAX_RELATIONSHIP_CANDIDATE_RESULTS } from '../usePeopleScreenModel';
import {
  CARD_CLASS,
  CARD_WITH_TOP_MARGIN_CLASS,
  DROPDOWN_MENU_ELEVATION,
  LAYER_Z_INDEX,
  MENU_MODAL_BACKDROP_COLOR,
  getPlaceholderTextColor,
} from '../constants';
import { AnimatedPressable } from './AnimatedPressable';
import { FadeModal } from './FadeModal';
import { RelationshipLinkForm } from './RelationshipLinkForm';
import type { PeopleScreenUiProps } from './types';
import { useAnchoredMenu } from './useAnchoredMenu';
import { formatLocalDateTime } from '../timestamps';


interface PersonDetailPanelProps {
  model: Pick<
    UsePeopleScreenModelResult,
    | 'selectedPerson'
    | 'onBackFromPersonDetailPress'
    | 'isPersonNameEditMode'
    | 'editingPersonName'
    | 'setEditingPersonName'
    | 'onSaveEditedPersonNamePress'
    | 'isEditingPersonName'
    | 'canSaveEditedPersonName'
    | 'onCancelEditPersonNamePress'
    | 'onStartEditPersonNamePress'
    | 'isDeletingPerson'
    | 'newNoteContent'
    | 'setNewNoteContent'
    | 'onSubmitNewNotePress'
    | 'isLoadingDetails'
    | 'isAddingNote'
    | 'canAddNote'
    | 'timelineNotes'
    | 'editingNoteId'
    | 'editingNoteContent'
    | 'setEditingNoteContent'
    | 'onSaveEditedNotePress'
    | 'isEditingNote'
    | 'canSaveEditedNote'
    | 'onCancelEditNotePress'
    | 'expandedNoteId'
    | 'onToggleNoteExpanded'
    | 'onStartEditNotePress'
    | 'isDeletingNote'
    | 'relationshipSearchTerm'
    | 'setRelationshipSearchTerm'
    | 'setSelectedRelationshipTargetId'
    | 'setRelationshipTypeInput'
    | 'relationshipCandidates'
    | 'hasMoreRelationshipCandidates'
    | 'selectedRelationshipTargetId'
    | 'relationshipTypeInput'
    | 'reverseRelationshipTypeInput'
    | 'setReverseRelationshipTypeInput'
    | 'isCreatingRelationship'
    | 'canSaveRelationship'
    | 'onCreateRelationshipPress'
    | 'relationshipItems'
    | 'onPersonPress'
    | 'onStartEditRelationshipPress'
    | 'onCancelEditRelationshipPress'
    | 'onSelectRelationshipCandidatePress'
    | 'editingRelationshipId'
    | 'isDeletingRelationship'
  >;
  ui: Pick<
    PeopleScreenUiProps,
    | 'theme'
    | 'themeMode'
    | 'keyboardLift'
    | 'personDetailScrollRef'
    | 'addNoteSectionOffsetYRef'
    | 'notesSectionOffsetYRef'
    | 'relationshipSectionOffsetYRef'
    | 'relationshipSearchInputRowOffsetYRef'
    | 'onFocusPersonDetailSection'
    | 'noteInputMinHeight'
    | 'newNoteInputHeight'
    | 'setNewNoteInputHeight'
    | 'editNoteInputHeight'
    | 'setEditNoteInputHeight'
    | 'isPersonActionsMenuOpen'
    | 'setIsPersonActionsMenuOpen'
    | 'onConfirmDeletePersonPress'
    | 'onConfirmDeleteNotePress'
    | 'hasRelationshipSearchTerm'
    | 'expandedRelationshipId'
    | 'setExpandedRelationshipId'
    | 'onConfirmDeleteRelationshipPress'
  >;
}

const PERSON_ACTIONS_MENU_WIDTH = 160;
const PERSON_ACTIONS_MENU_MARGIN = 8;
const PERSON_ACTIONS_MENU_TOP_OFFSET = 6;
const EDIT_NOTE_FOCUS_SCROLL_OFFSET = 120;

export function PersonDetailPanel({ model, ui }: PersonDetailPanelProps) {
  if (!model.selectedPerson) {
    return null;
  }

  const {
    closeMenu: closePersonActionsMenu,
    toggleMenu: togglePersonActionsMenu,
    onTriggerLayout: onActionsTriggerLayout,
    menuLeft,
    menuTop,
  } = useAnchoredMenu({
    isOpen: ui.isPersonActionsMenuOpen,
    setIsOpen: ui.setIsPersonActionsMenuOpen,
    menuWidth: PERSON_ACTIONS_MENU_WIDTH,
    menuMargin: PERSON_ACTIONS_MENU_MARGIN,
    menuTopOffset: PERSON_ACTIONS_MENU_TOP_OFFSET,
  });

  const floatingHeaderBaseHeight = model.isPersonNameEditMode ? 100 : 60;
  const floatingHeaderBottomGap = 0;
  const selectedPersonName = model.selectedPerson.name;
  const selectedRelationshipCandidate =
    model.relationshipCandidates.find((candidate) => candidate.id === model.selectedRelationshipTargetId) ?? null;
  const noteOffsetByIdRef = useRef<Map<number, number>>(new Map());
  const relationshipOffsetByIdRef = useRef<Map<number, number>>(new Map());
  const relationshipListRelativeOffsetYRef = useRef(0);
  const relationshipSearchRowRelativeOffsetYRef = useRef(0);

  const updateRelationshipSearchInputOffset = () => {
    ui.relationshipSearchInputRowOffsetYRef.current =
      ui.relationshipSectionOffsetYRef.current + relationshipSearchRowRelativeOffsetYRef.current;
  };

  const resolveRelationshipSearchOffsetY = () =>
    Math.max(
      0,
      ui.relationshipSearchInputRowOffsetYRef.current > 0
        ? ui.relationshipSearchInputRowOffsetYRef.current
        : ui.relationshipSectionOffsetYRef.current + relationshipSearchRowRelativeOffsetYRef.current
    );

  const focusRelationshipSection = () => {
    if (ui.relationshipSearchInputRowOffsetYRef.current > 0) {
      ui.onFocusPersonDetailSection(ui.relationshipSearchInputRowOffsetYRef.current);
    }
  };

  const resolveRelationshipCardOffsetY = (relationshipId: number) =>
    Math.max(
      0,
      ui.relationshipSectionOffsetYRef.current +
        relationshipListRelativeOffsetYRef.current +
        (relationshipOffsetByIdRef.current.get(relationshipId) ?? 0)
    );

  const renderRelationshipCandidateCard = (candidate: PersonListItem, isSelected: boolean) => (
    <View
      key={candidate.id}
      className={`mb-2 overflow-hidden rounded-lg border ${ui.theme.border} ${ui.theme.cardBackground}`}
    >
      <AnimatedPressable
        className={`px-3 py-2 ${isSelected ? ui.theme.selectedChipBackground : ''}`}
        dismissKeyboardOnPress={false}
        onPress={() => {
          model.onSelectRelationshipCandidatePress(isSelected ? null : candidate.id);

          if (!isSelected) {
            focusRelationshipSection();
          }
        }}
      >
        <Text className={isSelected ? 'font-semibold text-white' : ui.theme.primaryText}>{candidate.name}</Text>
        <Text
          className={`mt-0.5 text-xs ${isSelected ? 'text-white' : ui.theme.secondaryText}`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {candidate.first_note_content ?? 'No notes yet'}
        </Text>
      </AnimatedPressable>

      {isSelected ? (
        <View className="px-3 pb-3 pt-3">
          <RelationshipLinkForm
            theme={ui.theme}
            themeMode={ui.themeMode}
            personName={selectedPersonName}
            otherPersonName={candidate.name}
            relationshipType={model.relationshipTypeInput}
            onChangeRelationshipType={model.setRelationshipTypeInput}
            reverseRelationshipType={model.reverseRelationshipTypeInput}
            onChangeReverseRelationshipType={model.setReverseRelationshipTypeInput}
            isSaving={model.isCreatingRelationship}
            canSave={model.canSaveRelationship}
            submitLabel="Link"
            onSubmit={model.onCreateRelationshipPress}
            onCancel={() => model.onSelectRelationshipCandidatePress(null)}
            onInputFocus={focusRelationshipSection}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1">
      <View className={`absolute left-0 right-0 top-0 z-30 px-1 py-1 ${ui.theme.panelBackground}`}>
        {model.isPersonNameEditMode ? (
          <View className="mt-1">
            <TextInput
              value={model.editingPersonName}
              onChangeText={model.setEditingPersonName}
              onSubmitEditing={() => void model.onSaveEditedPersonNamePress()}
              onFocus={() => ui.onFocusPersonDetailSection(0)}
              placeholder="Edit person name"
              placeholderTextColor={getPlaceholderTextColor(ui.themeMode)}
              editable={!model.isEditingPersonName}
              returnKeyType="done"
              className={`rounded-xl border px-3 py-2 ${ui.theme.inputBorder} ${ui.theme.inputBackground} ${ui.theme.inputText}`}
            />
            <View className="mt-2 flex-row gap-2">
              <AnimatedPressable
                accessibilityRole="button"
                disabled={!model.canSaveEditedPersonName || model.isEditingPersonName}
                onPress={() => void model.onSaveEditedPersonNamePress()}
                className="rounded-lg bg-indigo-600 px-3 py-2"
              >
                <Text className="font-semibold text-white">{model.isEditingPersonName ? 'Saving...' : 'Save name'}</Text>
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityRole="button"
                disabled={model.isEditingPersonName}
                onPress={model.onCancelEditPersonNamePress}
                className={`rounded-lg px-3 py-2 ${ui.theme.navButton}`}
              >
                <Text className={`font-semibold ${ui.theme.navButtonText}`}>Cancel</Text>
              </AnimatedPressable>
            </View>
          </View>
        ) : (
          <View className="mt-1 flex-row items-center justify-between gap-2" style={{ zIndex: LAYER_Z_INDEX.headerRow }}>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Back to people"
              onPress={() => {
                if (ui.isPersonActionsMenuOpen) {
                  ui.setIsPersonActionsMenuOpen(false);
                }

                model.onBackFromPersonDetailPress();
              }}
              className={`h-10 w-10 items-center justify-center rounded-lg ${ui.theme.navButton}`}
            >
              <Text className={`font-semibold ${ui.theme.navButtonText}`}>⌂</Text>
            </AnimatedPressable>
            <Pressable
              className="flex-1 flex-row items-center"
              onPress={() => {
                Keyboard.dismiss();

                if (ui.isPersonActionsMenuOpen) {
                  ui.setIsPersonActionsMenuOpen(false);
                }
              }}
            >
              <Text className={`text-2xl ${ui.theme.tertiaryText}`}>{'>'} </Text>
              <Text className={`flex-1 text-2xl font-bold ${ui.theme.headingText}`}>{model.selectedPerson.name}</Text>
            </Pressable>
            <View className="relative" style={{ zIndex: LAYER_Z_INDEX.dropdownTriggerContainer }}>
              <View onLayout={onActionsTriggerLayout}>
                <AnimatedPressable
                  accessibilityRole="button"
                  onPress={togglePersonActionsMenu}
                  className={`h-10 w-10 items-center justify-center rounded-lg ${ui.theme.navButton}`}
                >
                  <Text className={`text-lg font-semibold ${ui.theme.navButtonText}`}>⋮</Text>
                </AnimatedPressable>
              </View>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        ref={ui.personDetailScrollRef}
        style={{ marginTop: floatingHeaderBaseHeight + floatingHeaderBottomGap }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 12 + ui.keyboardLift,
        }}
      >
      <View
        className={`${CARD_CLASS} ${ui.theme.border} ${ui.theme.cardBackground}`}
        onLayout={(event) => {
          ui.addNoteSectionOffsetYRef.current = event.nativeEvent.layout.y;
        }}
      >
        <Text className={`text-sm font-semibold uppercase tracking-wide ${ui.theme.tertiaryText}`}>Add note</Text>
        <View className="mt-2 flex-row items-center gap-2">
          <TextInput
            value={model.newNoteContent}
            onChangeText={model.setNewNoteContent}
            onFocus={() => ui.onFocusPersonDetailSection(ui.addNoteSectionOffsetYRef.current)}
            multiline
            scrollEnabled={false}
            onSubmitEditing={() => void model.onSubmitNewNotePress()}
            onContentSizeChange={(event) => {
              const nextHeight = Math.max(ui.noteInputMinHeight, Math.ceil(event.nativeEvent.contentSize.height));
              ui.setNewNoteInputHeight(nextHeight);
            }}
            placeholder="Write a note"
            placeholderTextColor={getPlaceholderTextColor(ui.themeMode)}
            editable={!model.isLoadingDetails && !model.isAddingNote}
            returnKeyType="default"
            textAlignVertical="center"
            style={{ height: ui.newNoteInputHeight }}
            className={`flex-1 rounded-xl border px-3 py-2 ${ui.theme.inputBorder} ${ui.theme.inputBackground} ${ui.theme.inputText}`}
          />
          <AnimatedPressable
            accessibilityRole="button"
            disabled={!model.canAddNote || model.isAddingNote}
            onPress={model.onSubmitNewNotePress}
            className={`h-11 items-center justify-center rounded-xl px-4 ${
              !model.canAddNote || model.isAddingNote ? 'bg-slate-400' : 'bg-indigo-600'
            }`}
          >
            <Text className="font-semibold text-white">{model.isAddingNote ? 'Saving...' : 'Save'}</Text>
          </AnimatedPressable>
        </View>
      </View>

      <View
        className={`${CARD_WITH_TOP_MARGIN_CLASS} ${ui.theme.border} ${ui.theme.cardBackground}`}
        onLayout={(event) => {
          ui.notesSectionOffsetYRef.current = event.nativeEvent.layout.y;
        }}
      >
        <Text className={`text-sm font-semibold uppercase tracking-wide ${ui.theme.tertiaryText}`}>Notes</Text>
        {model.isLoadingDetails ? (
          <Text className={`mt-2 ${ui.theme.secondaryText}`}>Loading details...</Text>
        ) : model.timelineNotes.length === 0 ? (
          <Text className={`mt-2 ${ui.theme.tertiaryText}`}>No notes yet.</Text>
        ) : (
          <View className="mt-2">
            {model.timelineNotes.map((note) => (
              model.editingNoteId === note.id ? (
                <View
                  className={`mb-2 rounded-lg border px-3 py-3 ${ui.theme.border}`}
                  key={note.id}
                  onLayout={(event) => {
                    noteOffsetByIdRef.current.set(
                      note.id,
                      ui.notesSectionOffsetYRef.current + event.nativeEvent.layout.y
                    );
                  }}
                >
                    <TextInput
                      autoFocus
                      value={model.editingNoteContent}
                      onChangeText={model.setEditingNoteContent}
                      onFocus={() => {
                        const noteOffsetY = noteOffsetByIdRef.current.get(note.id) ?? ui.notesSectionOffsetYRef.current;
                        ui.onFocusPersonDetailSection(Math.max(0, noteOffsetY - EDIT_NOTE_FOCUS_SCROLL_OFFSET));
                      }}
                      multiline
                      scrollEnabled={false}
                      onSubmitEditing={() => void model.onSaveEditedNotePress()}
                      onContentSizeChange={(event) => {
                        const nextHeight = Math.max(ui.noteInputMinHeight, Math.ceil(event.nativeEvent.contentSize.height));
                        ui.setEditNoteInputHeight(nextHeight);
                      }}
                      placeholder="Edit note"
                      placeholderTextColor={getPlaceholderTextColor(ui.themeMode)}
                      editable={!model.isEditingNote}
                      returnKeyType="default"
                      textAlignVertical="top"
                      style={{ minHeight: ui.noteInputMinHeight, height: ui.editNoteInputHeight }}
                      className={`rounded-xl border px-3 py-2 ${ui.theme.inputBorder} ${ui.theme.inputBackground} ${ui.theme.inputText}`}
                    />
                    <View className="mt-2 flex-row gap-2">
                      <AnimatedPressable
                        accessibilityRole="button"
                        disabled={!model.canSaveEditedNote || model.isEditingNote}
                        onPress={model.onSaveEditedNotePress}
                        className={`rounded-lg px-3 py-2 ${
                          !model.canSaveEditedNote || model.isEditingNote ? 'bg-slate-400' : 'bg-indigo-600'
                        }`}
                      >
                        <Text className="font-semibold text-white">{model.isEditingNote ? 'Saving...' : 'Save'}</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        accessibilityRole="button"
                        disabled={model.isEditingNote}
                        onPress={model.onCancelEditNotePress}
                        className={`rounded-lg px-3 py-2 ${ui.theme.navButton}`}
                      >
                        <Text className={`font-semibold ${ui.theme.navButtonText}`}>Cancel</Text>
                      </AnimatedPressable>
                    </View>
                </View>
              ) : (
                <AnimatedPressable
                  key={note.id}
                  onPress={() => model.onToggleNoteExpanded(note.id)}
                  onLayout={(event) => {
                    noteOffsetByIdRef.current.set(
                      note.id,
                      ui.notesSectionOffsetYRef.current + event.nativeEvent.layout.y
                    );
                  }}
                  className={`mb-2 rounded-lg border px-3 py-3 ${ui.theme.border}`}
                >
                  <Text className={ui.theme.primaryText}>{note.content}</Text>
                  {model.expandedNoteId === note.id ? (
                    <View className="mt-1">
                      <Text className={`text-xs ${ui.theme.tertiaryText}`}>
                        Created: {formatLocalDateTime(note.created_at)}
                        {note.updated_at && note.updated_at !== note.created_at
                          ? ` | Last edited: ${formatLocalDateTime(note.updated_at)}`
                          : ''}
                      </Text>
                    </View>
                  ) : null}
                  {model.expandedNoteId === note.id ? (
                    <View className="mt-2 flex-row gap-2">
                      <AnimatedPressable
                        accessibilityRole="button"
                        dismissKeyboardOnPress={false}
                        onPress={() => {
                          const noteOffsetY = noteOffsetByIdRef.current.get(note.id) ?? ui.notesSectionOffsetYRef.current;
                          ui.onFocusPersonDetailSection(Math.max(0, noteOffsetY - EDIT_NOTE_FOCUS_SCROLL_OFFSET));
                          model.onStartEditNotePress(note);
                        }}
                        className={`rounded-lg px-3 py-1.5 ${ui.theme.navButton}`}
                      >
                        <Text className={`font-semibold ${ui.theme.navButtonText}`}>Edit</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        accessibilityRole="button"
                        disabled={model.isDeletingNote}
                        onPress={() => ui.onConfirmDeleteNotePress(note.id)}
                        className="rounded-lg bg-rose-600 px-3 py-1.5"
                      >
                        <Text className="font-semibold text-white">{model.isDeletingNote ? 'Deleting...' : 'Delete'}</Text>
                      </AnimatedPressable>
                    </View>
                  ) : null}
                </AnimatedPressable>
              )
            ))}
          </View>
        )}
      </View>

      <View
        className={`${CARD_WITH_TOP_MARGIN_CLASS} ${ui.theme.border} ${ui.theme.cardBackground}`}
        onLayout={(event) => {
          ui.relationshipSectionOffsetYRef.current = event.nativeEvent.layout.y;
          updateRelationshipSearchInputOffset();
        }}
      >
        <Text className={`text-sm font-semibold uppercase tracking-wide ${ui.theme.tertiaryText}`}>Relationships</Text>
        
        {model.relationshipItems.length === 0 ? null : (
          <View
            className="mt-2"
            onLayout={(event) => {
              relationshipListRelativeOffsetYRef.current = event.nativeEvent.layout.y;
            }}
          >
            {model.relationshipItems.map((item) => {
              const isEditingRelationship = model.editingRelationshipId === item.id;

              return (
                <View
                  key={item.id}
                  className={`mb-2 overflow-hidden rounded-lg border ${ui.theme.border}`}
                  onLayout={(event) => {
                    relationshipOffsetByIdRef.current.set(item.id, event.nativeEvent.layout.y);
                  }}
                >
                  <AnimatedPressable
                    className="px-3 py-2"
                    onPress={() => {
                      ui.setExpandedRelationshipId((current) => (current === item.id ? null : item.id));
                    }}
                  >
                    <Text className={ui.theme.primaryText}>
                      {item.otherPersonName}
                      {item.otherPersonRelationshipType ? ` (${item.otherPersonRelationshipType})` : ''}
                    </Text>
                    {!item.otherPersonRelationshipType && item.selectedPersonRelationshipType ? (
                      <Text className={`mt-0.5 text-xs ${ui.theme.tertiaryText}`}>
                        {`${selectedPersonName} is ${item.otherPersonName}'s ${item.selectedPersonRelationshipType}`}
                      </Text>
                    ) : null}

                    {ui.expandedRelationshipId === item.id && !isEditingRelationship ? (
                      <View className="mt-2 flex-row gap-2">
                        <AnimatedPressable
                          accessibilityRole="button"
                          onPress={() => model.onPersonPress(item.otherPersonId)}
                          className={`rounded-lg px-3 py-1.5 ${ui.theme.navButton}`}
                        >
                          <Text className={`font-semibold ${ui.theme.navButtonText}`}>View</Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                          accessibilityRole="button"
                          dismissKeyboardOnPress={false}
                          onPress={() => {
                            model.onStartEditRelationshipPress(item);
                            ui.onFocusPersonDetailSection(resolveRelationshipCardOffsetY(item.id));
                          }}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5"
                        >
                          <Text className="font-semibold text-white">Edit</Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                          accessibilityRole="button"
                          disabled={model.isDeletingRelationship}
                          onPress={() => ui.onConfirmDeleteRelationshipPress(item.id)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5"
                        >
                          <Text className="font-semibold text-white">
                            {model.isDeletingRelationship ? 'Deleting...' : 'Delete'}
                          </Text>
                        </AnimatedPressable>
                      </View>
                    ) : null}
                  </AnimatedPressable>

                  {isEditingRelationship ? (
                    <View className="px-3 pb-3">
                      <RelationshipLinkForm
                        theme={ui.theme}
                        themeMode={ui.themeMode}
                        personName={selectedPersonName}
                        otherPersonName={item.otherPersonName}
                        relationshipType={model.relationshipTypeInput}
                        onChangeRelationshipType={model.setRelationshipTypeInput}
                        reverseRelationshipType={model.reverseRelationshipTypeInput}
                        onChangeReverseRelationshipType={model.setReverseRelationshipTypeInput}
                        isSaving={model.isCreatingRelationship}
                        canSave={model.canSaveRelationship}
                        submitLabel="Save"
                        onSubmit={() => {
                          ui.setExpandedRelationshipId(null);
                          void model.onCreateRelationshipPress();
                        }}
                        onCancel={() => {
                          ui.setExpandedRelationshipId(null);
                          model.onCancelEditRelationshipPress();
                        }}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {model.editingRelationshipId === null ? (
          <>
            <View
              className="mt-2 flex-row gap-2"
              onLayout={(event) => {
                relationshipSearchRowRelativeOffsetYRef.current = event.nativeEvent.layout.y;
                updateRelationshipSearchInputOffset();
              }}
            >
              <TextInput
                value={model.relationshipSearchTerm}
                onChangeText={model.setRelationshipSearchTerm}
                onFocus={() => {
                  ui.onFocusPersonDetailSection(resolveRelationshipSearchOffsetY());

                  // Re-align once layout settles after the results list appears.
                  requestAnimationFrame(() => {
                    ui.onFocusPersonDetailSection(resolveRelationshipSearchOffsetY());
                  });
                }}
                placeholder="Search people to link"
                placeholderTextColor={getPlaceholderTextColor(ui.themeMode)}
                className={`flex-1 rounded-xl border px-3 py-2 ${ui.theme.inputBorder} ${ui.theme.inputBackground} ${ui.theme.inputText}`}
              />
              <AnimatedPressable
                accessibilityRole="button"
                onPress={() => {
                  model.setRelationshipSearchTerm('');
                  model.onSelectRelationshipCandidatePress(null);
                }}
                disabled={!ui.hasRelationshipSearchTerm}
                className={`h-11 items-center justify-center rounded-xl px-3 ${
                  !ui.hasRelationshipSearchTerm ? 'bg-slate-400' : ui.theme.navButton
                }`}
              >
                <Text className={`font-semibold ${ui.theme.navButtonText}`}>Clear</Text>
              </AnimatedPressable>
            </View>

            {ui.hasRelationshipSearchTerm ? (
              <View className={`mt-2 rounded-xl border p-2 ${ui.theme.border} ${ui.theme.inputBackground}`}>
                <Text className={`mb-2 text-xs font-semibold uppercase tracking-wide ${ui.theme.tertiaryText}`}>
                  Search Results
                </Text>
                {selectedRelationshipCandidate ? (
                  renderRelationshipCandidateCard(selectedRelationshipCandidate, true)
                ) : (
                  <>
                    <ScrollView
                      className="max-h-40"
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator
                    >
                      {model.relationshipCandidates.length === 0 ? (
                        <Text className={`${ui.theme.tertiaryText}`}>No matching people.</Text>
                      ) : (
                        model.relationshipCandidates.map((candidate) =>
                          renderRelationshipCandidateCard(candidate, false)
                        )
                      )}
                    </ScrollView>

                    {model.hasMoreRelationshipCandidates ? (
                      <Text className={`mt-2 text-xs ${ui.theme.tertiaryText}`}>
                        {`Showing the first ${MAX_RELATIONSHIP_CANDIDATE_RESULTS} matches. Keep typing to narrow the list.`}
                      </Text>
                    ) : null}
                  </>
                )}
              </View>
            ) : null}
          </>
        ) : null}
      </View>

        {model.isDeletingPerson ? <Text className={`mt-4 text-sm ${ui.theme.tertiaryText}`}>Deleting person...</Text> : null}
      </ScrollView>

      <FadeModal
        visible={ui.isPersonActionsMenuOpen}
        backdropColor={MENU_MODAL_BACKDROP_COLOR[ui.themeMode]}
        backdropAccessibilityLabel="Close person actions menu"
        onRequestClose={closePersonActionsMenu}
      >
        <View pointerEvents="box-none" className="flex-1">
          <View
            className={`absolute rounded-lg border ${ui.theme.border} ${ui.theme.cardBackground}`}
            style={{
              left: menuLeft,
              top: menuTop,
              width: PERSON_ACTIONS_MENU_WIDTH,
              zIndex: LAYER_Z_INDEX.dropdownMenu,
              elevation: DROPDOWN_MENU_ELEVATION,
            }}
          >
            <AnimatedPressable
              accessibilityRole="button"
              onPress={() => {
                closePersonActionsMenu();
                model.onStartEditPersonNamePress();
              }}
              className="px-3 py-2"
            >
              <Text className={ui.theme.primaryText}>Edit name</Text>
            </AnimatedPressable>
            <View className={`border-t ${ui.theme.border}`} />
            <AnimatedPressable
              accessibilityRole="button"
              disabled={model.isDeletingPerson}
              onPress={() => {
                closePersonActionsMenu();
                ui.onConfirmDeletePersonPress();
              }}
              className="px-3 py-2"
            >
              <Text className="text-rose-600">Delete person</Text>
            </AnimatedPressable>
          </View>
        </View>
      </FadeModal>
    </View>
  );
}
