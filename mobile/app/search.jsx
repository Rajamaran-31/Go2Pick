import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../constants/theme';
import ShopCard from '../components/shop/ShopCard';
import { shopAPI } from '../services/api';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.length < 2) { setResults([]); setSearched(false); return; }
    try {
      const res = await shopAPI.list({ search: text });
      setResults(res.data || []);
      setSearched(true);
    } catch { setSearched(true); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <TextInput style={styles.input} value={query} onChangeText={handleSearch} placeholder="Search shops or products..." placeholderTextColor={colors.textLight} autoFocus returnKeyType="search" />
        {query.length > 0 && <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}><Ionicons name="close-circle" size={22} color={colors.textLight} /></TouchableOpacity>}
      </View>
      <FlatList data={results} keyExtractor={i => i.id} renderItem={({ item }) => <ShopCard shop={item} onPress={() => router.push(`/(tabs)/shops/${item.id}`)} />} contentContainerStyle={{ padding: spacing.base }}
        ListEmptyComponent={searched && <View style={styles.emptyWrap}><Text style={styles.emptyTitle}>No results found</Text><Text style={styles.emptyText}>Try a different search term</Text></View>} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  input: { flex: 1, height: 44, fontSize: fontSize.base, color: colors.textPrimary },
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: fontSize.md, color: colors.textLight, marginTop: 4 },
});
