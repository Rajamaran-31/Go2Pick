import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../../constants/theme';
import { orderAPI } from '../../services/api';

export default function ShopkeeperOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [statusModal, setStatusModal] = useState({ visible: false, orderId: null, currentStatus: '' });

  const filterOptions = ['All', 'pending', 'accepted', 'preparing', 'ready', 'completed', 'canceled', 'rejected'];
  const statusOptions = ['accepted', 'preparing', 'ready', 'completed', 'canceled', 'rejected'];

  useEffect(() => { orderAPI.list().then(res => setOrders(res.data || [])).catch(() => {}); }, []);

  const handleAction = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      setStatusModal({ visible: false, orderId: null, currentStatus: '' });
    } catch (e) { Alert.alert('Error', e.response?.data?.detail || 'Failed'); }
  };

  const filteredOrders = filter === 'All' ? orders : orders.filter(o => o.status?.toLowerCase() === filter.toLowerCase());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>All <Text style={{ color: colors.accent }}>Orders</Text></Text>
      </View>
      
      <View style={styles.filterRow}>
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(!showFilter)}>
            <Ionicons name="filter" size={16} color={colors.accent} />
            <Text style={styles.filterText}>{filter === 'All' ? 'Filter' : filter.charAt(0).toUpperCase() + filter.slice(1)}</Text>
          </TouchableOpacity>
          
          {showFilter && (
            <View style={styles.dropdownMenu}>
              {filterOptions.map(opt => (
                <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { setFilter(opt); setShowFilter(false); }}>
                  <Text style={[styles.dropdownItemText, filter === opt && { color: colors.accent, fontWeight: '700' }]}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.orderCount}>{filteredOrders.length} orders</Text>
      </View>

      <View style={[styles.tableContainer, { zIndex: 1 }]}>
        <View style={styles.tableTopHeader}>
          <Text style={styles.tableTitle}>{filter === 'All' ? 'All Orders' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Orders`}</Text>
          <Text style={styles.tableCount}>{filteredOrders.length} total</Text>
        </View>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { flex: 0.5 }]}>ORDER</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>CUSTOMER</Text>
          <Text style={[styles.th, { flex: 1 }]}>ITEMS</Text>
          <Text style={[styles.th, { flex: 1 }]}>TOTAL</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>DATE</Text>
          <Text style={[styles.th, { flex: 1 }]}>STATUS</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>ACTION</Text>
        </View>

        <FlatList 
          data={filteredOrders} 
          keyExtractor={i => i.id} 
          renderItem={({ item, index }) => (
            <View style={[styles.tableRow, index !== filteredOrders.length - 1 && styles.borderBottom]}>
              <View style={{ flex: 0.5 }}><Text style={styles.orderId}>#{item.id.slice(-4) || index + 1}</Text></View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.customerName}>{item.customer_name || 'Guest'}</Text>
                <Text style={styles.customerPhone}>{item.customer_phone || 'N/A'}</Text>
              </View>
              <View style={{ flex: 1 }}><Text style={styles.tdText}>{item.items?.length || 0} items</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.priceText}>₹{item.total}</Text></View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={[styles.statusBadge, { borderColor: item.status === 'completed' ? colors.success : item.status === 'canceled' ? colors.error : colors.accent }]}>
                  <Text style={[styles.statusText, { color: item.status === 'completed' ? colors.success : item.status === 'canceled' ? colors.error : colors.accent }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={[styles.actionCell, { flex: 1.5 }]}>
                <TouchableOpacity style={styles.viewBtn}><Ionicons name="eye" size={14} color={colors.accent} /><Text style={styles.viewText}>View</Text></TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dropdownBtn}
                  onPress={() => setStatusModal({ visible: true, orderId: item.id, currentStatus: item.status })}
                >
                  <Text style={styles.dropdownText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
                  <Ionicons name="chevron-down" size={12} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No orders found.</Text>}
        />
      </View>

      {/* Status Update Modal */}
      <Modal visible={statusModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            {statusOptions.map(opt => (
              <TouchableOpacity key={opt} style={styles.modalBtn} onPress={() => handleAction(statusModal.orderId, opt)}>
                <Text style={[styles.modalBtnText, statusModal.currentStatus === opt && { color: colors.accent, fontWeight: '700' }]}>
                  Mark as {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setStatusModal({ visible: false, orderId: null, currentStatus: '' })}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.base },
  header: { paddingTop: spacing.xl, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.sm, zIndex: 10, elevation: 10 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  filterText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginLeft: 6 },
  orderCount: { color: colors.textSecondary, fontSize: 14 },
  
  tableContainer: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  tableTopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  tableCount: { color: colors.textSecondary, fontSize: 14 },
  
  tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceHover },
  th: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
  
  orderId: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  customerName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  customerPhone: { color: colors.textSecondary, fontSize: 12 },
  tdText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  priceText: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  dateText: { color: colors.textSecondary, fontSize: 14 },
  
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, backgroundColor: colors.surfaceHover },
  statusText: { fontSize: 12, fontWeight: '700' },
  
  actionCell: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.background },
  dropdownText: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  
  empty: { textAlign: 'center', color: colors.textLight, fontSize: 16, padding: 40 },
  
  // Custom Dropdown & Modal Styles
  dropdownMenu: { position: 'absolute', top: 45, left: 0, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingVertical: 4, minWidth: 140, ...shadows.md },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.background },
  dropdownItemText: { color: colors.textPrimary, fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: 300, backgroundColor: colors.surface, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalBtn: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.background, alignItems: 'center' },
  modalBtnText: { color: colors.textPrimary, fontSize: 15 },
  modalCancelBtn: { marginTop: 12, paddingVertical: 12, backgroundColor: colors.surfaceHover, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: colors.error, fontSize: 15, fontWeight: '700' },
});
