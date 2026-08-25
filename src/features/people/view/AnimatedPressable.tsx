import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PRESSABLE_ANIMATION } from '../constants';

interface AnimatedPressableProps extends PressableProps {
  className?: string;
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
  onPressIn,
  onPressOut,
  style,
  className,
  children,
  ...props
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(
    new Animated.Value(disabled ? PRESSABLE_ANIMATION.disabledRestOpacity : PRESSABLE_ANIMATION.enabledRestOpacity)
  ).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: disabled ? PRESSABLE_ANIMATION.disabledRestOpacity : PRESSABLE_ANIMATION.enabledRestOpacity,
      duration: PRESSABLE_ANIMATION.settleDurationMs,
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
    Animated.parallel([
      Animated.spring(scale, {
        toValue: PRESSABLE_ANIMATION.pressedScale,
        speed: PRESSABLE_ANIMATION.pressInSpringSpeed,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: disabled ? PRESSABLE_ANIMATION.disabledPressedOpacity : PRESSABLE_ANIMATION.enabledPressedOpacity,
        duration: PRESSABLE_ANIMATION.pressDurationMs,
        useNativeDriver: true,
      }),
    ]).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: PRESSABLE_ANIMATION.pressOutSpringSpeed,
        bounciness: PRESSABLE_ANIMATION.pressOutBounciness,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: disabled ? PRESSABLE_ANIMATION.disabledPressedOpacity : PRESSABLE_ANIMATION.enabledRestOpacity,
        duration: PRESSABLE_ANIMATION.pressDurationMs,
        useNativeDriver: true,
      }),
    ]).start();

    onPressOut?.(event);
  };

  return (
    <Pressable
      {...props}
      disabled={disabled}
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
