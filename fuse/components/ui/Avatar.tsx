/**
 * Avatar — image with graceful initials fallback.
 *
 * Extracted from the ChatList avatar pattern (brandSoft bg + brand initial,
 * soft brand border). Falls back to initials when there is no photo or the
 * image fails to load.
 */
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import { theme } from '../../app/theme';

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

function initialOf(name?: string | null): string {
  const trimmed = (name || '').trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : '?';
}

export default function Avatar({ uri, name, size = 50, style }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const showImage = !!uri && !failed;
  const radius = size / 2;

  if (showImage) {
    return (
      <Image
        source={{ uri: uri as string }}
        onError={() => setFailed(true)}
        style={[
          { width: size, height: size, borderRadius: radius, backgroundColor: theme.colors.surfaceSunken },
          style as StyleProp<ImageStyle>,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.36 }]}>{initialOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: theme.colors.brandSofter,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  initial: {
    color: theme.colors.brand,
    fontFamily: theme.fontFamily.bold,
  },
});
