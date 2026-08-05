import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

const defaultCategoryImages = {
  'Bakery': 'http://localhost:8000/static/bakery.jpg',
  'Electronics': 'http://localhost:8000/static/electronics.jpg',
  'Grocery': 'http://localhost:8000/static/grocery.jpg',
  'Groceries': 'http://localhost:8000/static/grocery.jpg',
  'Home': 'http://localhost:8000/static/home.jpg',
  'Pharmacy': 'http://localhost:8000/static/pharmacy.jpg',
  'Ready to Eat': 'http://localhost:8000/static/ready_to_eat.jpg'
};

export default function CategoryCard({ category, onPress, style }) {
  const imageUrl = category.image || defaultCategoryImages[category.name] || defaultCategoryImages['Grocery'];
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
      <Text style={styles.count}>{category.shop_count || 0} shops</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', marginRight: spacing.base },
  image: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.surfaceHover, marginBottom: spacing.xs },
  name: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  count: { fontSize: fontSize.xs, color: colors.textLight },
});
