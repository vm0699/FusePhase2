/**
 * Button — the standard CTA primitive.
 *
 * Variants: primary (brand fill) | secondary (surface + border) | ghost (text only).
 * Built-in loading spinner+label, disabled styling, and a subtle press-scale
 * micro-interaction (reanimated). Replaces the repeated TouchableOpacity +
 * activeButton/disabledButton blocks across screens.
 *
 * Logic-only props (onPress/disabled/loading) are passed straight through —
 * this never alters behavior, only presentation.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../app/theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'lg' | 'md';

type ButtonProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  loadingLabel,
  fullWidth = true,
  style,
  textStyle,
  leftIcon,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const isInactive = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    if (isInactive) return;
    scale.value = withTiming(0.97, { duration: 90 });
  };
  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };

  const spinnerColor =
    variant === 'primary' ? theme.colors.onBrand : theme.colors.brand;

  return (
    <AnimatedPressable
      onPress={isInactive ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'primary' && !isInactive && theme.shadows.brand,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style as ViewStyle,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <>
            <ActivityIndicator color={spinnerColor} size="small" />
            <Text style={[styles.text, textForVariant(variant), textStyle]}>
              {loadingLabel ?? label}
            </Text>
          </>
        ) : (
          <>
            {leftIcon}
            <Text style={[styles.text, textForVariant(variant), textStyle]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

function textForVariant(variant: Variant): TextStyle {
  if (variant === 'primary') return { color: theme.colors.onBrand };
  return { color: theme.colors.brand };
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  lg: { paddingVertical: 17, paddingHorizontal: 24 },
  md: { paddingVertical: 13, paddingHorizontal: 20 },
  primary: { backgroundColor: theme.colors.brand },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.brandBorder,
  },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 17,
    lineHeight: 22,
  },
});
