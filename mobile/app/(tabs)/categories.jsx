import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../constants/theme';
import { categoryAPI } from '../../services/api';

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryAPI.list()
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setCategories(res.data);
        } else if (res.data?.categories && Array.isArray(res.data.categories)) {
          setCategories(res.data.categories);
        }
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  const renderItem = ({ item }) => {
    const defaultCategoryImages = {
      'Bakery': 'http://localhost:8000/static/bakery.jpg',
      'Electronics': 'http://localhost:8000/static/electronics.jpg',
      'Grocery': 'http://localhost:8000/static/grocery.jpg',
      'Groceries': 'http://localhost:8000/static/grocery.jpg',
      'Home': 'http://localhost:8000/static/home.jpg',
      'Pharmacy': 'http://localhost:8000/static/pharmacy.jpg',
      'Ready to Eat': 'http://localhost:8000/static/ready_to_eat.jpg'
    };
    const imageUrl = item.image || defaultCategoryImages[item.name] || defaultCategoryImages['Grocery'];
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/shops?category=${item.name}`)} activeOpacity={0.85}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        </View>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCount}>{item.shop_count || 0} shops</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Categories</Text>
      <FlatList data={categories} renderItem={renderItem} keyExtractor={i => i.id} numColumns={2} contentContainerStyle={styles.grid} columnWrapperStyle={styles.row} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, padding: spacing.base, paddingBottom: spacing.sm },
  grid: { paddingHorizontal: spacing.sm },
  row: { gap: spacing.sm },
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.sm, ...shadows.sm },
  imageContainer: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', backgroundColor: colors.surfaceHover, marginBottom: spacing.sm },
  image: { width: '100%', height: '100%' },
  cardName: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  cardCount: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
});
