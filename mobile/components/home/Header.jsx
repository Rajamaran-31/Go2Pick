import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const router = useRouter();
  const { user, mode, switchMode, isShopkeeper } = useAuthStore();

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Guest'} 👋</Text>
        <Text style={styles.subtitle}>What would you like to order?</Text>
      </View>
      <View style={styles.right}>
        {isShopkeeper() && (
          <TouchableOpacity
            style={[styles.switchBtn, mode === 'shopkeeper' && styles.switchActive]}
            onPress={() => {
              const newMode = mode === 'customer' ? 'shopkeeper' : 'customer';
              switchMode(newMode);
              if (newMode === 'shopkeeper') router.push('/(shopkeeper)');
              else router.push('/(tabs)');
            }}
          >
            <Ionicons name={mode === 'shopkeeper' ? 'storefront' : 'storefront-outline'} size={18} color={mode === 'shopkeeper' ? '#fff' : colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'G'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.md },
  left: { flex: 1 },
  greeting: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  switchBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  switchActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
});
