/**
 * Card — consistent white surface with rounded corners + elevation.
 *
 * Consolidates the repeated white-card style (rounded surface + subtle shadow)
 * used for list rows and content blocks. Becomes pressable when `onPress` is set,
 * with a subtle press-scale micro-interaction.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
  type PressableProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { theme, type ShadowKey } from '../../app/theme';

type CardProps = {
  children: React.ReactNode;
  onPress?: PressableProps['onPress'];
  elevation?: ShadowKey;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Card({
  children,
  onPress,
  elevation = 'subtle',
  padded = true,
  style,
}: CardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const baseStyle: StyleProp<ViewStyle> = [
    styles.card,
    theme.shadows[elevation],
    padded && styles.padded,
    style,
  ];

  if (!onPress) {
    return <View style={baseStyle}>{children}</View>;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withTiming(0.98, { duration: 90 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
      style={[baseStyle, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
  },
  padded: {
    padding: 14,
  },
});
