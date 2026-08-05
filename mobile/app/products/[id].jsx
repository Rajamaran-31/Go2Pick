import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { productAPI, cartAPI } from '../../services/api';
import { useCartStore } from '../../store/cartStore';

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (id) productAPI.get(id).then(res => setProduct(res.data)).catch(() => {});
  }, [id]);

  const handleAdd = async () => {
    try {
      const res = await cartAPI.add({ product_id: product.id, quantity: qty });
      addItem(res.data);
      Alert.alert('Added!', `${product.name} added to cart`, [{ text: 'Continue Shopping', onPress: () => router.back() }, { text: 'Go to Cart', onPress: () => router.push('/(tabs)/cart') }]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to add');
    }
  };

  if (!product) return <SafeAreaView style={styles.container}><Text style={{ textAlign: 'center', marginTop: 100, color: colors.textLight }}>Loading...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600' }} style={styles.image} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.unit}>per {product.unit || 'piece'}</Text>
          {product.shop_name && <TouchableOpacity style={styles.shopRow}><Ionicons name="storefront-outline" size={16} color={colors.accent} /><Text style={styles.shopLink}>{product.shop_name}</Text></TouchableOpacity>}
          <View style={styles.stockRow}>
            <Ionicons name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'} size={18} color={product.stock > 0 ? colors.accent : colors.error} />
            <Text style={[styles.stockText, { color: product.stock > 0 ? colors.accent : colors.error }]}>{product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}</Text>
          </View>
          {product.description && <Text style={styles.desc}>{product.description}</Text>}
          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => qty > 1 && setQty(qty - 1)}><Ionicons name="remove" size={20} color={colors.textPrimary} /></TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty + 1)}><Ionicons name="add" size={20} color={colors.textPrimary} /></TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <View><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>₹{(product.price * qty).toFixed(0)}</Text></View>
        <Button title="Add to Cart" onPress={handleAdd} disabled={product.stock <= 0} style={{ flex: 1, marginLeft: spacing.base }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 300, backgroundColor: colors.surfaceHover },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.xl },
  name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  price: { fontSize: 36, fontWeight: '900', color: colors.accent },
  unit: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.base },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  shopLink: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.base },
  stockText: { fontSize: fontSize.md, fontWeight: '600' },
  desc: { fontSize: fontSize.base, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },
  qtySection: { marginTop: spacing.base },
  qtyLabel: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHover, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: fontSize.xl, fontWeight: '800', minWidth: 40, textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.base, paddingBottom: spacing.xxl, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
});
