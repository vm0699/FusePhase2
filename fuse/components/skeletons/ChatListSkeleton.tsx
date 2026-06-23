/**
 * ChatListSkeleton — placeholder rows for ChatListScreen while chats load.
 * Mirrors the real row layout (avatar + name line + preview line + badge).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui';
import { theme } from '../../app/theme';

function Row() {
  return (
    <View style={styles.row}>
      <Skeleton width={50} height={50} circle />
      <View style={styles.middle}>
        <Skeleton width="55%" height={15} radius={7} />
        <Skeleton width="78%" height={12} radius={6} style={styles.line2} />
      </View>
      <Skeleton width={62} height={22} radius={11} />
    </View>
  );
}

export default function ChatListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <Row key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 14,
    marginBottom: theme.spacing.md,
    ...theme.shadows.subtle,
  },
  middle: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  line2: {
    marginTop: 8,
  },
});
