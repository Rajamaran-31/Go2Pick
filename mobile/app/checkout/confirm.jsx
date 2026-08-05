import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { useCartStore } from '../../store/cartStore';
import { orderAPI } from '../../services/api';

export default function OrderConfirm() {
  const router = useRouter();
  const { date, time } = useLocalSearchParams();
  const { items, shopName, getTotal, clearCart } = useCartStore();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [orderCode, setOrderCode] = useState(null);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.place({ pickup_date: date, pickup_time: time, notes: notes || null });
      clearCart();
      const orderId = res.data?.id || res.data?._id || Math.random().toString(36).substring(2, 8);
      setOrderCode(orderId.toString().slice(-6).toUpperCase());
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to place order');
    } finally { setLoading(false); }
  };

  if (orderCode) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} style={{ marginBottom: spacing.md }} />
          <Text style={styles.successTitle}>Order Placed Successfully! 🎉</Text>
          <Text style={styles.successDesc}>Your order has been sent to the shop.</Text>
          <View style={styles.codeWrap}>
            <Text style={styles.codeLabel}>Your Unique Pickup Code</Text>
            <Text style={styles.codeText}>#{orderCode}</Text>
          </View>
          <Text style={styles.payReminder}>Please show this code and pay at the shop.</Text>
          <Button title="View My Orders" onPress={() => router.replace('/(tabs)/orders')} style={{ marginTop: spacing.xl, width: '100%' }} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Confirm Order</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.base, paddingBottom: 120 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏪 {shopName}</Text>
          <View style={styles.divider} />
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.product_name} × {item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{(item.product_price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{getTotal().toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Pickup Details</Text>
          <View style={styles.divider} />
          <Text style={styles.pickupText}>Date: {date}</Text>
          <Text style={styles.pickupText}>Time: {time}</Text>
        </View>

        <View style={styles.payBadge}>
          <Ionicons name="wallet-outline" size={22} color={colors.accentDark} />
          <Text style={styles.payText}>Pay at Shop — No online payment required</Text>
        </View>

        <Text style={styles.notesLabel}>Special Instructions (optional)</Text>
        <TextInput style={styles.notesInput} value={notes} onChangeText={setNotes} placeholder="Any special requests..." placeholderTextColor={colors.textLight} multiline />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title="Place Order" onPress={handlePlaceOrder} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, marginBottom: spacing.base, ...shadows.sm },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  itemName: { fontSize: fontSize.md, color: colors.textPrimary, flex: 1 },
  itemPrice: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  totalValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.accent },
  pickupText: { fontSize: fontSize.base, color: colors.textPrimary, marginBottom: spacing.xs, fontWeight: '500' },
  payBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successLight, padding: spacing.base, borderRadius: borderRadius.md, marginBottom: spacing.lg },
  payText: { fontSize: fontSize.md, fontWeight: '600', color: colors.accentDark, flex: 1 },
  notesLabel: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  notesInput: { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.base, minHeight: 80, fontSize: fontSize.md, textAlignVertical: 'top', color: colors.textPrimary },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.base, paddingBottom: spacing.xxl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  successContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  successCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', width: '100%', ...shadows.lg },
  successTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  successDesc: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  codeWrap: { backgroundColor: colors.background, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', width: '100%', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  codeLabel: { fontSize: fontSize.sm, color: colors.textLight, textTransform: 'uppercase', fontWeight: '700', marginBottom: spacing.xs },
  codeText: { fontSize: 32, fontWeight: '900', color: colors.accent, letterSpacing: 2 },
  payReminder: { fontSize: fontSize.sm, color: colors.textPrimary, textAlign: 'center', fontWeight: '600' },
});
