import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

export default function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, style, textStyle, icon }) {
  const btnStyle = variant === 'primary' ? styles.primary : variant === 'outline' ? styles.outline : styles.secondary;
  const txtStyle = variant === 'primary' ? styles.primaryText : variant === 'outline' ? styles.outlineText : styles.secondaryText;

  return (
    <TouchableOpacity
      style={[styles.base, btnStyle, disabled && styles.disabled, style]}
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.accent} /> : (
        <>
          {icon}
          <Text style={[styles.baseText, txtStyle, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { height: 52, borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
  baseText: { fontSize: fontSize.base, fontWeight: '700' },
  primary: { backgroundColor: colors.accent },
  primaryText: { color: '#FFFFFF' },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accent },
  outlineText: { color: colors.accent },
  secondary: { backgroundColor: colors.surfaceHover },
  secondaryText: { color: colors.textPrimary },
  disabled: { opacity: 0.5 },
});
