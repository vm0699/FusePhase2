/**
 * Skeleton — the single shimmer primitive everything else composes.
 *
 * A base-colored block with a soft highlight that sweeps across horizontally,
 * driven by react-native-reanimated. Subtle & premium (no flashing).
 *
 * Usage:
 *   <Skeleton width={120} height={16} radius={8} />
 *   <Skeleton width={50} height={50} circle />
 *   <Skeleton width="100%" height={200} radius={20} />
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { theme } from '../../app/theme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  circle?: boolean;
  style?: ViewStyle | ViewStyle[];
};

const SHIMMER_WIDTH = 140;

export default function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  circle = false,
  style,
}: SkeletonProps) {
  const progress = useSharedValue(0);
  const [boxWidth, setBoxWidth] = React.useState(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [progress]);

  const computedRadius = circle
    ? typeof height === 'number'
      ? height / 2
      : 999
    : radius;

  const animatedStyle = useAnimatedStyle(() => {
    const travel = boxWidth + SHIMMER_WIDTH;
    const translateX = interpolate(progress.value, [0, 1], [-SHIMMER_WIDTH, travel]);
    return { transform: [{ translateX }] };
  });

  return (
    <View
      onLayout={(e) => setBoxWidth(e.nativeEvent.layout.width)}
      style={[
        {
          width,
          height,
          borderRadius: computedRadius,
          backgroundColor: theme.colors.skeletonBase,
          overflow: 'hidden',
        },
        style as ViewStyle,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            theme.colors.skeletonHighlight,
            theme.colors.skeletonHighlight,
            'transparent',
          ]}
          locations={[0, 0.4, 0.6, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: SHIMMER_WIDTH, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}
