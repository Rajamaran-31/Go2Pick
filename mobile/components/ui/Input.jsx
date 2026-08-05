import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

export default function Input({ label, value, onChangeText, placeholder, error, secureTextEntry, keyboardType, multiline, icon, style }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, focused && styles.focused, error && styles.errorBorder]}>
        {icon && <Ionicons name={icon} size={20} color={colors.textLight} style={styles.icon} />}
        <TextInput
          style={[styles.input, multiline && styles.multiline]}
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType} multiline={multiline}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.base },
  label: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.md, backgroundColor: colors.surface, minHeight: 48,
  },
  focused: { borderColor: colors.accent },
  errorBorder: { borderColor: colors.error },
  icon: { paddingLeft: spacing.base },
  input: { flex: 1, paddingHorizontal: spacing.base, fontSize: fontSize.base, color: colors.textPrimary, paddingVertical: spacing.md },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  eyeBtn: { paddingRight: spacing.base },
  error: { fontSize: fontSize.sm, color: colors.error, marginTop: spacing.xs },
});
