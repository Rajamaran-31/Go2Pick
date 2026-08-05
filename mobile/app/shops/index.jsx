import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../../constants/theme';
import ShopCard from '../../components/shop/ShopCard';
import { shopAPI } from '../../services/api';

export default function ShopListing() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = category ? { category } : {};
    shopAPI.list(params).then(res => setShops(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [category]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>{category || 'All Shops'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList data={shops} keyExtractor={i => i.id} renderItem={({ item }) => <ShopCard shop={item} onPress={() => router.push(`/(tabs)/shops/${item.id}`)} />} contentContainerStyle={{ padding: spacing.base }} ListEmptyComponent={!loading && <Text style={styles.empty}>No shops found in this category</Text>} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: 60, fontSize: fontSize.md },
});
