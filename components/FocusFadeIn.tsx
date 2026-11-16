import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useRef, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fades/slides content in whenever its tab becomes focused by switching tabs.
 * It deliberately does NOT animate when the tabs are merely covered by (or
 * revealed from under) a root stack screen such as a modal.
 */
export function FocusFadeIn({
  children,
  delay = 0,
  duration = 300,
  distance = 16,
  style,
}: Props) {
  const navigation = useNavigation();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);
  const coveredByStackRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (coveredByStackRef.current) {
        // Returning from a stack screen: content was left visible, keep it.
        coveredByStackRef.current = false;
        cancelAnimation(opacity);
        cancelAnimation(translateY);
        opacity.value = 1;
        translateY.value = 0;
      } else {
        opacity.value = 0;
        translateY.value = distance;
        opacity.value = withDelay(delay, withTiming(1, { duration }));
        translateY.value = withDelay(
          delay,
          withTiming(0, { duration, easing: Easing.out(Easing.cubic) }),
        );
      }

      return () => {
        // If the tabs route itself is no longer focused in the parent stack,
        // a stack screen (modal) is covering us — leave everything as-is.
        const stackNavigation = navigation.getParent();
        const tabsStillFocused = stackNavigation ? stackNavigation.isFocused() : true;

        if (!tabsStillFocused) {
          coveredByStackRef.current = true;
          return;
        }

        // Normal tab switch: re-arm the hidden start state for the next visit.
        cancelAnimation(opacity);
        cancelAnimation(translateY);
        opacity.value = withTiming(0, { duration: 90 });
        translateY.value = distance;
      };
    }, [delay, distance, duration, navigation, opacity, translateY]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
