import { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import { PeopleListPanel } from './view/PeopleListPanel';
import { PersonDetailPanel } from './view/PersonDetailPanel';
import { ScreenHeader } from './view/ScreenHeader';
import { SettingsPanel } from './view/SettingsPanel';
import { AnimatedPressable } from './view/AnimatedPressable';
import { FadeModal } from './view/FadeModal';
import { PAGE_TRANSITION, SETTINGS_MODAL_BACKDROP_COLOR } from './constants';
import type { PeopleScreenViewProps } from './view/types';

export function PeopleScreenView({ model, ui }: PeopleScreenViewProps) {
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageKey = model.selectedPerson ? 'detail' : 'list';

  useEffect(() => {
    pageFadeAnim.stopAnimation();
    pageFadeAnim.setValue(PAGE_TRANSITION.fadeStartOpacity);

    let animation: Animated.CompositeAnimation | null = null;
    const frameId = requestAnimationFrame(() => {
      animation = Animated.timing(pageFadeAnim, {
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
  }, [pageKey, pageFadeAnim]);

  return (
    <View className="relative flex-1">
      <ScreenHeader ui={ui} />

      <View className={`flex-1 rounded-2xl p-3 ${ui.theme.panelBackground}`}>
        <Animated.View key={pageKey} style={{ flex: 1, opacity: pageFadeAnim }}>
          {!model.selectedPerson ? <PeopleListPanel model={model} ui={ui} /> : <PersonDetailPanel model={model} ui={ui} />}

          {model.error ? <Text className="mb-2 mt-2 text-red-700">Error: {model.error}</Text> : null}
        </Animated.View>
      </View>

      <FadeModal
        visible={ui.viewMode === 'settings'}
        statusBarTranslucent
        backdropColor={SETTINGS_MODAL_BACKDROP_COLOR[ui.themeMode]}
        backdropAccessibilityLabel="Close settings"
        onRequestClose={() => ui.setViewMode('people')}
      >
        <View pointerEvents="box-none" className="flex-1 items-center justify-center">
          <View className={`h-[80%] w-[96%] overflow-hidden rounded-2xl border ${ui.theme.border} ${ui.theme.panelBackground}`}>
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
