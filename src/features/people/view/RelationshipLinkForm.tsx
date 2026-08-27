import { Text, TextInput, View } from 'react-native';
import { getPlaceholderTextColor } from '../constants';
import { AnimatedPressable } from './AnimatedPressable';
import type { ThemeMode, ThemeTokens } from './types';

interface RelationshipLinkFormProps {
  theme: ThemeTokens;
  themeMode: ThemeMode;
  personName: string;
  otherPersonName: string;
  relationshipType: string;
  onChangeRelationshipType: (value: string) => void;
  reverseRelationshipType: string;
  onChangeReverseRelationshipType: (value: string) => void;
  isSaving: boolean;
  canSave: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel?: () => void;
  onInputFocus?: () => void;
}

export function RelationshipLinkForm({
  theme,
  themeMode,
  personName,
  otherPersonName,
  relationshipType,
  onChangeRelationshipType,
  reverseRelationshipType,
  onChangeReverseRelationshipType,
  isSaving,
  canSave,
  submitLabel,
  onSubmit,
  onCancel,
  onInputFocus,
}: RelationshipLinkFormProps) {
  const isSubmitDisabled = !canSave || isSaving;
  const inputClassName = `mt-1 rounded-xl border px-3 py-2 ${theme.inputBorder} ${theme.inputBackground} ${theme.inputText}`;

  return (
    <View>
      <Text className={`text-xs ${theme.tertiaryText}`}>{`${otherPersonName} is ${personName}'s`}</Text>
      <TextInput
        autoFocus
        value={relationshipType}
        onChangeText={onChangeRelationshipType}
        onFocus={onInputFocus}
        placeholder="Relationship type (optional)"
        placeholderTextColor={getPlaceholderTextColor(themeMode)}
        editable={!isSaving}
        returnKeyType="next"
        className={inputClassName}
      />

      <Text className={`mt-3 text-xs ${theme.tertiaryText}`}>{`${personName} is ${otherPersonName}'s`}</Text>
      <TextInput
        value={reverseRelationshipType}
        onChangeText={onChangeReverseRelationshipType}
        onFocus={onInputFocus}
        onSubmitEditing={onSubmit}
        placeholder="Relationship type (optional)"
        placeholderTextColor={getPlaceholderTextColor(themeMode)}
        editable={!isSaving}
        returnKeyType="done"
        className={inputClassName}
      />

      <View className="mt-3 flex-row gap-2">
        <AnimatedPressable
          accessibilityRole="button"
          disabled={isSubmitDisabled}
          onPress={onSubmit}
          className={`h-11 flex-1 items-center justify-center rounded-xl px-4 ${
            isSubmitDisabled ? 'bg-slate-400' : 'bg-teal-600'
          }`}
        >
          <Text className="font-semibold text-white">{isSaving ? 'Saving...' : submitLabel}</Text>
        </AnimatedPressable>

        {onCancel ? (
          <AnimatedPressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={onCancel}
            className={`h-11 items-center justify-center rounded-xl px-4 ${theme.navButton}`}
          >
            <Text className={`font-semibold ${theme.navButtonText}`}>Cancel</Text>
          </AnimatedPressable>
        ) : null}
      </View>
    </View>
  );
}
