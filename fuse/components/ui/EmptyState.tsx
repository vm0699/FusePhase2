/**
 * EmptyState — one component for all empty lists / zero-data screens.
 *
 * Soft brand-tinted icon medallion + title + body + optional CTA button.
 * Replaces the blank FlatLists and ad-hoc "No X yet" text blocks.
 */
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { theme } from '../../app/theme';
import Button from './Button';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  message?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function EmptyState({
  icon: Icon,
  title,
  message,
  ctaLabel,
  onCtaPress,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      {Icon && (
        <View style={styles.medallion}>
          <Icon size={30} color={theme.colors.brand} strokeWidth={2} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!ctaLabel && !!onCtaPress && (
        <View style={styles.cta}>
          <Button label={ctaLabel} onPress={onCtaPress} size="md" fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing['4xl'],
  },
  medallion: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.brandSoft,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    maxWidth: 300,
  },
  cta: {
    marginTop: theme.spacing.xl,
  },
});
