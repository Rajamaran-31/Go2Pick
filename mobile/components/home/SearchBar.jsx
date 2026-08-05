import React from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

export default function SearchBar({ style }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={[styles.container, style]} onPress={() => router.push('/search')} activeOpacity={0.8}>
      <Ionicons name="search" size={20} color={colors.textLight} />
      <View style={styles.placeholder}>
        <TextInput style={styles.input} placeholder="Search shops or products..." placeholderTextColor={colors.textLight} editable={false} pointerEvents="none" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.base, height: 48,
    borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.base, gap: spacing.sm,
  },
  placeholder: { flex: 1 },
  input: { fontSize: fontSize.md, color: colors.textLight },
});
