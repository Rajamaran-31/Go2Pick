import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../constants/theme';

export default function ShopCard({ shop, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: shop.image || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>
        <View style={styles.row}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{shop.category}</Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{shop.rating?.toFixed(1) || '4.0'}</Text>
          </View>
        </View>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={colors.textLight} />
          <Text style={styles.address} numberOfLines={1}>{shop.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.md, marginBottom: spacing.base, padding: spacing.sm, alignItems: 'center' },
  image: { width: 90, height: 90, borderRadius: borderRadius.md, backgroundColor: colors.surfaceHover },
  info: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  categoryBadge: { backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  categoryText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.accentDark },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { fontSize: fontSize.xs, color: colors.textLight, flex: 1 },
});
