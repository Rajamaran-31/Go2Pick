import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../constants/theme';

export default function Card({ children, style, padded = true }) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.md },
  padded: { padding: spacing.base },
});
