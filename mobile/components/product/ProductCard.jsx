import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../constants/theme';

export default function ProductCard({ product, onPress, onAddToCart, style }) {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit || 'piece'}</Text>
        <View style={styles.bottom}>
          <Text style={styles.price}>₹{product.price}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={onAddToCart} activeOpacity={0.7}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {product.stock <= 0 && (
        <View style={styles.outOfStock}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.sm, overflow: 'hidden', flex: 1, margin: spacing.xs },
  image: { width: '100%', height: 120, backgroundColor: colors.surfaceHover },
  info: { padding: spacing.md },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  unit: { fontSize: fontSize.xs, color: colors.textLight, marginBottom: spacing.sm },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: fontSize.lg, fontWeight: '800', color: colors.accent },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  outOfStock: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  outOfStockText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.error },
});
