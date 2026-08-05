import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../../constants/theme';

export default function EmptyState({ icon = 'cube-outline', title = 'Nothing here yet', message = 'Check back later', style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={48} color={colors.textLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surfaceHover, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.base },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  message: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
});
