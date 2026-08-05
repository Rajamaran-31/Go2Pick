import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import api, { shopkeeperAPI } from '../../services/api';

export default function ShopkeeperReports() {
  const router = useRouter();
  const [reports, setReports] = useState({ 
    today: { total: 0, count: 0 }, 
    thisWeek: { total: 0, count: 0 }, 
    thisMonth: { total: 0, count: 0 }, 
    dailyBreakdown: [], 
    top_products: [] 
  });
  const [activeTab, setActiveTab] = useState('Daily');

  useEffect(() => { 
    shopkeeperAPI.getReports().then(res => {
      if (res.data && res.data.success) {
        setReports(prev => ({...prev, ...res.data}));
      }
    }).catch(() => {});
    
    // Attempt to fetch top products if that API is available
    api.get('/api/shopkeeper/reports/top-products').then(res => {
      if (res.data && res.data.success) {
        setReports(prev => ({...prev, top_products: res.data.products}));
      }
    }).catch(() => {});
  }, []);

  const periods = [
    { label: 'Today', revenue: reports.today?.total || 0, orders: reports.today?.count || 0, color: colors.accent },
    { label: 'This Week', revenue: reports.thisWeek?.total || 0, orders: reports.thisWeek?.count || 0, color: '#3B82F6' },
    { label: 'This Month', revenue: reports.thisMonth?.total || 0, orders: reports.thisMonth?.count || 0, color: '#10B981' }
  ];

  // Dynamic data for the graph from API
  const chartData = {
    Daily: reports.dailyBreakdown?.map(d => ({ label: d.label, value: d.revenue })) || [],
    Weekly: [],
    Monthly: []
  };

  const currentData = chartData[activeTab] || [];
  const maxValue = Math.max(...currentData.map(d => d.value), 100);
  const yAxisLabels = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];

  const formatYLabel = (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.base }}>
        
        {/* Metric Cards */}
        <View style={styles.grid}>
          {periods.map((p, i) => (
            <View key={i} style={[styles.periodCard, { borderTopColor: p.color }]}>
              <Text style={styles.periodLabel}>{p.label.toUpperCase()}</Text>
              <Text style={styles.periodRevenue}>₹{p.revenue.toLocaleString()}</Text>
              <Text style={styles.periodOrders}>{p.orders} orders</Text>
            </View>
          ))}
        </View>

        {/* X/Y Axis Graph Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Sales Overview</Text>
            <View style={styles.tabContainer}>
              {['Daily', 'Weekly', 'Monthly'].map(tab => (
                <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.graphWrapper}>
            {/* Y-Axis */}
            <View style={styles.yAxis}>
              {yAxisLabels.map((val, i) => (
                <Text key={i} style={styles.yAxisText}>₹{formatYLabel(val)}</Text>
              ))}
            </View>

            {/* Graph Area */}
            <View style={styles.graphContent}>
              {/* Grid Lines */}
              <View style={styles.gridLinesContainer}>
                {yAxisLabels.map((_, i) => <View key={i} style={styles.gridLine} />)}
              </View>

              {/* Bars */}
              <View style={styles.barsContainer}>
                {currentData.map((d, i) => {
                  const heightPercent = `${(d.value / maxValue) * 100}%`;
                  return (
                    <View key={i} style={styles.barGroup}>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: heightPercent, backgroundColor: activeTab === 'Daily' ? colors.accent : activeTab === 'Weekly' ? '#3B82F6' : '#10B981' }]} />
                      </View>
                      <Text style={styles.xAxisText}>{d.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Top Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Products</Text>
          {reports.top_products?.map((p, i) => (
            <View key={i} style={styles.topProduct}>
              <Text style={styles.topRank}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.topName}>{p.name}</Text>
                <Text style={styles.topDetail}>{p.quantity} units sold</Text>
              </View>
              <Text style={styles.topRevenue}>₹{p.revenue}</Text>
            </View>
          ))}
          {(!reports.top_products || reports.top_products.length === 0) && (
            <Text style={styles.emptyText}>No product data yet</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  periodCard: { flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.base, borderTopWidth: 4, ...shadows.sm },
  periodLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 8 },
  periodRevenue: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  periodOrders: { fontSize: 13, color: colors.textSecondary },
  
  chartSection: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.base, marginBottom: spacing.xl, ...shadows.sm },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, flexWrap: 'wrap', gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  
  tabContainer: { flexDirection: 'row', backgroundColor: colors.background, padding: 4, borderRadius: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  activeTab: { backgroundColor: colors.surface },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  activeTabText: { color: colors.textPrimary },

  graphWrapper: { flexDirection: 'row', height: 220, paddingTop: 10 },
  yAxis: { justifyContent: 'space-between', paddingRight: 12, alignItems: 'flex-end', height: '100%', paddingBottom: 24 },
  yAxisText: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
  
  graphContent: { flex: 1, height: '100%' },
  gridLinesContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 24, justifyContent: 'space-between' },
  gridLine: { height: 1, backgroundColor: colors.border, width: '100%' },
  
  barsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 10, paddingBottom: 24 },
  barGroup: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { flex: 1, width: 24, justifyContent: 'flex-end', alignItems: 'center' },
  barFill: { width: '100%', borderRadius: 4 },
  xAxisText: { position: 'absolute', bottom: -20, color: colors.textSecondary, fontSize: 10, fontWeight: '600' },

  section: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.base, ...shadows.sm },
  topProduct: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  topRank: { fontSize: 16, fontWeight: '800', color: colors.accent, width: 24 },
  topName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  topDetail: { fontSize: 13, color: colors.textSecondary },
  topRevenue: { fontSize: 15, fontWeight: '700', color: colors.success },
  emptyText: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 20 },
});
