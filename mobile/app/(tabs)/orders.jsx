import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing } from '../../constants/theme';
import OrderCard from '../../components/order/OrderCard';
import EmptyState from '../../components/ui/EmptyState';
import { orderAPI } from '../../services/api';

const tabs = ['All', 'Active', 'Completed', 'Cancelled'];

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    orderAPI.list()
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setOrders(res.data);
        } else if (res.data?.orders && Array.isArray(res.data.orders)) {
          setOrders(res.data.orders);
        }
      })
      .catch(() => {
        setOrders([]);
      });
  }, []);

  const filtered = orders.filter(o => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return ['pending', 'accepted', 'preparing', 'ready'].includes(o.status);
    if (activeTab === 'Completed') return o.status === 'completed';
    if (activeTab === 'Cancelled') return ['cancelled', 'rejected'].includes(o.status);
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>My Orders</Text>
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <OrderCard order={item} onPress={() => router.push(`/orders/${item.id}`)} />}
        contentContainerStyle={{ padding: spacing.base, paddingTop: spacing.sm }}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders yet" message="Your orders will appear here" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, padding: spacing.base, paddingBottom: spacing.sm },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.sm },
  tab: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.surfaceHover },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  activeTabText: { color: '#FFFFFF' },
});
