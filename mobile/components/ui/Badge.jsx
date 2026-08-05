import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../constants/theme';

const badgeStyles = {
  pending: { bg: '#FEF3C7', color: '#D97706' },
  accepted: { bg: '#DBEAFE', color: '#2563EB' },
  preparing: { bg: '#E0E7FF', color: '#4F46E5' },
  ready: { bg: '#DCFCE7', color: '#16A34A' },
  completed: { bg: '#DCFCE7', color: '#16A34A' },
  rejected: { bg: '#FEE2E2', color: '#DC2626' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626' },
};

export default function Badge({ status, style }) {
  const s = badgeStyles[status?.toLowerCase()] || badgeStyles.pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }, style]}>
      <Text style={[styles.text, { color: s.color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  text: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
