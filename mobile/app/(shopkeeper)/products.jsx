import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../constants/theme';
import { productAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ShopkeeperProducts() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState([]);

  let numColumns = 1;
  if (width >= 1000) numColumns = 5;
  else if (width >= 768) numColumns = 3;
  else if (width >= 480) numColumns = 2;

  useEffect(() => {
    if (user?.shop_id) productAPI.list({ shop_id: user.shop_id }).then(res => setProducts(res.data || [])).catch(() => {});
  }, []);

  const handleDelete = (id, name) => {
    Alert.alert('Delete Product', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await productAPI.remove(id); setProducts(prev => prev.filter(p => p.id !== id)); } catch {} } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage <Text style={{ color: colors.accent }}>Products</Text></Text>
      </View>
      
      <View style={styles.actionRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textLight} />
          <Text style={styles.searchText}>Search products...</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(shopkeeper)/bulk-add')} style={styles.bulkBtn}>
          <Ionicons name="folder" size={16} color={colors.accent} />
          <Text style={styles.bulkText}>Bulk Add</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(shopkeeper)/add-product')} style={styles.addBtn}>
          <Text style={styles.addText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        key={`grid-${numColumns}`}
        data={products} 
        keyExtractor={i => i.id} 
        numColumns={numColumns}
        columnWrapperStyle={{ gap: spacing.base, paddingBottom: spacing.base }}
        renderItem={({ item }) => (
          <View style={[styles.card, numColumns === 1 && { minWidth: 280, maxWidth: 400, alignSelf: 'center' }]}>
            <View>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' }} style={styles.image} resizeMode="cover" />
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.category} numberOfLines={1}>{item.category || 'CATEGORY'}</Text>
                
                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{item.price}</Text>
                  <Text style={styles.stock}>{item.stock} left</Text>
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => Alert.alert('Edit', 'Edit feature coming soon')} style={styles.editBtn}>
                <Ionicons name="pencil" size={14} color={colors.textPrimary} />
                <Text style={styles.btnTextWhite}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
                <Ionicons name="trash" size={14} color={colors.error} />
                <Text style={styles.btnTextRed}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} 
        contentContainerStyle={{ padding: spacing.base, paddingBottom: 100 }} 
        ListEmptyComponent={<Text style={styles.empty}>No products yet. Add your first product!</Text>} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.md, gap: spacing.sm },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 12, height: 40, gap: 8 },
  searchText: { color: colors.textLight, fontSize: 14 },
  bulkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceHover, paddingHorizontal: 12, height: 40, borderRadius: 8, gap: 6 },
  bulkText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  addBtn: { backgroundColor: colors.accent, paddingHorizontal: 12, height: 40, borderRadius: 8, justifyContent: 'center' },
  addText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', height: 345, justifyContent: 'space-between' },
  imageContainer: { width: '100%', height: 180, backgroundColor: '#FFFFFF' },
  image: { width: '100%', height: '100%' },
  info: { padding: 16 },
  name: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  category: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  price: { fontSize: 20, fontWeight: '800', color: colors.accent },
  stock: { fontSize: 14, color: colors.textSecondary },
  
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surfaceHover, borderRadius: 8 },
  btnTextWhite: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.error, borderRadius: 8 },
  btnTextRed: { color: colors.error, fontSize: 13, fontWeight: '600' },
  
  empty: { textAlign: 'center', color: colors.textLight, fontSize: fontSize.md, marginTop: 60 },
});
