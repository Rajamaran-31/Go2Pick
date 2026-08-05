import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImagePickerField from '../../components/ui/ImagePickerField';
import { productAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function AddProduct() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', unit: 'piece', low_stock_threshold: '5' });
  const [loading, setLoading] = useState(false);
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.price) { Alert.alert('Error', 'Name and price are required'); return; }
    setLoading(true);
    try {
      await productAPI.create({ 
        ...form, 
        shop_id: user.shop_id, 
        price: parseFloat(form.price), 
        stock: parseInt(form.stock || '0'),
        low_stock_threshold: parseInt(form.low_stock_threshold || '5'),
        is_available: true 
      });
      Alert.alert('Success', 'Product added!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to add');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Add Product</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.base }}>
        <Input label="Product Name *" value={form.name} onChangeText={v => update('name', v)} placeholder="Enter product name" />
        <Input label="Description" value={form.description} onChangeText={v => update('description', v)} placeholder="Product description" multiline />
        <Input label="Price (₹) *" value={form.price} onChangeText={v => update('price', v)} placeholder="0" keyboardType="numeric" />
        <Input label="Stock Quantity" value={form.stock} onChangeText={v => update('stock', v)} placeholder="0" keyboardType="numeric" />
        <Input label="Low Stock Alert Threshold" value={form.low_stock_threshold} onChangeText={v => update('low_stock_threshold', v)} placeholder="5" keyboardType="numeric" />
        <Input label="Category *" value={form.category} onChangeText={v => update('category', v)} placeholder="e.g. Vegetables" />
        <ImagePickerField label="Product Image" value={form.image} onChangeText={v => update('image', v)} />
        <Button title="Add Product" onPress={handleSave} loading={loading} style={{ marginTop: spacing.base }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
});
