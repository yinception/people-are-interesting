import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { MODAL_FADE_TRANSITION, type ModalFadeEasingPreset } from '../constants';

interface FadeModalProps {
  visible: boolean;
  onRequestClose: () => void;
  backdropColor?: string;
  backdropAccessibilityLabel?: string;
  statusBarTranslucent?: boolean;
  children: ReactNode;
}

function resolveEasing(preset: ModalFadeEasingPreset) {
  switch (preset) {
    case 'snappy':
      return Easing.bezier(0.22, 1, 0.36, 1);
    case 'linear':
      return Easing.linear;
    default:
      return Easing.cubic;
  }
}

export function FadeModal({
  visible,
  onRequestClose,
  backdropColor,
  backdropAccessibilityLabel,
  statusBarTranslucent = false,
  children,
}: FadeModalProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const opacity = useRef(new Animated.Value(visible ? 1 : MODAL_FADE_TRANSITION.initialOpacity)).current;
  const easing = resolveEasing(MODAL_FADE_TRANSITION.easingPreset);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    let frameId = 0;

    if (visible) {
      setShouldRender(true);
      frameId = requestAnimationFrame(() => {
        opacity.stopAnimation();
        animation = Animated.timing(opacity, {
          toValue: 1,
          duration: MODAL_FADE_TRANSITION.fadeInDurationMs,
          easing: Easing.out(easing),
          useNativeDriver: true,
        });

        animation.start();
      });

      return () => {
        cancelAnimationFrame(frameId);
        animation?.stop();
      };
    }

    if (!shouldRender) {
      return;
    }

    opacity.stopAnimation();
    animation = Animated.timing(opacity, {
      toValue: MODAL_FADE_TRANSITION.initialOpacity,
      duration: MODAL_FADE_TRANSITION.fadeOutDurationMs,
      easing: Easing.in(easing),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });

    return () => {
      animation?.stop();
    };
  }, [easing, opacity, shouldRender, visible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={onRequestClose}
    >
      <View style={styles.root}>
        {backdropColor ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backdropAccessibilityLabel ?? 'Close dialog'}
            onPress={onRequestClose}
            style={StyleSheet.absoluteFill}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: backdropColor,
                  opacity,
                },
              ]}
            />
          </Pressable>
        ) : null}

        <Animated.View pointerEvents="box-none" style={{ flex: 1, opacity }}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
