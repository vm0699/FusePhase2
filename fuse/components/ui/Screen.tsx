/**
 * Screen — shared safe-area + background wrapper.
 *
 * Generalizes the FuseFieldShell concept into a reusable layout: the cream
 * `bg`, consistent top padding, optional decorative brand orbs, and optional
 * floating-bottom-nav clearance. Opt-in — screens adopt it without changing
 * any of their own logic.
 */
import React from 'react';
import {
  StyleSheet,
  View,
  Platform,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../app/theme';

type ScreenProps = {
  children: React.ReactNode;
  /** Draw soft brand-tinted background orbs (decorative). */
  orbs?: boolean;
  /** Apply default horizontal screen gutter to the content. */
  padded?: boolean;
  /** Add bottom padding so content clears the floating BottomNav. */
  withBottomNav?: boolean;
  /** Respect the top safe-area inset (default true). */
  topInset?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function Screen({
  children,
  orbs = false,
  padded = false,
  withBottomNav = false,
  topInset = true,
  style,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = topInset
    ? Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8)
    : 0;

  return (
    <View style={[styles.screen, style]}>
      {orbs && (
        <>
          <View style={styles.orbOne} pointerEvents="none" />
          <View style={styles.orbTwo} pointerEvents="none" />
        </>
      )}
      <View
        style={[
          styles.content,
          { paddingTop },
          padded && { paddingHorizontal: theme.spacing.screenX },
          withBottomNav && { paddingBottom: theme.spacing.bottomNavSafe },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
  },
  orbOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.orbOne,
    top: -42,
    left: -48,
  },
  orbTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: theme.colors.orbTwo,
    bottom: 120,
    right: -40,
  },
});
