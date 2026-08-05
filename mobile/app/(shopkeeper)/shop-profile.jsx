import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../../constants/theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImagePickerField from '../../components/ui/ImagePickerField';
import { shopAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ShopProfile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name: '', description: '', address: '', opening_time: '', closing_time: '', image: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.shop_id) {
      shopAPI.get(user.shop_id).then(res => {
        const s = res.data;
        setForm({ name: s.name || '', description: s.description || '', address: s.address || '', opening_time: s.opening_time || '', closing_time: s.closing_time || '', image: s.image || '' });
      }).catch(() => {});
    }
  }, []);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await shopAPI.update(user.shop_id, form);
      Alert.alert('Success', 'Shop profile updated!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to update');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Shop Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.base }}>
        <Input label="Shop Name" value={form.name} onChangeText={v => update('name', v)} placeholder="Shop name" />
        <ImagePickerField label="Shop Image" value={form.image} onChangeText={v => update('image', v)} placeholder="Upload a photo of your shop" />
        <Input label="Description" value={form.description} onChangeText={v => update('description', v)} placeholder="About your shop" multiline />
        <Input label="Address" value={form.address} onChangeText={v => update('address', v)} placeholder="Shop address" />
        <Input label="Opening Time" value={form.opening_time} onChangeText={v => update('opening_time', v)} placeholder="09:00" />
        <Input label="Closing Time" value={form.closing_time} onChangeText={v => update('closing_time', v)} placeholder="21:00" />
        <Button title="Save Changes" onPress={handleSave} loading={loading} style={{ marginTop: spacing.base }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
});
