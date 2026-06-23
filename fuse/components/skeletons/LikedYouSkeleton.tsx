/**
 * LikedYouSkeleton — 2-column grid placeholder for LikedYouScreen while likes load.
 * Mirrors the photo card + name/meta lines beneath.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui';
import { theme } from '../../app/theme';

function GridCard() {
  return (
    <View style={styles.cell}>
      <Skeleton width="100%" height={200} radius={theme.radii.lg} />
      <Skeleton width="70%" height={15} radius={7} style={styles.name} />
      <Skeleton width="45%" height={12} radius={6} style={styles.meta} />
    </View>
  );
}

export default function LikedYouSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <GridCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.gutter,
    justifyContent: 'space-between',
  },
  cell: {
    width: '48%',
    marginBottom: theme.spacing.xl,
  },
  name: {
    marginTop: 10,
  },
  meta: {
    marginTop: 7,
  },
});
