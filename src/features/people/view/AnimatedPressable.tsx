import { cssInterop } from 'nativewind';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PRESSABLE_ANIMATION } from '../constants';

// react-native-web's Animated wrapper drops className, so resolve it into the style prop instead.
if (Platform.OS === 'web') {
  cssInterop(Animated.View, { className: 'style' });
}

interface AnimatedPressableProps extends PressableProps {
  className?: string;
  /** Set false for controls that immediately focus another input. */
  dismissKeyboardOnPress?: boolean;
}

type PressableStyle = AnimatedPressableProps['style'];

function resolveStyle(style: PressableStyle, state: PressableStateCallbackType): StyleProp<ViewStyle> {
  if (typeof style === 'function') {
    return style(state);
  }

  return style as StyleProp<ViewStyle>;
}

export function AnimatedPressable({
  disabled = false,
  dismissKeyboardOnPress = true,
  onPress,
  onPressIn,
  onPressOut,
  style,
  className,
  children,
  ...props
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const disabledRef = useRef(disabled);
  const opacity = useRef(
    new Animated.Value(disabled ? PRESSABLE_ANIMATION.disabledRestOpacity : PRESSABLE_ANIMATION.enabledRestOpacity)
  ).current;

  disabledRef.current = disabled;

  useEffect(() => {
    opacity.stopAnimation();
    scale.stopAnimation();

    Animated.timing(opacity, {
      toValue: disabled ? PRESSABLE_ANIMATION.disabledRestOpacity : PRESSABLE_ANIMATION.enabledRestOpacity,
      duration: PRESSABLE_ANIMATION.settleDurationMs,
      useNativeDriver: true,
    }).start();

    Animated.spring(scale, {
      toValue: 1,
      speed: PRESSABLE_ANIMATION.pressOutSpringSpeed,
      bounciness: PRESSABLE_ANIMATION.pressOutBounciness,
      useNativeDriver: true,
    }).start();
  }, [disabled, opacity]);

  const animatedStyle = useMemo(
    () => ({
      opacity,
      transform: [{ scale }],
    }),
    [opacity, scale]
  );

  const handlePressIn = (event: GestureResponderEvent) => {
    const isDisabled = disabledRef.current;

    opacity.stopAnimation();
    scale.stopAnimation();

    Animated.parallel([
      Animated.spring(scale, {
        toValue: PRESSABLE_ANIMATION.pressedScale,
        speed: PRESSABLE_ANIMATION.pressInSpringSpeed,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isDisabled ? PRESSABLE_ANIMATION.disabledPressedOpacity : PRESSABLE_ANIMATION.enabledPressedOpacity,
        duration: PRESSABLE_ANIMATION.pressDurationMs,
        useNativeDriver: true,
      }),
    ]).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    const isDisabled = disabledRef.current;

    opacity.stopAnimation();
    scale.stopAnimation();

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: PRESSABLE_ANIMATION.pressOutSpringSpeed,
        bounciness: PRESSABLE_ANIMATION.pressOutBounciness,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isDisabled ? PRESSABLE_ANIMATION.disabledRestOpacity : PRESSABLE_ANIMATION.enabledRestOpacity,
        duration: PRESSABLE_ANIMATION.pressDurationMs,
        useNativeDriver: true,
      }),
    ]).start();

    onPressOut?.(event);
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (dismissKeyboardOnPress) {
      Keyboard.dismiss();
    }

    onPress?.(event);
  };

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={undefined}
    >
      {(state) => (
        <Animated.View className={className} style={[resolveStyle(style, state), animatedStyle]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
