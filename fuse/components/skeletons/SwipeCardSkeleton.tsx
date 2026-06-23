/**
 * SwipeCardSkeleton — full-bleed placeholder for the swipe deck's first load.
 * Approximates the hero photo card + name/meta lines + action buttons row.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui';
import { theme } from '../../app/theme';

const { width } = Dimensions.get('window');

export default function SwipeCardSkeleton() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Skeleton width="100%" height="100%" radius={theme.radii.xl} />
        <View style={styles.overlay}>
          <Skeleton width="60%" height={26} radius={9} />
          <Skeleton width="40%" height={16} radius={7} style={styles.metaLine} />
          <View style={styles.chips}>
            <Skeleton width={84} height={28} radius={14} />
            <Skeleton width={108} height={28} radius={14} style={styles.chipGap} />
            <Skeleton width={72} height={28} radius={14} style={styles.chipGap} />
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Skeleton width={58} height={58} circle />
        <Skeleton width={66} height={66} circle style={styles.actionGap} />
        <Skeleton width={58} height={58} circle style={styles.actionGap} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.lg,
  },
  card: {
    width: width - theme.spacing.gutter * 2,
    flex: 1,
    maxHeight: 560,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 22,
  },
  metaLine: {
    marginTop: 10,
  },
  chips: {
    flexDirection: 'row',
    marginTop: 16,
  },
  chipGap: {
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  actionGap: {
    marginLeft: theme.spacing.xl,
  },
});
