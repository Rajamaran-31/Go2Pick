import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../constants/theme';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ImagePickerField from '../components/ui/ImagePickerField';
import { shopkeeperAPI } from '../services/api';

const categories = ['Grocery', 'Bakery', 'Pharmacy', 'Electronics', 'Fashion', 'Restaurant', 'Fruits & Vegetables', 'Stationery'];

export default function ShopkeeperRequest() {
  const router = useRouter();
  const [form, setForm] = useState({ owner_name: '', shop_name: '', category: '', phone: '', email: '', address: '', description: '', opening_time: '09:00', closing_time: '21:00' });
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    const required = ['owner_name', 'shop_name', 'category', 'phone', 'email', 'address'];
    for (const key of required) {
      if (!form[key]) { Alert.alert('Error', `Please fill ${key.replace('_', ' ')}`); return; }
    }
    setLoading(true);
    try {
      await shopkeeperAPI.submitRequest(form);
      setSuccess(true);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to submit');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} style={{ marginBottom: spacing.md }} />
          <Text style={styles.successTitle}>Request Submitted! 🎉</Text>
          <Text style={styles.successDesc}>Your application to become a shopkeeper has been sent.</Text>
          <View style={styles.infoWrap}>
            <Text style={styles.infoText}>Our admin team will review your details. You will be notified once your shop is approved and activated.</Text>
          </View>
          <Button title="Back to Profile" onPress={() => router.back()} style={{ marginTop: spacing.xl, width: '100%' }} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Become a Shopkeeper</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.base, paddingBottom: 40 }}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Why join Go2Pick?</Text>
          <Text style={styles.bannerItem}>📈 Increased sales & digital presence</Text>
          <Text style={styles.bannerItem}>📦 Smart inventory management</Text>
          <Text style={styles.bannerItem}>🤝 Direct customer connection</Text>
          <Text style={styles.bannerItem}>🏪 Reduce in-store crowding</Text>
        </View>

        <Input label="Shop Owner Name *" value={form.owner_name} onChangeText={v => update('owner_name', v)} placeholder="Your full name" icon="person-outline" />
        <Input label="Shop Name *" value={form.shop_name} onChangeText={v => update('shop_name', v)} placeholder="Your shop name" icon="storefront-outline" />

        <Text style={styles.fieldLabel}>Shop Category *</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowCategories(!showCategories)}>
          <Text style={form.category ? styles.dropdownText : styles.dropdownPlaceholder}>{form.category || 'Select category'}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.textLight} />
        </TouchableOpacity>
        {showCategories && (
          <View style={styles.dropdownList}>
            {categories.map(cat => (
              <TouchableOpacity key={cat} style={styles.dropdownItem} onPress={() => { update('category', cat); setShowCategories(false); }}>
                <Text style={styles.dropdownItemText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Input label="Mobile Number *" value={form.phone} onChangeText={v => update('phone', v)} placeholder="Your mobile number" keyboardType="phone-pad" icon="call-outline" />
        <Input label="Email *" value={form.email} onChangeText={v => update('email', v)} placeholder="Your email" keyboardType="email-address" icon="mail-outline" />
        <Input label="Shop Address *" value={form.address} onChangeText={v => update('address', v)} placeholder="Complete shop address" icon="location-outline" />
        
        <ImagePickerField label="Shop Image" value={form.shop_image} onChangeText={v => update('shop_image', v)} placeholder="Upload a photo of your shop" />

        <Input label="Description" value={form.description} onChangeText={v => update('description', v)} placeholder="Tell us about your shop..." multiline />
        <Input label="Opening Time" value={form.opening_time} onChangeText={v => update('opening_time', v)} placeholder="09:00" icon="time-outline" />
        <Input label="Closing Time" value={form.closing_time} onChangeText={v => update('closing_time', v)} placeholder="21:00" icon="time-outline" />

        <Button title="Submit Request" onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.base }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  banner: { backgroundColor: colors.successLight, padding: spacing.base, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  bannerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.accentDark, marginBottom: spacing.sm },
  bannerItem: { fontSize: fontSize.md, color: colors.textPrimary, marginBottom: spacing.xs },
  fieldLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.base, backgroundColor: colors.surface, marginBottom: spacing.base },
  dropdownText: { fontSize: fontSize.base, color: colors.textPrimary },
  dropdownPlaceholder: { fontSize: fontSize.base, color: colors.textLight },
  dropdownList: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginTop: -12, marginBottom: spacing.base },
  dropdownItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownItemText: { fontSize: fontSize.md, color: colors.textPrimary },
  successContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  successCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', width: '100%' },
  successTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  successDesc: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  infoWrap: { backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, width: '100%', borderWidth: 1, borderColor: colors.border },
  infoText: { fontSize: fontSize.sm, color: colors.textPrimary, textAlign: 'center', lineHeight: 20 },
});
