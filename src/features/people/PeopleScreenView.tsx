import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PeopleListPanel } from './view/PeopleListPanel';
import { PersonDetailPanel } from './view/PersonDetailPanel';
import { ScreenHeader } from './view/ScreenHeader';
import { SettingsPanel } from './view/SettingsPanel';
import { AnimatedPressable } from './view/AnimatedPressable';
import { FadeModal } from './view/FadeModal';
import { APP_MAX_WIDTH, PAGE_TRANSITION, SETTINGS_MODAL_BACKDROP_COLOR } from './constants';
import type { PeopleScreenViewProps } from './view/types';

export function PeopleScreenView({ model, ui }: PeopleScreenViewProps) {
  const listFadeAnim = useRef(new Animated.Value(1)).current;
  const detailFadeAnim = useRef(new Animated.Value(0)).current;
  const selectedPersonId = model.selectedPerson?.id ?? null;
  const isPersonDetailVisible = selectedPersonId !== null;

  useEffect(() => {
    const activeFadeAnim = isPersonDetailVisible ? detailFadeAnim : listFadeAnim;
    const inactiveFadeAnim = isPersonDetailVisible ? listFadeAnim : detailFadeAnim;

    activeFadeAnim.stopAnimation();
    inactiveFadeAnim.stopAnimation();
    inactiveFadeAnim.setValue(0);
    activeFadeAnim.setValue(PAGE_TRANSITION.fadeStartOpacity);

    let animation: Animated.CompositeAnimation | null = null;
    const frameId = requestAnimationFrame(() => {
      animation = Animated.timing(activeFadeAnim, {
        toValue: 1,
        duration: PAGE_TRANSITION.fadeDurationMs,
        useNativeDriver: true,
      });

      animation.start();
    });

    return () => {
      cancelAnimationFrame(frameId);
      animation?.stop();
    };
  }, [detailFadeAnim, isPersonDetailVisible, listFadeAnim, selectedPersonId]);

  const errorMessage = model.error ? (
    <Text className="mb-2 mt-2 text-red-700">Error: {model.error}</Text>
  ) : null;

  return (
    <View className="relative flex-1">
      <ScreenHeader ui={ui} />

      <View className={`flex-1 overflow-hidden rounded-2xl ${ui.theme.panelBackground}`}>
        {/* The list stays mounted so its rows and scroll position survive navigation. */}
        <Animated.View
          className="p-3"
          style={[StyleSheet.absoluteFill, { opacity: listFadeAnim }]}
          pointerEvents={isPersonDetailVisible ? 'none' : 'auto'}
        >
          <PeopleListPanel model={model} ui={ui} />

          {errorMessage}
        </Animated.View>

        {isPersonDetailVisible ? (
          <Animated.View className="p-3" style={[StyleSheet.absoluteFill, { opacity: detailFadeAnim }]}>
            <PersonDetailPanel model={model} ui={ui} />

            {errorMessage}
          </Animated.View>
        ) : null}
      </View>

      <FadeModal
        visible={ui.viewMode === 'settings'}
        statusBarTranslucent
        backdropColor={SETTINGS_MODAL_BACKDROP_COLOR[ui.themeMode]}
        backdropAccessibilityLabel="Close settings"
        onRequestClose={() => ui.setViewMode('people')}
      >
        <View pointerEvents="box-none" className="flex-1 items-center justify-center">
          <View
            className={`h-[80%] w-[96%] overflow-hidden rounded-2xl border ${ui.theme.border} ${ui.theme.panelBackground}`}
            style={{ maxWidth: APP_MAX_WIDTH }}
          >
            <View className={`flex-row items-center justify-between border-b px-4 py-3 ${ui.theme.border}`}>
              <Text className={`text-lg font-semibold ${ui.theme.headingText}`}>Settings</Text>

              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Close settings"
                onPress={() => ui.setViewMode('people')}
                className={`h-9 w-9 items-center justify-center rounded-lg ${ui.theme.navButton}`}
              >
                <Text className={`text-lg font-semibold ${ui.theme.navButtonText}`}>✕</Text>
              </AnimatedPressable>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 12, paddingBottom: 20 }}>
              <SettingsPanel model={model} ui={ui} />
            </ScrollView>
          </View>
        </View>
      </FadeModal>
    </View>
  );
}
