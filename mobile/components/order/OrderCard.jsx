import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Badge from '../ui/Badge';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../constants/theme';

export default function OrderCard({ order, onPress }) {
  const itemCount = order.items?.length || order.items_count || 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.shopName}>{order.shop_name}</Text>
        <Badge status={order.status} />
      </View>
      <View style={styles.details}>
        <Text style={styles.detail}>{itemCount} item{itemCount !== 1 ? 's' : ''} • ₹{order.total}</Text>
        <Text style={styles.date}>{order.pickup_date} at {order.pickup_time}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.orderId}>#{typeof order.id === 'string' ? order.id.slice(-6) : order.id}</Text>
        <Text style={styles.viewBtn}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, ...shadows.sm, marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  shopName: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  details: { marginBottom: spacing.md },
  detail: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '600' },
  date: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  orderId: { fontSize: fontSize.sm, color: colors.textLight, fontFamily: 'monospace' },
  viewBtn: { fontSize: fontSize.sm, fontWeight: '600', color: colors.accent },
});
