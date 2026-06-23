/**
 * ScreenHeader — standardized screen title block.
 *
 * Consolidates the per-screen header pattern (big title + optional subtitle,
 * optional back button and right-side action). Purely presentational.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '../../app/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
};

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  align = 'left',
  style,
}: ScreenHeaderProps) {
  const centered = align === 'center';

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={theme.colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        ) : (
          centered && <View style={styles.backBtn} />
        )}

        <View style={[styles.titleWrap, centered && styles.titleWrapCentered]}>
          <Text style={[styles.title, centered && styles.centerText]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {right ? (
          <View style={styles.right}>{right}</View>
        ) : (
          centered && <View style={styles.backBtn} />
        )}
      </View>

      {!!subtitle && (
        <Text style={[styles.subtitle, centered && styles.centerText]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  titleWrap: {
    flex: 1,
  },
  titleWrapCentered: {
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  right: {
    marginLeft: theme.spacing.sm,
  },
  centerText: {
    textAlign: 'center',
  },
});
