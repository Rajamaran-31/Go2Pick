import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { useCartStore } from '../../store/cartStore';

export default function PickupTime() {
  const router = useRouter();
  const { shopName } = useCartStore();
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { date: d.toISOString().split('T')[0], day: d.toLocaleDateString('en-IN', { weekday: 'short' }), num: d.getDate(), month: d.toLocaleDateString('en-IN', { month: 'short' }) };
  });

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Select Pickup Time</Text>
        <View style={{ width: 24 }} />
      </View>
      {shopName && <Text style={styles.shopName}>🏪 {shopName}</Text>}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.label}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {dates.map((d, i) => (
            <TouchableOpacity key={i} style={[styles.dateCard, selectedDate === i && styles.dateActive]} onPress={() => setSelectedDate(i)}>
              <Text style={[styles.dateDay, selectedDate === i && styles.dateActiveText]}>{d.day}</Text>
              <Text style={[styles.dateNum, selectedDate === i && styles.dateActiveText]}>{d.num}</Text>
              <Text style={[styles.dateMonth, selectedDate === i && styles.dateActiveText]}>{d.month}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Select Time Slot</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map(t => (
            <TouchableOpacity key={t} style={[styles.timeCard, selectedTime === t && styles.timeActive]} onPress={() => setSelectedTime(t)}>
              <Text style={[styles.timeText, selectedTime === t && styles.timeActiveText]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title="Continue" onPress={() => router.push({ pathname: '/checkout/confirm', params: { date: dates[selectedDate].date, time: selectedTime } })} disabled={!selectedTime} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  shopName: { fontSize: fontSize.md, color: colors.textSecondary, paddingHorizontal: spacing.base, marginBottom: spacing.md },
  label: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: spacing.base, marginBottom: spacing.md, marginTop: spacing.lg },
  dateScroll: { paddingHorizontal: spacing.base, gap: spacing.sm },
  dateCard: { width: 72, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  dateActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dateDay: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  dateNum: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginVertical: 2 },
  dateMonth: { fontSize: fontSize.xs, color: colors.textLight },
  dateActiveText: { color: '#FFFFFF' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, gap: spacing.sm },
  timeCard: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minWidth: 80, alignItems: 'center' },
  timeActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  timeText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  timeActiveText: { color: '#FFFFFF' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.base, paddingBottom: spacing.xxl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
