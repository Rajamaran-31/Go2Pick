import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { shopkeeperAPI } from '../../services/api';

export default function ShopkeeperDashboard() {
  const router = useRouter();
  const { user, switchMode } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  
  const [stats, setStats] = useState({ total_products: 0, today_orders: 0, pending_orders: 0, today_revenue: 0, total_orders: 0, total_revenue: 0, recent_orders: [] });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await shopkeeperAPI.dashboard();
      setStats(res.data);
    } catch (e) { console.log('Failed to load dashboard', e); }
  };

  useFocusEffect(useCallback(() => { fetchDashboard(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity style={styles.switchBtn} onPress={() => { switchMode('customer'); router.replace('/(tabs)'); }}>
            <Ionicons name="log-out-outline" size={16} color={colors.primary} />
            <Text style={styles.switchText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* LOW STOCK ALERTS */}
        {stats.low_stock_products && stats.low_stock_products.length > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={20} color={colors.error} />
              <Text style={styles.alertTitle}>Low Stock Alerts ({stats.low_stock_products.length})</Text>
            </View>
            {stats.low_stock_products.map((p) => (
              <View key={p.id} style={styles.alertRow}>
                <Text style={styles.alertProductName}>{p.name}</Text>
                <View style={styles.alertDetails}>
                  <Text style={styles.alertStockText}>Only <Text style={{fontWeight: '800'}}>{p.stock}</Text> left</Text>
                  <Text style={styles.alertThresholdText}>(Threshold: {p.threshold})</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TOP STATS */}
        <View style={[styles.statsRow, isDesktop ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>
          <View style={[styles.statCard, { borderTopColor: '#FBBF24', flex: 1 }]}>
            <View style={styles.statHeader}><Text style={styles.statTitle}>TOTAL REVENUE</Text><Ionicons name="cash-outline" size={20} color="#333" /></View>
            <Text style={styles.statValue}>₹{stats.today_revenue || '0'}</Text>
            <Text style={styles.statSubtitle}>{stats.today_orders || '0'} orders</Text>
          </View>
          
          <View style={[styles.statCard, { borderTopColor: '#F97316', flex: 1 }]}>
            <View style={styles.statHeader}><Text style={styles.statTitle}>TOTAL ORDERS</Text><Ionicons name="cube-outline" size={20} color="#333" /></View>
            <Text style={styles.statValue}>{stats.today_orders || '0'}</Text>
            <Text style={styles.statSubtitle}>{stats.pending_orders || '0'} pending</Text>
          </View>
          
          <View style={[styles.statCard, { borderTopColor: '#10B981', flex: 1 }]}>
            <View style={styles.statHeader}><Text style={styles.statTitle}>PRODUCTS</Text><Ionicons name="pricetags-outline" size={20} color="#333" /></View>
            <Text style={styles.statValue}>{stats.total_products || '0'}</Text>
            <Text style={styles.statSubtitle}>All stocked <Ionicons name="checkmark-circle" size={12} color="#10B981" /></Text>
          </View>

          <View style={[styles.statCard, { borderTopColor: '#3B82F6', flex: 1 }]}>
            <View style={styles.statHeader}><Text style={styles.statTitle}>CUSTOMERS</Text><Ionicons name="people-outline" size={20} color="#333" /></View>
            <Text style={styles.statValue}>{stats.today_orders || '0'}</Text>
            <Text style={styles.statSubtitle}>{stats.today_orders || '0'} unique buyers</Text>
          </View>
        </View>

        {/* MIDDLE SECTION */}
        <View style={[styles.middleRow, isDesktop ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>
          
          {/* Sales by Day (Graph Placeholder) */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Sales by Day</Text>
            <View style={styles.graphContainer}>
              <View style={styles.graphRow}>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { width: '80%', backgroundColor: '#FBBF24' }]} />
                  <Text style={styles.dayText}>Mon</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { width: '90%', backgroundColor: '#FBBF24' }]} />
                  <Text style={styles.dayText}>Tue</Text>
                </View>
                <View style={styles.barGroup}><View style={styles.barEmpty} /><Text style={styles.dayText}>Wed</Text></View>
                <View style={styles.barGroup}><View style={styles.barEmpty} /><Text style={styles.dayText}>Thu</Text></View>
                <View style={styles.barGroup}><View style={styles.barEmpty} /><Text style={styles.dayText}>Fri</Text></View>
                <View style={styles.barGroup}><View style={styles.barEmpty} /><Text style={styles.dayText}>Sat</Text></View>
                <View style={styles.barGroup}><View style={styles.barEmpty} /><Text style={styles.dayText}>Sun</Text></View>
              </View>
            </View>
          </View>

          {/* Recent Orders Table */}
          <View style={[styles.card, { flex: 1.2 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(shopkeeper)/orders')}><Text style={styles.linkText}>View All →</Text></TouchableOpacity>
            </View>
            
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 0.5 }]}>ORDER</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>CUSTOMER</Text>
              <Text style={[styles.th, { flex: 1 }]}>TOTAL</Text>
              <Text style={[styles.th, { flex: 1 }]}>STATUS</Text>
            </View>
            
            {stats.recent_orders?.slice(0, 5).map((o, idx) => (
              <View key={o.id} style={[styles.tableRow, idx !== Math.min(stats.recent_orders.length, 5) - 1 && styles.borderBottom]}>
                <View style={{ flex: 0.5 }}><Text style={styles.orderId}>#{o.id.slice(-4) || idx+1}</Text></View>
                <View style={{ flex: 1.5 }}><Text style={styles.customerName}>{o.customer_name}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.priceText}>₹{o.total}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeSolid}>
                    <Text style={styles.badgeTextSolid}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</Text>
                  </View>
                </View>
              </View>
            ))}
            {(!stats.recent_orders || stats.recent_orders.length === 0) && <Text style={styles.empty}>No recent orders</Text>}
          </View>
        </View>

        {/* BOTTOM SECTION - Top Products */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Top Products</Text>
            <TouchableOpacity onPress={() => router.push('/(shopkeeper)/products')}><Text style={styles.linkText}>Manage →</Text></TouchableOpacity>
          </View>
          
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 2 }]}>PRODUCT</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>CATEGORY</Text>
            <Text style={[styles.th, { flex: 1 }]}>PRICE</Text>
            <Text style={[styles.th, { flex: 1 }]}>STOCK</Text>
          </View>
          
          {stats.top_products && stats.top_products.length > 0 ? (
            stats.top_products.map((product, idx) => (
              <View key={product.id || idx} style={[styles.tableRow, idx !== stats.top_products.length - 1 && styles.borderBottom]}>
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.productIcon}></View>
                  <Text style={styles.productName}>{product.name}</Text>
                </View>
                <View style={{ flex: 1.5 }}><Text style={styles.textDim}>{product.category || '—'}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.priceText}>₹{product.price}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.stockText}>{product.stock} units</Text></View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No products added yet.</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceHover },
  switchText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  
  statsRow: { gap: spacing.md, marginBottom: spacing.lg, paddingHorizontal: spacing.sm },
  statCard: { backgroundColor: colors.surface, padding: 20, borderRadius: 12, borderTopWidth: 4 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  statValue: { color: colors.textPrimary, fontSize: 32, fontWeight: '900', marginBottom: 4 },
  statSubtitle: { color: colors.textSecondary, fontSize: 13 },
  
  middleRow: { gap: spacing.md, marginBottom: spacing.lg, paddingHorizontal: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, marginHorizontal: spacing.sm, marginBottom: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  linkText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  
  /* Graph */
  graphContainer: { height: 150, justifyContent: 'flex-end', paddingTop: 20 },
  graphRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%' },
  barGroup: { alignItems: 'center', flex: 1, gap: 8 },
  bar: { height: 4, borderRadius: 2 },
  barEmpty: { height: 4, width: '80%', backgroundColor: colors.surfaceHover, borderRadius: 2 },
  dayText: { color: colors.textSecondary, fontSize: 11 },
  
  /* Table */
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12, marginBottom: 12 },
  th: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
  
  orderId: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  customerName: { color: colors.textPrimary, fontSize: 14 },
  priceText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  badgeSolid: { backgroundColor: '#332717', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' },
  badgeTextSolid: { color: '#FBBF24', fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textLight, padding: 20 },
  
  productIcon: { width: 32, height: 32, backgroundColor: colors.background, borderRadius: 4 },
  productName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  textDim: { color: colors.textSecondary, fontSize: 13 },
  stockText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  
  /* Alerts */
  alertSection: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: colors.error, borderRadius: 12, padding: 16, marginHorizontal: spacing.sm, marginBottom: spacing.md },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  alertTitle: { color: colors.error, fontSize: 16, fontWeight: '800' },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(239, 68, 68, 0.2)' },
  alertProductName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  alertDetails: { alignItems: 'flex-end' },
  alertStockText: { color: colors.error, fontSize: 14 },
  alertThresholdText: { color: colors.textSecondary, fontSize: 11 },
});
