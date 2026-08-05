import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill all fields'); return; }
    setError(''); setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const token = await userCredential.user.getIdToken();
      const res = await authAPI.getMe();
      await login(token, res.data);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logo}><Text style={styles.logoText}>G2P</Text></View>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue shopping</Text>
        </View>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <Input label="Email" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" icon="mail-outline" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry icon="lock-closed-outline" />

        <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />

        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.linkText}>Don't have an account? </Text>
          <Text style={styles.linkAccent}>Sign Up</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { width: 72, height: 72, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.base },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  title: { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 4 },
  errorBox: { backgroundColor: colors.errorLight, padding: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.base },
  errorText: { color: colors.error, fontSize: fontSize.sm, fontWeight: '500' },
  btn: { marginTop: spacing.sm, marginBottom: spacing.base },
  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { fontSize: fontSize.md, color: colors.textSecondary },
  linkAccent: { fontSize: fontSize.md, color: colors.accent, fontWeight: '700' },
  demoHint: { textAlign: 'center', marginTop: spacing.xl, fontSize: fontSize.sm, color: colors.textLight },
});
