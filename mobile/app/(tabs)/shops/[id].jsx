import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../../constants/theme';
import ProductCard from '../../../components/product/ProductCard';
import { shopAPI, productAPI, cartAPI } from '../../../services/api';
import { useCartStore } from '../../../store/cartStore';

export default function ShopDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (id) {
      shopAPI.get(id).then(res => setShop(res.data)).catch(() => {});
      productAPI.list({ shop_id: id }).then(res => setProducts(res.data || [])).catch(() => {});
    }
  }, [id]);

  const handleAddToCart = async (product) => {
    try {
      const res = await cartAPI.add({ product_id: product.id, quantity: 1 });
      addItem(res.data);
      Alert.alert('Added!', `${product.name} added to cart`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to add to cart');
    }
  };

  if (!shop) return <SafeAreaView style={styles.container}><Text style={styles.loading}>Loading...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: shop.image || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800' }} style={styles.coverImage} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}><Text style={styles.categoryText}>{shop.category}</Text></View>
            <View style={styles.ratingBadge}><Ionicons name="star" size={14} color="#F59E0B" /><Text style={styles.ratingText}>{shop.rating?.toFixed(1)}</Text></View>
          </View>
          <View style={styles.detailRow}><Ionicons name="location-outline" size={16} color={colors.textLight} /><Text style={styles.detailText}>{shop.address}</Text></View>
          <View style={styles.detailRow}><Ionicons name="time-outline" size={16} color={colors.textLight} /><Text style={styles.detailText}>{shop.opening_time} - {shop.closing_time}</Text></View>
          {shop.description && <Text style={styles.description}>{shop.description}</Text>}
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.productsTitle}>Products ({products.length})</Text>
          <View style={styles.productsGrid}>
            {products.map(p => (
              <ProductCard key={p.id} product={p} onPress={() => router.push(`/products/${p.id}`)} onAddToCart={() => handleAddToCart(p)} style={{ maxWidth: '48%' }} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { textAlign: 'center', marginTop: 100, color: colors.textLight },
  imageWrap: { position: 'relative' },
  coverImage: { width: '100%', height: 220, backgroundColor: colors.surfaceHover },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  info: { padding: spacing.base },
  shopName: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  categoryBadge: { backgroundColor: colors.successLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categoryText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.accentDark },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.warningLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: fontSize.sm, fontWeight: '700', color: '#D97706' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  detailText: { fontSize: fontSize.md, color: colors.textSecondary },
  description: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.md },
  productsSection: { padding: spacing.base },
  productsTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
