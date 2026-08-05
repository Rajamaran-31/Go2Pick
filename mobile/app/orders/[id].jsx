import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../constants/theme';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { orderAPI } from '../../services/api';

const statusSteps = ['pending', 'accepted', 'preparing', 'ready', 'completed'];
const stepLabels = { pending: 'Order Placed', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready for Pickup', completed: 'Completed' };

export default function OrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (id) orderAPI.get(id).then(res => setOrder(res.data)).catch(() => {});
  }, [id]);

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => { try { await orderAPI.cancel(id); setOrder(prev => ({ ...prev, status: 'cancelled' })); } catch {} } },
    ]);
  };

  if (!order) return <SafeAreaView style={styles.container}><Text style={{ textAlign: 'center', marginTop: 100, color: colors.textLight }}>Loading...</Text></SafeAreaView>;

  const currentStep = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.base }}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.orderId}>#{typeof order.id === 'string' ? order.id.slice(-8) : order.id}</Text>
            <Badge status={order.status} />
          </View>
          {!isCancelled && (
            <View style={styles.timeline}>
              {statusSteps.map((step, i) => (
                <View key={step} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, i <= currentStep && styles.timelineDotActive]} />
                  {i < statusSteps.length - 1 && <View style={[styles.timelineLine, i < currentStep && styles.timelineLineActive]} />}
                  <Text style={[styles.timelineLabel, i <= currentStep && styles.timelineLabelActive]}>{stepLabels[step]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏪 {order.shop_name}</Text>
          <View style={styles.divider} />
          {order.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name} × {item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{order.total}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Pickup Info</Text>
          <View style={styles.divider} />
          <Text style={styles.infoText}>Date: {order.pickup_date}</Text>
          <Text style={styles.infoText}>Time: {order.pickup_time}</Text>
          <Text style={styles.infoText}>Payment: Pay at shop</Text>
        </View>

        {order.status === 'pending' && (
          <Button title="Cancel Order" onPress={handleCancel} variant="outline" style={{ borderColor: colors.error }} textStyle={{ color: colors.error }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  statusCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, marginBottom: spacing.base, ...shadows.sm },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  orderId: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary, fontFamily: 'monospace' },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: spacing.sm },
  timelineItem: { alignItems: 'center', flex: 1, position: 'relative' },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.border, marginBottom: spacing.xs },
  timelineDotActive: { backgroundColor: colors.accent },
  timelineLine: { position: 'absolute', top: 10, left: '50%', right: '-50%', height: 2, backgroundColor: colors.border, zIndex: -1 },
  timelineLineActive: { backgroundColor: colors.accent },
  timelineLabel: { fontSize: 9, color: colors.textLight, textAlign: 'center', fontWeight: '600' },
  timelineLabelActive: { color: colors.accent },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, marginBottom: spacing.base, ...shadows.sm },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  itemName: { fontSize: fontSize.md, color: colors.textPrimary },
  itemPrice: { fontSize: fontSize.md, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSize.lg, fontWeight: '700' },
  totalValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.accent },
  infoText: { fontSize: fontSize.base, color: colors.textPrimary, marginBottom: spacing.xs, fontWeight: '500' },
});
